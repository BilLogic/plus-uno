import React from 'react';
import { Label } from '../../../../../packages/plus-ds/src/forms/LabelAndCaption.stories';
import InputGroup from '../../../../../packages/plus-ds/src/forms/InputGroup/InputGroup';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Steppers',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Stepper Component
 * A numeric stepper input with minus and plus buttons on either side.
 * Reuses the InputGroup component with button addons from the forms library.
 * Matches the Figma "Steppers" spec.
 *
 * Spacing:
 * - Gap between label and input group: --size-element-gap-xs
 *
 * States:
 * - steppers-enabled: Both minus and plus buttons are active
 * - plus-enabled: Minus is disabled, plus is active
 * - minus-enabled: Minus is active, plus is disabled
 */
const Stepper = ({
    state = 'steppers-enabled',
    label = 'Max # of tutors',
    value = '4',
}) => {
    const isMinusDisabled = state === 'plus-enabled';
    const isPlusDisabled = state === 'minus-enabled';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-xs)',
                alignItems: 'flex-start',
                width: '100%',
            }}
        >
            {/* Label */}
            <Label text={label} required={true} />

            {/* Input Group with minus/plus buttons */}
            <InputGroup
                placeholder={value}
                value={value}
                size="medium"
                readonly
                leadingVisual={{
                    type: 'button',
                    text: '−',
                    style: 'primary',
                    fill: 'outline',
                    size: 'medium',
                    disabled: isMinusDisabled,
                }}
                trailingVisual={{
                    type: 'button',
                    text: '+',
                    style: 'primary',
                    fill: 'outline',
                    size: 'medium',
                    disabled: isPlusDisabled,
                }}
                className="stepper-input-group"
            />
            <style>{`
                .stepper-input-group .plus-input-group-input {
                    text-align: center;
                    background-color: var(--color-surface-container-lowest);
                }
            `}</style>
        </div>
    );
};

/**
 * Overview - All States
 * Shows all visual states of the Stepper component
 * matching the Figma spec exactly.
 *
 * States shown:
 * 1. Steppers Enabled - Both buttons active
 * 2. Plus Enabled - Only plus button active, minus disabled
 * 3. Minus Enabled - Only minus button active, plus disabled
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            maxWidth: 400,
        }}
    >
        <section>
            <h6 className="h6 mb-3">Steppers Enabled</h6>
            <Stepper state="steppers-enabled" />
        </section>

        <section>
            <h6 className="h6 mb-3">Plus Enabled</h6>
            <Stepper state="plus-enabled" />
        </section>

        <section>
            <h6 className="h6 mb-3">Minus Enabled</h6>
            <Stepper state="minus-enabled" />
        </section>
    </div>
);

/**
 * Steppers_Enabled
 * Both minus and plus buttons are active.
 */
export const Steppers_Enabled = () => (
    <div style={{ maxWidth: 400 }}>
        <Stepper state="steppers-enabled" />
    </div>
);

/**
 * Plus_Enabled
 * Only the plus button is active, minus is disabled.
 */
export const Plus_Enabled = () => (
    <div style={{ maxWidth: 400 }}>
        <Stepper state="plus-enabled" />
    </div>
);

/**
 * Minus_Enabled
 * Only the minus button is active, plus is disabled.
 */
export const Minus_Enabled = () => (
    <div style={{ maxWidth: 400 }}>
        <Stepper state="minus-enabled" />
    </div>
);

// Export component for reuse
export { Stepper };
