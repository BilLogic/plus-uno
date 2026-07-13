/**
 * Profile - Elements - University
 *
 * Dropdown for selecting the user's university.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4478-4514&m=dev
 */
import React from 'react';
import { Label } from '@/components/forms-and-inputs/LabelAndCaption.stories';
import Select from '@/components/forms-and-inputs/Select';

export default {
    title: 'Specs/Profile/Elements/University',
    excludeStories: ['University'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'University autocomplete / select for tutor profile. Token notes are in the file header comment.',
            },
        },
    },
};

const universityOptions = [
    { value: 'carnegie-mellon', label: 'Carnegie Mellon University' },
    { value: 'duquesne', label: 'Duquesne University' },
    { value: 'pitt', label: 'University of Pittsburgh' },
];

/** Reusable University component for use in sections and pages */
export const University = ({ id = 'university', value, onChange, defaultValue, required = false, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                width: '100%',
            }}
        >
            <Label text="University" required={required} />
            <Select
                id={id}
                mode="single"
                options={universityOptions}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                placeholder="Select University"
                size="medium"
                style={{ width: '100%' }}
                {...props}
            />
        </div>
    );
};

export const Overview = () => (
    <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <University id="university-overview" required={false} />
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
        <div style={{ width: '400px', maxWidth: '100%' }}>
            <University id="university-var-empty" required={false} />
        </div>
        <div style={{ width: '400px', maxWidth: '100%' }}>
            <University id="university-var-filled" defaultValue="carnegie-mellon" required={false} />
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
            options: ['', 'carnegie-mellon', 'duquesne', 'pitt'],
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <University
                id="university-interactive"
                key={args.initialValue ?? ''}
                defaultValue={args.initialValue || undefined}
                required={false}
            />
        </div>
    ),
};
