/**
 * Profile - Elements - Language Preferences
 *
 * Multi-select dropdown for selecting languages the user can tutor in.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4899-13061&m=dev
 */
import React from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/LanguagePreferences',
    excludeStories: ['LanguagePreferences'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Language preferences multi-select with badges for tutor profile. Token notes are in the file header comment.',
            },
        },
    },
};

const languageOptions = [
    { value: 'arabic', label: 'Arabic' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'korean', label: 'Korean' },
];

/** Reusable Language Preferences component for use in sections and pages */
export const LanguagePreferences = ({ id = 'language-preferences', value, onChange, defaultValue, required = false, ...props }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                width: '100%',
            }}
        >
            <Label text="Language Preferences" required={required} />
            <Select
                id={id}
                mode="multi"
                options={languageOptions}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                placeholder="Select Languages"
                displayMode="badges"
                creatable={true}
                searchable={true}
                size="medium"
                style={{ width: '100%' }}
                {...props}
            />
        </div>
    );
};

const languagePresetDefaults = {
    empty: undefined,
    bilingual: ['english', 'french'],
    trilingual: ['arabic', 'english', 'korean'],
};

export const Overview = () => (
    <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <LanguagePreferences id="language-preferences-overview" required={false} />
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
            <LanguagePreferences id="language-var-empty" required={false} />
        </div>
        <div style={{ maxWidth: '400px', flex: '1 1 320px' }}>
            <LanguagePreferences
                id="language-var-bilingual"
                defaultValue={languagePresetDefaults.bilingual}
                required={false}
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
            options: ['empty', 'bilingual', 'trilingual'],
            description: 'Initial language badges',
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <LanguagePreferences
                id="language-preferences-interactive"
                key={args.preset}
                defaultValue={languagePresetDefaults[args.preset]}
                required={false}
            />
        </div>
    ),
};
