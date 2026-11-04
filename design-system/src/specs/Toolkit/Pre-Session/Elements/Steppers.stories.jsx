import React from 'react';
import { Label } from '@/components/forms-and-inputs/LabelAndCaption.stories';
import Button from '@/components/forms-and-inputs/Button/Button';
import TextField from '@/components/forms-and-inputs/TextField/TextField';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Steppers',
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Stepper Component
 * A numeric stepper input with minus and plus buttons on either side.
 * Reuses the Text field with buttons in its before and after slots.
 * Matches the Figma "Steppers" spec.
 *
 * Spacing:
 * - Gap between label and field: --stack-sm
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
                gap: 'var(--stack-sm)',
                alignItems: 'flex-start',
                width: '100%',
            }}
        >
            {/* Label */}
            <Label text={label} required={true} />

            {/* Text field with minus and plus buttons */}
            <TextField
                placeholder={value}
                value={value}
                isReadOnly
                elemBeforeInput={<Button appearance="default" spacing="compact" text="−" isDisabled={isMinusDisabled} />}
                elemAfterInput={<Button appearance="default" spacing="compact" text="+" isDisabled={isPlusDisabled} />}
                className="stepper-field"
            />
            <style>{`
                .stepper-field .plus-field {
                    background-color: var(--ds-surface);
                }
                .stepper-field .plus-field__control {
                    text-align: center;
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
