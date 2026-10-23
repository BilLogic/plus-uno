import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Checkbox from './Checkbox';

export default {
    title: 'Components/Forms and inputs/Checkbox',
    component: Checkbox,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'A labeled checkbox is a 24 row at every size, its label 14/20.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="large"` was deprecated: it draws like `medium` and warns in development.' },
        ],
        docs: {
            description: {
                component:
                    'Checkbox component allows multiple selections with optional indeterminate state. Supports controlled and uncontrolled modes.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Label text for the checkbox',
            table: { category: 'Content' },
        },
        checked: {
            table: { disable: true, category: 'Development' },
        },
        indeterminate: {
            control: 'boolean',
            description: 'Indeterminate visual state',
            table: { category: 'State' },
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the checkbox',
            table: { category: 'Behavior' },
        },
        required: {
            control: 'boolean',
            description: 'Show required indicator',
            table: { category: 'Behavior' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        name: {
            table: { disable: true, category: 'Development' },
        },
        value: {
            table: { disable: true, category: 'Development' },
        },
        defaultChecked: {
            table: { disable: true, category: 'Development' },
        },
        onChange: {
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

const pageWrap = { maxWidth: '600px' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function CheckboxContentDemos() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>Long label</h6>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Longer descriptive copy used in forms and filters.
                </p>
                <div style={contentVariantCard}>
                    <Checkbox id="cb-content-long" name="cb-content-long" label="Longer label text used in forms and filters" />
                </div>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>Required indicator</h6>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Adds a required marker next to the label.
                </p>
                <div style={contentVariantCard}>
                    <Checkbox id="cb-content-required" name="cb-content-required" label="Required field" required />
                </div>
            </section>
        </div>
    );
}

function CheckboxSizesDemos() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SMALL</span>
                <Checkbox id="cb-small" name="cb-small" label="Option" size="small" defaultChecked />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
                <Checkbox id="cb-medium" name="cb-medium" label="Option" size="medium" defaultChecked />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LARGE</span>
                <Checkbox id="cb-large" name="cb-large" label="Option" size="large" defaultChecked />
            </div>
        </div>
    );
}

function CheckboxInteractionStatesDemos() {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(true);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">UNCHECKED</span>
                <Checkbox
                    id="cb-unchecked"
                    name="cb-unchecked"
                    label="Label"
                    checked={checked1}
                    onChange={(e) => setChecked1(e.target.checked)}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CHECKED</span>
                <Checkbox
                    id="cb-checked"
                    name="cb-checked"
                    label="Label"
                    checked={checked2}
                    onChange={(e) => setChecked2(e.target.checked)}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INDETERMINATE</span>
                <Checkbox id="cb-indeterminate" name="cb-indeterminate" label="Label" indeterminate />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <Checkbox id="cb-disabled" name="cb-disabled" label="Label" disabled />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">REQUIRED</span>
                <Checkbox id="cb-required" name="cb-required" label="Label" required />
            </div>
        </div>
    );
}

export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <Checkbox id="cb-overview" name="cb-overview" label="Option" defaultChecked />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formCheckbox }
    }
};

export const Content = () => (
    <div style={pageWrap}>
        <CheckboxContentDemos />
    </div>
);

export const Sizes = () => (
    <div style={pageWrap}>
        <CheckboxSizesDemos />
    </div>
);

export const InteractionStates = () => (
    <div style={pageWrap}>
        <CheckboxInteractionStatesDemos />
    </div>
);

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
    indeterminate: false,
    size: 'medium',
    disabled: false,
    required: false,
};

/**
 * Read-only: the answer is shown at full contrast and stays in the tab order,
 * and clicking or pressing Space does not change it.
 */
export const ReadOnly = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
        <Checkbox id="checkbox-readonly-on" label="Background check complete" defaultChecked readOnly />
        <Checkbox id="checkbox-readonly-off" label="Training complete" readOnly />
    </div>
);
ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const on = canvas.getByRole('checkbox', { name: 'Background check complete' });
    await expect(on.getAttribute('aria-readonly')).toBe('true');
    await expect(on.disabled).toBe(false);
    await userEvent.click(on);
    await expect(on.checked).toBe(true);

    const off = canvas.getByRole('checkbox', { name: 'Training complete' });
    off.focus();
    await userEvent.keyboard(' ');
    await expect(off.checked).toBe(false);
};

/** A description under the label, and the card appearance. */
export const DescriptionAndCard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)', maxWidth: '360px' }}>
        <Checkbox id="checkbox-desc" label="Email reminders" description="Sent the evening before." />
        <Checkbox id="checkbox-card" label="Text reminders" description="Sent an hour before." appearance="card" defaultChecked />
    </div>
);
DescriptionAndCard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox', { name: 'Email reminders' });
    const desc = canvasElement.ownerDocument.getElementById(box.getAttribute('aria-describedby'));
    await expect(desc.textContent).toBe('Sent the evening before.');
};
