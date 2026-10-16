import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import Input from './Input';
import TagInput from './TagInput';

/**
 * `TagInput` — a field of Tags with a text entry after them, modelled on
 * Notion's multi-select: typing filters a list of options, and Enter picks the
 * highlighted one or creates a new tag.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and each behaviour the field promises has one. The list
 * renders in a portal on `document.body`, so the tests look for it there.
 */

export default {
    title: 'Components/Forms and inputs/Tag input',
    component: TagInput,
    tags: ['!dev', '!autodocs'],
};

const TOPICS = [
    { value: 'design-judgment', label: 'Design judgment', color: 'grey' },
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

const TAG_COLORS = ['grey', 'blue', 'green', 'purple', 'magenta', 'yellow', 'teal'];

/**
 * When nothing matches, Create is highlighted and Enter creates the tag. The
 * new tag's random colour is reported once, with its value.
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

        // The row previews the tag it will create: a real Tag, in its colour.
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

/** Each pasted tag gets one of Tag's seven colours, reported with its value. */
export const PastedTagsGetTagColours = {
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

/** A new value is cut to `maxLength`, and `onCreate` reports the cut value in a Tag colour. */
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
 * The small field fits its tags: every tag, "+n" included, is Tag's one
 * height, 22, and sits inside the field's border at any width, and the field
 * stays as tall as a small Input.
 */
const SMALL_WIDTHS = [160, 200, 240, 280, 360];

export const SmallFitsItsTags = () => (
    <div style={stack}>
        <Input label="Small input" size="small" />
        {SMALL_WIDTHS.map((width) => (
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
    for (const width of SMALL_WIDTHS) {
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
