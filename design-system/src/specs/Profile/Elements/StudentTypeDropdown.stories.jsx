/**
 * Profile - Elements - Student Type Dropdown
 * 
 * Dropdown for selecting the user's academic / professional background.
 * Re-uses the Label component (from forms) and Select component (from forms).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5667-35179&m=dev
 * 
 * States:
 * - Default (closed, unfilled): placeholder "Select type", caret-down
 * - Open (unfilled): placeholder "Select type", caret-up, dropdown with options
 * - Filled (closed): selected value displayed, caret-down
 * 
 * Typography:
 * - Label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667)
 * - Required asterisk: body3-txt font-weight-light (Merriweather Sans Light, 12px) in --color-danger
 * - Placeholder: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface-variant
 * - Selected value: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Options: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Icon: Font Awesome 7 Solid, 12px in --color-on-surface-variant
 * 
 * Colors:
 * - Label: --color-on-surface
 * - Required: --color-danger
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
 * Width: 229px (from Figma)
 * 
 * Options:
 * - Undergraduate Student
 * - Graduate Student
 * - Phd Student
 * - Teacher
 * - Retired Teacher
 */
import React, { useState } from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/Student Type Dropdown',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

const studentTypeOptions = [
    { value: 'undergraduate-student', label: 'Undergraduate Student' },
    { value: 'graduate-student', label: 'Graduate Student' },
    { value: 'phd-student', label: 'Phd Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'retired-teacher', label: 'Retired Teacher' },
];

/**
 * Reusable Student Type Dropdown component for use in sections and pages
 */
export const StudentTypeDropdown = ({ id = 'student-type', value, onChange, defaultValue, required = true, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                width: '100%',
            }}
        >
            <Label text="Student Type" required={required} />
            <Select
                id={id}
                mode="single"
                options={studentTypeOptions}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                placeholder="Select Student Type"
                size="medium"
                style={{ width: '100%' }}
                {...props}
            />
        </div>
    );
};

/**
 * All States
 * Shows the Student Type Dropdown in all three states:
 * Default (closed/unfilled), Open (unfilled), and Filled (closed).
 */
export const StudentTypeDropdownStory = () => {
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
                        width: '229px',
                    }}
                >
                    <Label text="Academic / Professional Background:" required={true} />
                    <Select
                        id="student-type-default"
                        mode="single"
                        options={studentTypeOptions}
                        placeholder="Select type"
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
                        width: '229px',
                    }}
                >
                    <Label text="Academic / Professional Background:" required={true} />
                    <Select
                        id="student-type-open"
                        mode="single"
                        options={studentTypeOptions}
                        placeholder="Select type"
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
                        gap: 'var(--size-element-gap-xs, 4px)',
                        width: '229px',
                    }}
                >
                    <Label text="Academic / Professional Background:" required={true} />
                    <Select
                        id="student-type-filled"
                        mode="single"
                        options={studentTypeOptions}
                        defaultValue="undergraduate-student"
                        placeholder="Select type"
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
                        width: '229px',
                    }}
                >
                    <Label text="Academic / Professional Background:" required={true} />
                    <Select
                        id="student-type-interactive"
                        mode="single"
                        options={studentTypeOptions}
                        value={selectedValue}
                        onChange={setSelectedValue}
                        placeholder="Select type"
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
                        Selected: {studentTypeOptions.find(o => o.value === selectedValue)?.label}
                    </p>
                )}
            </div>
        </div>
    );
};
