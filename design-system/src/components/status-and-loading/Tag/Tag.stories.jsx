import React, { useState } from 'react';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';

import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Tag, { TAG_BEHAVIORS, TAG_COLORS, TagContext } from './Tag';

/**
 * `Tag` — a category, outlined: color on the border and swatch, neutral text,
 * one size (22), four behaviors.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. A good assertion here is one a person could make by using
 * the component or by measuring it: a role, a name, focus order, a computed
 * height, width or color. Never a class name.
 *
 * Hover and press are forced through `withForcedPseudo`, because a synthetic
 * event never sets `:hover` or `:active`; the browser's own cascade still
 * decides what the forced state looks like.
 *
 * Contrast is not re-asserted: the a11y ratchet tracks `color-contrast` over
 * every story rendered.
 */

export default {
    title: 'Components/Status and loading/Tag',
    component: Tag,
    parameters: {
        docs: {
            description: {
                component:
                    'Is it a number? Count. Is it the condition something is in, and can that '
                    + 'condition change? Status. Otherwise, Tag: a subject, a focus area, a person, '
                    + 'a category. Outlined, with neutral text and the color on the border and swatch.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' };

/* ------------------------------------------------------------------ helpers */

/** A computed style property of `measured` while `target` is forced into `pseudo`. */
const whileForced = (target, pseudo, property, measured = target) =>
    withForcedPseudo(target, pseudo, () => getComputedStyle(measured)[property]);

const CLEAR = 'rgba(0, 0, 0, 0)';

/* ----------------------------------------------------------------- stories */

const HUE_TOKEN = {
    blue: 'technology-tools',
    green: 'advocacy',
    purple: 'mastering-content',
    magenta: 'relationship',
    yellow: 'social-emotional',
    teal: 'tertiary',
};

/** Every color. The hue is on the border and the swatch; the words stay neutral. */
export const Colors = () => (
    <div style={row}>
        {TAG_COLORS.map((color) => (
            <Tag key={color} color={color} data-testid={color}>{color}</Tag>
        ))}
    </div>
);

/**
 * A color name paints the hue it names, on the border and the swatch, and on
 * nothing else. The border is the hue's Border Subtle token (grey's is Outline
 * Variant), the swatch is the hue itself, and the text is the same neutral on
 * every color.
 */
Colors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ink = tokenColor(canvasElement, '--color-on-surface');

    for (const color of TAG_COLORS) {
        const tag = canvas.getByTestId(color);
        const swatch = tag.querySelector('[aria-hidden="true"]');
        const s = getComputedStyle(tag);

        await expect(px(s.height), `${color} is 22 tall`).toBe(22);
        await expect(px(s.borderTopWidth), `${color} has a 1px border`).toBe(1);
        await expect(s.color, `${color} text is neutral`).toBe(ink);

        const border = color === 'grey'
            ? tokenColor(canvasElement, '--color-outline-variant')
            : tokenColor(canvasElement, `--color-${HUE_TOKEN[color]}-border-subtle`);
        await expect(s.borderTopColor, `${color} border`).toBe(border);

        const hue = color === 'grey'
            ? tokenColor(canvasElement, '--color-outline')
            : tokenColor(canvasElement, `--color-${HUE_TOKEN[color]}`);
        await expect(getComputedStyle(swatch).backgroundColor, `${color} swatch`).toBe(hue);
        await expect(px(getComputedStyle(swatch).width)).toBe(10);
        await expect(px(getComputedStyle(swatch).borderTopLeftRadius)).toBe(2);
    }

    // Grey is the one name that is not a hue: a default that drifted into a
    // color would have every uncolored tag claiming a category nobody gave it.
    const greySwatch = canvas.getByTestId('grey').querySelector('[aria-hidden="true"]');
    const [r, g, b] = getComputedStyle(greySwatch).backgroundColor.match(/\d+/g).map(Number);
    await expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(12);
};

/** The four behaviors, and the states that change a tag's contents. */
export const Behaviors = () => (
    <div style={row}>
        <Tag color="blue" data-testid="read-only">Read only</Tag>
        <Tag behavior="removable" color="blue" onRemove={() => {}} data-testid="removable">Removable</Tag>
        <Tag behavior="selectable" color="blue" data-testid="selectable">Selectable</Tag>
        <Tag behavior="selectable" color="blue" isSelected count={12} data-testid="selected">Selected</Tag>
        <Tag behavior="link" color="blue" href="#tag" data-testid="link">Link</Tag>
        <Tag behavior="link" color="blue" href="#tag" onRemove={() => {}} data-testid="split">Link with remove</Tag>
        <Tag behavior="removable" color="blue" onRemove={() => {}} isLoading data-testid="saving">Algebra</Tag>
    </div>
);

/** One size: every behavior and state is 22 tall, the count and the × included. */
Behaviors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const id of ['read-only', 'removable', 'selectable', 'selected', 'link', 'split', 'saving']) {
        await expect(px(getComputedStyle(canvas.getByTestId(id)).height), `${id} is 22 tall`).toBe(22);
    }
    await expect(TAG_BEHAVIORS).toEqual(['read-only', 'removable', 'selectable', 'link']);
};

/* -------------------------------------------------------------- selectable */

/** A selectable tag is a toggle, and says so through `aria-pressed`. */
export const Selecting = () => {
    const [picked, setPicked] = useState(['Science']);
    const toggle = (s) => setPicked((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    return (
        <div style={row}>
            {['Science', 'Mathematics'].map((s) => (
                <Tag
                    key={s}
                    behavior="selectable"
                    color="magenta"
                    isSelected={picked.includes(s)}
                    onClick={() => toggle(s)}
                >
                    {s}
                </Tag>
            ))}
        </div>
    );
};

Selecting.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const science = canvas.getByRole('button', { name: 'Science', pressed: true });
    const maths = canvas.getByRole('button', { name: 'Mathematics', pressed: false });

    await userEvent.click(maths);
    await expect(canvas.getByRole('button', { name: 'Mathematics', pressed: true })).toBeInTheDocument();

    await userEvent.click(science);
    await expect(canvas.getByRole('button', { name: 'Science', pressed: false })).toBeInTheDocument();
};

/** The hue's own state layers, in place of a brightness filter. */
export const StateLayers = () => (
    <div style={row}>
        <Tag behavior="selectable" color="blue">Unselected</Tag>
        <Tag behavior="selectable" color="blue" isSelected>Selected</Tag>
        <Tag behavior="selectable" color="grey" isSelected>Grey selected</Tag>
        <Tag behavior="link" color="green" href="#tag">Link</Tag>
        <Tag behavior="link" color="green" href="#tag" onRemove={() => {}} data-testid="split">Split link</Tag>
        <Tag behavior="removable" color="purple" onRemove={() => {}} data-testid="removable">Removable</Tag>
    </div>
);

/**
 * Selectable: hover 08, pressed 12; selected is 12 with a full-hue border, and
 * 16 on hover or press. A link is 08 and 12, and its text underlines on hover
 * and press only. On a removable tag only the × reacts: 08 on hover, 16
 * pressed, and the tag's own ground never moves.
 */
StateLayers.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const t = (token) => tokenColor(canvasElement, token);
    const bg = 'backgroundColor';

    const unselected = canvas.getByRole('button', { name: 'Unselected' });
    await expect(getComputedStyle(unselected)[bg], 'rest is outlined only').toBe(CLEAR);
    await expect(whileForced(unselected, ':hover', bg)).toBe(t('--color-technology-tools-state-08'));
    await expect(whileForced(unselected, ':active', bg)).toBe(t('--color-technology-tools-state-12'));

    const selected = canvas.getByRole('button', { name: 'Selected' });
    await expect(getComputedStyle(selected).borderTopColor, 'selected border is the full hue')
        .toBe(t('--color-technology-tools'));
    await expect(getComputedStyle(selected)[bg]).toBe(t('--color-technology-tools-state-12'));
    await expect(whileForced(selected, ':hover', bg)).toBe(t('--color-technology-tools-state-16'));
    await expect(whileForced(selected, ':active', bg)).toBe(t('--color-technology-tools-state-16'));

    const grey = canvas.getByRole('button', { name: 'Grey selected' });
    await expect(getComputedStyle(grey).borderTopColor).toBe(t('--color-outline'));
    await expect(getComputedStyle(grey)[bg]).toBe(t('--color-on-surface-variant-state-12'));

    // A plain link: the tag is the link.
    const link = canvas.getByRole('link', { name: 'Link' });
    const linkText = within(link).getByText('Link');
    await expect(whileForced(link, ':hover', bg)).toBe(t('--color-advocacy-state-08'));
    await expect(whileForced(link, ':active', bg)).toBe(t('--color-advocacy-state-12'));
    await expect(getComputedStyle(linkText).textDecorationLine, 'no underline at rest').toBe('none');
    await expect(whileForced(link, ':hover', 'textDecorationLine', linkText)).toBe('underline');
    await expect(whileForced(link, ':active', 'textDecorationLine', linkText)).toBe('underline');

    // A split link: the tag lights up for its link half, and the text underlines.
    const split = canvas.getByTestId('split');
    const splitLink = canvas.getByRole('link', { name: 'Split link' });
    const splitText = within(splitLink).getByText('Split link');
    await expect(whileForced(splitLink, ':hover', bg, split)).toBe(t('--color-advocacy-state-08'));
    await expect(whileForced(splitLink, ':active', bg, split)).toBe(t('--color-advocacy-state-12'));
    await expect(getComputedStyle(splitText).textDecorationLine).toBe('none');
    await expect(whileForced(splitLink, ':hover', 'textDecorationLine', splitText)).toBe('underline');
    await expect(whileForced(splitLink, ':active', 'textDecorationLine', splitText)).toBe('underline');
    const splitX = canvas.getByRole('button', { name: 'Remove Split link' });
    await expect(whileForced(splitX, ':hover', bg, split), 'hovering the × does not light the link')
        .toBe(CLEAR);

    const removable = canvas.getByTestId('removable');
    await expect(whileForced(removable, ':hover', bg), 'a removable tag itself never reacts').toBe(CLEAR);
    const x = canvas.getByRole('button', { name: 'Remove Removable' });
    await expect(whileForced(x, ':hover', bg)).toBe(t('--color-on-surface-variant-state-08'));
    await expect(whileForced(x, ':active', bg)).toBe(t('--color-on-surface-variant-state-16'));
};

/* ---------------------------------------------------------------- removing */

/**
 * The × removes the value, and says which value. A row of tags whose × are all
 * called "Remove" gives a screen-reader user identical controls and no way to
 * tell which one drops Science.
 */
export const Removing = {
    args: { onRemoveSpy: fn() },
    render: ({ onRemoveSpy }) => {
        const Row = () => {
            const [subjects, setSubjects] = useState(['Science', 'Mathematics', 'History']);
            return (
                <div style={row}>
                    {subjects.map((s) => (
                        <Tag
                            key={s}
                            behavior="removable"
                            color="blue"
                            onRemove={() => {
                                onRemoveSpy(s);
                                setSubjects((prev) => prev.filter((x) => x !== s));
                            }}
                        >
                            {s}
                        </Tag>
                    ))}
                    <Tag behavior="removable" color="blue" onRemove={() => {}} removeLabel="Drop the maths filter">Maths</Tag>
                </div>
            );
        };
        return <Row />;
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const remove = canvas.getByRole('button', { name: 'Remove Science' });
        await expect(px(getComputedStyle(remove).width), 'the × is the small Remove button').toBe(16);
        await expect(px(getComputedStyle(remove).height)).toBe(16);

        await userEvent.click(remove);
        await expect(args.onRemoveSpy).toHaveBeenCalledWith('Science');
        await expect(canvas.queryByText('Science')).toBeNull();
        await expect(canvas.getByText('Mathematics')).toBeInTheDocument();

        // `removeLabel` replaces the generated name.
        await expect(canvas.getByRole('button', { name: 'Drop the maths filter' })).toBeInTheDocument();

        // A removable tag is not itself a control: exactly one button per tag.
        await expect(canvas.getAllByRole('button')).toHaveLength(3);
    },
};

/**
 * A label that is not text gives the × nothing to be named after, so a row of
 * them would all be "Remove". Development says so unless `removeLabel` is set.
 */
export const RemoveNeedsANameForNodeLabels = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <button type="button" onClick={() => setMounted(true)}>Mount</button>
                {mounted && (
                    <>
                        <Tag behavior="removable" onRemove={() => {}}><em>Unnamed</em></Tag>
                        <Tag behavior="removable" onRemove={() => {}} removeLabel="Remove Named"><em>Named</em></Tag>
                    </>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount' }));
            await expect(canvas.getByRole('button', { name: 'Remove Named' })).toBeInTheDocument();
            const calls = warn.mock.calls.filter(([m]) => String(m).includes('Pass `removeLabel`'));
            await expect(calls.length, 'only the unnamed one warns').toBeGreaterThan(0);
            await expect(calls.every(([m]) => !String(m).includes('Named'))).toBe(true);
        } finally {
            warn.mockRestore();
        }
    },
};

/** Keyboard focus: a 2px Focus Ring 2px outside the tag, the link, or the ×. */
export const FocusRing = () => (
    <div style={row}>
        <Tag behavior="selectable" color="teal">Filter</Tag>
        <Tag behavior="removable" color="teal" onRemove={() => {}}>Chosen</Tag>
        <Tag behavior="link" color="teal" href="#tag">Go</Tag>
        <Tag behavior="link" color="teal" href="#tag" onRemove={() => {}} data-testid="split">Split</Tag>
    </div>
);

FocusRing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--color-focus-ring');
    const expectRing = async (el, what) => {
        const s = getComputedStyle(el);
        await expect(s.outlineStyle, what).toBe('solid');
        await expect(px(s.outlineWidth), what).toBe(2);
        await expect(px(s.outlineOffset), `${what} sits 2px outside`).toBe(2);
        await expect(s.outlineColor, what).toBe(ring);
    };

    await userEvent.tab();
    const tag = canvas.getByRole('button', { name: 'Filter' });
    await expect(tag).toHaveFocus();
    await expectRing(tag, 'selectable');

    await userEvent.tab();
    const x = canvas.getByRole('button', { name: 'Remove Chosen' });
    await expect(x).toHaveFocus();
    await expectRing(x, 'the ×');
    await expect(getComputedStyle(x).backgroundColor, 'with the 12 fill under it')
        .toBe(tokenColor(canvasElement, '--color-on-surface-variant-state-12'));

    await userEvent.tab();
    const go = canvas.getByRole('link', { name: 'Go' });
    await expect(go).toHaveFocus();
    await expectRing(go, 'a link');

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Split' })).toHaveFocus();
    await expectRing(canvas.getByTestId('split'), 'a split link rings the whole tag');
};

/* -------------------------------------------------------------------- link */

/**
 * A link that can also be removed is two targets, never one inside the other:
 * the text is the link and the × is its sibling, in that tab order, so
 * removing it can never follow it.
 */
export const LinkWithRemove = {
    args: { onRemoveSpy: fn(), onFollowSpy: fn() },
    render: ({ onRemoveSpy, onFollowSpy }) => (
        <div style={row}>
            <button type="button">Before</button>
            <Tag
                behavior="link"
                color="purple"
                href="#algebra"
                onClick={(e) => {
                    e.preventDefault();
                    onFollowSpy();
                }}
                onRemove={onRemoveSpy}
            >
                Algebra
            </Tag>
        </div>
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link', { name: 'Algebra' });
        const x = canvas.getByRole('button', { name: 'Remove Algebra' });

        await expect(link.contains(x), 'the × is not nested in the link').toBe(false);
        await expect(x.closest('a'), 'nor inside any link').toBeNull();

        canvas.getByRole('button', { name: 'Before' }).focus();
        await userEvent.tab();
        await expect(link).toHaveFocus();
        await userEvent.tab();
        await expect(x).toHaveFocus();

        await userEvent.click(x);
        await expect(args.onRemoveSpy).toHaveBeenCalledTimes(1);
        await expect(args.onFollowSpy, 'removing never follows the link').not.toHaveBeenCalled();
    },
};

/* ---------------------------------------------------------------- disabled */

/**
 * Disabled comes from the field, through `TagContext`: a neutral fill,
 * Secondary (Text), no ×, nothing to focus, and no hover.
 */
export const DisabledInField = () => (
    <div style={row}>
        <button type="button">Before</button>
        <TagContext.Provider value={{ isDisabled: true }}>
            <Tag color="blue" data-testid="read-only">Read only</Tag>
            <Tag behavior="removable" color="blue" onRemove={() => {}} data-testid="removable">Removable</Tag>
            <Tag behavior="selectable" color="blue" data-testid="selectable">Selectable</Tag>
            <Tag behavior="selectable" color="blue" isSelected data-testid="selected">Selected</Tag>
            <Tag behavior="link" color="blue" href="#tag" data-testid="link">Link</Tag>
        </TagContext.Provider>
        <button type="button">After</button>
    </div>
);

DisabledInField.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('button', { name: /^Remove/ }), 'no ×').toBeNull();
    await expect(canvas.queryByRole('link'), 'a disabled link is not a link').toBeNull();

    canvas.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' }), 'no tag takes focus').toHaveFocus();

    const fill = tokenColor(canvasElement, '--color-on-surface-state-12');
    const text = tokenColor(canvasElement, '--color-secondary-text');
    for (const id of ['read-only', 'removable', 'selectable', 'selected', 'link']) {
        const tag = canvas.getByTestId(id);
        await expect(getComputedStyle(tag).backgroundColor, `${id} fill`).toBe(fill);
        await expect(getComputedStyle(tag).color, `${id} text`).toBe(text);
        await expect(px(getComputedStyle(tag).height)).toBe(22);
    }

    // Selected stays visible when disabled, as a Secondary (Text) border.
    await expect(getComputedStyle(canvas.getByTestId('selected')).borderTopColor).toBe(text);
    await expect(getComputedStyle(canvas.getByTestId('read-only')).borderTopColor).toBe(CLEAR);

    // A disabled link does not answer a pointer: no state layer, no underline.
    const link = canvas.getByTestId('link');
    const linkText = within(link).getByText('Link');
    await expect(whileForced(link, ':hover', 'backgroundColor')).toBe(fill);
    await expect(whileForced(link, ':active', 'backgroundColor')).toBe(fill);
    await expect(whileForced(link, ':hover', 'textDecorationLine', linkText)).toBe('none');
    await expect(whileForced(link, ':active', 'textDecorationLine', linkText)).toBe('none');
};

/* ------------------------------------------------------------------- count */

/**
 * A count belongs to a selectable tag, such as a filter's result count. On any
 * other behavior it is ignored, and development says so.
 */
export const CountOnSelectable = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <Tag behavior="selectable" color="green" count={12}>Science</Tag>
                <button type="button" onClick={() => setMounted(true)}>Mount a removable with a count</button>
                {mounted && (
                    <Tag behavior="removable" color="green" count={34} onRemove={() => {}}>History</Tag>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const count = canvas.getByText('12');
        await expect(px(getComputedStyle(count.parentElement).height), 'a small Count, 16').toBe(16);
        await expect(canvas.getByRole('button', { name: 'Science 12' })).toBeInTheDocument();

        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount a removable with a count' }));
            await expect(canvas.getByText('History')).toBeInTheDocument();
            await expect(canvas.queryByText('34'), 'ignored off selectable').toBeNull();
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('`count` is only shown on behavior="selectable"'));
        } finally {
            warn.mockRestore();
        }
    },
};

/* ------------------------------------------------------------------ saving */

/**
 * Saving swaps the swatch for a spinner of the same size, so the tag does not
 * move, and says so once, through a status beside the tag rather than inside
 * its name. The × and a link stay in place but do nothing until the save lands.
 */
export const Saving = {
    args: { onRemoveSpy: fn(), onFollowSpy: fn(), onToggleSpy: fn() },
    render: ({ onRemoveSpy, onFollowSpy, onToggleSpy }) => {
        const Row = () => {
            const [saving, setSaving] = useState(false);
            return (
                <div style={row}>
                    <span data-testid="removable-wrap">
                        <Tag behavior="removable" color="yellow" isLoading={saving} onRemove={onRemoveSpy} data-testid="removable">Geometry</Tag>
                    </span>
                    <Tag behavior="selectable" color="yellow" isLoading={saving} onClick={onToggleSpy}>Statistics</Tag>
                    <Tag
                        behavior="link"
                        color="yellow"
                        href="#calculus"
                        isLoading={saving}
                        onClick={(e) => {
                            e.preventDefault();
                            onFollowSpy();
                        }}
                    >
                        Calculus
                    </Tag>
                    <button type="button" onClick={() => setSaving((v) => !v)}>
                        {saving ? 'Done' : 'Save'}
                    </button>
                </div>
            );
        };
        return <Row />;
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const tag = canvas.getByTestId('removable');
        const status = within(canvas.getByTestId('removable-wrap')).getByRole('status');
        const before = tag.getBoundingClientRect().width;

        await expect(status, 'the live region is there before anything is said').toHaveTextContent('');
        await expect(tag.contains(status), 'and sits outside the tag').toBe(false);

        await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
        await expect(tag.getBoundingClientRect().width, 'saving keeps the width').toBe(before);
        await expect(status).toHaveTextContent('Saving');
        await expect(within(canvas.getByTestId('removable-wrap')).getAllByRole('status'), 'announced once')
            .toHaveLength(1);

        // The control's name is its label, not "Saving".
        const toggle = canvas.getByRole('button', { name: 'Statistics' });
        await expect(toggle).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(toggle);
        await expect(args.onToggleSpy).not.toHaveBeenCalled();

        const link = canvas.getByRole('link', { name: 'Calculus' });
        await expect(link).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(link);
        await expect(args.onFollowSpy, 'a saving link does not follow').not.toHaveBeenCalled();

        await userEvent.click(canvas.getByRole('button', { name: 'Remove Geometry' }));
        await expect(args.onRemoveSpy, 'the × waits for the save').not.toHaveBeenCalled();

        const spinner = tag.querySelector('[aria-hidden="true"]');
        const hue = tokenColor(canvasElement, '--color-social-emotional');
        await expect(getComputedStyle(spinner).borderTopColor, 'the spinner is in the tag hue').toBe(hue);
        await expect(getComputedStyle(spinner).borderBottomColor, 'a 270° arc').toBe(hue);
        await expect(getComputedStyle(spinner).borderLeftColor).toBe(CLEAR);

        await userEvent.click(canvas.getByRole('button', { name: 'Done' }));
        await expect(status, 'and it goes quiet when the save lands').toHaveTextContent('');
        await userEvent.click(canvas.getByRole('button', { name: 'Remove Geometry' }));
        await expect(args.onRemoveSpy).toHaveBeenCalledTimes(1);
    },
};

/* -------------------------------------------------------------- truncation */

/**
 * Every tag caps at 180 wide. A clipped label ellipsizes and its full text is a
 * tooltip a keyboard can reach: on a span tag the label takes focus while it is
 * clipped; on a control, the control carries the tooltip. A label that fits
 * gets no tooltip and no extra tab stop.
 */
export const Truncation = () => (
    <div style={row}>
        <Tag color="blue">Social-Emotional Learning and Advocacy for Every Student</Tag>
        <Tag behavior="selectable" color="blue">Mastering Content Across Every Grade Band</Tag>
        <Tag color="blue">Short</Tag>
    </div>
);

Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const long = canvas.getByText('Social-Emotional Learning and Advocacy for Every Student');

    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
    await expect(getComputedStyle(long).textOverflow).toBe('ellipsis');
    await expect(long.parentElement.getBoundingClientRect().width).toBeLessThanOrEqual(180);

    await userEvent.tab();
    await expect(long, 'a clipped label is reachable by keyboard').toHaveFocus();
    const tip = await page.findByRole('tooltip', {}, { timeout: 2000 });
    await expect(tip).toHaveTextContent('Social-Emotional Learning and Advocacy for Every Student');

    await userEvent.tab();
    const control = canvas.getByRole('button', { name: 'Mastering Content Across Every Grade Band' });
    await expect(control, 'a control carries its own tooltip, with no second stop').toHaveFocus();
    await waitFor(() => expect(page.getByRole('tooltip')).toHaveTextContent('Mastering Content Across Every Grade Band'));

    await userEvent.tab();
    await expect(canvas.getByText('Short'), 'a label that fits takes no focus').not.toHaveFocus();
    await expect(canvas.getByText('Short')).not.toHaveAttribute('tabindex');
};

/* ------------------------------------------------------------- deprecation */

/**
 * The old names keep working. `orange` is `yellow` (the hue is a 44° yellow),
 * and `variant="dismissible"` is `behavior="removable"`; both say so in
 * development.
 */
export const DeprecatedNames = {
    render: () => {
        const [mounted, setMounted] = useState(false);
        return (
            <div style={row}>
                <button type="button" onClick={() => setMounted(true)}>Mount the old names</button>
                {mounted && (
                    <>
                        <Tag color="orange" data-testid="orange">Orange</Tag>
                        <Tag variant="dismissible" color="yellow" onRemove={() => {}}>Dismissible</Tag>
                    </>
                )}
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Mount the old names' }));
            await expect(getComputedStyle(canvas.getByTestId('orange')).borderTopColor)
                .toBe(tokenColor(canvasElement, '--color-social-emotional-border-subtle'));
            await expect(canvas.getByRole('button', { name: 'Remove Dismissible' })).toBeInTheDocument();
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('color="orange" is deprecated'));
            await expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant="dismissible" is deprecated'));
        } finally {
            warn.mockRestore();
        }
    },
};

/* -------------------------------------------------------------- playground */

/**
 * Interactive playground. `onRemove` is supplied here rather than exposed as a
 * control: a docs control cannot author a function, and a removable tag with
 * no handler renders no ×.
 */
export const Interactive = (args) => (
    <Tag {...args} onClick={(e) => e.preventDefault()} onRemove={() => {}} />
);
Interactive.args = {
    text: 'Mathematics',
    behavior: 'read-only',
    color: 'blue',
    href: '#mathematics',
    isSelected: false,
    isLoading: false,
};
