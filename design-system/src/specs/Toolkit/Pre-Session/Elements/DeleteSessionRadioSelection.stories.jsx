import React from 'react';
import { ChoiceGroup } from '@/components';
import DatePicker from '@/components/forms-and-inputs/DatePicker';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Elements/Delete Session Radio Selection',
    excludeStories: ['dateRangeOption'],
    parameters: {
        layout: 'padded',
    },
};

// ─── Shared Label ─────────────────────────────────────────────

const RadioLabel = () => (
    <span>
        This and all sessions at{' '}
        <strong style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
            Hogwarts
        </strong>{' '}
        during a specific date period
    </span>
);

// ─── Reusable option ─────────────────────────────────────────

/**
 * The "during a specific date period" answer, as a ChoiceGroup option: while it
 * is chosen, the date range opens under it. The Delete Session modals put it in
 * their own ChoiceGroup beside the other answers.
 *
 * Tokens:
 * - Gap between date pickers and "to": --size-element-gap-sm
 * - Typography: body2-txt
 * - Color: --color-on-surface
 */
export const dateRangeOption = ({
    startDate = '',
    endDate = '',
    startPlaceholder = 'Select Date',
    endPlaceholder = 'Select Date',
} = {}) => ({
    id: 'delete-date-period',
    value: 'date-period',
    label: <RadioLabel />,
    reveal: (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-sm)',
            }}
        >
            <DatePicker
                size="small"
                placeholder={startPlaceholder}
                value={startDate}
                onChange={() => {}}
            />
            <span
                className="body2-txt"
                style={{
                    color: 'var(--color-on-surface)',
                    fontWeight: 300,
                }}
            >
                to
            </span>
            <DatePicker
                size="small"
                placeholder={endPlaceholder}
                value={endDate}
                onChange={() => {}}
            />
        </div>
    ),
});

/** The option on its own, chosen or not, for the state gallery below. */
const DeleteSessionRadioItem = ({ selected = false, ...dates }) => (
    <ChoiceGroup
        name="delete-session-radio"
        aria-label="Sessions to cancel"
        options={[dateRangeOption(dates)]}
        value={selected ? 'date-period' : null}
        onChange={() => {}}
    />
);

// ─── Stories ─────────────────────────────────────────────────

/**
 * Overview - All States
 * Shows all visual states of the Delete Session Radio Selection
 * matching the Figma spec.
 *
 * States:
 * 1. Default (unselected)
 * 2. Selected, both dates empty
 * 3. Start date filled, end date empty
 * 4. Both dates filled
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            paddingBottom: '320px',
        }}
    >
        <section>
            <h6 className="h6 mb-3">Default (Unselected)</h6>
            <DeleteSessionRadioItem selected={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Selected — Empty Dates</h6>
            <DeleteSessionRadioItem selected={true} />
        </section>

        <section>
            <h6 className="h6 mb-3">Selected — Start Date Filled</h6>
            <DeleteSessionRadioItem
                selected={true}
                startDate="2025-03-26"
            />
        </section>

        <section>
            <h6 className="h6 mb-3">Selected — Both Dates Filled</h6>
            <DeleteSessionRadioItem
                selected={true}
                startDate="2025-03-26"
                endDate="2025-03-31"
            />
        </section>
    </div>
);

/**
 * Default
 * Unselected radio — only shows the radio label text with no date pickers.
 */
export const Default = () => (
    <DeleteSessionRadioItem selected={false} />
);

/**
 * Selected_Empty
 * Radio selected with both date pickers showing "Select Date" placeholder.
 * Click the date pickers to open the calendar dropdown.
 */
export const Selected_Empty = () => (
    <div style={{ paddingBottom: '320px' }}>
        <DeleteSessionRadioItem selected={true} />
    </div>
);

/**
 * Start_Date_Filled
 * Radio selected, start date is 03/26/25, end date is still empty.
 */
export const Start_Date_Filled = () => (
    <div style={{ paddingBottom: '320px' }}>
        <DeleteSessionRadioItem
            selected={true}
            startDate="2025-03-26"
        />
    </div>
);

/**
 * Both_Dates_Filled
 * Radio selected, both dates filled: 03/26/25 to 03/31/25.
 */
export const Both_Dates_Filled = () => (
    <div style={{ paddingBottom: '320px' }}>
        <DeleteSessionRadioItem
            selected={true}
            startDate="2025-03-26"
            endDate="2025-03-31"
        />
    </div>
);
