import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Rating from './Rating';

export default {
    title: 'Components/Forms and inputs/Rating',
    component: Rating,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'Each rating item is 32 with a 16 icon, down from 40 with a 20 icon.' },
        ],
        docs: {
            description: {
                component: 'Rating component for form inputs. Supports two variants: with "Comments" label below or with numeric labels (1-5) above each star. Provides interactive star selection from 0 to 5 stars.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        value: {
            table: { disable: true, category: 'Development' }
        },
        label: {
            control: 'text',
            table: { category: 'Content' }
        },
        variant: {
            control: 'select',
            options: ['comments', 'numeric'],
            description: 'Variant type: comments (label below) or numeric (labels above)',
            table: { category: 'Design' }
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the rating component',
            table: { category: 'Behavior' }
        },
        isRequired: {
            control: 'boolean',
            description: 'Show required indicator',
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

const ratingCol = { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' };

export const Overview = () => {
    const [value, setValue] = useState(3);

    return (
        <div style={{ ...ratingCol, maxWidth: '480px' }}>
            <Rating
                id="rating-overview"
                label="Rating"
                isRequired
                value={value}
                variant="comments"
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
                <span style={{ display: 'block', marginBottom: 'var(--space-050)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>BASELINE RATING</span>
                <p className="body2-txt" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Labeled comments-style rating with a required indicator.
                </p>
                <Rating
                    id="rating-content"
                    label="Rating"
                    isRequired
                    value={value}
                    variant="comments"
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
                <span style={{ display: 'block', marginBottom: 'var(--space-050)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>COMMENTS</span>
                <p className="body2-txt" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Label appears below the stars for open-ended feedback flows.
                </p>
                <Rating id="rating-comments-variant" value={commentsValue} variant="comments" onChange={setCommentsValue} />
            </section>
            <section>
                <span style={{ display: 'block', marginBottom: 'var(--space-050)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>NUMERIC</span>
                <p className="body2-txt" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Numeric labels above each star for more explicit scales.
                </p>
                <Rating id="rating-numeric-variant" value={numericValue} variant="numeric" onChange={setNumericValue} />
            </section>
        </div>
    );
};

export const InteractionStates = () => (
    <div style={ratingCol}>
        <section>
            <span style={{ display: 'block', marginBottom: 'var(--space-050)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>DISABLED</span>
            <p className="body2-txt" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                Disabled ratings remain visible but cannot be changed.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
                <Rating id="rating-disabled-comments" value={3} variant="comments" isDisabled />
                <Rating id="rating-disabled-numeric" value={3} variant="numeric" isDisabled />
            </div>
        </section>
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(3);

    useEffect(() => {
        setValue(3);
    }, [args.variant]);

    return (
        <div style={{ maxWidth: '400px' }}>
            <Rating
                label={args.label}
                isRequired={args.isRequired}
                variant={args.variant}
                isDisabled={args.isDisabled}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
Interactive.args = {
    label: 'Rating',
    isRequired: false,
    variant: 'comments',
    isDisabled: false,
};

/** Each prop shows up in the DOM: numeric labels, comments label, icon family, required mark. */
export const PropsRender = () => (
    <div style={ratingCol}>
        <Rating id="rating-props-numeric" label="Numeric" variant="numeric" icon="thumbs-up" isRequired value={2} />
        <Rating id="rating-props-comments" label="Comments" variant="comments" commentsLabel="Tell us more" value={2} />
    </div>
);
PropsRender.parameters = { docs: { disable: true } };
PropsRender.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const numeric = canvas.getByRole('radiogroup', { name: /Numeric/ });
    const comments = canvas.getByRole('radiogroup', { name: /Comments/ });

    // variant=numeric: a label 1-5 above each item, no comments label.
    for (const n of [1, 2, 3, 4, 5]) {
        await expect(within(numeric.parentElement).getByText(String(n))).toBeTruthy();
    }
    await expect(within(numeric.parentElement).queryByText('Comments')).toBeNull();

    // variant=comments: the comments label sits below, no numbers.
    await expect(canvas.getByText('Tell us more')).toBeTruthy();
    await expect(within(comments.parentElement).queryByText('1')).toBeNull();

    // icon=thumbs-up: filled for items up to the value, outline after.
    const items = within(numeric).getAllByRole('radio');
    await expect(items[1].querySelector('i').className).toContain('fa-thumbs-up');
    await expect(items[1].querySelector('i').className).toContain('fas');
    await expect(items[2].querySelector('i').className).toContain('far');
    await expect(within(comments).getAllByRole('radio')[0].querySelector('i').className).toContain('fa-star');

    // isRequired: the mark is announced, and only on the required rating.
    await expect(within(numeric.parentElement).getByLabelText('required')).toBeTruthy();
    await expect(within(comments.parentElement).queryByLabelText('required')).toBeNull();
};

/** One story per state, for the Examples tab. */
const frame = { maxWidth: '480px' };

export const Unrated = {
    render: () => (
        <div style={frame}>
            <Rating id="rating-ex-off" label="How was the session?" value={0} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const radios = within(canvasElement).getAllByRole('radio');
        await expect(radios.every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
        await expect(getComputedStyle(radios[0]).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
    },
};

export const Rated = {
    render: () => (
        <div style={frame}>
            <Rating id="rating-ex-on" label="How was the session?" value={3} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('radio', { name: 'Rate 3' })).toHaveAttribute('aria-checked', 'true');
        await expect(getComputedStyle(canvas.getByRole('radio', { name: 'Rate 2' }).querySelector('i')).color).toBe(tokenColor(canvasElement, '--ds-icon-selected'));
        await expect(getComputedStyle(canvas.getByRole('radio', { name: 'Rate 4' }).querySelector('i')).color).toBe(tokenColor(canvasElement, '--ds-icon-subtle'));
    },
};

export const Hovered = {
    render: () => (
        <div style={frame}>
            <Rating id="rating-ex-hover" label="How was the session?" value={2} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const item = within(canvasElement).getByRole('radio', { name: 'Rate 4' });
        item.style.transition = 'none';
        const fill = withForcedPseudo(item, ':hover', () => getComputedStyle(item).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-background-neutral-hovered'));
    },
};

export const Focused = {
    render: () => (
        <div style={frame}>
            <Rating id="rating-ex-focus" label="How was the session?" value={3} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await userEvent.tab();
        const item = within(canvasElement).getByRole('radio', { name: 'Rate 3' });
        await expect(document.activeElement).toBe(item);
        const style = getComputedStyle(item);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        item.blur();
    },
};

export const Required = {
    render: () => (
        <div style={frame}>
            <Rating id="rating-ex-required" label="How was the session?" isRequired value={0} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const marker = canvasElement.querySelector('.plus-rating-required');
        await expect(marker).toBeInTheDocument();
        await expect(getComputedStyle(marker).color).toBe(tokenColor(canvasElement, '--ds-text-danger'));
    },
};

export const Disabled = {
    render: () => (
        <div style={frame}>
            <Rating id="rating-ex-disabled" label="How was the session?" value={3} isDisabled />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const item = within(canvasElement).getByRole('radio', { name: 'Rate 3' });
        await expect(item).toHaveAttribute('data-disabled');
        await expect(getComputedStyle(item).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
    },
};
