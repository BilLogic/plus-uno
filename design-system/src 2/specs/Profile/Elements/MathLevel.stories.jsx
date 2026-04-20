/**
 * Profile - Elements - Math Level
 * 
 * Multi-select searchable dropdown for selecting math topic expertise.
 * Re-uses the Label component (from forms) and Select component (from forms).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4483-3723&m=dev
 * 
 * States:
 * - Default (closed, unfilled): placeholder "Select topic(s)", caret-down
 * - Open (unfilled): placeholder "Select topic(s)", caret-up, searchable checkbox dropdown
 * - Closed (with selections): Dismissible badges shown, caret-down
 * 
 * Typography:
 * - Label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface
 * - Required asterisk: body3-txt font-weight-light (Merriweather Sans Light, 12px) in --color-danger
 * - Placeholder: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface-variant
 * - Badge text: body2-txt (Merriweather Sans Regular, 14px) in --color-secondary-text
 * - Options: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Search input: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface-variant
 * - Icon: Font Awesome 7 Solid, 12px in --color-on-surface-variant
 * 
 * Colors:
 * - Label: --color-on-surface
 * - Required: --color-danger
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
 * - Label-to-select gap: var(--size-element-gap-xs, 4px)
 * - Input padding: var(--size-element-pad-x-md, 10px) / var(--size-element-pad-y-md, 6px)
 * - Input gap: var(--size-element-gap-md, 10px)
 * - Badge gap: var(--size-element-gap-xs, 4px)
 * - Input border-radius: var(--size-border-radius-50, 2px)
 * 
 * Width: 249px (from Figma)
 * 
 * Select props:
 * - mode="multi" (multi-select with checkboxes)
 * - displayMode="badges" (selected values shown as dismissible badges)
 * - searchable={true} (search field in dropdown)
 * 
 * Options:
 * - Ratios
 * - Fractions & Decimals
 * - Area, Surface Area & Volume
 * - Data & Probability
 */
import React, { useState } from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/Math Level',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

const mathTopicOptions = [
    { value: 'ratios', label: 'Ratios' },
    { value: 'fractions-decimals', label: 'Fractions & Decimals' },
    { value: 'area-surface-volume', label: 'Area, Surface Area & Volume' },
    { value: 'data-probability', label: 'Data & Probability' },
];

/**
 * Reusable Math Level component for use in sections and pages
 */
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

/**
 * All States
 * Shows the Math Level dropdown in all three states:
 * Default (closed/unfilled), Open (unfilled), and Closed (with selections).
 */
export const MathLevelStory = () => {
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
                        gap: 'var(--size-element-gap-xs, 4px)',
                        width: '249px',
                    }}
                >
                    <Label text="Math Topic Expertise" required={true} />
                    <Select
                        id="math-level-default"
                        mode="multi"
                        options={mathTopicOptions}
                        placeholder="Select topic(s)"
                        displayMode="badges"
                        searchable={true}
                        creatable={false}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 2: Open (unfilled) — click to open and search/select */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Open (Unfilled) — Click to open
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-element-gap-xs, 4px)',
                        width: '249px',
                    }}
                >
                    <Label text="Math Topic Expertise" required={true} />
                    <Select
                        id="math-level-open"
                        mode="multi"
                        options={mathTopicOptions}
                        placeholder="Select topic(s)"
                        displayMode="badges"
                        searchable={true}
                        creatable={false}
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
                        gap: 'var(--size-element-gap-xs, 4px)',
                        width: '249px',
                    }}
                >
                    <Label text="Math Topic Expertise" required={true} />
                    <Select
                        id="math-level-filled"
                        mode="multi"
                        options={mathTopicOptions}
                        defaultValue={['ratios', 'fractions-decimals']}
                        placeholder="Select topic(s)"
                        displayMode="badges"
                        searchable={true}
                        creatable={false}
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Interactive */}
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
                        gap: 'var(--size-element-gap-xs, 4px)',
                        width: '249px',
                    }}
                >
                    <Label text="Math Topic Expertise" required={true} />
                    <Select
                        id="math-level-interactive"
                        mode="multi"
                        options={mathTopicOptions}
                        value={interactiveValue}
                        onChange={setInteractiveValue}
                        placeholder="Select topic(s)"
                        displayMode="badges"
                        searchable={true}
                        creatable={false}
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
                        Selected: {interactiveValue.map(v => mathTopicOptions.find(o => o.value === v)?.label || v).join(', ')}
                    </p>
                )}
            </div>
        </div>
    );
};
