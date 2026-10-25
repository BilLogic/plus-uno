import React, { useState } from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import InputGroup from './InputGroup';

export default {
    title: 'Components/Forms and inputs/Input group',
    component: InputGroup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'A single-line field became 32, its text centered and its side padding 12.' },
            { date: '2026-10-23', kind: 'changed', summary: 'Button and dropdown addons became 24, 4 from the field\'s edge.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="small"` and `size="large"` were deprecated: they draw like `medium` and warn in development.' },
        ],
        docs: {
            description: {
                component: 'Input Group component extends form controls by adding text, checkbox, radio, icon, button, or dropdown addons on either side of textual inputs. Supports multiple addons on each side and various size variants.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the input group',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the input group',
            table: { category: 'Behavior' }
        },
        readOnly: {
            control: 'boolean',
            description: 'Make the input read-only',
            table: { category: 'Behavior' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text for the input',
            table: { category: 'Content' }
        },
        addonPreset: {
            control: 'select',
            options: ['baseline', 'selection', 'action', 'dropdown'],
            description: 'Curated addon combination for the interactive demo',
            table: { category: 'Content' }
        },
        leadingVisual: {
            table: { disable: true, category: 'Development' }
        },
        trailingVisual: {
            table: { disable: true, category: 'Development' }
        },
        value: {
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },}
};

const addonDropdownItems = [
    { text: 'Action' },
    { text: 'Another action' },
    { text: 'Something else' },
];

const docsCol = { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' };

export const Overview = () => {
    const [value, setValue] = useState('');

    return (
        <div style={{ maxWidth: '800px' }}>
            <InputGroup
                id="input-group-overview"
                placeholder="Placeholder"
                leadingVisual={{ type: 'text', children: 'https://' }}
                trailingVisual="icon"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formInputGroup }
    }
};

export const Content = () => {
    const [value, setValue] = useState('');

    return (
        <div style={docsCol}>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BASELINE INPUT GROUP</span>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--ds-text-subtle)' }}>
                    Text addon on the left with an icon addon on the right.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual={{ type: 'text', children: 'https://' }}
                    trailingVisual="icon"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </section>
        </div>
    );
};

export const Variants = () => {
    const [checkboxValue, setCheckboxValue] = useState('');
    const [radioValue, setRadioValue] = useState('');
    const [buttonValue, setButtonValue] = useState('');
    const [dropdownValue, setDropdownValue] = useState('');

    return (
        <div style={docsCol}>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SELECTION ADDONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InputGroup
                        placeholder="Checkbox addons"
                        leadingVisual="checkbox"
                        trailingVisual="checkbox"
                        value={checkboxValue}
                        onChange={(e) => setCheckboxValue(e.target.value)}
                    />
                    <InputGroup
                        placeholder="Radio addons"
                        leadingVisual={{ type: 'radio', checked: true }}
                        trailingVisual={{ type: 'radio', checked: false }}
                        value={radioValue}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ACTION ADDONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InputGroup
                        placeholder="Button addons"
                        leadingVisual="button"
                        trailingVisual="button"
                        value={buttonValue}
                        onChange={(e) => setButtonValue(e.target.value)}
                    />
                    <InputGroup
                        placeholder="Dropdown addons"
                        leadingVisual={{ type: 'dropdown', text: 'Menu', items: addonDropdownItems }}
                        trailingVisual={{ type: 'dropdown', text: 'More', items: addonDropdownItems }}
                        value={dropdownValue}
                        onChange={(e) => setDropdownValue(e.target.value)}
                    />
                </div>
            </section>
        </div>
    );
};

export const Sizes = () => (
    <div style={docsCol}>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SIZES</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InputGroup
                    placeholder="Small"
                    size="small"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Medium"
                    size="medium"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Large"
                    size="large"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
            </div>
        </section>
    </div>
);

export const InteractionStates = () => (
    <div style={docsCol}>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INTERACTION STATES</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InputGroup
                    placeholder="Default"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Disabled"
                    disabled
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Read-only"
                    readOnly
                    value="Read-only value"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
            </div>
        </section>
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState('');
    const addonPresets = {
        baseline: {
            leadingVisual: { type: 'text', children: 'https://' },
            trailingVisual: 'icon'
        },
        selection: {
            leadingVisual: 'checkbox',
            trailingVisual: { type: 'radio', checked: false }
        },
        action: {
            leadingVisual: 'button',
            trailingVisual: 'button'
        },
        dropdown: {
            leadingVisual: { type: 'dropdown', text: 'Menu', items: addonDropdownItems },
            trailingVisual: { type: 'dropdown', text: 'More', items: addonDropdownItems }
        }
    };
    const visuals = addonPresets[args.addonPreset] || addonPresets.baseline;

    return (
        <div style={{ maxWidth: '600px' }}>
            <InputGroup
                size={args.size}
                disabled={args.disabled}
                readOnly={args.readOnly}
                placeholder={args.placeholder}
                leadingVisual={visuals.leadingVisual}
                trailingVisual={visuals.trailingVisual}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};
Interactive.args = {
    size: 'medium',
    disabled: false,
    readOnly: false,
    placeholder: 'Placeholder',
    addonPreset: 'baseline',
};

/**
 * Overview
 * Comprehensive view of Input Group configurations matching Figma specifications.
 */


/**
 * AddonsInSlots — addons go in the field's Leading and Trailing slots and
 * draw no box of their own. Buttons are the 24 compact button, so the field
 * stays 32 high; a side takes one addon or an array.
 */
export const AddonsInSlots = () => (
    <div style={docsCol}>
        <InputGroup
            id="ig-price"
            label="Hourly rate"
            leadingVisual="$"
            trailingVisual=".00"
        />
        <InputGroup
            id="ig-invite"
            label="Invite by email"
            trailingVisual={[{ type: 'button', text: 'Copy' }, { type: 'button', text: 'Send' }]}
        />
        <InputGroup
            id="ig-agree"
            label="Agreement note"
            leadingVisual={{ type: 'checkbox', checked: true, 'aria-label': 'Include a note' }}
        />
        <InputGroup
            id="ig-primary"
            label="Primary contact"
            leadingVisual={{ type: 'radio', checked: true, 'aria-label': 'Make primary' }}
        />
    </div>
);

AddonsInSlots.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = (name) => canvas.getByRole('textbox', { name }).closest('.plus-field');

    const price = box('Hourly rate');
    await expect(price.querySelector('.plus-field__leading')).toHaveTextContent('$');
    await expect(price.querySelector('.plus-field__trailing')).toHaveTextContent('.00');

    // No addon draws a border: the field is the only box.
    for (const addon of canvasElement.querySelectorAll('.plus-input-group-text')) {
        await expect(getComputedStyle(addon).borderTopStyle).toBe('none');
    }

    // Two buttons in Trailing, small and 24 high, and the field stays 32.
    const invite = box('Invite by email');
    const buttons = within(invite.querySelector('.plus-field__trailing')).getAllByRole('button');
    await expect(buttons.map((button) => button.textContent)).toEqual(['Copy', 'Send']);
    for (const button of buttons) {
        await expect(button.classList.contains('plus-btn--small')).toBe(true);
        await expect(Math.round(button.getBoundingClientRect().height)).toBe(24);
    }
    await expect(Math.round(invite.getBoundingClientRect().height)).toBe(32);

    // A checkbox addon is named and sits in Leading.
    const agree = box('Agreement note');
    const check = within(agree).getByRole('checkbox', { name: 'Include a note' });
    await expect(check).toBeChecked();

    // It is the Checkbox at code's size, 18 square, centered in its addon.
    const checkBox = check.getBoundingClientRect();
    await expect(Math.round(checkBox.width)).toBe(18);
    await expect(Math.round(checkBox.height)).toBe(18);
    const addonBox = check.closest('.plus-input-group-checkbox').getBoundingClientRect();
    const center = (r) => [r.left + r.width / 2, r.top + r.height / 2];
    const [checkX, checkY] = center(checkBox);
    const [addonX, addonY] = center(addonBox);
    await expect(Math.abs(checkX - addonX)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(checkY - addonY)).toBeLessThanOrEqual(0.5);

    // A radio addon is the PLUS Radio, named, 18 square and centered the same way.
    const primary = box('Primary contact');
    const radio = within(primary).getByRole('radio', { name: 'Make primary' });
    await expect(radio).toBeChecked();
    await expect(radio.closest('.plus-form-radio-wrapper')).not.toBeNull();
    const radioBox = radio.getBoundingClientRect();
    await expect(Math.round(radioBox.width)).toBe(18);
    await expect(Math.round(radioBox.height)).toBe(18);
    const radioAddon = radio.closest('.plus-input-group-radio').getBoundingClientRect();
    const [radioX, radioY] = center(radioBox);
    const [radioAddonX, radioAddonY] = center(radioAddon);
    await expect(Math.abs(radioX - radioAddonX)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(radioY - radioAddonY)).toBeLessThanOrEqual(0.5);
};
