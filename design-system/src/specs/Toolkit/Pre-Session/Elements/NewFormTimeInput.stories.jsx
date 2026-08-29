import React from 'react';
import { expect, within } from 'storybook/test';

import { Label, Caption } from '@/components/forms-and-inputs/LabelAndCaption.stories';
import DateAndTimePicker from '@/components/forms-and-inputs/DateAndTimePicker';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/New Form Time Input',
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
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
 *
 * Naming (#225). "Session time" sits above two separate pickers, and a single
 * `<label for>` names one control, so it cannot be the name of either. Each
 * picker owns its own name instead — `label="Start time"` / `label="End time"`
 * with `showLabel={false}`, which the component now clips rather than deletes —
 * and the visible caption names the pair as a `group`. So the caption stays a
 * caption, and the two controls are told apart by assistive tech.
 *
 * The `id="start-time"` / `id="end-time"` these used to pass went with it: the
 * Overview story renders four of these, so four fields claimed one pair of ids,
 * and now that the labels are rendered they would all have pointed at the first
 * — #222's failure exactly. `useFieldId` generates one id per instance, and
 * nothing outside this file referenced those two.
 */
const SessionTimeInput = ({
    state = 'unfilled',
}) => {
    const isFilled = state === 'filled';
    const isMissingStart = state === 'missing-start';
    const isMissingEnd = state === 'missing-end';
    /** Unique per instance — the Overview story renders four of these. */
    const captionId = `${React.useId()}-session-time`;

    return (
        <div
            role="group"
            aria-labelledby={captionId}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-spacing-small-space-050)',
                alignItems: 'flex-start',
                width: '100%',
            }}
        >
            {/* Label — names the pair, not either picker */}
            <div id={captionId}>
                <Label text="Session time" required={true} />
            </div>

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
                        label="Start time"
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
                        label="End time"
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
 * The naming contract at the call site (#225): one visible caption over two
 * pickers, and two controls that are still told apart.
 *
 * Checking that the `for` targets resolve would not catch the failure this
 * guards — #222's lesson. Before the fix both inputs resolved fine and were
 * both called "Time".
 */
Unfilled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The caption names the pair, because it cannot name either control.
    const pair = canvas.getByRole('group', { name: /Session time/ });
    const inputs = within(pair).getAllByRole('textbox');
    await expect(inputs).toHaveLength(2);

    // `getByRole` throws on more than one match, so a distinct name each is the
    // assertion: two controls, two names, neither of them "Time".
    const start = within(pair).getByRole('textbox', { name: 'Start time' });
    const end = within(pair).getByRole('textbox', { name: 'End time' });
    await expect(start).not.toBe(end);

    // `showLabel={false}` is a visual switch: the label is in the document,
    // pointed at the control, and clipped to nothing.
    for (const [input, text] of [[start, 'Start time'], [end, 'End time']]) {
        const label = input.ownerDocument.querySelector(`label[for="${input.id}"]`);
        await expect(label).not.toBeNull();
        await expect(label.textContent).toBe(text);
        await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    }
};

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
