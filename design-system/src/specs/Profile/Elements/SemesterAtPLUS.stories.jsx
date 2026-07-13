/**
 * Profile - Elements - Semester at PLUS
 *
 * Read-only multi-select showing semesters the tutor has been at PLUS.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5470-9151&m=dev
 */
import React from 'react';
import { Label } from '@/components/forms-and-inputs/LabelAndCaption.stories';
import Select from '@/components/forms-and-inputs/Select';

export default {
    title: 'Specs/Profile/Elements/Semester At PLUS',
    excludeStories: ['SemesterAtPLUS'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Read-only semester badges for time at PLUS on tutor profile. Token notes are in the file header comment.',
            },
        },
    },
};

const semesterOptions = [
    { value: 'fall-2024', label: 'Fall 2024' },
    { value: 'spring-2025', label: 'Spring 2025' },
    { value: 'summer-2025', label: 'Summer 2025' },
    { value: 'fall-2025', label: 'Fall 2025' },
];

/** Reusable Semester at PLUS component for use in sections and pages */
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

const semesterPresetDefaults = {
    one: ['fall-2024'],
    two: ['fall-2024', 'spring-2025'],
    four: ['fall-2024', 'spring-2025', 'summer-2025', 'fall-2025'],
};

export const Overview = () => (
    <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <SemesterAtPLUS
            id="semester-plus-overview"
            defaultValue={semesterPresetDefaults.one}
            label="Semester Tutored at PLUS"
            required={false}
        />
    </div>
);

export const Variants = () => (
    <div
        style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--size-section-gap-xl, 32px)',
            padding: 'var(--size-element-pad-y-lg, 12px)',
        }}
    >
        <div style={{ maxWidth: '400px', flex: '1 1 320px' }}>
            <SemesterAtPLUS
                id="semester-var-one"
                defaultValue={semesterPresetDefaults.one}
                label="Semester Tutored at PLUS"
                required={false}
            />
        </div>
        <div style={{ maxWidth: '400px', flex: '1 1 320px' }}>
            <SemesterAtPLUS
                id="semester-var-four"
                defaultValue={semesterPresetDefaults.four}
                label="Semester Tutored at PLUS"
                required={false}
            />
        </div>
    </div>
);

export const Interactive = {
    args: {
        preset: 'four',
    },
    argTypes: {
        preset: {
            control: 'radio',
            options: ['one', 'two', 'four'],
            description: 'How many semester badges are shown (read-only)',
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <SemesterAtPLUS
                id="semester-plus-interactive"
                key={args.preset}
                defaultValue={semesterPresetDefaults[args.preset]}
                label="Semester Tutored at PLUS"
                required={false}
            />
        </div>
    ),
};
