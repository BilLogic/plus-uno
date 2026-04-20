import React from 'react';
import { Stepper } from './Steppers.stories';
import { Label, Caption } from '../../../../forms/LabelAndCaption.stories';
import InputGroup from '../../../../forms/InputGroup/InputGroup';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Steppers Max Tutor & Lead Tutor',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# Steppers — Max Tutor & Lead Tutor

Two steppers side by side for setting the max number of regular tutors and lead tutors.

## States
- **Default**: Both steppers enabled with minus and plus buttons
- **Invalid tutor #**: Regular tutors has error (red border, no buttons), lead tutors has minus disabled + error caption
- **Invalid lead tutor #**: Regular tutors normal, lead tutors has error (red border, no buttons) + error caption

## Design Tokens
- **Row gap**: \`--size-element-gap-lg\` (12px) between the two steppers
- **Label-to-input gap**: \`--size-element-gap-xs\` (4px)
- **Error border**: \`--color-danger\`
- **Error caption**: body3-txt, \`--color-danger-text\`, icon \`fa-triangle-exclamation\`
                `
            }
        }
    },
    tags: ['autodocs'],
};

/**
 * Error stepper — shows input with danger border, no buttons
 * Used when the value is invalid
 */
const ErrorStepper = ({ label = 'Max # of lead tutors', value = '4' }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-xs)',
            alignItems: 'flex-start',
            width: '100%',
        }}
    >
        <Label text={label} required={true} />
        <div className="error-stepper-input-wrapper">
            <InputGroup
                placeholder={value}
                value={value}
                size="medium"
                readonly
                className="error-stepper-input-group"
            />
        </div>
        <style>{`
            .error-stepper-input-group .plus-input-group-input {
                text-align: center;
                background-color: var(--color-surface-container-lowest);
                border-color: var(--color-danger) !important;
            }
        `}</style>
    </div>
);

/**
 * Row layout for two steppers side by side
 */
const StepperRow = ({ children }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--size-element-gap-lg)',
            width: '100%',
        }}
    >
        {children}
    </div>
);

/**
 * Wrapper for a single stepper column with optional caption
 */
const StepperColumn = ({ children }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-xs)',
            flex: 1,
        }}
    >
        {children}
    </div>
);

// ─── Stories ─────────────────────────────────────────────────────

/**
 * Overview - All States
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            maxWidth: 600,
        }}
    >
        {/* Default State */}
        <section>
            <h6 className="h6 mb-3">Default</h6>
            <StepperRow>
                <StepperColumn>
                    <Stepper
                        state="steppers-enabled"
                        label="Max # of regular tutors"
                        value="4"
                    />
                </StepperColumn>
                <StepperColumn>
                    <Stepper
                        state="steppers-enabled"
                        label="Max # of lead tutors"
                        value="4"
                    />
                </StepperColumn>
            </StepperRow>
        </section>

        {/* Invalid tutor # */}
        <section>
            <h6 className="h6 mb-3">Invalid Tutor #</h6>
            <StepperRow>
                <StepperColumn>
                    <ErrorStepper
                        label="Max # of regular tutors"
                        value="4"
                    />
                </StepperColumn>
                <StepperColumn>
                    <Stepper
                        state="plus-enabled"
                        label="Max # of lead tutors"
                        value="4"
                    />
                    <Caption
                        text="Invalid number of max lead tutors"
                        state="danger"
                        icon="triangle-exclamation"
                    />
                </StepperColumn>
            </StepperRow>
        </section>

        {/* Invalid lead tutor # */}
        <section>
            <h6 className="h6 mb-3">Invalid Lead Tutor #</h6>
            <StepperRow>
                <StepperColumn>
                    <Stepper
                        state="steppers-enabled"
                        label="Max # of regular tutors"
                        value="4"
                    />
                </StepperColumn>
                <StepperColumn>
                    <ErrorStepper
                        label="Max # of lead tutors"
                        value="4"
                    />
                    <Caption
                        text="Invalid number of max lead tutors"
                        state="danger"
                        icon="triangle-exclamation"
                    />
                </StepperColumn>
            </StepperRow>
        </section>
    </div>
);

/**
 * Default
 * Both steppers enabled with all buttons active.
 */
export const Default = () => (
    <div style={{ maxWidth: 600 }}>
        <StepperRow>
            <StepperColumn>
                <Stepper
                    state="steppers-enabled"
                    label="Max # of regular tutors"
                    value="4"
                />
            </StepperColumn>
            <StepperColumn>
                <Stepper
                    state="steppers-enabled"
                    label="Max # of lead tutors"
                    value="4"
                />
            </StepperColumn>
        </StepperRow>
    </div>
);

/**
 * Invalid_Tutor_Number
 * Regular tutors has error state, lead tutors has minus disabled with error caption.
 */
export const Invalid_Tutor_Number = () => (
    <div style={{ maxWidth: 600 }}>
        <StepperRow>
            <StepperColumn>
                <ErrorStepper
                    label="Max # of regular tutors"
                    value="4"
                />
            </StepperColumn>
            <StepperColumn>
                <Stepper
                    state="plus-enabled"
                    label="Max # of lead tutors"
                    value="4"
                />
                <Caption
                    text="Invalid number of max lead tutors"
                    state="danger"
                    icon="triangle-exclamation"
                />
            </StepperColumn>
        </StepperRow>
    </div>
);

/**
 * Invalid_Lead_Tutor_Number
 * Regular tutors normal, lead tutors has error state with error caption.
 */
export const Invalid_Lead_Tutor_Number = () => (
    <div style={{ maxWidth: 600 }}>
        <StepperRow>
            <StepperColumn>
                <Stepper
                    state="steppers-enabled"
                    label="Max # of regular tutors"
                    value="4"
                />
            </StepperColumn>
            <StepperColumn>
                <ErrorStepper
                    label="Max # of lead tutors"
                    value="4"
                />
                <Caption
                    text="Invalid number of max lead tutors"
                    state="danger"
                    icon="triangle-exclamation"
                />
            </StepperColumn>
        </StepperRow>
    </div>
);
