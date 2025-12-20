import React, { useState } from 'react';
import Rating from './Rating';

export default {
    title: 'Forms/Rating/Subcomponents',
};

/**
 * RatingItem Component
 * Individual star item with circular background and star icon
 */
const ItemComponent = () => {
    const [selected1, setSelected1] = useState(false);
    const [selected2, setSelected2] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unselected State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Star item in unselected state with outlined star icon.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Rating.Item
                        value={1}
                        selected={selected1}
                        onClick={() => setSelected1(!selected1)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Selected State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Star item in selected state with filled star icon.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Rating.Item
                        value={1}
                        selected={selected2}
                        onClick={() => setSelected2(!selected2)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Numeric Variant
 * Star item with numeric label above
 */
const NumericVariantComponent = () => {
    const [selected1, setSelected1] = useState(false);
    const [selected2, setSelected2] = useState(true);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Numeric Variant - Unselected</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Star item with numeric label (1) above, in unselected state.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div className="body2-txt" style={{ color: 'var(--color-on-surface)', fontWeight: 'var(--font-weight-medium)' }}>1</div>
                        <Rating.Item
                            value={1}
                            selected={selected1}
                            onClick={() => setSelected1(!selected1)}
                        />
                    </div>
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Numeric Variant - Selected</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Star item with numeric label (1) above, in selected state.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div className="body2-txt" style={{ color: 'var(--color-on-surface)', fontWeight: 'var(--font-weight-medium)' }}>1</div>
                        <Rating.Item
                            value={1}
                            selected={selected2}
                            onClick={() => setSelected2(!selected2)}
                        />
                    </div>
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>
        </div>
    );
};

/**
 * All Star Items
 * Display all 5 star items in a row
 */
const AllItemsComponent = () => {
    const [rating, setRating] = useState(3);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>All Star Items</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Complete set of 5 star items. Click any star to set rating.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <Rating.Item
                            key={value}
                            value={value}
                            selected={rating >= value}
                            onClick={() => setRating(value)}
                        />
                    ))}
                </div>
                <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                    Current rating: {rating}
                </p>
            </div>
        </div>
    );
};

/**
 * Disabled State
 * Star item in disabled state
 */
const DisabledComponent = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Disabled - Unselected</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled star item in unselected state.
                </p>
                <Rating.Item
                    value={1}
                    selected={false}
                    disabled
                />
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Disabled - Selected</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled star item in selected state.
                </p>
                <Rating.Item
                    value={1}
                    selected={true}
                    disabled
                />
            </div>
        </div>
    );
};

export const Item = () => (
    <div className="p-4">
        <ItemComponent />
    </div>
);

export const NumericVariant = () => (
    <div className="p-4">
        <NumericVariantComponent />
    </div>
);

export const AllItems = () => (
    <div className="p-4">
        <AllItemsComponent />
    </div>
);

export const Disabled = () => (
    <div className="p-4">
        <DisabledComponent />
    </div>
);
