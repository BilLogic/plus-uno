import React, { useState } from 'react';
import ChoiceGrid from './ChoiceGrid';

export default {
    title: 'Forms/Choice Grid/Subcomponents',
};

/**
 * CheckboxItem Component
 * Individual checkbox item with all states
 */
const CheckboxItemComponent = () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [checked3, setChecked3] = useState(true);
    const [checked4, setChecked4] = useState(false);
    const [indeterminate, setIndeterminate] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Default/Hover)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Unchecked checkbox with primary border color, hover state.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.CheckboxItem
                        id="checkbox-unchecked-hover"
                        name="checkbox-unchecked-hover"
                        checked={checked1}
                        onChange={(e) => setChecked1(e.target.checked)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Default)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Unchecked checkbox with outline-variant border color.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.CheckboxItem
                        id="checkbox-unchecked"
                        name="checkbox-unchecked"
                        checked={checked2}
                        onChange={(e) => setChecked2(e.target.checked)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Checked</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checked checkbox with primary background and white checkmark.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.CheckboxItem
                        id="checkbox-checked"
                        name="checkbox-checked"
                        checked={checked3}
                        onChange={(e) => setChecked3(e.target.checked)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Indeterminate</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Indeterminate checkbox with primary background and white dash/minus icon.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        id="checkbox-indeterminate"
                        checked={false}
                        ref={(input) => {
                            if (input) input.indeterminate = true;
                        }}
                        onChange={() => {}}
                        style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer'
                        }}
                    />
                    <span className="body2-txt">Indeterminate state (requires manual input setup)</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Disabled)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled unchecked checkbox with reduced opacity.
                </p>
                <ChoiceGrid.CheckboxItem
                    id="checkbox-disabled-unchecked"
                    name="checkbox-disabled-unchecked"
                    checked={false}
                    disabled
                />
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Focused)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Unchecked checkbox with focus ring (blue glow).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.CheckboxItem
                        id="checkbox-focused-unchecked"
                        name="checkbox-focused-unchecked"
                        checked={checked4}
                        onChange={(e) => setChecked4(e.target.checked)}
                    />
                    <span className="body2-txt">Tab to focus</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Checked (Focused)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checked checkbox with focus ring (blue glow).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.CheckboxItem
                        id="checkbox-focused-checked"
                        name="checkbox-focused-checked"
                        checked={true}
                        onChange={() => {}}
                    />
                    <span className="body2-txt">Tab to focus</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Indeterminate (Focused)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Indeterminate checkbox with focus ring (blue glow).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        id="checkbox-focused-indeterminate"
                        checked={false}
                        ref={(input) => {
                            if (input) input.indeterminate = true;
                        }}
                        onChange={() => {}}
                        style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer'
                        }}
                    />
                    <span className="body2-txt">Tab to focus</span>
                </div>
            </div>
        </div>
    );
};

/**
 * RadioItem Component
 * Individual radio button item with all states
 */
const RadioItemComponent = () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [checked3, setChecked3] = useState(true);
    const [checked4, setChecked4] = useState(false);
    const [checked5, setChecked5] = useState(false);
    const [checked6, setChecked6] = useState(true);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Default State)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Unchecked radio button with white interior and primary border.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.RadioItem
                        id="radio-unchecked-1"
                        name="radio-group-1"
                        checked={checked1}
                        onChange={(e) => setChecked1(e.target.checked)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Hover/Hinted State)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Unchecked radio button with light blue tint on hover.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.RadioItem
                        id="radio-unchecked-hover"
                        name="radio-group-2"
                        checked={checked2}
                        onChange={(e) => setChecked2(e.target.checked)}
                    />
                    <span className="body2-txt">Hover to see effect</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Checked (Default State)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checked radio button with primary color fill.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.RadioItem
                        id="radio-checked"
                        name="radio-group-3"
                        checked={checked3}
                        onChange={(e) => setChecked3(e.target.checked)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Disabled State)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled unchecked radio button with grey border.
                </p>
                <ChoiceGrid.RadioItem
                    id="radio-disabled-unchecked"
                    name="radio-group-4"
                    checked={false}
                    disabled
                />
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unchecked (Focused/Hovered with Focus Ring)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Unchecked radio button with focus ring (blue glow).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.RadioItem
                        id="radio-focused-unchecked"
                        name="radio-group-5"
                        checked={checked5}
                        onChange={(e) => setChecked5(e.target.checked)}
                    />
                    <span className="body2-txt">Tab to focus</span>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Checked (Focused/Hovered with Focus Ring)</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checked radio button with focus ring (blue glow).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ChoiceGrid.RadioItem
                        id="radio-focused-checked"
                        name="radio-group-6"
                        checked={checked6}
                        onChange={(e) => setChecked6(e.target.checked)}
                    />
                    <span className="body2-txt">Tab to focus</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Size Variants
 * Display checkbox and radio items in different sizes
 */
const SizeVariantsComponent = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox - Size Variants</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span className="body2-txt" style={{ minWidth: '80px' }}>Small:</span>
                        <ChoiceGrid.CheckboxItem
                            id="checkbox-small"
                            name="checkbox-small"
                            size="small"
                            checked={false}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span className="body2-txt" style={{ minWidth: '80px' }}>Medium:</span>
                        <ChoiceGrid.CheckboxItem
                            id="checkbox-medium"
                            name="checkbox-medium"
                            size="medium"
                            checked={false}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span className="body2-txt" style={{ minWidth: '80px' }}>Large:</span>
                        <ChoiceGrid.CheckboxItem
                            id="checkbox-large"
                            name="checkbox-large"
                            size="large"
                            checked={false}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio - Size Variants</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span className="body2-txt" style={{ minWidth: '80px' }}>Small:</span>
                        <ChoiceGrid.RadioItem
                            id="radio-small"
                            name="radio-size-small"
                            size="small"
                            checked={false}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span className="body2-txt" style={{ minWidth: '80px' }}>Medium:</span>
                        <ChoiceGrid.RadioItem
                            id="radio-medium"
                            name="radio-size-medium"
                            size="medium"
                            checked={false}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span className="body2-txt" style={{ minWidth: '80px' }}>Large:</span>
                        <ChoiceGrid.RadioItem
                            id="radio-large"
                            name="radio-size-large"
                            size="large"
                            checked={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CheckboxItem = () => (
    <div className="p-4">
        <CheckboxItemComponent />
    </div>
);

export const RadioItem = () => (
    <div className="p-4">
        <RadioItemComponent />
    </div>
);

export const SizeVariants = () => (
    <div className="p-4">
        <SizeVariantsComponent />
    </div>
);
