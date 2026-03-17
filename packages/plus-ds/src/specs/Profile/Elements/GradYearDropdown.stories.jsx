/**
 * Profile - Elements - Grad Year Dropdown
 * 
 * Dropdown for selecting the user's expected graduation time.
 * Re-uses the Label component (from forms) and Select component (from forms).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4313-28236&m=dev
 * 
 * States:
 * - Default (closed, unfilled): placeholder "Select semester", caret-down
 * - Open (unfilled): placeholder "Select semester", caret-up, dropdown with options
 * - Filled (closed): selected value displayed, caret-down
 * 
 * Typography:
 * - Label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface
 * - Placeholder: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface-variant
 * - Selected value: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Options: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Icon: Font Awesome 7 Solid, 12px in --color-on-surface-variant
 * 
 * Colors:
 * - Label: --color-on-surface
 * - Input background: --color-surface
 * - Input border (default): --color-outline-variant
 * - Input border (focused/open): --color-outline
 * - Dropdown background: --color-surface
 * - Dropdown border: --color-outline-variant
 * - Dropdown radius: --size-modal-radius-sm (4px)
 * 
 * Spacing:
 * - Label-to-select gap: var(--size-small-gap-xs, 4px)
 * - Input padding: var(--size-element-pad-x-md, 10px) / var(--size-element-pad-y-md, 6px)
 * - Input gap: var(--size-element-gap-md, 10px)
 * - Input border-radius: var(--size-border-radius-50, 2px)
 * 
 * Width: 200px (from Figma)
 * 
 * Note: No required asterisk on this label (unlike Student Type Dropdown).
 * 
 * Options:
 * - Undecided
 * - Spring 2026
 * - Summer 2026
 * - Fall 2026
 * - Spring 2027
 */
import React, { useState } from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/Grad Year Dropdown',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

const gradYearOptions = [
    { value: 'undecided', label: 'Undecided' },
    { value: 'spring-2026', label: 'Spring 2026' },
    { value: 'summer-2026', label: 'Summer 2026' },
    { value: 'fall-2026', label: 'Fall 2026' },
    { value: 'spring-2027', label: 'Spring 2027' },
];

/**
 * Reusable Grad Year Dropdown component for use in sections and pages
 */
export const GradYearDropdown = ({ id = 'grad-year', value, onChange, defaultValue, required = false, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                width: '100%',
            }}
        >
            <Label text="Graduation Year" required={required} />
            <Select
                id={id}
                mode="single"
                options={gradYearOptions}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                placeholder="Select Graduation Year"
                size="medium"
                style={{ width: '100%' }}
                {...props}
            />
        </div>
    );
};

/**
 * All States
 * Shows the Grad Year Dropdown in all three states:
 * Default (closed/unfilled), Open (unfilled), and Filled (closed).
 */
export const GradYearDropdownStory = () => {
    const [selectedValue, setSelectedValue] = useState('');

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-xl, 32px)',
                padding: 'var(--size-element-pad-y-lg, 12px)',
            }}
        >
            {/* State 1: Default (closed, unfilled) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Default (Closed, Unfilled)
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '200px',
                    }}
                >
                    <Label text="Expected Graduation Time" required={false} />
                    <Select
                        id="grad-year-default"
                        mode="single"
                        options={gradYearOptions}
                        placeholder="Select semester"
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 2: Open (unfilled) — interactive, user can click to open */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Open (Unfilled) — Click to open
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '200px',
                    }}
                >
                    <Label text="Expected Graduation Time" required={false} />
                    <Select
                        id="grad-year-open"
                        mode="single"
                        options={gradYearOptions}
                        placeholder="Select semester"
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 3: Filled (closed) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Filled (Closed)
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '200px',
                    }}
                >
                    <Label text="Expected Graduation Time" required={false} />
                    <Select
                        id="grad-year-filled"
                        mode="single"
                        options={gradYearOptions}
                        defaultValue="spring-2026"
                        placeholder="Select semester"
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Interactive: user can select and see the value */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Interactive
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '200px',
                    }}
                >
                    <Label text="Expected Graduation Time" required={false} />
                    <Select
                        id="grad-year-interactive"
                        mode="single"
                        options={gradYearOptions}
                        value={selectedValue}
                        onChange={setSelectedValue}
                        placeholder="Select semester"
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
                {selectedValue && (
                    <p
                        className="body3-txt"
                        style={{
                            color: 'var(--color-on-surface-variant)',
                            marginTop: 'var(--size-element-gap-sm, 8px)',
                        }}
                    >
                        Selected: {gradYearOptions.find(o => o.value === selectedValue)?.label}
                    </p>
                )}
            </div>
        </div>
    );
};
