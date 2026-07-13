/**
 * Profile - Elements - Student Type Dropdown
 *
 * Dropdown for selecting the user's academic / professional background.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5667-35179&m=dev
 */
import React from 'react';
import { Label } from '@/components/forms-and-inputs/LabelAndCaption.stories';
import Select from '@/components/forms-and-inputs/Select';

export default {
    title: 'Specs/Profile/Elements/Student Type Dropdown',
    excludeStories: ['StudentTypeDropdown'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Student type single-select for tutor profile background & matching. Token notes are in the file header comment.',
            },
        },
    },
};

const studentTypeOptions = [
    { value: 'undergraduate-student', label: 'Undergraduate Student' },
    { value: 'graduate-student', label: 'Graduate Student' },
    { value: 'phd-student', label: 'Phd Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'retired-teacher', label: 'Retired Teacher' },
];

/** Reusable Student Type Dropdown component for use in sections and pages */
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

export const Overview = () => (
    <div style={{ width: '229px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <StudentTypeDropdown id="student-type-overview" required={true} />
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
        <div style={{ width: '229px' }}>
            <StudentTypeDropdown id="student-type-var-empty" required={true} />
        </div>
        <div style={{ width: '229px' }}>
            <StudentTypeDropdown id="student-type-var-filled" defaultValue="undergraduate-student" required={true} />
        </div>
    </div>
);

export const Interactive = {
    args: {
        initialValue: '',
    },
    argTypes: {
        initialValue: {
            name: 'initial selection',
            control: 'select',
            options: [
                '',
                'undergraduate-student',
                'graduate-student',
                'phd-student',
                'teacher',
                'retired-teacher',
            ],
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ width: '229px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <StudentTypeDropdown
                id="student-type-interactive"
                key={args.initialValue ?? ''}
                defaultValue={args.initialValue || undefined}
                required={true}
            />
        </div>
    ),
};
