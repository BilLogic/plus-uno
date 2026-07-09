/**
 * Profile - Elements - Pronouns
 *
 * Dropdown for selecting the user's preferred pronouns.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4913-8269&m=dev
 */
import React from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/Pronouns',
    excludeStories: ['Pronouns'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Preferred pronouns — single-select dropdown on tutor profile (Label + Select). Token notes are in the file header comment.',
            },
        },
    },
};

const pronounOptions = [
    { value: 'she-her', label: 'She/Her' },
    { value: 'he-him', label: 'He/Him' },
    { value: 'they-them', label: 'They/Them' },
];

/** Reusable Pronouns component for use in sections and pages */
export const Pronouns = ({ id = 'pronouns', value, onChange, defaultValue, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                width: '100%',
            }}
        >
            <Label text="Preferred Pronouns" required={false} />
            <Select
                id={id}
                mode="single"
                options={pronounOptions}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                placeholder="Select Pronouns"
                size="medium"
                style={{ width: '100%' }}
                {...props}
            />
        </div>
    );
};

export const Overview = () => (
    <div style={{ width: '163px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <Pronouns id="pronouns-overview" />
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
        <div style={{ width: '163px' }}>
            <Pronouns id="pronouns-variant-empty" />
        </div>
        <div style={{ width: '163px' }}>
            <Pronouns id="pronouns-variant-filled" defaultValue="she-her" />
        </div>
    </div>
);

export const Interactive = {
    args: {
        pronoun: '',
    },
    argTypes: {
        pronoun: {
            name: 'initial pronoun',
            control: 'select',
            options: ['', 'she-her', 'he-him', 'they-them'],
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ width: '163px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <Pronouns
                id="pronouns-interactive"
                key={args.pronoun ?? ''}
                defaultValue={args.pronoun || undefined}
            />
        </div>
    ),
};
