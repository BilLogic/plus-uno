import React from 'react';
import { Label, Caption } from '../../../../forms/LabelAndCaption.stories';
import DateAndTimePicker from '../../../../forms/DateAndTimePicker';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/New Form Time Input',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * SessionTimeInput Component
 * A time range input with two time pickers separated by a dash.
 * Reuses the DateAndTimePicker component (time-only mode via showDate={false}).
 * Matches the Figma "Create New Session / Form Time Input" spec.
 *
 * Spacing:
 * - Gap between label and inputs: --size-spacing-space-050
 * - Gap between time inputs and dash: 10px (Figma spec)
 * - Width: 536px (Figma spec)
 *
 * States:
 * - unfilled: Both time pickers show placeholder
 * - filled: Both time pickers show actual time values
 * - missing-start: Left picker has danger border + "Start Time is required" caption
 * - missing-end: Right picker has danger border + "End Time is required" caption
 */
const SessionTimeInput = ({
    state = 'unfilled',
}) => {
    const isFilled = state === 'filled';
    const isMissingStart = state === 'missing-start';
    const isMissingEnd = state === 'missing-end';

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
            <Label text="Session time" required={true} />

            {/* Time Inputs Row */}
            <div
                style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    width: '100%',
                }}
            >
                {/* Start Time */}
                <div style={{ flex: '1 0 0', minWidth: 0, minHeight: 1 }}>
                    <DateAndTimePicker
                        id="start-time"
                        showLabel={false}
                        showSectionLabels={false}
                        showDate={false}
                        timePlaceholder="___ : ___ ET"
                        timeValue={(isFilled || isMissingEnd) ? '11:00' : undefined}
                        validation={isMissingStart ? 'invalid' : 'none'}
                        validationMessage={isMissingStart ? 'Start Time is required' : ''}
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

                {/* End Time */}
                <div style={{ flex: '1 0 0', minWidth: 0, minHeight: 1 }}>
                    <DateAndTimePicker
                        id="end-time"
                        showLabel={false}
                        showSectionLabels={false}
                        showDate={false}
                        timePlaceholder="___ : ___ ET"
                        timeValue={(isFilled || isMissingStart) ? '11:00' : undefined}
                        validation={isMissingEnd ? 'invalid' : 'none'}
                        validationMessage={isMissingEnd ? 'End Time is required' : ''}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * Overview - All States
 * Shows all visual states of the Session Time form input
 * matching the Figma spec exactly.
 *
 * States shown:
 * 1. Unfilled - Default placeholder state
 * 2. Filled - Both times populated
 * 3. Missing Start Time - Start time has error border + validation message
 * 4. Missing End Time - End time has error border + validation message
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
            <SessionTimeInput state="unfilled" />
        </section>

        <section>
            <h6 className="h6 mb-3">Filled State</h6>
            <SessionTimeInput state="filled" />
        </section>

        <section>
            <h6 className="h6 mb-3">Missing Start Time State</h6>
            <SessionTimeInput state="missing-start" />
        </section>

        <section>
            <h6 className="h6 mb-3">Missing End Time State</h6>
            <SessionTimeInput state="missing-end" />
        </section>
    </div>
);

/**
 * Unfilled
 * Default state with placeholder text in both time inputs.
 */
export const Unfilled = () => (
    <SessionTimeInput state="unfilled" />
);

/**
 * Filled
 * Both time inputs populated with actual time values.
 */
export const Filled = () => (
    <SessionTimeInput state="filled" />
);

/**
 * Missing_Start_Time
 * Start time input shows error border with "Start Time is required" validation message.
 */
export const Missing_Start_Time = () => (
    <SessionTimeInput state="missing-start" />
);

/**
 * Missing_End_Time
 * End time input shows error border with "End Time is required" validation message.
 */
export const Missing_End_Time = () => (
    <SessionTimeInput state="missing-end" />
);

// Export component for reuse
export { SessionTimeInput };
