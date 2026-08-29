import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Tag, { TAG_COLORS } from './Tag';

/**
 * `Tag` — a value someone picked (#276).
 *
 * THE TEST SEAM IS THIS FILE. #276 settled on story `play:` functions run by
 * `check:storybook` in a real browser, and on nothing else: a good assertion
 * here is one a person could make by using the component — that a dismissed tag
 * disappears, that a selected tag says so to assistive technology — and never
 * that a class name is present or an internal function was called.
 *
 * The contrast half is already covered elsewhere and is not re-asserted here:
 * the a11y ratchet in `docs/evals/a11y-baseline.json` tracks `color-contrast`
 * over every story rendered, and may fall but never rise.
 */

export default {
    title: 'Components/Status and loading/Tag',
    component: Tag,
    parameters: {
        docs: {
            description: {
                component:
                    'A tag is a representation of a value that someone has picked. To show '
                    + 'system-generated data that people cannot change, use a badge instead.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' };

/** Every colour the API offers, so a name with no rule renders as an unstyled tag. */
export const Colors = () => (
    <div style={row}>
        {TAG_COLORS.map((color) => (
            <Tag key={color} color={color}>{color}</Tag>
        ))}
    </div>
);

export const Variants = () => (
    <div style={row}>
        <Tag variant="read-only" color="blue">Read only</Tag>
        <Tag variant="dismissible" color="green" onRemove={() => {}}>Dismissible</Tag>
        <Tag variant="selectable" color="purple" isSelected>Selected</Tag>
        <Tag variant="selectable" color="purple">Unselected</Tag>
        <Tag variant="operational" color="orange" onClick={() => {}}>Operational</Tag>
    </div>
);

/* ------------------------------------------------------------ dismissible */

/**
 * Dismissing removes the value, and the button says WHICH value.
 *
 * The accessible name is the assertion that matters. A row of tags whose remove
 * buttons are all called "Dismiss" gives a screen-reader user a list of
 * identical controls and no way to tell which one drops Science — which is what
 * the existing `Badge` does today, and the reason this is named from the label.
 */
export const Dismissing = () => {
    const [subjects, setSubjects] = useState(['Science', 'Mathematics', 'History']);
    return (
        <div style={row}>
            {subjects.map((s) => (
                <Tag
                    key={s}
                    variant="dismissible"
                    color="blue"
                    onRemove={() => setSubjects((prev) => prev.filter((x) => x !== s))}
                >
                    {s}
                </Tag>
            ))}
        </div>
    );
};

Dismissing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const remove = canvas.getByRole('button', { name: 'Remove Science' });
    await expect(remove).toBeInTheDocument();

    await userEvent.click(remove);

    // The value is gone, and only that value.
    await expect(canvas.queryByText('Science')).toBeNull();
    await expect(canvas.getByText('Mathematics')).toBeInTheDocument();
    await expect(canvas.getByText('History')).toBeInTheDocument();
};

/**
 * `onRemove` on a tag that is not dismissible renders no remove button.
 *
 * The gate is behaviour, not a type: `propTypes` validates that `onRemove` is a
 * function, never that the combination means anything. A read-only tag that
 * quietly grew an X would make the variant a lie, and the variant is the whole
 * API.
 */
export const RemoveIsGatedToDismissible = () => (
    <div style={row}>
        <Tag variant="read-only" color="grey" onRemove={() => {}}>Read only</Tag>
        <Tag variant="dismissible" color="grey" onRemove={() => {}}>Dismissible</Tag>
    </div>
);

RemoveIsGatedToDismissible.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Remove Read only' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Remove Dismissible' })).toBeInTheDocument();
};

/**
 * A dismissible tag is not itself a control.
 *
 * Its remove button is, and putting a button inside a button is invalid per
 * ARIA — the same rule the existing `Badge` records for its own dismiss button.
 * So the tag stays a `span`, and exactly one control exists inside it.
 */
export const DismissibleIsNotNestedInteractive = () => (
    <Tag variant="dismissible" color="teal" onRemove={() => {}}>Science</Tag>
);

DismissibleIsNotNestedInteractive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');
    await expect(buttons).toHaveLength(1);
    await expect(buttons[0]).toHaveAttribute('aria-label', 'Remove Science');
};

/* -------------------------------------------------------------- selectable */

/**
 * A selectable tag is a toggle, and says so.
 *
 * `aria-pressed` is the difference between a toggle and a button that happens to
 * look different after you press it. Without it the state change is visible only
 * to people who can see the change.
 */
export const Selecting = () => {
    const [picked, setPicked] = useState(['Science']);
    const toggle = (s) => setPicked((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    return (
        <div style={row}>
            {['Science', 'Mathematics'].map((s) => (
                <Tag
                    key={s}
                    variant="selectable"
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

/**
 * An operational tag acts, so it has no pressed state to report.
 *
 * `aria-pressed="false"` on a control that never toggles tells a screen-reader
 * user there is a state to track when there is not.
 */
export const OperationalHasNoPressedState = () => (
    <Tag variant="operational" color="orange" onClick={() => {}}>Add subject</Tag>
);

OperationalHasNoPressedState.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByRole('button', { name: 'Add subject' });
    await expect(tag).not.toHaveAttribute('aria-pressed');
};

/**
 * A read-only tag exposes no control at all.
 *
 * It is still a tag — the value was chosen by a person, and the pattern signals
 * that the selection becomes editable once the surface does. What it must not do
 * is offer something to press.
 */
export const ReadOnlyExposesNoControl = () => (
    <Tag variant="read-only" color="green">Science</Tag>
);

ReadOnlyExposesNoControl.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
    await expect(canvas.getByText('Science')).toBeInTheDocument();
};

/* ------------------------------------------------------------- truncation */

/**
 * A truncated label keeps its full text.
 *
 * Truncation that loses the text is not truncation, it is deletion — and CSS
 * ellipsis leaves nothing behind for a screen reader or a hover.
 */
export const Truncation = () => (
    <div style={row}>
        <Tag color="blue" maxWidth={140}>
            Social-Emotional Learning and Advocacy
        </Tag>
    </div>
);

Truncation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByTitle('Social-Emotional Learning and Advocacy');
    await expect(text).toBeInTheDocument();
    // The box is capped, so the label really is being clipped rather than fitting.
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
};

/* ------------------------------------------------------------- decoration */

export const WithLeadingContent = () => (
    <div style={row}>
        <Tag color="grey" swatchBefore="#7f3fb1">Series A</Tag>
        <Tag color="grey" elemBefore={<i className="fa-solid fa-user" aria-hidden="true" />}>Ms Okafor</Tag>
    </div>
);

/**
 * A swatch is decoration, not content.
 *
 * It repeats what the tag already says in words. Announcing it would give a
 * screen-reader user "square, Series A" and no extra information.
 */
WithLeadingContent.play = async ({ canvasElement }) => {
    const swatch = canvasElement.querySelector('.plus-tag__swatch');
    await expect(swatch).toHaveAttribute('aria-hidden', 'true');
};

export const Loading = () => (
    <div style={row}>
        <Tag variant="selectable" color="purple" isLoading>Saving</Tag>
    </div>
);

/**
 * A loading tag stands down as a control.
 *
 * A second click while the value is already changing queues a second action
 * against it, which is how a dismissal gets applied twice.
 */
Loading.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    await expect(canvas.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
};
