import React, { useState } from 'react';
import Select from '../../../../../packages/plus-ds/src/forms/Select';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Days Dropdown',
    component: Select,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# Days Dropdown

A dropdown for selecting a day of the week. Used in the create new session form.

## States
- **Unfilled**: Placeholder text "Select a day" with chevron icon
- **Open**: Dropdown expanded with day options (Mondays, Tuesdays, Wednesdays, Thursdays, Fridays)
- **Filled**: Selected day displayed (e.g. "Mondays")
- **Error**: Red border with validation message "Days is required"

## Design Tokens
- **Label**: body3-txt semibold, \`--color-on-surface\`
- **Required asterisk**: body3-txt, \`--color-danger\`
- **Label gap**: \`--size-spacing-space-050\` (4px)
- **Field gap**: \`--size-spacing-space-050\` (4px) between label and select
- **Placeholder text**: body2-txt, \`--color-on-surface\`
- **Chevron icon**: \`--color-on-surface-variant\`, 12px FA solid
- **Dropdown bg**: \`--color-surface-container-high\`
- **Error text**: body3-txt, \`--color-danger\`
- **Error border**: \`--color-danger\`
- **Max width**: 589px
                `
            }
        }
    },
};

// Day options matching Figma design
const dayOptions = [
    { value: 'mondays', label: 'Mondays' },
    { value: 'tuesdays', label: 'Tuesdays' },
    { value: 'wednesdays', label: 'Wednesdays' },
    { value: 'thursdays', label: 'Thursdays' },
    { value: 'fridays', label: 'Fridays' },
];

/**
 * Reusable label component for the Days field
 * Renders "Days" label with required asterisk
 *
 * Tokens:
 * - Label text: body3-txt font-weight-semibold, --color-on-surface
 * - Asterisk: body3-txt, --color-danger
 * - Gap: --size-ele-gap-xs (4px)
 */
const DaysLabel = () => (
    <div style={{ display: 'flex', gap: 'var(--size-ele-gap-xs, 4px)' }}>
        <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
            Days
        </span>
        <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
    </div>
);

/**
 * Reusable field wrapper with consistent max-width and gap
 *
 * Tokens:
 * - Gap between label and select: --size-ele-gap-xs (4px)
 * - Max width: 589px (from Figma)
 */
const FieldWrapper = ({ children }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-ele-gap-xs, 4px)',
            maxWidth: '589px',
        }}
    >
        {children}
    </div>
);

/**
 * Error message component
 *
 * Tokens:
 * - Icon: fa-triangle-exclamation, --color-danger, 10px
 * - Text: body3-txt, --color-danger
 * - Gap: --size-element-gap-sm (8px)
 */
const ErrorMessage = ({ message }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--size-element-gap-sm, 8px)',
            marginTop: 'var(--size-ele-gap-xs, 4px)',
        }}
    >
        <i
            className="fa-solid fa-triangle-exclamation"
            style={{ color: 'var(--color-danger)', fontSize: '10px' }}
        />
        <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>
            {message}
        </span>
    </div>
);

/**
 * Error wrapper that applies a danger border around the Select
 * Since the Select component doesn't have a built-in error state,
 * we wrap it and use CSS to override the trigger border.
 *
 * Tokens:
 * - Border color: --color-danger
 */
const ErrorSelectWrapper = ({ children }) => (
    <div className="plus-select-error-wrapper">
        <style>{`
            .plus-select-error-wrapper .plus-select-trigger {
                border-color: var(--color-danger) !important;
            }
        `}</style>
        {children}
    </div>
);

// ─── Stories ─────────────────────────────────────────────────────

/**
 * Overview - All States
 * Shows all visual states of the Days Dropdown:
 * Unfilled, Open (note: open state is interactive), Filled, and Error
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            padding: 'var(--size-section-gap-lg)',
            backgroundColor: 'var(--color-surface-variant)',
            minHeight: '100vh',
        }}
    >
        <div>
            <h5 className="text-muted mb-2">Days Dropdown</h5>
            <p className="text-muted small mb-0">
                Dropdown for selecting a day of the week. Shows all four states from the Figma design.
            </p>
        </div>

        {/* Unfilled State */}
        <section>
            <h6 className="h6 mb-3">Unfilled State (Default/Placeholder)</h6>
            <FieldWrapper>
                <DaysLabel />
                <Select
                    options={dayOptions}
                    placeholder="Select a day"
                    mode="single"
                    required
                />
            </FieldWrapper>
        </section>

        {/* Open State — note: click the dropdown above to see open state */}
        <section>
            <h6 className="h6 mb-3">Open State (Click dropdown to open)</h6>
            <p className="body3-txt text-muted mb-2">
                Click the dropdown to see the open state with day options.
            </p>
            <FieldWrapper>
                <DaysLabel />
                <Select
                    options={dayOptions}
                    placeholder="Select a day"
                    mode="single"
                    required
                />
            </FieldWrapper>
        </section>

        {/* Filled State */}
        <section>
            <h6 className="h6 mb-3">Filled State (Selection Made)</h6>
            <FieldWrapper>
                <DaysLabel />
                <Select
                    options={dayOptions}
                    placeholder="Select a day"
                    mode="single"
                    searchable
                    defaultValue="mondays"
                    required
                />
            </FieldWrapper>
        </section>

        {/* Error State */}
        <section>
            <h6 className="h6 mb-3">Error State (Validation Error)</h6>
            <FieldWrapper>
                <DaysLabel />
                <ErrorSelectWrapper>
                    <Select
                        options={dayOptions}
                        placeholder="Select a day"
                        mode="single"
                        searchable
                        required
                    />
                </ErrorSelectWrapper>
                <ErrorMessage message="Days is required" />
            </FieldWrapper>
        </section>
    </div>
);

/**
 * Interactive
 * Fully interactive days dropdown with validation
 */
export const Interactive = () => {
    const [selectedDay, setSelectedDay] = useState('');
    const [touched, setTouched] = useState(false);
    const hasError = touched && !selectedDay;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-lg)',
                padding: 'var(--size-section-gap-lg)',
                backgroundColor: 'var(--color-surface-variant)',
                minHeight: '100vh',
            }}
        >
            <div>
                <h5 className="text-muted mb-2">Interactive Days Dropdown</h5>
                <p className="text-muted small mb-0">
                    Select a day from the dropdown. Click away without selecting to trigger the error state.
                </p>
            </div>

            <FieldWrapper>
                <DaysLabel />
                {hasError ? (
                    <ErrorSelectWrapper>
                        <Select
                            options={dayOptions}
                            placeholder="Select a day"
                            mode="single"
                            searchable
                            required
                            value={selectedDay}
                            onChange={(val) => {
                                setSelectedDay(val);
                                setTouched(true);
                            }}
                            onBlur={() => setTouched(true)}
                        />
                    </ErrorSelectWrapper>
                ) : (
                    <Select
                        options={dayOptions}
                        placeholder="Select a day"
                        mode="single"
                        searchable
                        required
                        value={selectedDay}
                        onChange={(val) => {
                            setSelectedDay(val);
                            setTouched(true);
                        }}
                        onBlur={() => setTouched(true)}
                    />
                )}
                {hasError && <ErrorMessage message="Days is required" />}
            </FieldWrapper>

            {selectedDay && (
                <p className="body2-txt" style={{ color: 'var(--color-secondary-text)' }}>
                    Selected: {dayOptions.find(o => o.value === selectedDay)?.label}
                </p>
            )}
        </div>
    );
};
