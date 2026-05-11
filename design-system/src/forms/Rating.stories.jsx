import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Rating from './Rating';

export default {
    title: 'Forms/Rating',
    component: Rating,
    tags: ['!dev'],
    parameters: {
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
        disabled: {
            control: 'boolean',
            description: 'Disable the rating component',
            table: { category: 'Behavior' }
        },
        required: {
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
                required
                value={value}
                variant="comments"
                onChange={setValue}
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.formRating }
    }
};

export const Content = () => {
    const [value, setValue] = useState(3);

    return (
        <div style={ratingCol}>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BASELINE RATING</span>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Labeled comments-style rating with a required indicator.
                </p>
                <Rating
                    id="rating-content"
                    label="Rating"
                    required
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">COMMENTS</span>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Label appears below the stars for open-ended feedback flows.
                </p>
                <Rating id="rating-comments-variant" value={commentsValue} variant="comments" onChange={setCommentsValue} />
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">NUMERIC</span>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Disabled ratings remain visible but cannot be changed.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Rating id="rating-disabled-comments" value={3} variant="comments" disabled />
                <Rating id="rating-disabled-numeric" value={3} variant="numeric" disabled />
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
                required={args.required}
                variant={args.variant}
                disabled={args.disabled}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
Interactive.args = {
    label: 'Rating',
    required: false,
    variant: 'comments',
    disabled: false,
};


