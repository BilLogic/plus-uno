import React from 'react';
import Radio from '../../../../forms/Radio';
import DatePicker from '../../../../forms/DatePicker';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Delete Session Radio Selection',
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

// ─── Reusable Component ──────────────────────────────────────

/**
 * DeleteSessionRadioItem
 * A radio option that, when selected, reveals a date range picker.
 *
 * Props:
 * - selected: Whether the radio is checked
 * - startDate: Value for the start DatePicker (YYYY-MM-DD or '')
 * - endDate: Value for the end DatePicker (YYYY-MM-DD or '')
 * - startPlaceholder: Placeholder for start date
 * - endPlaceholder: Placeholder for end date
 *
 * Tokens:
 * - Gap between radio and content: --size-element-gap-sm
 * - Gap between date pickers and "to": --size-element-gap-sm
 * - Typography: body2-txt
 * - Color: --color-on-surface
 */
export const DeleteSessionRadioItem = ({
    selected = false,
    startDate = '',
    endDate = '',
    startPlaceholder = 'Select Date',
    endPlaceholder = 'Select Date',
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-md)',
            alignItems: 'flex-start',
        }}
    >
        <Radio
            name="delete-session-radio"
            label={<RadioLabel />}
            checked={selected}
            onChange={() => {}}
        />

        {selected && (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-sm)',
                    paddingLeft: 'calc(18px + var(--size-element-gap-sm))',
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
        )}
    </div>
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
