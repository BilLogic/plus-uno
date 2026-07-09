/**
 * Profile - Elements - Grad Year Dropdown
 *
 * Dropdown for selecting the user's expected graduation time.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4313-28236&m=dev
 */
import React from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/GradYearDropdown',
    excludeStories: ['GradYearDropdown'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Graduation year select for tutor profile background & matching. Token notes are in the file header comment.',
            },
        },
    },
};

const gradYearOptions = [
    { value: 'undecided', label: 'Undecided' },
    { value: 'spring-2026', label: 'Spring 2026' },
    { value: 'summer-2026', label: 'Summer 2026' },
    { value: 'fall-2026', label: 'Fall 2026' },
    { value: 'spring-2027', label: 'Spring 2027' },
];

/** Reusable Grad Year Dropdown component for use in sections and pages */
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

export const Overview = () => (
    <div style={{ width: '200px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <GradYearDropdown id="grad-year-overview" required={false} />
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
        <div style={{ width: '200px' }}>
            <GradYearDropdown id="grad-year-var-empty" required={false} />
        </div>
        <div style={{ width: '200px' }}>
            <GradYearDropdown id="grad-year-var-filled" defaultValue="spring-2026" required={false} />
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
            options: ['', 'undecided', 'spring-2026', 'summer-2026', 'fall-2026', 'spring-2027'],
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ width: '200px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <GradYearDropdown
                id="grad-year-interactive"
                key={args.initialValue ?? ''}
                defaultValue={args.initialValue || undefined}
                required={false}
            />
        </div>
    ),
};
