/**
 * Profile - Elements - Math Level
 *
 * Multi-select searchable dropdown for selecting math topic expertise.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4483-3723&m=dev
 */
import React from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/MathLevel',
    excludeStories: ['MathLevel'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Math level / topics multi-select for tutor profile. Token notes are in the file header comment.',
            },
        },
    },
};

const mathTopicOptions = [
    { value: 'ratios', label: 'Ratios' },
    { value: 'fractions-decimals', label: 'Fractions & Decimals' },
    { value: 'area-surface-volume', label: 'Area, Surface Area & Volume' },
    { value: 'data-probability', label: 'Data & Probability' },
];

/** Reusable Math Level component for use in sections and pages */
export const MathLevel = ({ id = 'math-level', value, onChange, defaultValue, required = true, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                width: '100%',
            }}
        >
            <Label text="Math Level" required={required} />
            <Select
                id={id}
                mode="multi"
                options={mathTopicOptions}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                placeholder="Select Math Topics"
                displayMode="badges"
                searchable={true}
                creatable={false}
                size="medium"
                style={{ width: '100%' }}
                {...props}
            />
        </div>
    );
};

const mathLevelPresetDefaults = {
    empty: undefined,
    one: ['ratios'],
    two: ['ratios', 'fractions-decimals'],
};

export const Overview = () => (
    <div style={{ width: '249px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <MathLevel id="math-level-overview" required={true} />
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
        <div style={{ width: '249px' }}>
            <MathLevel id="math-level-var-empty" required={true} />
        </div>
        <div style={{ width: '249px' }}>
            <MathLevel
                id="math-level-var-filled"
                defaultValue={mathLevelPresetDefaults.two}
                required={true}
            />
        </div>
    </div>
);

export const Interactive = {
    args: {
        preset: 'empty',
    },
    argTypes: {
        preset: {
            control: 'radio',
            options: ['empty', 'one', 'two'],
            description: 'Initial badge selection',
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ width: '249px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <MathLevel
                id="math-level-interactive"
                key={args.preset}
                defaultValue={mathLevelPresetDefaults[args.preset]}
                required={true}
            />
        </div>
    ),
};
