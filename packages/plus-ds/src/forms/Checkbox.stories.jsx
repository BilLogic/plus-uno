import React, { useState } from 'react';
import Checkbox from './Checkbox';

export default {
    title: 'Forms/Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Checkbox component allows multiple selections with optional indeterminate state. Supports controlled and uncontrolled modes.'
            }
        }
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the checkbox',
            table: { category: 'Content' }
        },
        checked: {
            control: 'boolean',
            description: 'Controlled checked state',
            table: { category: 'State' }
        },
        indeterminate: {
            control: 'boolean',
            description: 'Indeterminate visual state',
            table: { category: 'State' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the checkbox',
            table: { category: 'Behavior' }
        },
        required: {
            control: 'boolean',
            description: 'Show required indicator',
            table: { category: 'Behavior' }
        }
    }
};

export const Overview = () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(true);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>States</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Checkbox id="cb-unchecked" name="cb-unchecked" label="Unchecked" checked={checked1} onChange={(e) => setChecked1(e.target.checked)} />
                    <Checkbox id="cb-checked" name="cb-checked" label="Checked" checked={checked2} onChange={(e) => setChecked2(e.target.checked)} />
                    <Checkbox id="cb-indeterminate" name="cb-indeterminate" label="Indeterminate" indeterminate />
                    <Checkbox id="cb-disabled" name="cb-disabled" label="Disabled" disabled />
                    <Checkbox id="cb-required" name="cb-required" label="Required" required />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Checkbox id="cb-small" name="cb-small" label="Small" size="small" defaultChecked />
                    <Checkbox id="cb-medium" name="cb-medium" label="Medium (Default)" size="medium" defaultChecked />
                    <Checkbox id="cb-large" name="cb-large" label="Large" size="large" defaultChecked />
                </div>
            </section>
        </div>
    );
};

export const Interactive = (args) => {
    const [checked, setChecked] = useState(args.checked || false);

    return (
        <Checkbox
            id="checkbox-interactive"
            name="checkbox-interactive"
            label={args.label}
            checked={checked}
            indeterminate={args.indeterminate}
            size={args.size}
            disabled={args.disabled}
            required={args.required}
            onChange={(e) => setChecked(e.target.checked)}
        />
    );
};

Interactive.args = {
    label: 'Checkbox Label',
    checked: false,
    indeterminate: false,
    size: 'medium',
    disabled: false,
    required: false
};
