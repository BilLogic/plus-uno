import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Switch from './Switch';

export default {
    title: 'Forms/Checkbox, Radio, and Switch',
    component: Checkbox,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Checkbox, Radio, and Switch components for form inputs. Checkbox allows multiple selections with optional indeterminate state. Radio allows single selection from a group of mutually exclusive options. Switch toggles between two states.'
            }
        }
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the checkbox or radio',
            table: { category: 'Content' }
        },
        checked: {
            control: 'boolean',
            description: 'Checked state',
            table: { category: 'State' }
        },
        indeterminate: {
            control: 'boolean',
            description: 'Indeterminate state (checkbox only)',
            table: { category: 'State' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the component',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the component',
            table: { category: 'Behavior' }
        },
        required: {
            control: 'boolean',
            description: 'Required field indicator',
            table: { category: 'Behavior' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Checkbox and Radio configurations.
 */
export const Overview = () => {
    const [checkbox1, setCheckbox1] = useState(false);
    const [checkbox2, setCheckbox2] = useState(true);
    const [checkbox3, setCheckbox3] = useState(false);
    const [checkbox4, setCheckbox4] = useState(false);
    const [checkbox5, setCheckbox5] = useState(false);
    const [radioValue, setRadioValue] = useState('option1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Checkbox Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checkbox component allows multiple selections with optional indeterminate state.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Checkbox
                        id="checkbox-default"
                        name="checkbox-default"
                        label="Default Checkbox"
                        checked={checkbox1}
                        onChange={(e) => setCheckbox1(e.target.checked)}
                    />
                    <Checkbox
                        id="checkbox-checked"
                        name="checkbox-checked"
                        label="Checked Checkbox"
                        checked={checkbox2}
                        onChange={(e) => setCheckbox2(e.target.checked)}
                    />
                    <Checkbox
                        id="checkbox-indeterminate"
                        name="checkbox-indeterminate"
                        label="Indeterminate Checkbox"
                        indeterminate={checkbox3}
                        onChange={() => setCheckbox3(!checkbox3)}
                    />
                    <Checkbox
                        id="checkbox-disabled"
                        name="checkbox-disabled"
                        label="Disabled Checkbox"
                        disabled
                    />
                    <Checkbox
                        id="checkbox-required"
                        name="checkbox-required"
                        label="Required Checkbox"
                        required
                        checked={checkbox4}
                        onChange={(e) => setCheckbox4(e.target.checked)}
                    />
                </div>
            </section>

            {/* Checkbox Sizes */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox - Sizes</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checkbox component in different sizes: small, medium (default), and large.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Checkbox
                        id="checkbox-small"
                        name="checkbox-small"
                        label="Small Checkbox"
                        size="small"
                        checked={checkbox5}
                        onChange={(e) => setCheckbox5(e.target.checked)}
                    />
                    <Checkbox
                        id="checkbox-medium"
                        name="checkbox-medium"
                        label="Medium Checkbox (Default)"
                        size="medium"
                        checked={checkbox5}
                        onChange={(e) => setCheckbox5(e.target.checked)}
                    />
                    <Checkbox
                        id="checkbox-large"
                        name="checkbox-large"
                        label="Large Checkbox"
                        size="large"
                        checked={checkbox5}
                        onChange={(e) => setCheckbox5(e.target.checked)}
                    />
                </div>
            </section>

            {/* Radio Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio component for single selection from mutually exclusive options.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Radio
                        id="radio-option1"
                        name="radio-group"
                        label="Option 1"
                        value="option1"
                        checked={radioValue === 'option1'}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                        id="radio-option2"
                        name="radio-group"
                        label="Option 2"
                        value="option2"
                        checked={radioValue === 'option2'}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                        id="radio-option3"
                        name="radio-group"
                        label="Option 3"
                        value="option3"
                        checked={radioValue === 'option3'}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                        id="radio-disabled"
                        name="radio-group-disabled"
                        label="Disabled Radio"
                        value="disabled"
                        disabled
                    />
                </div>
            </section>

            {/* Radio Sizes */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio - Sizes</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio component in different sizes: small, medium (default), and large.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Radio
                        id="radio-small"
                        name="radio-size-small"
                        label="Small Radio"
                        value="small"
                        size="small"
                        checked={radioValue === 'small'}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                        id="radio-medium"
                        name="radio-size-medium"
                        label="Medium Radio (Default)"
                        value="medium"
                        size="medium"
                        checked={radioValue === 'medium'}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                        id="radio-large"
                        name="radio-size-large"
                        label="Large Radio"
                        value="large"
                        size="large"
                        checked={radioValue === 'large'}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                </div>
            </section>

            {/* Switch Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Switch</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Switch component for toggling between two states.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Switch
                        id="switch-unchecked"
                        name="switch-unchecked"
                        label="Unchecked Switch"
                        defaultChecked={false}
                    />
                    <Switch
                        id="switch-checked"
                        name="switch-checked"
                        label="Checked Switch"
                        defaultChecked={true}
                    />
                    <Switch
                        id="switch-disabled"
                        name="switch-disabled"
                        label="Disabled Switch"
                        disabled
                    />
                    <Switch
                        id="switch-disabled-checked"
                        name="switch-disabled-checked"
                        label="Disabled & Checked Switch"
                        disabled
                        defaultChecked={true}
                    />
                </div>
            </section>

            {/* Switch Sizes */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Switch - Sizes</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Switch component in different sizes: small, medium (default), and large.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Switch
                        id="switch-small"
                        name="switch-small"
                        label="Small Switch"
                        size="small"
                        defaultChecked={true}
                    />
                    <Switch
                        id="switch-medium"
                        name="switch-medium"
                        label="Medium Switch (Default)"
                        size="medium"
                        defaultChecked={true}
                    />
                    <Switch
                        id="switch-large"
                        name="switch-large"
                        label="Large Switch"
                        size="large"
                        defaultChecked={true}
                    />
                </div>
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Checkbox attributes in real-time.
 */
export const InteractiveCheckbox = (args) => {
    const [checked, setChecked] = useState(args.checked || false);
    const [indeterminate, setIndeterminate] = useState(args.indeterminate || false);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Checkbox
                id="checkbox-interactive"
                name="checkbox-interactive"
                label={args.label || 'Interactive Checkbox'}
                checked={checked}
                indeterminate={indeterminate}
                size={args.size}
                disabled={args.disabled}
                required={args.required}
                onChange={(e) => {
                    setChecked(e.target.checked);
                    setIndeterminate(false);
                }}
            />
        </div>
    );
};

InteractiveCheckbox.args = {
    label: 'Interactive Checkbox',
    checked: false,
    indeterminate: false,
    size: 'medium',
    disabled: false,
    required: false
};

/**
 * Interactive Playground
 * Customize the Radio attributes in real-time.
 */
export const InteractiveRadio = (args) => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Radio
                    id="radio-interactive-1"
                    name="radio-interactive"
                    label={args.label || 'Option 1'}
                    value="option1"
                    checked={value === 'option1'}
                    size={args.size}
                    disabled={args.disabled}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-interactive-2"
                    name="radio-interactive"
                    label="Option 2"
                    value="option2"
                    checked={value === 'option2'}
                    size={args.size}
                    disabled={args.disabled}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    );
};

InteractiveRadio.args = {
    label: 'Option 1',
    size: 'medium',
    disabled: false
};

/**
 * Interactive Playground
 * Customize the Switch attributes in real-time.
 */
export const InteractiveSwitch = (args) => {
    const [checked, setChecked] = useState(args.checked || false);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Switch
                id="switch-interactive"
                name="switch-interactive"
                label={args.label || 'Interactive Switch'}
                checked={checked}
                size={args.size}
                disabled={args.disabled}
                onChange={(e) => setChecked(e.target.checked)}
            />
        </div>
    );
};

InteractiveSwitch.args = {
    label: 'Interactive Switch',
    checked: false,
    size: 'medium',
    disabled: false
};

