import React, { useState } from 'react';
import RadioButtonGroup from './RadioButtonGroup';

export default {
    title: 'Forms/Radio Button Group/Subcomponents',
};

/**
 * RadioButton Component
 * Individual radio button with label, supporting all states
 */
const ButtonComponent = () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [checked3, setChecked3] = useState(true);
    const [checked4, setChecked4] = useState(false);
    const [checked5, setChecked5] = useState(false);
    const [checked6, setChecked6] = useState(true);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            {/* Unselected / Default State */}
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unselected / Default State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio button in unselected state with outline border.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <RadioButtonGroup.Button
                        id="radio-unselected"
                        name="radio-unselected"
                        label="Text"
                        checked={checked1}
                        onChange={() => setChecked1(!checked1)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            {/* Unselected / Hover State */}
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unselected / Hover State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio button in unselected state with hover effect (light blue fill).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <RadioButtonGroup.Button
                        id="radio-hover"
                        name="radio-hover"
                        label="Text"
                        checked={checked2}
                        onChange={() => setChecked2(!checked2)}
                    />
                    <span className="body2-txt">Hover to see effect</span>
                </div>
            </div>

            {/* Selected / Default State */}
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Selected / Default State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio button in selected state with filled primary color.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <RadioButtonGroup.Button
                        id="radio-selected"
                        name="radio-selected"
                        label="Text"
                        checked={checked3}
                        onChange={() => setChecked3(!checked3)}
                    />
                    <span className="body2-txt">Click to toggle</span>
                </div>
            </div>

            {/* Unselected / Disabled State */}
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unselected / Disabled State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled radio button in unselected state with reduced opacity.
                </p>
                <RadioButtonGroup.Button
                    id="radio-disabled-unselected"
                    name="radio-disabled-unselected"
                    label="Text"
                    checked={false}
                    disabled
                />
            </div>

            {/* Unselected / Focus State */}
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Unselected / Focus State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio button in unselected state with focus ring (light blue glow).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <RadioButtonGroup.Button
                        id="radio-focus-unselected"
                        name="radio-focus-unselected"
                        label="Text"
                        checked={checked4}
                        onChange={() => setChecked4(!checked4)}
                    />
                    <span className="body2-txt">Tab to focus</span>
                </div>
            </div>

            {/* Selected / Focus State */}
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Selected / Focus State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio button in selected state with focus ring (light blue glow).
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <RadioButtonGroup.Button
                        id="radio-focus-selected"
                        name="radio-focus-selected"
                        label="Text"
                        checked={checked6}
                        onChange={() => setChecked6(!checked6)}
                    />
                    <span className="body2-txt">Tab to focus</span>
                </div>
            </div>
        </div>
    );
};

/**
 * All States Overview
 * Display all radio button states in a vertical stack
 */
const AllStatesComponent = () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(true);
    const [checked3, setChecked3] = useState(false);
    const [checked4, setChecked4] = useState(false);
    const [checked5, setChecked5] = useState(false);
    const [checked6, setChecked6] = useState(true);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>All States</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Complete set of radio button states. Click to interact.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <RadioButtonGroup.Button
                        id="radio-state-1"
                        name="radio-states"
                        label="Text"
                        checked={checked1}
                        onChange={() => setChecked1(!checked1)}
                    />
                    <RadioButtonGroup.Button
                        id="radio-state-2"
                        name="radio-states"
                        label="Text"
                        checked={checked2}
                        onChange={() => setChecked2(!checked2)}
                    />
                    <RadioButtonGroup.Button
                        id="radio-state-3"
                        name="radio-states"
                        label="Text"
                        checked={checked3}
                        onChange={() => setChecked3(!checked3)}
                    />
                    <RadioButtonGroup.Button
                        id="radio-state-4"
                        name="radio-states"
                        label="Text"
                        checked={checked4}
                        onChange={() => setChecked4(!checked4)}
                    />
                    <RadioButtonGroup.Button
                        id="radio-state-5"
                        name="radio-states"
                        label="Text"
                        checked={checked5}
                        onChange={() => setChecked5(!checked5)}
                    />
                    <RadioButtonGroup.Button
                        id="radio-state-6"
                        name="radio-states"
                        label="Text"
                        checked={checked6}
                        onChange={() => setChecked6(!checked6)}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * Disabled States
 * Radio button in disabled states
 */
const DisabledComponent = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Disabled - Unselected</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled radio button in unselected state.
                </p>
                <RadioButtonGroup.Button
                    id="radio-disabled-unselected"
                    name="radio-disabled-unselected"
                    label="Text"
                    checked={false}
                    disabled
                />
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: '12px' }}>Disabled - Selected</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled radio button in selected state.
                </p>
                <RadioButtonGroup.Button
                    id="radio-disabled-selected"
                    name="radio-disabled-selected"
                    label="Text"
                    checked={true}
                    disabled
                />
            </div>
        </div>
    );
};

export const Button = () => (
    <div className="p-4">
        <ButtonComponent />
    </div>
);

export const AllStates = () => (
    <div className="p-4">
        <AllStatesComponent />
    </div>
);

export const Disabled = () => (
    <div className="p-4">
        <DisabledComponent />
    </div>
);
