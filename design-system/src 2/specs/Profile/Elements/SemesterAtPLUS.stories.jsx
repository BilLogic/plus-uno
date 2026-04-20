/**
 * Profile - Elements - Semester at PLUS
 * 
 * Read-only multi-select showing semesters the tutor has been at PLUS.
 * Re-uses the Label component (from forms) and Select component (from forms).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5470-9151&m=dev
 * 
 * States:
 * - Filled (1 semester): one badge shown in read-only input
 * - Filled (multiple semesters): multiple badges shown in read-only input
 * 
 * Typography:
 * - Label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface
 * - Badge text: body2-txt (Merriweather Sans Regular, 14px, line-height 1.571) in --color-secondary-text
 * 
 * Colors:
 * - Label: --color-on-surface
 * - Input background: --color-surface-variant (read-only/disabled state)
 * - Input border: --color-outline-variant
 * - Badge background: --color-secondary-state-08 (rgba(68,92,106,0.08))
 * - Badge text: --color-secondary-text
 * 
 * Spacing:
 * - Label-to-select gap: var(--size-spacing-space-050, 4px)
 * - Input padding: var(--size-element-pad-x-md, 10px) / var(--size-element-pad-y-md, 6px)
 * - Badge gap: var(--size-element-gap-xs, 4px)
 * - Badge padding: var(--size-element-pad-x-sm, 8px)
 * - Badge border-radius: var(--size-element-radius-full, 999px)
 * - Input border-radius: var(--size-border-radius-50, 2px)
 * 
 * Width: 400px (from Figma)
 * 
 * Select props:
 * - mode="multi" (multi-select with badges)
 * - displayMode="badges" (selected values shown as badges)
 * - readonly={true} (read-only, no interaction)
 * 
 * Options:
 * - Fall 2024
 * - Spring 2025
 * - Summer 2025
 * - Fall 2025
 */
import React from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/Semester at PLUS',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

const semesterOptions = [
    { value: 'fall-2024', label: 'Fall 2024' },
    { value: 'spring-2025', label: 'Spring 2025' },
    { value: 'summer-2025', label: 'Summer 2025' },
    { value: 'fall-2025', label: 'Fall 2025' },
];

/**
 * Reusable Semester at PLUS component for use in sections and pages
 */
export const SemesterAtPLUS = ({ id = 'semester-plus', value, onChange, defaultValue, label = 'Semester Tutored at PLUS', required = false, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                width: '100%',
            }}
        >
            <Label text={label} required={required} />
            <Select
                id={id}
                mode="multi"
                options={semesterOptions}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                placeholder="Select semester(s)"
                displayMode="badges"
                readonly={true}
                size="medium"
                style={{ width: '100%' }}
                {...props}
            />
        </div>
    );
};

/**
 * All States
 * Shows the Semester at PLUS field in its different filled states.
 * This field is read-only — values are set by the system.
 */
export const SemesterAtPLUSStory = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-xl, 32px)',
                padding: 'var(--size-element-pad-y-lg, 12px)',
            }}
        >
            {/* State 1: Filled (1 semester) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Filled (1 Semester)
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-spacing-space-050, 4px)',
                        width: '400px',
                    }}
                >
                    <Label text="Semester Tutored at PLUS" required={false} />
                    <Select
                        id="semester-plus-uno"
                        mode="multi"
                        options={semesterOptions}
                        defaultValue={['fall-2024']}
                        placeholder="Select semester(s)"
                        displayMode="badges"
                        readonly={true}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 2: Filled (multiple semesters) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Filled (Multiple Semesters)
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-spacing-space-050, 4px)',
                        width: '400px',
                    }}
                >
                    <Label text="Semester Tutored at PLUS" required={false} />
                    <Select
                        id="semester-plus-multi"
                        mode="multi"
                        options={semesterOptions}
                        defaultValue={['fall-2024', 'spring-2025', 'summer-2025', 'fall-2025']}
                        placeholder="Select semester(s)"
                        displayMode="badges"
                        readonly={true}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
};
