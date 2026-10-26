import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Input from './Input';
import TagInput from './TagInput';

/**
 * `TagInput` — a field of Tags with a text entry after them, modeled on
 * Notion's multi-select: typing filters a list of options, and Enter picks the
 * highlighted one or creates a new tag.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and each behavior the field promises has one. The list
 * renders in a portal on `document.body`, so the tests look for it there.
 */

export default {
    title: 'Components/Forms and inputs/Tag input',
    component: TagInput,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-25', kind: 'changed', summary: 'The color menu and a new tag\'s random color cover Tag\'s ten colors: orange, lime and brown joined.' },
            { date: '2026-10-23', kind: 'changed', summary: 'The field became 32 with one row of tags, growing as they wrap.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="small"` and `size="large"` were deprecated: they draw like `medium` and warn in development.' },
        ],
    },
};

const TOPICS = [
    { value: 'design-judgment', label: 'Design judgment', color: 'gray' },
    { value: 'decision-recall', label: 'Decision recall', color: 'purple' },
    { value: 'design-taxonomy', label: 'Design system taxonomy', color: 'blue' },
    { value: 'dev-coordination', label: 'Dev coordination', color: 'teal' },
];

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)', maxWidth: '400px' };

const bodyOf = (canvasElement) => within(canvasElement.ownerDocument.body);
const tagsIn = (canvas, label) => within(canvas.getByRole('list', { name: `Selected: ${label}` }));
/** The field's own live region. Each Tag carries one too, for its saving state. */
const announcer = (canvasElement) => canvasElement.querySelector('.plus-tag-input__announcer');

/** Typing filters the list and highlights the first match; Enter picks it. */
export const TypingFilters = () => (
    <div style={stack}>
        <TagInput label="Topics" options={TOPICS} />
    </div>
);

TypingFilters.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Topics' });

    await userEvent.click(input);
    const listbox = await body.findByRole('listbox', { name: 'Topics options' });
    await expect(within(listbox).getAllByRole('option')).toHaveLength(4);

    await userEvent.type(input, 'dec');
    // The one match, then the Create row: "dec" is not an option exactly.
    const options = within(listbox).getAllByRole('option');
    await expect(options).toHaveLength(2);
    await expect(options[0]).toHaveTextContent('Decision recall');
    await expect(options[1]).toHaveTextContent('Create dec');
    await expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

    await userEvent.keyboard('{Enter}');
    await expect(tagsIn(canvas, 'Topics').getByText('Decision recall')).toBeInTheDocument();
    await expect(input).toHaveValue('');
    await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('Decision recall added'));
};

/**
 * A screen owns the options: this one adds what `onCreate` reports, as a
 * real caller would.
 */
const Owned = ({ onCreateSpy, initialOptions = TOPICS, ...props }) => {
    const [options, setOptions] = useState(initialOptions);
    return (
        <TagInput
            label="Topics"
            options={options}
            onCreate={({ value, color }) => {
                if (onCreateSpy) onCreateSpy({ value, color });
                setOptions((list) => [...list, { value, label: value, color }]);
            }}
            {...props}
        />
    );
};

const TAG_COLORS = ['gray', 'blue', 'green', 'purple', 'magenta', 'yellow', 'teal', 'orange', 'lime', 'brown'];

/**
 * When nothing matches, Create is highlighted and Enter creates the tag. The
 * new tag's random color is reported once, with its value.
 */
export const CreateWhenNothingMatches = {
    args: { onCreateSpy: fn() },
    render: (args) => <div style={stack}><Owned {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = bodyOf(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Topics' });

        await userEvent.click(input);
        await userEvent.type(input, 'Music');
        const listbox = await body.findByRole('listbox', { name: 'Topics options' });
        await expect(body.getByText('No results')).toBeInTheDocument();
        const create = within(listbox).getByRole('option', { name: 'Create Music' });
        await expect(input).toHaveAttribute('aria-activedescendant', create.id);

        // The row previews the tag it will create: a real Tag, in its color.
        const preview = create.querySelector('.plus-tag');
        await expect(preview).not.toBeNull();
        await expect(preview).toHaveTextContent('Music');
        const previewColor = TAG_COLORS.find((name) => preview.classList.contains(`plus-tag--${name}`));

        await userEvent.keyboard('{Enter}');
        await expect(tagsIn(canvas, 'Topics').getByText('Music')).toBeInTheDocument();
        await expect(args.onCreateSpy).toHaveBeenCalledTimes(1);
        const [{ value, color }] = args.onCreateSpy.mock.calls[0];
        await expect(value).toBe('Music');
        await expect(TAG_COLORS).toContain(color);
        await expect(color).toBe(previewColor);

        // Created once: typing it again offers the option, not a second Create.
        await userEvent.type(input, 'music');
        await expect(within(listbox).queryByRole('option', { name: /^Create/ })).not.toBeInTheDocument();
    },
};

/** Text that matches an option apart from letter case picks that option. */
export const MatchIgnoresCase = {
    args: { onCreateSpy: fn() },
    render: (args) => <div style={stack}><Owned {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = bodyOf(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Topics' });

        await userEvent.click(input);
        await userEvent.type(input, 'DESIGN JUDGMENT');
        const listbox = await body.findByRole('listbox', { name: 'Topics options' });
        await expect(within(listbox).queryByRole('option', { name: /^Create/ })).not.toBeInTheDocument();

        await userEvent.keyboard('{Enter}');
        await expect(tagsIn(canvas, 'Topics').getByText('Design judgment')).toBeInTheDocument();
        await expect(args.onCreateSpy).not.toHaveBeenCalled();
    },
};

/** A click on a row picks it, and the list stays open for the next one. */
export const ClickPicks = () => (
    <div style={stack}>
        <TagInput label="Topics" options={TOPICS} />
    </div>
);

ClickPicks.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Topics' }));
    const listbox = await body.findByRole('listbox', { name: 'Topics options' });

    await userEvent.click(within(listbox).getByRole('option', { name: 'Dev coordination' }));
    await userEvent.click(within(listbox).getByRole('option', { name: 'Decision recall' }));
    const tags = tagsIn(canvas, 'Topics');
    await expect(tags.getByText('Dev coordination')).toBeInTheDocument();
    await expect(tags.getByText('Decision recall')).toBeInTheDocument();
    await expect(body.getByRole('listbox', { name: 'Topics options' })).toBeInTheDocument();
};

/** Backspace in an empty entry removes the last tag, and says so. */
export const BackspaceRemovesTheLastTag = () => (
    <div style={stack}>
        <TagInput label="Topics" options={TOPICS} defaultTags={['Algebra', 'Geometry']} />
    </div>
);

BackspaceRemovesTheLastTag.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Topics' });

    await userEvent.click(input);
    await userEvent.type(input, 'a');
    await userEvent.keyboard('{Backspace}');
    // The first Backspace deleted the typed letter; the tags are untouched.
    await expect(tagsIn(canvas, 'Topics').getByText('Geometry')).toBeInTheDocument();

    await userEvent.keyboard('{Backspace}');
    await expect(tagsIn(canvas, 'Topics').queryByText('Geometry')).not.toBeInTheDocument();
    await expect(tagsIn(canvas, 'Topics').getByText('Algebra')).toBeInTheDocument();
    await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('Geometry removed'));
};

/** Esc closes the list and clears only the typed text; the tags stay. */
export const EscClearsOnlyTheText = () => (
    <div style={stack}>
        <TagInput label="Topics" options={TOPICS} defaultTags={['Algebra']} />
    </div>
);

EscClearsOnlyTheText.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Topics' });

    await userEvent.click(input);
    await userEvent.type(input, 'des');
    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(body.queryByRole('listbox', { name: 'Topics options' })).not.toBeInTheDocument();
    await expect(tagsIn(canvas, 'Topics').getByText('Algebra')).toBeInTheDocument();
};

/** Pasting "a, b, c" makes three tags, trimmed, and an existing option is picked, not copied. */
export const PasteSplitsOnCommas = {
    args: { onCreateSpy: fn() },
    render: (args) => <div style={stack}><Owned {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Topics' });

        await userEvent.click(input);
        await userEvent.paste('Music,  Art , decision recall');
        const tags = tagsIn(canvas, 'Topics');
        await expect(tags.getAllByRole('listitem')).toHaveLength(3);
        await expect(tags.getByText('Music')).toBeInTheDocument();
        await expect(tags.getByText('Art')).toBeInTheDocument();
        await expect(tags.getByText('Decision recall')).toBeInTheDocument();
        await expect(args.onCreateSpy).toHaveBeenCalledTimes(2);
        await expect(input).toHaveValue('');
    },
};

/** Each pasted tag gets one of Tag's ten colors, reported with its value. */
export const PastedTagsGetTagColors = {
    args: { onCreateSpy: fn() },
    render: (args) => <div style={stack}><Owned {...args} initialOptions={[]} /></div>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Topics' });

        await userEvent.click(input);
        await userEvent.paste('a, b, c');
        await expect(tagsIn(canvas, 'Topics').getAllByRole('listitem')).toHaveLength(3);
        await expect(args.onCreateSpy).toHaveBeenCalledTimes(3);
        const reported = args.onCreateSpy.mock.calls.map(([call]) => call);
        await expect(reported.map(({ value }) => value)).toEqual(['a', 'b', 'c']);
        for (const { color } of reported) {
            await expect(TAG_COLORS).toContain(color);
        }
    },
};

/** A new value is cut to `maxLength`, and `onCreate` reports the cut value in a Tag color. */
export const MaxLength = {
    args: { onCreateSpy: fn() },
    render: (args) => <div style={stack}><Owned {...args} maxLength={5} /></div>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Topics' });
        await expect(input).toHaveAttribute('maxlength', '5');

        await userEvent.click(input);
        await userEvent.paste('Photography, Art');
        await expect(tagsIn(canvas, 'Topics').getByText('Photo')).toBeInTheDocument();
        await expect(tagsIn(canvas, 'Topics').getByText('Art')).toBeInTheDocument();
        await expect(args.onCreateSpy).toHaveBeenCalledTimes(2);
        const reported = args.onCreateSpy.mock.calls.map(([call]) => call);
        await expect(reported.map(({ value }) => value)).toEqual(['Photo', 'Art']);
        for (const { color } of reported) {
            await expect(TAG_COLORS).toContain(color);
        }
    },
};

/** At the pick limit, Create hides and the list says why. */
export const PickLimit = () => (
    <div style={stack}>
        <TagInput label="Topics" options={TOPICS} maxTags={2} defaultTags={['Algebra', 'Geometry']} />
    </div>
);

PickLimit.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Topics' });

    await userEvent.click(input);
    await userEvent.type(input, 'Music');
    const listbox = await body.findByRole('listbox', { name: 'Topics options' });
    await expect(within(listbox).queryByRole('option', { name: /^Create/ })).not.toBeInTheDocument();
    await expect(body.getByText('You can pick up to 2')).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    await expect(tagsIn(canvas, 'Topics').getAllByRole('listitem')).toHaveLength(2);
};

const MANY = ['Algebra', 'Geometry', 'Fractions', 'Decimals', 'Ratios', 'Statistics', 'Probability'];

/** Without focus, tags past one line collapse into "+n". With focus, every tag shows. */
export const CollapsesWithoutFocus = () => (
    <div style={{ ...stack, maxWidth: '280px' }}>
        <TagInput label="Topics" options={TOPICS} defaultTags={MANY} />
    </div>
);

CollapsesWithoutFocus.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Selected: Topics' });
    const overflow = await within(list).findByRole('button', { name: /^\+\d+ more tags?$/ });
    await expect(overflow).toBeVisible();

    await userEvent.click(overflow);
    await expect(canvas.getByRole('combobox', { name: 'Topics' })).toHaveFocus();
    await waitFor(() => expect(within(list).queryByRole('button', { name: /more tag/ })).not.toBeInTheDocument());
    await expect(within(list).getByText('Probability')).toBeVisible();
};

/**
 * The field fits its tags: every tag, "+n" included, is Tag's one height, 22,
 * and sits inside the field's border at any width, and the field stays as tall
 * as an Input. `small` is deprecated and draws like `medium`, so the two match.
 */
const WIDTHS = [160, 200, 240, 280, 360];

export const SmallFitsItsTags = () => (
    <div style={stack}>
        <Input label="Small input" size="small" />
        {WIDTHS.map((width) => (
            <div key={width} style={{ width }}>
                <TagInput label={`Topics at ${width}`} size="small" options={TOPICS} defaultTags={MANY} />
            </div>
        ))}
    </div>
);

SmallFitsItsTags.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const smallInput = canvas.getByRole('textbox', { name: 'Small input' }).closest('.plus-field');
    const smallHeight = smallInput.getBoundingClientRect().height;
    for (const width of WIDTHS) {
        const list = canvas.getByRole('list', { name: `Selected: Topics at ${width}` });
        await within(list).findByRole('button', { name: /^\+\d+ more tags?$/ });

        const field = list.closest('.plus-field');
        const border = parseFloat(getComputedStyle(field).borderTopWidth);
        const inner = field.getBoundingClientRect();
        await expect(Math.abs(inner.height - smallHeight)).toBeLessThanOrEqual(0.5);
        const shown = [...list.querySelectorAll('.plus-tag')]
            .filter((tag) => tag.checkVisibility({ visibilityProperty: true }));
        await expect(shown.some((tag) => tag.matches('.plus-tag-group__overflow'))).toBe(true);
        for (const tag of shown) {
            const box = tag.getBoundingClientRect();
            await expect(Math.round(box.height)).toBe(22);
            await expect(box.top).toBeGreaterThanOrEqual(inner.top + border);
            await expect(box.bottom).toBeLessThanOrEqual(inner.bottom - border);
            await expect(box.right).toBeLessThanOrEqual(inner.right - border);
        }
    }
};

/**
 * A created tag holds a temporary id, saving, until the caller confirms it
 * with the id it stored. `onChange` reports both.
 */
const Confirming = ({ onChange }) => {
    const [confirm, setConfirm] = useState(null);
    return (
        <div style={stack}>
            <TagInput
                label="Topics"
                options={TOPICS}
                onChange={onChange}
                onCreate={() => new Promise((resolve) => setConfirm(() => resolve))}
            />
            <button type="button" disabled={!confirm} onClick={() => confirm('topic-42')}>Confirm</button>
        </div>
    );
};

export const TemporaryIdUntilConfirmed = {
    args: { onChange: fn() },
    render: (args) => <Confirming {...args} />,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox', { name: 'Topics' });

        await userEvent.click(input);
        await userEvent.type(input, 'Music{Enter}');
        const pending = args.onChange.mock.lastCall[0][0];
        await expect(pending.value).toMatch(/^new-/);
        await expect(pending.text).toBe('Music');

        await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
        await waitFor(() => expect(args.onChange.mock.lastCall[0][0].value).toBe('topic-42'));
    },
};

/** Read-only: the tags show on the read-only fill, with no × and no list. */
export const ReadOnly = () => (
    <div style={stack}>
        <TagInput label="Topics" options={TOPICS} defaultTags={['Algebra', 'Geometry']} readOnly />
    </div>
);

ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Topics' });
    await expect(input).toHaveAttribute('readonly');
    await expect(canvas.queryAllByRole('button', { name: /^Remove/ })).toHaveLength(0);

    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');
    await expect(body.queryByRole('listbox', { name: 'Topics options' })).not.toBeInTheDocument();
    await expect(tagsIn(canvas, 'Topics').getByText('Geometry')).toBeInTheDocument();
};

/** Invalid: the danger border, and the message under the field names the problem. */
export const Invalid = () => (
    <div style={stack}>
        <TagInput
            label="Topics"
            options={TOPICS}
            required
            validation="invalid"
            validationMessage="Pick at least one topic"
        />
    </div>
);

Invalid.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Topics' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Pick at least one topic');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Pick at least one topic');

    const box = input.closest('.plus-field');
    const message = canvasElement.querySelector('.plus-field-caption__message--invalid');
    await userEvent.click(input);
    const hint = await waitFor(() => {
        const el = document.querySelector('.plus-tag-input__hint');
        if (!el) throw new Error('the list has not opened');
        return el;
    });
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(box).borderTopColor, `${mode}: invalid border`).toBe(token('--ds-border-danger'));
        await expect(getComputedStyle(message).color, `${mode}: invalid message`).toBe(token('--ds-text-danger'));
        await expect(getComputedStyle(hint).color, `${mode}: the list's hint`).toBe(token('--ds-text-subtle'));
    });
    await userEvent.keyboard('{Escape}');
};

/** Disabled: every tag is disabled, with no × and no entry. */
export const Disabled = () => (
    <div style={stack}>
        <TagInput label="Topics" options={TOPICS} defaultTags={['Algebra', 'Geometry']} disabled />
    </div>
);

Disabled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox', { name: 'Topics' })).toBeDisabled();
    await expect(canvas.queryAllByRole('button', { name: /^Remove/ })).toHaveLength(0);
};

const ControlledField = () => {
    const [tags, setTags] = useState(['Algebra', 'Geometry']);
    return <TagInput label="With onChange" options={TOPICS} tags={tags} onChange={setTags} />;
};

/** A controlled field offers a × only when it has a handler to tell. */
export const Controlled = () => (
    <div style={stack}>
        <ControlledField />
        <TagInput label="No handler" options={TOPICS} tags={['Algebra']} />
    </div>
);

Controlled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(tagsIn(canvas, 'No handler').queryAllByRole('button', { name: /^Remove/ })).toHaveLength(0);
    await userEvent.click(tagsIn(canvas, 'With onChange').getByRole('button', { name: 'Remove Algebra' }));
    await expect(tagsIn(canvas, 'With onChange').queryByText('Algebra')).not.toBeInTheDocument();
};

/**
 * A screen that owns its options and lets people tidy them where they pick
 * them: rename, delete, recolor and reorder, each reported to the caller,
 * which updates its list, as a real caller would.
 */
const Tidy = ({
    onRenameSpy, onDeleteSpy, onColorChangeSpy, onReorderSpy,
    menu = true, reorder = true, initialTags = [], ...props
}) => {
    const [options, setOptions] = useState(TOPICS);
    const handlers = {};
    if (menu) {
        handlers.onRename = (value, name) => {
            if (onRenameSpy) onRenameSpy(value, name);
            setOptions((list) => list.map((option) => (option.value === value ? { ...option, label: name } : option)));
        };
        handlers.onDelete = (value) => {
            if (onDeleteSpy) onDeleteSpy(value);
            setOptions((list) => list.filter((option) => option.value !== value));
        };
        handlers.onColorChange = (value, color) => {
            if (onColorChangeSpy) onColorChangeSpy(value, color);
            setOptions((list) => list.map((option) => (option.value === value ? { ...option, color } : option)));
        };
    }
    if (reorder) {
        handlers.onReorder = (from, to) => {
            if (onReorderSpy) onReorderSpy(from, to);
            setOptions((list) => {
                const next = [...list];
                next.splice(to, 0, ...next.splice(from, 1));
                return next;
            });
        };
    }
    return <TagInput label="Topics" options={options} defaultTags={initialTags} {...handlers} {...props} />;
};

const tidyArgs = () => ({
    onRenameSpy: fn(), onDeleteSpy: fn(), onColorChangeSpy: fn(), onReorderSpy: fn(),
});

/** Opens the list and points at a row the way a mouse does, then returns its "…" button. */
const openMenuButton = async (canvasElement, name) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Topics' }));
    const listbox = await body.findByRole('listbox', { name: 'Topics options' });
    await userEvent.hover(within(listbox).getByRole('option', { name }));
    return body.findByRole('button', { name: `Options for ${name}` });
};

const rowNames = (canvasElement) => within(bodyOf(canvasElement).getByRole('listbox', { name: 'Topics options' }))
    .getAllByRole('option').map((option) => option.textContent);

/**
 * The "…" on a row opens its menu. Focus moves to the name, Enter renames, and
 * focus comes back to the "…". Esc leaves the name as it was.
 */
export const OptionMenuRenames = {
    args: tidyArgs(),
    render: (args) => <div style={stack}><Tidy {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const body = bodyOf(canvasElement);
        const more = await openMenuButton(canvasElement, 'Decision recall');
        await userEvent.click(more);

        const name = await body.findByRole('textbox', { name: 'Name' });
        await waitFor(() => expect(name).toHaveFocus());
        await expect(name).toHaveValue('Decision recall');

        await userEvent.keyboard('{Escape}');
        await expect(args.onRenameSpy).not.toHaveBeenCalled();
        await expect(body.queryByRole('listbox', { name: 'Options for Decision recall' })).not.toBeInTheDocument();
        await waitFor(() => expect(more).toHaveFocus());

        await userEvent.keyboard('{Enter}');
        const again = await body.findByRole('textbox', { name: 'Name' });
        await waitFor(() => expect(again).toHaveFocus());
        await userEvent.clear(again);
        await userEvent.type(again, 'Recall{Enter}');
        await expect(args.onRenameSpy).toHaveBeenCalledWith('decision-recall', 'Recall');
        await expect(body.getByRole('option', { name: 'Recall' })).toBeInTheDocument();
        await waitFor(() => expect(body.getByRole('button', { name: 'Options for Recall' })).toHaveFocus());
        await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('Decision recall renamed to Recall'));
    },
};

/** Delete removes the option, and a tag picked from it goes too. */
export const OptionMenuDeletes = {
    args: { ...tidyArgs(), initialTags: [TOPICS[1]] },
    render: (args) => <div style={stack}><Tidy {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = bodyOf(canvasElement);
        await userEvent.click(await openMenuButton(canvasElement, 'Decision recall'));
        const menu = await body.findByRole('listbox', { name: 'Options for Decision recall' });

        await userEvent.click(within(menu).getByRole('option', { name: 'Delete' }));
        await expect(args.onDeleteSpy).toHaveBeenCalledWith('decision-recall');
        await expect(body.queryByRole('option', { name: 'Decision recall' })).not.toBeInTheDocument();
        await expect(canvas.queryByRole('list', { name: 'Selected: Topics' })).not.toBeInTheDocument();
        await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('Decision recall deleted'));
    },
};

/**
 * The menu lists Tag's ten colors with the current one checked. A click
 * picks one; so do the arrow keys and Enter from the name field.
 */
export const OptionMenuChangesColor = {
    args: tidyArgs(),
    render: (args) => <div style={stack}><Tidy {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const body = bodyOf(canvasElement);
        const more = await openMenuButton(canvasElement, 'Decision recall');
        await userEvent.click(more);
        const menu = await body.findByRole('listbox', { name: 'Options for Decision recall' });
        const colors = within(within(menu).getByRole('group', { name: 'Color' })).getAllByRole('option');
        await expect(colors.map((row) => row.textContent)).toEqual(
            ['Gray', 'Blue', 'Green', 'Purple', 'Magenta', 'Yellow', 'Teal', 'Orange', 'Lime', 'Brown']
        );
        await expect(within(menu).getByRole('option', { name: 'Purple' })).toHaveAttribute('aria-selected', 'true');

        await userEvent.click(within(menu).getByRole('option', { name: 'Teal' }));
        await expect(args.onColorChangeSpy).toHaveBeenCalledWith('decision-recall', 'teal');
        await waitFor(() => expect(more).toHaveFocus());

        // The keyboard: Enter on the "…", then the arrows walk the rows from the top.
        await userEvent.keyboard('{Enter}');
        const name = await body.findByRole('textbox', { name: 'Name' });
        await waitFor(() => expect(name).toHaveFocus());
        const reopened = body.getByRole('listbox', { name: 'Options for Decision recall' });
        await expect(within(reopened).getByRole('option', { name: 'Teal' })).toHaveAttribute('aria-selected', 'true');
        await userEvent.keyboard('{ArrowDown}');
        await expect(name).toHaveAttribute(
            'aria-activedescendant',
            within(reopened).getByRole('option', { name: 'Delete' }).id
        );
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await expect(args.onColorChangeSpy).toHaveBeenLastCalledWith('decision-recall', 'blue');
    },
};

/**
 * The keyboard reorders: Tab from the entry reaches the highlighted row's
 * handle, Space picks the row up, the arrows move it, Space drops it and Esc
 * cancels. Each step is announced.
 */
export const KeyboardReorder = {
    args: tidyArgs(),
    render: (args) => <div style={stack}><Tidy {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = bodyOf(canvasElement);
        await userEvent.click(canvas.getByRole('combobox', { name: 'Topics' }));
        await body.findByRole('listbox', { name: 'Topics options' });

        await userEvent.tab();
        const handle = body.getByRole('button', { name: 'Reorder Design judgment' });
        await expect(handle).toHaveFocus();

        await userEvent.keyboard(' ');
        await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('Design judgment picked up, position 1 of 4'));
        await expect(body.getByRole('option', { name: 'Design judgment' })).toHaveClass('is-dragging');
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('position 3 of 4'));
        await expect(body.getByRole('option', { name: 'Dev coordination' })).toHaveClass('has-drop-indicator');
        await userEvent.keyboard('{Escape}');
        await expect(args.onReorderSpy).not.toHaveBeenCalled();
        await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('Reorder canceled'));
        await expect(body.getByRole('option', { name: 'Design judgment' })).not.toHaveClass('is-dragging');

        await userEvent.keyboard(' {ArrowDown}{ArrowDown}{Enter}');
        await expect(args.onReorderSpy).toHaveBeenCalledWith(0, 2);
        await waitFor(() => expect(announcer(canvasElement)).toHaveTextContent('Design judgment dropped, position 3 of 4'));
        await expect(rowNames(canvasElement)).toEqual(
            ['Decision recall', 'Design system taxonomy', 'Design judgment', 'Dev coordination']
        );
        await waitFor(() => expect(body.getByRole('button', { name: 'Reorder Design judgment' })).toHaveFocus());
    },
};

/** A drag by the handle moves a row, and a line marks where it will land. */
export const DragReorder = {
    args: tidyArgs(),
    render: (args) => <div style={stack}><Tidy {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        const body = bodyOf(canvasElement);
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('combobox', { name: 'Topics' }));
        const listbox = await body.findByRole('listbox', { name: 'Topics options' });
        await userEvent.hover(within(listbox).getByRole('option', { name: 'Design judgment' }));
        const handle = body.getByRole('button', { name: 'Reorder Design judgment' });

        const start = handle.getBoundingClientRect();
        const pointer = (target, type, y) => target.dispatchEvent(new PointerEvent(type, {
            bubbles: true, clientX: start.left + 2, clientY: y, pointerId: 1, isPrimary: true, button: 0,
        }));
        pointer(handle, 'pointerdown', start.top + 2);
        const dev = within(listbox).getByRole('option', { name: 'Dev coordination' }).getBoundingClientRect();
        pointer(window, 'pointermove', dev.top + dev.height * 0.75);
        await waitFor(() => expect(within(listbox).getByRole('option', { name: 'Design judgment' })).toHaveClass('is-dragging'));
        await expect(within(listbox).getByRole('option', { name: 'Dev coordination' })).toHaveClass('has-drop-indicator-after');

        pointer(window, 'pointerup', dev.top + dev.height * 0.75);
        await expect(args.onReorderSpy).toHaveBeenCalledWith(0, 3);
        await expect(rowNames(canvasElement)).toEqual(
            ['Decision recall', 'Design system taxonomy', 'Dev coordination', 'Design judgment']
        );
    },
};

/** With none of the handlers, rows have no "…" and no handle, and Tab leaves the field as before. */
export const NoTidyingWithoutHandlers = {
    args: tidyArgs(),
    render: (args) => (
        <div style={stack}>
            <Tidy {...args} menu={false} reorder={false} />
            <button type="button">After</button>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = bodyOf(canvasElement);
        await userEvent.click(canvas.getByRole('combobox', { name: 'Topics' }));
        const listbox = await body.findByRole('listbox', { name: 'Topics options' });
        await userEvent.hover(within(listbox).getByRole('option', { name: 'Decision recall' }));
        await expect(body.queryByRole('button', { name: /^Options for/ })).not.toBeInTheDocument();
        await expect(body.queryByRole('button', { name: /^Reorder/ })).not.toBeInTheDocument();
        await expect(listbox.querySelector('.fa-grip-vertical')).toBeNull();
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
    },
};

const tidyArgTypes = {
    menu: { control: 'boolean', description: 'Pass onRename, onDelete and onColorChange.', table: { category: 'Behavior' } },
    reorder: { control: 'boolean', description: 'Pass onReorder.', table: { category: 'Behavior' } },
    size: { control: 'radio', options: ['small', 'medium', 'large'], description: 'Size variant', table: { category: 'Design' } },
};

/** The option menu, open on a row. Controls choose which handlers the field gets. */
export const OptionMenu = {
    args: { menu: true, reorder: true, size: 'medium' },
    argTypes: tidyArgTypes,
    render: (args) => <div style={{ ...stack, minHeight: '480px' }}><Tidy {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        if (!args.menu) return;
        await userEvent.click(await openMenuButton(canvasElement, 'Decision recall'));
    },
};

/** Reordering: a row picked up by its handle, with the hint naming the keys. */
export const Reordering = {
    args: { menu: true, reorder: true, size: 'medium' },
    argTypes: tidyArgTypes,
    render: (args) => <div style={{ ...stack, minHeight: '320px' }}><Tidy {...args} /></div>,
    play: async ({ canvasElement, args }) => {
        if (!args.reorder) return;
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('combobox', { name: 'Topics' }));
        await userEvent.tab();
        await userEvent.keyboard(' {ArrowDown}');
        await expect(bodyOf(canvasElement).getByText('↑ ↓ move · Space drops · Esc cancels')).toBeInTheDocument();
    },
};

/** Filled, at rest. Focus it to type, pick and create. */
export const Overview = () => (
    <div style={stack}>
        <Owned defaultTags={[TOPICS[0], TOPICS[1]]} />
    </div>
);

export const Sizes = () => (
    <div style={stack}>
        {['small', 'medium', 'large'].map((size) => (
            <TagInput key={size} label={`Topics, ${size}`} size={size} options={TOPICS} defaultTags={[TOPICS[0], TOPICS[1]]} />
        ))}
    </div>
);

export const Interactive = {
    args: {
        label: 'Topics',
        caption: '',
        required: false,
        size: 'medium',
        disabled: false,
        readOnly: false,
        validation: 'none',
        validationMessage: 'Pick at least one topic',
    },
    argTypes: {
        label: { control: 'text', description: 'Names the field.', table: { category: 'Content' } },
        caption: { control: 'text', description: 'Standing help under the field.', table: { category: 'Content' } },
        required: { control: 'boolean', description: 'Shows an asterisk and sets aria-required.', table: { category: 'Content' } },
        size: { control: 'radio', options: ['small', 'medium', 'large'], description: 'Size variant', table: { category: 'Design' } },
        disabled: { control: 'boolean', table: { category: 'Behavior' } },
        readOnly: { control: 'boolean', table: { category: 'Behavior' } },
        validation: { control: 'radio', options: ['none', 'invalid'], table: { category: 'Behavior' } },
        validationMessage: { control: 'text', table: { category: 'Content' } },
        onCreateSpy: { table: { disable: true } },
    },
    render: (args) => <div style={stack}><Owned {...args} caption={args.caption || undefined} /></div>,
};
