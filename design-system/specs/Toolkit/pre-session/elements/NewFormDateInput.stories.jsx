import React from 'react';
import { Label, Caption } from '../../../../../packages/plus-ds/src/forms/LabelAndCaption.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/New Form Date Input',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * DateInput Component
 * A single date input field matching the Figma form input pattern.
 * 
 * Typography:
 * - Input text: body2-txt (Merriweather Sans Light, 14px, line-height 1.571)
 * - Icon: Font Awesome 6 Free Solid, 12px
 * 
 * Colors:
 * - Text: --color-on-surface
 * - Placeholder: --color-on-surface (light weight)
 * - Icon: --color-on-surface-variant
 * - Border (default): --color-outline-variant
 * - Border (invalid): --color-danger
 * - Background: --color-surface-container-lowest
 * 
 * Spacing:
 * - Padding: --size-element-pad-y-md / --size-element-pad-x-md
 * - Gap between text and icon: --size-element-gap-md
 * - Border radius: --size-element-radius-sm (via --size-small-gap-xs for inner gap)
 */
const DateInput = ({
    placeholder = 'MM/DD/YY',
    value = '',
    validation = 'none',
    disabled = false,
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-small-gap-xs)',
            alignItems: 'flex-start',
            overflow: 'hidden',
            width: '100%',
        }}
    >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-md)',
                padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                width: '100%',
                borderRadius: 'var(--size-element-radius-sm)',
                border: `1px solid ${validation === 'invalid' ? 'var(--color-danger)' : 'var(--color-outline-variant)'}`,
                backgroundColor: disabled ? 'var(--color-surface-container-low)' : 'var(--color-surface-container-lowest)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
            }}
        >
            <span
                className="body2-txt"
                style={{
                    flex: '1 0 0',
                    color: 'var(--color-on-surface)',
                    fontWeight: 300,
                    lineHeight: 1.571,
                }}
            >
                {value || placeholder}
            </span>
            <i
                className="fa-solid fa-calendar"
                style={{
                    fontSize: 'var(--font-size-fa-b2-solid)',
                    lineHeight: 1.833,
                    color: 'var(--color-on-surface-variant)',
                }}
            />
        </div>
    </div>
);

/**
 * SessionDateInput Component
 * A date range input with two date pickers separated by a dash.
 * Matches the Figma "Create New Session / Form Date Input" spec.
 * 
 * Spacing:
 * - Gap between label and inputs: --size-spacing-space-050
 * - Gap between date inputs and dash: 10px (Figma spec)
 * - Width: 542px (Figma spec)
 * 
 * States:
 * - unfilled: Both date pickers show placeholder
 * - filled: Both date pickers show actual date values
 * - invalid-date: Left picker has red border, shows "Invalid Date" caption
 * - missing-date: Left picker has red border, shows "Session date is required" caption
 */
const SessionDateInput = ({
    state = 'unfilled',
    startDate = '',
    endDate = '',
    startPlaceholder = 'MM/DD/YY',
    endPlaceholder = 'MM/DD/YY',
}) => {
    const isInvalid = state === 'invalid-date' || state === 'missing-date';
    const isFilled = state === 'filled';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-spacing-space-050)',
                alignItems: 'flex-start',
                width: '100%',
            }}
        >
            {/* Label */}
            <Label text="Session date" required={true} />

            {/* Date Inputs Row */}
            <div
                style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                {/* Start Date */}
                <div style={{ flex: '1 0 0', minWidth: 0, minHeight: 1 }}>
                    <DateInput
                        placeholder={startPlaceholder}
                        value={isFilled ? (startDate || '06/28/2026') : ''}
                        validation={isInvalid ? 'invalid' : 'none'}
                    />
                </div>

                {/* Dash Separator */}
                <span
                    className="body2-txt"
                    style={{
                        color: 'var(--color-on-surface)',
                        fontWeight: 300,
                        lineHeight: 1.571,
                        width: 9,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    -
                </span>

                {/* End Date */}
                <div style={{ flex: '1 0 0', minWidth: 0, minHeight: 1 }}>
                    <DateInput
                        placeholder={endPlaceholder}
                        value={isFilled ? (endDate || '06/28/2026') : ''}
                        validation="none"
                    />
                </div>
            </div>

            {/* Validation Caption */}
            {(state === 'invalid-date' || state === 'missing-date') && (
                <div style={{ marginTop: 'var(--size-element-gap-xs)' }}>
                    <Caption
                        text={state === 'invalid-date' ? 'Invalid Date' : 'Session date is required'}
                        state="danger"
                        icon="triangle-exclamation"
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Overview - All States
 * Shows all visual states of the Session Date form input
 * matching the Figma spec exactly.
 * 
 * States shown:
 * 1. Unfilled - Default placeholder state
 * 2. Filled - Both dates populated
 * 3. Invalid Date - Start date has error border + validation message
 * 4. Missing Date - Start date has error border + "Session date is required" message
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
        }}
    >
        <section>
            <h6 className="h6 mb-3">Unfilled State</h6>
            <SessionDateInput state="unfilled" />
        </section>

        <section>
            <h6 className="h6 mb-3">Filled State</h6>
            <SessionDateInput state="filled" startDate="06/28/2026" endDate="06/28/2026" />
        </section>

        <section>
            <h6 className="h6 mb-3">Invalid Date State</h6>
            <SessionDateInput state="invalid-date" />
        </section>

        <section>
            <h6 className="h6 mb-3">Missing Date State</h6>
            <SessionDateInput state="missing-date" />
        </section>
    </div>
);

/**
 * Unfilled
 * Default state with placeholder text in both date inputs.
 */
export const Unfilled = () => (
    <SessionDateInput state="unfilled" />
);

/**
 * Filled
 * Both date inputs populated with actual date values.
 */
export const Filled = () => (
    <SessionDateInput state="filled" startDate="06/28/2026" endDate="06/28/2026" />
);

/**
 * Invalid_Date
 * Start date input shows error border with "Invalid Date" validation message.
 */
export const Invalid_Date = () => (
    <SessionDateInput state="invalid-date" />
);

/**
 * Missing_Date
 * Start date input shows error border with "Session date is required" validation message.
 */
export const Missing_Date = () => (
    <SessionDateInput state="missing-date" />
);

// Export components for reuse
export { DateInput, SessionDateInput };
