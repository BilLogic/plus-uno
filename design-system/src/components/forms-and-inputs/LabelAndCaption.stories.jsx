import React from 'react';
import { expect, within } from 'storybook/test';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import TextField from './TextField';
import { Label, Caption } from '@/storybook-docs/form-demos.jsx';

export default {
    title: 'Components/Forms and inputs/Form',
    component: Label,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'The label above a field, with its optional required marker, and the caption below it, in the tone its state names. Every field in Forms and inputs draws both for you.',
            },
        },
    },
    argTypes: {
        text: { control: 'text', table: { category: 'Content' } },
        required: { control: 'boolean', table: { category: 'Behavior' } },
        htmlFor: { table: { disable: true } },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', maxWidth: 'var(--size-3000)' };
const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--size-section-gap-md)', alignItems: 'flex-start' };
const cell = { minWidth: 'var(--size-1000)' };

export const Overview = () => (
    <div style={stack}>
        <Label text="Field label" required />
        <Caption text="Helper or validation copy beneath the label." state="default" />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formLabelCaption }
    }
};
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Field label').closest('label')).toBeInTheDocument();
    await expect(canvas.getByText('Helper or validation copy beneath the label.')).toBeInTheDocument();
};

export const LabelPlain = () => <Label text="Email address" required={false} />;
LabelPlain.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('label')).not.toHaveTextContent('*');
};

export const LabelRequired = () => <Label text="Email address" required />;
LabelRequired.play = async ({ canvasElement }) => {
    const label = canvasElement.querySelector('label');
    await expect(label).toHaveTextContent('Email address*');
    await expect(getComputedStyle(label.querySelector('.plus-field-required')).color).toBe(tokenColor(canvasElement, '--ds-text-danger'));
};

export const CaptionVariants = () => (
    <div style={row}>
        <section style={cell}>
            <h6 className="h6 mb-3">Default</h6>
            <Caption text="caption" state="default" />
        </section>
        <section style={cell}>
            <h6 className="h6 mb-3">Success</h6>
            <Caption text="caption" state="success" />
        </section>
        <section style={cell}>
            <h6 className="h6 mb-3">Danger</h6>
            <Caption text="caption" state="danger" />
        </section>
        <section style={cell}>
            <h6 className="h6 mb-3">Warning</h6>
            <Caption text="caption" state="warning" />
        </section>
    </div>
);
/** Each caption state takes its own text color: help is subtle, the others carry their status. */
CaptionVariants.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const colors = {
        Default: '--ds-text-subtle',
        Success: '--ds-text-success',
        Danger: '--ds-text-danger',
        Warning: '--ds-text-warning',
    };
    for (const [heading, token] of Object.entries(colors)) {
        const section = canvas.getByRole('heading', { name: heading }).closest('section');
        await expect(getComputedStyle(section.querySelector('.plus-field-caption__message')).color, `${heading} caption`).toBe(tokenColor(canvasElement, token));
    }
};

/** One story per caption tone, for the Examples tab. */
export const CaptionHelp = () => <Caption text="Include the area code." state="default" />;
export const CaptionSuccess = () => <Caption text="Number verified." state="success" />;
export const CaptionDanger = () => <Caption text="Enter a 10-digit number." state="danger" />;
export const CaptionWarning = () => <Caption text="This number looks like a landline." state="warning" />;

/** Label, control and caption stacked as the fields draw them, one per caption state. */
export const Layout = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-4">Default</h6>
            <div style={stack}>
                <TextField id="layout-email" type="email" label="Email address" isRequired placeholder="Enter your email" caption="We'll never share your email with anyone else." />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Success</h6>
            <div style={stack}>
                <TextField id="layout-username" label="Username" isRequired defaultValue="john_doe" successMessage="Username is available." />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Error</h6>
            <div style={stack}>
                <TextField id="layout-password" type="password" label="Password" isRequired defaultValue="123" isInvalid errorMessage="Password must be at least 8 characters long." />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Warning</h6>
            <div style={stack}>
                <TextField id="layout-phone" type="tel" label="Phone number" defaultValue="555-0123" warningMessage="Include a country code for international numbers." />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Disabled</h6>
            <div style={stack}>
                <TextField id="layout-account-type" label="Account type" isRequired defaultValue="Premium" isDisabled />
            </div>
        </section>
    </div>
);
Layout.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/Email address/)).toHaveAttribute('id', 'layout-email');
    await expect(canvas.getByLabelText(/Password/)).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByLabelText(/Account type/)).toBeDisabled();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters long.');
};

export const Interactive = {
    args: { text: 'Email address', required: true },
    render: (args) => (
        <div style={stack}>
            <Label {...args} />
            <Caption text="We'll never share your email." state="default" />
        </div>
    ),
};
