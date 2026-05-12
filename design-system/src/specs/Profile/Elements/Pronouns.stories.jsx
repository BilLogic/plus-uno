/**
 * Profile - Elements - Pronouns
 * 
 * Dropdown for selecting the user's preferred pronouns.
 * Re-uses the Label component (from forms) and Select component (from forms).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4913-8269&m=dev
 * 
 * States:
 * - Default (closed, unfilled): placeholder "Select Pronouns", caret-down
 * - Open (unfilled): placeholder "Select Pronouns", caret-up, dropdown with options
 * - Filled (closed): selected value displayed, caret-down
 * 
 * Typography:
 * - Label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface
 * - Placeholder: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface-variant
 * - Selected value: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Options: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Icon: Font Awesome 7 Solid, 12px in --color-on-surface-variant
 * 
 * Colors:
 * - Label: --color-on-surface
 * - Input background: --color-surface
 * - Input border (default): --color-outline-variant
 * - Input border (focused/open): --color-outline
 * - Dropdown background: --color-surface
 * - Dropdown border: --color-outline-variant
 * - Dropdown radius: --size-modal-radius-sm (4px)
 * 
 * Spacing:
 * - Label-to-select gap: var(--size-small-gap-xs, 4px)
 * - Input padding: var(--size-element-pad-x-md, 10px) / var(--size-element-pad-y-md, 6px)
 * - Input gap: var(--size-element-gap-md, 10px)
 * - Input border-radius: var(--size-border-radius-50, 2px)
 * 
 * Width: 163px (from Figma)
 * 
 * Options:
 * - She/Her
 * - He/Him
 * - They/Them
 */
import React, { useState } from 'react';
import { Title, Canvas } from '@storybook/addon-docs/blocks';
import {
    DocsCanvasShell,
    DocsInteractivePlayground,
    ResourcesBlock,
} from '@/storybook-docs/ds-docs-layout.jsx';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Select from '../../../forms/Select';

export default {
    title: 'Specs/Profile/Elements/Pronouns',
    excludeStories: ['Pronouns'],
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            page: PronounsSpecDocsPage,
            description: {
                component:
                    'Preferred pronouns — single-select dropdown on tutor profile (Label + Select). Token notes are in the file header.',
            },
        },
    },
};

const pronounOptions = [
    { value: 'she-her', label: 'She/Her' },
    { value: 'he-him', label: 'He/Him' },
    { value: 'they-them', label: 'They/Them' },
];

/**
 * Reusable Pronouns component for use in sections and pages
 */
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

/**
 * Interactive — inline controls (see Profile specification doc).
 */
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
                id="pronouns-playground"
                key={args.pronoun ?? ''}
                defaultValue={args.pronoun || undefined}
            />
        </div>
    ),
};

/**
 * All States
 * Shows the Pronouns dropdown in all three states:
 * Default (closed/unfilled), Open (unfilled), and Filled (closed).
 */
export const AllStates = () => {
    const [selectedValue, setSelectedValue] = useState('');

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
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '163px',
                    }}
                >
                    <Label text="Preferred Pronouns" required={false} />
                    <Select
                        id="pronouns-default"
                        mode="single"
                        options={pronounOptions}
                        placeholder="Select Pronouns"
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 2: Open (unfilled) — click to open */}
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
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '163px',
                    }}
                >
                    <Label text="Preferred Pronouns" required={false} />
                    <Select
                        id="pronouns-open"
                        mode="single"
                        options={pronounOptions}
                        placeholder="Select Pronouns"
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* State 3: Filled (closed) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Filled (Closed)
                </h6>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '163px',
                    }}
                >
                    <Label text="Preferred Pronouns" required={false} />
                    <Select
                        id="pronouns-filled"
                        mode="single"
                        options={pronounOptions}
                        defaultValue="she-her"
                        placeholder="Select Pronouns"
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
                        gap: 'var(--size-small-gap-xs, 4px)',
                        width: '163px',
                    }}
                >
                    <Label text="Preferred Pronouns" required={false} />
                    <Select
                        id="pronouns-interactive"
                        mode="single"
                        options={pronounOptions}
                        value={selectedValue}
                        onChange={setSelectedValue}
                        placeholder="Select Pronouns"
                        size="medium"
                        style={{ width: '100%' }}
                    />
                </div>
                {selectedValue && (
                    <p
                        className="body3-txt"
                        style={{
                            color: 'var(--color-on-surface-variant)',
                            marginTop: 'var(--size-element-gap-sm, 8px)',
                        }}
                    >
                        Selected: {pronounOptions.find(o => o.value === selectedValue)?.label}
                    </p>
                )}
            </div>
        </div>
    );
};

function PronounsSpecDocsPage() {
    return (
        <>
            <Title />

            <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-md)' }}>
                Preferred pronouns — single-select dropdown on the tutor profile (Label + Select). Typography and
                spacing follow tokens documented in the stories source header.
            </p>

            <ResourcesBlock
                figmaLink="https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4913-8269"
                githubLink="https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile/Elements"
            />

            <div className="sb-ds-component-docs not-prose">
                <div className="sb-ds-doc-section">
                    <h3 className="h5">States</h3>
                    <DocsCanvasShell description={<>Default, open, and filled variants on one canvas.</>}>
                        <Canvas of={AllStates} story={{ inline: true }} sourceState="hidden" />
                    </DocsCanvasShell>
                </div>

                <div className="sb-ds-doc-section">
                    <h3 className="h5">Interactive playground</h3>
                    <DocsInteractivePlayground
                        of={Interactive}
                        description={<>Choose the initial pronoun from controls; open the dropdown on the canvas.</>}
                    />
                </div>
            </div>
        </>
    );
}
