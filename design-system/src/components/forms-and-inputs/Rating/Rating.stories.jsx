import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Rating from './Rating';
import { typeStyle } from '@/storybook-docs/lib/type-style.js';

export default {
    title: 'Components/Forms and inputs/Rating',
    component: Rating,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Rating component for form inputs. Supports two types: with "Comments" label below or with numeric labels (1-5) above each star. Provides interactive star selection from 0 to 5 stars.'
            }
        }
    },
    argTypes: {
        children: {
            storyOnly: true,
            table: { disable: true },
        },
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: { table: { disable: true } },
        value: {
            table: { disable: true, category: 'Development' }
        },
        label: {
            control: 'text',
            table: { category: 'Content' }
        },
        type: {
            control: 'select',
            options: ['comments', 'numeric'],
            table: { category: 'Design' }
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isRequired: {
            control: 'boolean',
            table: { category: 'Content' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            table: { disable: true, category: 'Development' }
        }
    }
};

const ratingCol = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-2xl)', maxWidth: 'var(--content-max-width-reading)' };

export const Overview = () => {
    const [value, setValue] = useState(3);

    return (
        <div style={{ ...ratingCol, maxWidth: '480px' /* demo frame */ }}>
            <Rating
                id="rating-overview"
                label="How was the session?"
                isRequired
                value={value}
                type="comments"
                onChange={setValue}
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formRating }
    }
};

export const Content = () => {
    const [value, setValue] = useState(3);

    return (
        <div style={ratingCol}>
            <section>
                <span style={{ display: 'block', marginBottom: 'var(--stack-md)', ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' }}>BASELINE RATING</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Labeled comments-style rating with a required indicator.
                </p>
                <Rating
                    id="rating-content"
                    label="How was the session?"
                    isRequired
                    value={value}
                    type="comments"
                    onChange={setValue}
                />
            </section>
        </div>
    );
};

export const Variants = () => {
    const [commentsValue, setCommentsValue] = useState(2);
    const [numericValue, setNumericValue] = useState(4);

    return (
        <div style={ratingCol}>
            <section>
                <span style={{ display: 'block', marginBottom: 'var(--stack-md)', ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' }}>COMMENTS</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Label appears below the stars for open-ended feedback flows.
                </p>
                <Rating id="rating-comments-type" value={commentsValue} type="comments" onChange={setCommentsValue} />
            </section>
            <section>
                <span style={{ display: 'block', marginBottom: 'var(--stack-md)', ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' }}>NUMERIC</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Numeric labels above each star for more explicit scales.
                </p>
                <Rating id="rating-numeric-type" value={numericValue} type="numeric" onChange={setNumericValue} />
            </section>
        </div>
    );
};

export const InteractionStates = () => (
    <div style={ratingCol}>
        <section>
            <span style={{ display: 'block', marginBottom: 'var(--stack-md)', ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' }}>DISABLED</span>
            <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                Disabled ratings remain visible but cannot be changed.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-2xl)' }}>
                <Rating id="rating-disabled-comments" value={3} type="comments" isDisabled />
                <Rating id="rating-disabled-numeric" value={3} type="numeric" isDisabled />
            </div>
        </section>
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(3);

    useEffect(() => {
        setValue(3);
    }, [args.type]);

    return (
        <div style={{ maxWidth: '400px' /* demo frame */ }}>
            <Rating
                label={args.label}
                isRequired={args.isRequired}
                type={args.type}
                isDisabled={args.isDisabled}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
Interactive.args = {
    label: 'How was the session?',
    isRequired: false,
    type: 'comments',
    isDisabled: false,
};
Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const star4 = canvas.getByRole('radio', { name: 'Rate 4' });
    await userEvent.click(star4);
    await settleAnimations(canvasElement);
    await expect(star4).toHaveAttribute('aria-checked', 'true');
    await expect(getComputedStyle(star4.querySelector('i')).color).toBe(tokenColor(canvasElement, '--ds-icon-inverse'));

    const star5 = canvas.getByRole('radio', { name: 'Rate 5' });
    await userEvent.click(star5);
    await expect(star5.style.getPropertyValue('--plus-rating-stagger')).toBe('0ms');
    await settleAnimations(canvasElement);
    await expect(star5).toHaveAttribute('aria-checked', 'true');
};

/** Each prop shows up in the DOM: numeric labels, comments label, icon family, minority marker. */
export const PropsRender = () => (
    <div style={ratingCol}>
        <Rating id="rating-props-numeric" label="Session pacing" type="numeric" icon="thumbs-up" isRequired labelMarker="required" value={2} />
        <Rating id="rating-props-comments" label="Tutor feedback" type="comments" commentsLabel="Tell us more" value={2} />
    </div>
);
PropsRender.parameters = { docs: { disable: true } };
PropsRender.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const numeric = canvas.getByRole('radiogroup', { name: 'Session pacing' });
    const comments = canvas.getByRole('radiogroup', { name: 'Tutor feedback' });

    // type=numeric: a label 1-5 above each item, no comments label.
    for (const n of [1, 2, 3, 4, 5]) {
        await expect(within(numeric.parentElement).getByText(String(n))).toBeTruthy();
    }
    await expect(within(numeric.parentElement).queryByText('Comments')).toBeNull();

    // type=comments: the comments label sits below, no numbers.
    await expect(canvas.getByText('Tell us more')).toBeTruthy();
    await expect(within(comments.parentElement).queryByText('1')).toBeNull();

    // icon=thumbs-up: filled for items up to the value, outline after.
    const items = within(numeric).getAllByRole('radio');
    await expect(items[1].querySelector('i').className).toContain('fa-thumbs-up');
    await expect(items[1].querySelector('i').className).toContain('fa-solid');
    await expect(items[2].querySelector('i').className).toContain('fa-regular');
    await expect(within(comments).getAllByRole('radio')[0].querySelector('i').className).toContain('fa-star');

    // isRequired: aria-required sits on the required radiogroup only.
    await expect(numeric).toHaveAttribute('aria-required', 'true');
    await expect(comments).not.toHaveAttribute('aria-required');
};

/** One story per state, for the Examples tab. */
const frame = { maxWidth: '480px' /* demo frame */ };

const stateRender = (id, type, props) => () => (
    <div style={frame}>
        <Rating id={id} label="How was the session?" type={type} onChange={() => {}} {...props} />
    </div>
);

const itemOf = (canvasElement, n) => {
    const item = within(canvasElement).getByRole('radio', { name: `Rate ${n}` });
    item.style.transition = 'none';
    return item;
};
const fillOf = (item) => getComputedStyle(item).backgroundColor;
const inkOf = (item) => getComputedStyle(item.querySelector('i')).color;

/** The seven states of the item, one play each, shared by every type. */
const statePlays = {
    rest: async ({ canvasElement }) => {
        const items = within(canvasElement).getAllByRole('radio');
        await expect(items.every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
        const first = itemOf(canvasElement, 1);
        await expect(fillOf(first)).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await expect(inkOf(first)).toBe(tokenColor(canvasElement, '--ds-icon-subtle'));
    },
    selected: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('radio', { name: 'Rate 3' })).toHaveAttribute('aria-checked', 'true');
        const picked = itemOf(canvasElement, 2);
        await expect(fillOf(picked)).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
        await expect(inkOf(picked)).toBe(tokenColor(canvasElement, '--ds-icon-inverse'));
        const rest = itemOf(canvasElement, 4);
        await expect(fillOf(rest)).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await expect(inkOf(rest)).toBe(tokenColor(canvasElement, '--ds-icon-subtle'));
    },
    hovered: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 4);
        await expect(withForcedPseudo(item, ':hover', () => fillOf(item))).toBe(tokenColor(canvasElement, '--ds-background-neutral-hovered'));
    },
    pressed: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 4);
        await expect(withForcedPseudo(item, ':active', () => fillOf(item))).toBe(tokenColor(canvasElement, '--ds-background-neutral-pressed'));
    },
    selectedHovered: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 2);
        await expect(withForcedPseudo(item, ':hover', () => fillOf(item))).toBe(tokenColor(canvasElement, '--ds-background-selected-bold-hovered'));
    },
    selectedPressed: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 2);
        await expect(withForcedPseudo(item, ':active', () => fillOf(item))).toBe(tokenColor(canvasElement, '--ds-background-selected-bold-pressed'));
    },
    focused: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 3);
        await userEvent.tab();
        await expect(document.activeElement).toBe(item);
        const style = getComputedStyle(item);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        item.blur();
    },
    disabled: async ({ canvasElement }) => {
        const item = itemOf(canvasElement, 2);
        await expect(item).toHaveAttribute('data-disabled');
        await expect(fillOf(item)).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
        await expect(inkOf(item)).toBe(tokenColor(canvasElement, '--ds-icon-disabled'));
    },
};

const state = (id, type, props, play) => ({ render: stateRender(id, type, props), play });

export const Unrated = state('rating-ex-off', 'comments', { value: 0 }, statePlays.rest);
export const Rated = state('rating-ex-on', 'comments', { value: 3 }, statePlays.selected);
export const Hovered = state('rating-ex-hover', 'comments', { value: 2 }, statePlays.hovered);
export const Pressed = state('rating-ex-press', 'comments', { value: 2 }, statePlays.pressed);
export const SelectedHovered = state('rating-ex-selected-hover', 'comments', { value: 3 }, statePlays.selectedHovered);
export const SelectedPressed = state('rating-ex-selected-press', 'comments', { value: 3 }, statePlays.selectedPressed);
export const Focused = state('rating-ex-focus', 'comments', { value: 3 }, statePlays.focused);
export const Disabled = state('rating-ex-disabled', 'comments', { value: 3, isDisabled: true }, statePlays.disabled);

export const UnratedNumeric = state('rating-num-off', 'numeric', { value: 0 }, statePlays.rest);
export const RatedNumeric = state('rating-num-on', 'numeric', { value: 3 }, statePlays.selected);
export const HoveredNumeric = state('rating-num-hover', 'numeric', { value: 2 }, statePlays.hovered);
export const PressedNumeric = state('rating-num-press', 'numeric', { value: 2 }, statePlays.pressed);
export const SelectedHoveredNumeric = state('rating-num-selected-hover', 'numeric', { value: 3 }, statePlays.selectedHovered);
export const SelectedPressedNumeric = state('rating-num-selected-press', 'numeric', { value: 3 }, statePlays.selectedPressed);
export const FocusedNumeric = state('rating-num-focus', 'numeric', { value: 3 }, statePlays.focused);
export const DisabledNumeric = state('rating-num-disabled', 'numeric', { value: 3, isDisabled: true }, statePlays.disabled);

/** The thumbs-up glyph wears the same brand selected fill as the star. */
export const RatedThumbsUp = state('rating-ex-thumbs', 'comments', { value: 3, icon: 'thumbs-up' }, async ({ canvasElement }) => {
    const picked = itemOf(canvasElement, 2);
    await expect(picked.querySelector('i').className).toContain('fa-thumbs-up');
    await expect(fillOf(picked)).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    await expect(inkOf(picked)).toBe(tokenColor(canvasElement, '--ds-icon-inverse'));
    const rest = itemOf(canvasElement, 4);
    await expect(rest.querySelector('i').className).toContain('fa-regular');
    await expect(fillOf(rest)).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
});

export const Required = {
    render: () => (
        <div style={frame}>
            <Rating id="rating-ex-required" label="How was the session?" isRequired labelMarker="required" value={0} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const group = within(canvasElement).getByRole('radiogroup', { name: 'How was the session?' });
        await expect(group).toHaveAttribute('aria-required', 'true');
        const marker = canvasElement.querySelector('.plus-field-marker');
        await expect(getComputedStyle(marker).color).toBe(tokenColor(canvasElement, '--ds-text-subtle'));
        const label = canvasElement.querySelector('.plus-rating-label');
        await expect(getComputedStyle(label).color).toBe(tokenColor(canvasElement, '--ds-text'));
    },
};
