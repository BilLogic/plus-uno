import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
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

export const Content = () => {
    const [value, setValue] = useState(3);

    return (
        <div style={ratingCol}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Baseline rating</h6>
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
                <h6 className="h6" style={{ marginBottom: '16px' }}>Comments</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Label appears below the stars for open-ended feedback flows.
                </p>
                <Rating id="rating-comments-variant" value={commentsValue} variant="comments" onChange={setCommentsValue} />
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Numeric</h6>
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
            <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled</h6>
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

/**
 * Overview
 * Comprehensive view of Rating configurations.
 */
export const Overview = () => {
    const [rating1, setRating1] = useState(0);
    const [rating2, setRating2] = useState(1);
    const [rating3, setRating3] = useState(2);
    const [rating4, setRating4] = useState(3);
    const [rating5, setRating5] = useState(4);
    const [rating6, setRating6] = useState(5);

    const [numericRating1, setNumericRating1] = useState(0);
    const [numericRating2, setNumericRating2] = useState(1);
    const [numericRating3, setNumericRating3] = useState(2);
    const [numericRating4, setNumericRating4] = useState(3);
    const [numericRating5, setNumericRating5] = useState(4);
    const [numericRating6, setNumericRating6] = useState(5);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Comments Variant Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Rating - Comments Variant</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Rating component with "Comments" label positioned below the stars. Click stars to select rating from 0 to 5.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>0 Stars</p>
                        <Rating
                            id="rating-0"
                            value={rating1}
                            onChange={setRating1}
                            variant="comments"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>1 Star</p>
                        <Rating
                            id="rating-1"
                            value={rating2}
                            onChange={setRating2}
                            variant="comments"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>2 Stars</p>
                        <Rating
                            id="rating-2"
                            value={rating3}
                            onChange={setRating3}
                            variant="comments"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>3 Stars</p>
                        <Rating
                            id="rating-3"
                            value={rating4}
                            onChange={setRating4}
                            variant="comments"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>4 Stars</p>
                        <Rating
                            id="rating-4"
                            value={rating5}
                            onChange={setRating5}
                            variant="comments"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>5 Stars</p>
                        <Rating
                            id="rating-5"
                            value={rating6}
                            onChange={setRating6}
                            variant="comments"
                        />
                    </div>
                </div>
            </section>

            {/* Numeric Variant Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Rating - Numeric Variant</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Rating component with numeric labels (1-5) positioned above each star. Click stars to select rating from 0 to 5.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>0 Stars</p>
                        <Rating
                            id="rating-numeric-0"
                            value={numericRating1}
                            onChange={setNumericRating1}
                            variant="numeric"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>1 Star</p>
                        <Rating
                            id="rating-numeric-1"
                            value={numericRating2}
                            onChange={setNumericRating2}
                            variant="numeric"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>2 Stars</p>
                        <Rating
                            id="rating-numeric-2"
                            value={numericRating3}
                            onChange={setNumericRating3}
                            variant="numeric"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>3 Stars</p>
                        <Rating
                            id="rating-numeric-3"
                            value={numericRating4}
                            onChange={setNumericRating4}
                            variant="numeric"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>4 Stars</p>
                        <Rating
                            id="rating-numeric-4"
                            value={numericRating5}
                            onChange={setNumericRating5}
                            variant="numeric"
                        />
                    </div>
                    <div>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>5 Stars</p>
                        <Rating
                            id="rating-numeric-5"
                            value={numericRating6}
                            onChange={setNumericRating6}
                            variant="numeric"
                        />
                    </div>
                </div>
            </section>

            {/* With Label Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Rating - With Label</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Rating component with form label and optional required indicator.
                </p>
                <Rating
                    id="rating-labeled"
                    label="Rating"
                    required
                    value={3}
                    variant="comments"
                />
            </section>

            {/* Disabled Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Rating - Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled state prevents interaction with the rating component.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Rating
                        id="rating-disabled-comments"
                        value={3}
                        variant="comments"
                        disabled
                    />
                    <Rating
                        id="rating-disabled-numeric"
                        value={3}
                        variant="numeric"
                        disabled
                    />
                </div>
            </section>
        </div>
    );
};

