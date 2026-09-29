import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Tag from '../Tag';
import Suggestion from '../Suggestion';
import TagGroup from './TagGroup';

/**
 * `TagGroup` — the gaps, the wrapping, the alignment and the disabled field.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. The assertions are about the SET, and about what a person
 * could observe: that it announces itself as a list, where its members land,
 * that `+n` counts what is really hidden and reaches it from the keyboard, and
 * that a disabled group leaves nothing to press. Never a class name.
 */

export default {
    title: 'Components/Status and loading/Tag group',
    component: TagGroup,
    parameters: {
        docs: {
            description: {
                component:
                    'Owns what a single tag cannot decide: the 8px gap between tags, whether a long '
                    + 'set wraps or collapses behind a `+n` overflow tag, which edge the tags line up '
                    + 'on, and whether the whole set is disabled.',
            },
        },
    },
};

const SUBJECTS = ['Science', 'Mathematics', 'History', 'Geography', 'Music', 'Art', 'Drama'];

const box = (el) => el.getBoundingClientRect();

/** Tags whose top edge matches, grouped into rows, top to bottom. */
const rowsOf = (elements) => {
    const rows = new Map();
    for (const el of elements) {
        const top = Math.round(box(el).top);
        rows.set(top, [...(rows.get(top) || []), el]);
    }
    return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
};

/* -------------------------------------------------------------------- wrap */

export const Wrapping = () => (
    <div style={{ width: '320px' }}>
        <TagGroup label="Subjects">
            {SUBJECTS.map((s) => <Tag key={s} color="blue" data-testid={`tag-${s}`}>{s}</Tag>)}
        </TagGroup>
    </div>
);

/**
 * The set announces itself as a list, and wraps with 8 between tags in both
 * directions.
 *
 * Without the list role a screen reader reads seven unrelated words in a row.
 * The gap is measured between the tags themselves, so a margin on a tag would
 * show up here as a gap wider than 8.
 */
Wrapping.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Subjects' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(SUBJECTS.length);

    const tags = SUBJECTS.map((s) => canvas.getByTestId(`tag-${s}`));
    const rows = rowsOf(tags);
    await expect(rows.length, 'seven subjects at 320 wrap onto more than one line').toBeGreaterThan(1);

    for (const row of rows) {
        for (let i = 1; i < row.length; i += 1) {
            await expect(Math.round(box(row[i]).left - box(row[i - 1]).right), 'gap between tags').toBe(8);
        }
    }
    for (let r = 1; r < rows.length; r += 1) {
        await expect(Math.round(box(rows[r][0]).top - box(rows[r - 1][0]).bottom), 'gap between rows').toBe(8);
    }
    // Rows start at the left edge by default.
    for (const row of rows) {
        await expect(Math.round(box(row[0]).left)).toBe(Math.round(box(list).left));
    }
};

/* ---------------------------------------------------------------- collapse */

/**
 * `collapse` keeps one line: as many tags as fit, then a `+n` that opens a menu
 * of the rest. The container here is a fixed 300 wide, and the play function
 * resizes it to show that the count follows the width.
 */
export const Collapse = () => (
    <div data-testid="frame" style={{ width: '300px' }}>
        <TagGroup label="Subjects" overflow="collapse">
            {SUBJECTS.map((s) => <Tag key={s} color="green" data-testid={`tag-${s}`}>{s}</Tag>)}
        </TagGroup>
    </div>
);

/** How many tags a person can see, and what `+n` says is hidden. */
const readCollapse = (canvasElement) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Subjects' });
    const more = within(list).queryByRole('button', { name: /more tags$/ });
    // A tag on the row, not an item in the menu, and not one hidden past the edge.
    const onRow = (s) => within(list).queryAllByText(s)
        .some((el) => !el.closest('button') && el.checkVisibility({ visibilityProperty: true }));
    const shown = SUBJECTS.filter(onRow);
    return { list, more, shown };
};

/**
 * "As many as fit" is checked from both sides: nothing that shows runs past the
 * edge, and the first hidden tag would not have fit beside `+n`.
 */
const expectFits = async (canvasElement) => {
    const canvas = within(canvasElement);
    const { list, more, shown } = readCollapse(canvasElement);
    const right = box(list).right;
    const hiddenCount = SUBJECTS.length - shown.length;

    await expect(shown.length, 'at least one tag shows').toBeGreaterThan(0);
    for (const s of shown) {
        await expect(box(canvas.getByTestId(`tag-${s}`)).right).toBeLessThanOrEqual(right + 0.5);
        // A tag is only cut short when it is the one tag that shows.
        if (shown.length > 1) {
            const words = within(canvas.getByTestId(`tag-${s}`)).getByText(s);
            await expect(words.scrollWidth, `${s} is not truncated`).toBeLessThanOrEqual(words.clientWidth);
        }
    }
    if (hiddenCount === 0) {
        await expect(more, 'everything fits, so there is no +n').toBeNull();
        return;
    }
    await expect(more).not.toBeNull();
    await expect(more).toHaveAccessibleName(`${hiddenCount} more tags`);
    await expect(more).toHaveTextContent(`+${hiddenCount}`);
    await expect(box(more).right).toBeLessThanOrEqual(right + 0.5);

    // One more tag, at its own width plus a gap, would have run past the edge.
    const next = canvas.getByTestId(`tag-${SUBJECTS[shown.length]}`);
    const lastShown = canvas.getByTestId(`tag-${shown[shown.length - 1]}`);
    await expect(box(lastShown).right + 8 + box(next).width + 8 + box(more).width).toBeGreaterThan(right);
};

Collapse.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('frame');

    await waitFor(() => expectFits(canvasElement));
    const at300 = readCollapse(canvasElement).shown.length;
    await expect(at300, 'at 300 some tags are hidden').toBeLessThan(SUBJECTS.length);
    await expect(px(getComputedStyle(readCollapse(canvasElement).list).height), 'one line').toBe(22);

    // Wider: more tags show, and +n counts fewer.
    frame.style.width = '480px';
    await waitFor(() => expect(readCollapse(canvasElement).shown.length).toBeGreaterThan(at300));
    await waitFor(() => expectFits(canvasElement));

    // Narrow enough that a second tag would only fit by squeezing the first.
    frame.style.width = '200px';
    await waitFor(() => expect(readCollapse(canvasElement).shown.length).toBeLessThan(at300));
    await waitFor(() => expectFits(canvasElement));

    // Narrower than one tag and +n: the first tag still shows, and truncates.
    frame.style.width = '90px';
    await waitFor(() => {
        const { shown, more, list } = readCollapse(canvasElement);
        expect(shown).toEqual(['Science']);
        expect(box(more).right).toBeLessThanOrEqual(box(list).right + 0.5);
    });
    const science = within(canvas.getByTestId('tag-Science')).getByText('Science');
    await expect(science.scrollWidth, 'the one tag truncates').toBeGreaterThan(science.clientWidth);

    // Wide enough for all of them: no +n at all.
    frame.style.width = '800px';
    await waitFor(() => expect(readCollapse(canvasElement).shown).toHaveLength(SUBJECTS.length));
    await expect(readCollapse(canvasElement).more).toBeNull();

    frame.style.width = '300px';
    await waitFor(() => expect(readCollapse(canvasElement).shown).toHaveLength(at300));
};

/**
 * The `+n` menu lists the hidden tags and works without a pointer: Enter opens
 * it, Tab reaches the hidden tags, Escape closes it and puts focus back.
 */
export const CollapseMenu = () => (
    <div style={{ width: '300px', paddingBottom: '240px' }}>
        <TagGroup label="Subjects" overflow="collapse">
            {SUBJECTS.map((s) => <Tag key={s} color="green">{s}</Tag>)}
        </TagGroup>
    </div>
);

CollapseMenu.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { shown, more } = readCollapse(canvasElement);
    const hidden = SUBJECTS.slice(shown.length);

    await expect(more).toHaveAttribute('aria-expanded', 'false');
    for (const s of hidden) {
        await expect(canvas.queryByRole('button', { name: s }), `${s} is not reachable while closed`).toBeNull();
    }

    more.focus();
    await userEvent.keyboard('{Enter}');
    await expect(more).toHaveAttribute('aria-expanded', 'true');

    // The menu lists exactly the hidden tags, in order.
    for (const s of hidden) {
        await expect(canvas.getByRole('button', { name: s })).toBeVisible();
    }
    for (const s of shown) {
        await expect(canvas.queryByRole('button', { name: s }), `${s} is already on the row`).toBeNull();
    }

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: hidden[0] }), 'Tab reaches the first hidden tag').toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(more, 'Escape returns focus to +n').toHaveFocus();
    await expect(canvas.queryByRole('button', { name: hidden[0] })).toBeNull();

    // Space opens it too, and choosing an item closes it.
    await userEvent.keyboard(' ');
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(more).toHaveAttribute('aria-expanded', 'false');
};

/**
 * `maxVisible` caps the count even when more would fit.
 */
export const MaxVisible = () => (
    <div style={{ width: '600px' }}>
        <TagGroup label="Subjects" overflow="collapse" maxVisible={3}>
            {SUBJECTS.map((s) => <Tag key={s} color="green">{s}</Tag>)}
        </TagGroup>
    </div>
);

MaxVisible.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Three tags plus the overflow tag itself.
    await waitFor(() => expect(canvas.getAllByRole('listitem')).toHaveLength(4));
    await expect(canvas.getByRole('button', { name: '4 more tags' })).toHaveTextContent('+4');
};

/**
 * A set short enough to fit shows no overflow tag.
 *
 * `+0` is the failure this guards: an off-by-one would render an overflow tag
 * claiming nothing is hidden.
 */
export const NoOverflowWhenItFits = () => (
    <TagGroup label="Subjects" overflow="collapse">
        {SUBJECTS.slice(0, 3).map((s) => <Tag key={s} color="teal">{s}</Tag>)}
    </TagGroup>
);

NoOverflowWhenItFits.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(canvas.queryByRole('button', { name: /more tags$/ })).toBeNull();
};

/**
 * Conditional children are skipped, not counted.
 *
 * `{cond && <Tag/>}` is ordinary JSX and yields `false`. Counting those would
 * make `+n` claim tags that do not exist.
 */
export const ConditionalChildrenAreNotCounted = () => (
    <TagGroup label="Subjects" overflow="collapse" maxVisible={2}>
        <Tag color="blue">Science</Tag>
        {false && <Tag color="blue">Hidden</Tag>}
        {null}
        <Tag color="blue">History</Tag>
    </TagGroup>
);

ConditionalChildrenAreNotCounted.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await expect(canvas.queryByRole('button', { name: /more tags$/ })).toBeNull();
};

/**
 * `+n` is the Figma set's: a grey selectable tag with no swatch, hover the
 * on-surface-variant 08 state layer and pressed its 12. It opens a menu, so it
 * reports expanded, never pressed.
 */
export const OverflowTag = () => (
    <div style={{ width: '240px' }}>
        <TagGroup label="Subjects" overflow="collapse" maxVisible={2}>
            {SUBJECTS.map((s) => <Tag key={s} color="green">{s}</Tag>)}
        </TagGroup>
    </div>
);

OverflowTag.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = await canvas.findByRole('button', { name: '5 more tags' });

    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(more, 'a menu button, not a toggle').not.toHaveAttribute('aria-pressed');
    await expect(more.textContent).toBe('+5');
    await expect(px(getComputedStyle(more).height)).toBe(22);

    // No swatch: the label is the only thing inside, so the text starts at
    // the padding.
    const words = within(more).getByText('+5');
    await expect(Math.round(box(words).left - box(more).left)).toBe(
        Math.round(px(getComputedStyle(more).paddingLeft) + px(getComputedStyle(more).borderLeftWidth)),
    );

    const bg = (pseudo) => withForcedPseudo(more, pseudo, () => getComputedStyle(more).backgroundColor);
    await expect(getComputedStyle(more).backgroundColor, 'rest is clear').toBe('rgba(0, 0, 0, 0)');
    await expect(bg(':hover')).toBe(tokenColor(canvasElement, '--color-on-surface-variant-state-08'));
    await expect(bg(':active')).toBe(tokenColor(canvasElement, '--color-on-surface-variant-state-12'));
};

const MANY = Array.from({ length: 14 }, (_, i) => `T${i + 1}`);

/**
 * Fourteen short tags, so `+n` goes from `+10` to `+9` as the row widens. At
 * every width across that boundary the count settles after one measurement
 * and stays settled: it never flips between two values as the label gains or
 * loses a digit.
 */
export const DigitBoundary = () => (
    <div data-testid="frame" style={{ width: '160px' }}>
        <TagGroup label="Many" overflow="collapse">
            {MANY.map((s) => <Tag key={s} color="blue">{s}</Tag>)}
        </TagGroup>
    </div>
);

const frames = (n) => new Promise((resolve) => {
    const step = (left) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve());
    step(n);
});

DigitBoundary.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('frame');
    const list = canvas.getByRole('list', { name: 'Many' });
    const label = () => within(list).queryByRole('button', { name: /more tags$/ })?.textContent ?? '';

    const seen = new Set();
    for (let width = 120; width <= 360; width += 2) {
        frame.style.width = `${width}px`;
        await frames(3);
        const settled = label();
        // Watch the label for a few more frames: a flip would change it.
        const flips = [];
        const watch = new MutationObserver(() => flips.push(label()));
        watch.observe(list, { subtree: true, characterData: true, childList: true });
        await frames(4);
        watch.disconnect();
        await expect(flips, `at ${width}px the count settled on ${settled}`).toEqual([]);
        await expect(list.scrollWidth, `at ${width}px nothing runs past the edge`).toBeLessThanOrEqual(list.clientWidth);
        seen.add(settled);
    }
    await expect(seen.has('+10'), 'the sweep reaches +10').toBe(true);
    await expect(seen.has('+9'), 'and crosses to +9').toBe(true);
};

/* --------------------------------------------------------------- alignment */

/**
 * `alignment="right"` lines the tags up on the right edge, for a right-aligned
 * table column: every wrapped row, and the `+n` of a collapsed one.
 */
export const AlignmentRight = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '320px' }}>
        <TagGroup label="Wrapped subjects" alignment="right">
            {SUBJECTS.map((s) => <Tag key={s} color="purple" data-testid={`wrap-${s}`}>{s}</Tag>)}
        </TagGroup>
        <TagGroup label="Collapsed subjects" alignment="right" overflow="collapse">
            {SUBJECTS.map((s) => <Tag key={s} color="purple">{s}</Tag>)}
        </TagGroup>
    </div>
);

AlignmentRight.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const wrapped = canvas.getByRole('list', { name: 'Wrapped subjects' });
    const rows = rowsOf(SUBJECTS.map((s) => canvas.getByTestId(`wrap-${s}`)));
    await expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
        await expect(Math.round(box(row[row.length - 1]).right), 'each row ends on the right edge')
            .toBe(Math.round(box(wrapped).right));
    }

    const collapsed = canvas.getByRole('list', { name: 'Collapsed subjects' });
    const more = await within(collapsed).findByRole('button', { name: /more tags$/ });
    await expect(Math.round(box(more).right), '+n ends on the right edge').toBe(Math.round(box(collapsed).right));
};

/* ---------------------------------------------------------------- disabled */

/**
 * `disabled` disables every tag and suggestion in the group through the same
 * context a field uses: nothing takes focus, nothing responds, and the group
 * and its controls are announced as disabled.
 */
export const Disabled = {
    args: { onAccept: fn(), onSelect: fn() },
    render: ({ onAccept, onSelect }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '360px' }}>
            <button type="button">Before</button>
            <TagGroup label="Focus areas" disabled>
                <Tag color="blue" data-testid="read-only">Read only</Tag>
                <Tag behavior="removable" color="blue" onRemove={() => {}} data-testid="removable">Removable</Tag>
                <Tag behavior="selectable" color="blue" onClick={onSelect}>Selectable</Tag>
                <Tag behavior="link" color="blue" href="#tag" data-testid="link">Link</Tag>
                <Suggestion label="Fractions" onAccept={onAccept} />
                <Suggestion type="prompt" label="Summarize" onAccept={onAccept} />
            </TagGroup>
            <div style={{ width: '200px' }}>
                <TagGroup label="Collapsed focus areas" overflow="collapse" disabled>
                    {SUBJECTS.map((s) => <Tag key={s} color="blue" data-testid={`collapsed-${s}`}>{s}</Tag>)}
                </TagGroup>
            </div>
            <button type="button">After</button>
        </div>
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const group = canvas.getByRole('list', { name: 'Focus areas' });

        // Every tag is inert and says so itself: no ×, no link, a disabled
        // toggle, and each tag that is not a button carries aria-disabled.
        await expect(within(group).queryByRole('button', { name: /^Remove/ })).toBeNull();
        await expect(within(group).queryByRole('link')).toBeNull();
        await expect(within(group).getByRole('button', { name: 'Selectable' })).toBeDisabled();
        for (const id of ['read-only', 'removable', 'link']) {
            await expect(canvas.getByTestId(id), `${id} is announced disabled`).toHaveAttribute('aria-disabled', 'true');
        }

        // Suggestions read the same context: still named, announced disabled.
        const insert = within(group).getByRole('button', { name: 'Add Fractions, suggested' });
        const prompt = within(group).getByRole('button', { name: 'Summarize, suggested' });
        await expect(insert).toBeDisabled();
        await expect(prompt).toBeDisabled();

        // The collapsed group's +n is disabled with the rest.
        const collapsed = canvas.getByRole('list', { name: 'Collapsed focus areas' });
        await expect(await within(collapsed).findByRole('button', { name: /more tags$/ })).toBeDisabled();
        await expect(canvas.getByTestId('collapsed-Science')).toHaveAttribute('aria-disabled', 'true');

        // Nothing between Before and After takes focus.
        canvas.getByRole('button', { name: 'Before' }).focus();
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();

        // And nothing responds to a press.
        await userEvent.click(insert, { pointerEventsCheck: 0 });
        await userEvent.click(prompt, { pointerEventsCheck: 0 });
        await userEvent.click(within(group).getByRole('button', { name: 'Selectable' }), { pointerEventsCheck: 0 });
        await expect(args.onAccept).not.toHaveBeenCalled();
        await expect(args.onSelect).not.toHaveBeenCalled();
    },
};

/* ----------------------------------------------------------------- content */

/**
 * A removable set: the group holds the gaps, the tags hold the values.
 */
export const RemovableSet = () => {
    const [picked, setPicked] = useState(SUBJECTS.slice(0, 4));
    return (
        <TagGroup label="Chosen subjects">
            {picked.map((s) => (
                <Tag
                    key={s}
                    behavior="removable"
                    color="purple"
                    onRemove={() => setPicked((prev) => prev.filter((x) => x !== s))}
                >
                    {s}
                </Tag>
            ))}
        </TagGroup>
    );
};

RemovableSet.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);

    await userEvent.click(canvas.getByRole('button', { name: 'Remove History' }));

    // The list shrinks with it — the group counts what is really there.
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(canvas.queryByText('History')).toBeNull();
};

/**
 * `onOverflowClick` replaces the menu, for opening a picker instead.
 */
export const CustomOverflowAction = () => {
    const [opened, setOpened] = useState(0);
    return (
        <div>
            <TagGroup
                label="Subjects"
                overflow="collapse"
                maxVisible={2}
                overflowLabel={(n) => `${n} more`}
                onOverflowClick={() => setOpened((n) => n + 1)}
            >
                {SUBJECTS.map((s) => <Tag key={s} color="yellow">{s}</Tag>)}
            </TagGroup>
            <p className="body2-txt">Picker opened {opened} time(s)</p>
        </div>
    );
};

CustomOverflowAction.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = await canvas.findByRole('button', { name: '5 more tags' });
    await expect(more).toHaveTextContent('5 more');

    await userEvent.click(more);
    await expect(canvas.getByText('Picker opened 1 time(s)')).toBeInTheDocument();

    // The menu must NOT also open, or the caller's picker opens over it.
    await expect(canvas.queryByRole('button', { name: 'History' })).toBeNull();
};

/* -------------------------------------------------------------- playground */

/**
 * Interactive playground.
 *
 * The tags are fixed so the controls change the SET: whether it wraps or
 * collapses, which edge it lines up on, and whether it is disabled.
 */
export const Interactive = (args) => (
    <div style={{ maxWidth: '360px' }}>
        <TagGroup {...args}>
            {SUBJECTS.map((s) => <Tag key={s} color="blue">{s}</Tag>)}
        </TagGroup>
    </div>
);
Interactive.args = {
    label: 'Subjects',
    overflow: 'wrap',
    alignment: 'left',
    disabled: false,
};
