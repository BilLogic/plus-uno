/**
 * Profile - Elements - Language Preferences
 * 
 * Multi-select dropdown for selecting languages the user can tutor in.
 * Re-uses the Label component (from forms) and Select component (from forms).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4899-13061&m=dev
 * 
 * States:
 * - Default (closed, unfilled): placeholder "Select Language(s)", caret-down
 * - Open (with selections): Badges in trigger + checkbox dropdown with creatable option
 * - Closed (with selections): Dismissible badges shown, caret-down
 * 
 * Typography:
 * - Label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface
 * - Placeholder: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface-variant
 * - Badge text: body2-txt (Merriweather Sans Regular, 14px) in --color-secondary-text
 * - Options: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Creatable text: body2-txt (Merriweather Sans Regular, 14px) in --color-primary
 * - Icon: Font Awesome 7 Solid, 12px in --color-on-surface-variant
 * 
 * Colors:
 * - Label: --color-on-surface
 * - Input background: --color-surface
 * - Input border (default): --color-outline-variant
 * - Input border (focused/open): --color-outline
 * - Badge background: --color-secondary-state-08 (rgba(68,92,106,0.08))
 * - Badge text: --color-secondary-text
 * - Selected item indicator: --color-primary-container (left 4px bar)
 * - Selected item background: --color-primary-state-08 (rgba(0,101,142,0.08))
 * - Checkbox checked: --color-primary
 * - Checkbox unchecked border: --color-primary
 * - Dropdown background: --color-surface
 * - Dropdown border: --color-outline-variant
 * - Dropdown radius: --size-modal-radius-sm (4px)
 * 
 * Spacing:
 * - Label-to-select gap: var(--size-spacing-space-050, 4px)
 * - Input padding: var(--size-element-pad-x-md, 10px) / var(--size-element-pad-y-md, 6px)
 * - Input gap: var(--size-element-gap-md, 10px)
 * - Badge gap: var(--size-element-gap-xs, 4px)
 * - Input border-radius: var(--size-border-radius-50, 2px)
 * 
 * Width: 400px (from Figma)
 * 
 * Select props:
 * - mode="multi" (multi-select with checkboxes)
 * - displayMode="badges" (selected values shown as dismissible badges)
 * - creatable={true} ("Add a language not currently listed")
 * 
 * Options:
 * - Arabic
 * - English
 * - French
 * - Korean
 */
import React, { useState } from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/Language Preferences',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

const languageOptions = [
    { value: 'arabic', label: 'Arabic' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'korean', label: 'Korean' },
];

/**
 * Reusable Language Preferences component for use in sections and pages
 */
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

/**
 * All States
 * Shows Language Preferences in all three states:
 * Default (closed/unfilled), Open (with selections), and Closed (with selections).
 */
export const LanguagePreferencesStory = () => {
    const [interactiveValue, setInteractiveValue] = useState([]);

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
                        gap: 'var(--size-spacing-space-050, 4px)',
                        width: '400px',
                    }}
                >
                    <Label text="Languages you can tutor in" required={false} />
                    <Select
                        id="lang-pref-default"
                        mode="multi"
                        options={languageOptions}
                        placeholder="Select Language(s)"
                        displayMode="badges"
                        creatable={true}
                        searchable={true}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 2: Open (with selections) — click to open and select */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Open (With Selections) — Click to open
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-spacing-space-050, 4px)',
                        width: '400px',
                    }}
                >
                    <Label text="Languages you can tutor in" required={false} />
                    <Select
                        id="lang-pref-open"
                        mode="multi"
                        options={languageOptions}
                        defaultValue={['english', 'french']}
                        placeholder="Select Language(s)"
                        displayMode="badges"
                        creatable={true}
                        searchable={true}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 3: Closed (with selections) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Closed (With Selections)
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-spacing-space-050, 4px)',
                        width: '400px',
                    }}
                >
                    <Label text="Languages you can tutor in" required={false} />
                    <Select
                        id="lang-pref-closed"
                        mode="multi"
                        options={languageOptions}
                        defaultValue={['english', 'french']}
                        placeholder="Select Language(s)"
                        displayMode="badges"
                        creatable={true}
                        searchable={true}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Interactive: user can select and see the values */}
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
                        gap: 'var(--size-spacing-space-050, 4px)',
                        width: '400px',
                    }}
                >
                    <Label text="Languages you can tutor in" required={false} />
                    <Select
                        id="lang-pref-interactive"
                        mode="multi"
                        options={languageOptions}
                        value={interactiveValue}
                        onChange={setInteractiveValue}
                        placeholder="Select Language(s)"
                        displayMode="badges"
                        creatable={true}
                        searchable={true}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
                {interactiveValue.length > 0 && (
                    <p
                        className="body3-txt"
                        style={{
                            color: 'var(--color-on-surface-variant)',
                            marginTop: 'var(--size-element-gap-sm, 8px)',
                        }}
                    >
                        Selected: {interactiveValue.map(v => languageOptions.find(o => o.value === v)?.label || v).join(', ')}
                    </p>
                )}
            </div>
        </div>
    );
};
