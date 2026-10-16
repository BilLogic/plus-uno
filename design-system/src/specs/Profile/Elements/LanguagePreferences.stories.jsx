/**
 * Profile - Elements - Language Preferences
 *
 * The languages a tutor can tutor in, as a TagInput: type to filter, pick a
 * language, or create one the list does not have yet.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4899-13061&m=dev
 */
import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { TagInput } from '@/components';

export default {
    title: 'Specs/Profile/Elements/Language Preferences',
    excludeStories: ['LanguagePreferences'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'The languages a tutor can tutor in, on TagInput: type to filter, pick one, or create a language the list lacks.',
            },
        },
    },
};

const languageOptions = [
    { value: 'arabic', label: 'Arabic', color: 'green' },
    { value: 'english', label: 'English', color: 'blue' },
    { value: 'french', label: 'French', color: 'purple' },
    { value: 'korean', label: 'Korean', color: 'teal' },
];

/**
 * Reusable Language Preferences element for sections and pages.
 *
 * `value` and `defaultValue` are arrays of language values, such as
 * `['english', 'french']`; `onChange` receives the same shape. A created
 * language joins the options with the colour TagInput gave it.
 */
export const LanguagePreferences = ({
    id = 'language-preferences',
    value,
    onChange,
    defaultValue,
    required = false,
    ...props
}) => {
    const [options, setOptions] = useState(languageOptions);
    const [internal, setInternal] = useState(defaultValue ?? []);
    const values = value ?? internal;

    const tagOf = (languageValue) => {
        const option = options.find((o) => o.value === languageValue);
        return option ? { value: option.value, text: option.label, color: option.color } : languageValue;
    };

    return (
        <TagInput
            id={id}
            label="Language Preferences"
            required={required}
            placeholder="Select or create a language"
            options={options}
            tags={values.map(tagOf)}
            onCreate={({ value: text, color }) => {
                setOptions((list) => [...list, { value: text.toLowerCase(), label: text, color }]);
                return text.toLowerCase();
            }}
            onChange={(next) => {
                const nextValues = next.map((tag) => (typeof tag === 'string' ? tag : tag.value));
                if (value === undefined) setInternal(nextValues);
                if (onChange) onChange(nextValues);
            }}
            {...props}
        />
    );
};

const languagePresetDefaults = {
    empty: undefined,
    bilingual: ['english', 'french'],
    trilingual: ['arabic', 'english', 'korean'],
};

export const Overview = () => (
    <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <LanguagePreferences id="language-preferences-overview" defaultValue={languagePresetDefaults.bilingual} />
    </div>
);

/** It is a TagInput: typing a language the list lacks creates it. */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Language Preferences' });
    const tags = within(canvas.getByRole('list', { name: 'Selected: Language Preferences' }));
    await expect(tags.getByText('English')).toBeInTheDocument();

    await userEvent.click(input);
    await userEvent.type(input, 'Spanish{Enter}');
    await expect(tags.getByText('Spanish')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
};

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
            <LanguagePreferences id="language-var-empty" />
        </div>
        <div style={{ maxWidth: '400px', flex: '1 1 320px' }}>
            <LanguagePreferences id="language-var-bilingual" defaultValue={languagePresetDefaults.bilingual} />
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
            description: 'Initial languages',
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ maxWidth: '400px', padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <LanguagePreferences
                id="language-preferences-interactive"
                key={args.preset}
                defaultValue={languagePresetDefaults[args.preset]}
            />
        </div>
    ),
};
