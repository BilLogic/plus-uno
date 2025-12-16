import React from 'react';
import Alert from './Alert';

export default {
    title: 'Components/Alert',
    component: Alert,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Universal element component for displaying alert messages, notifications, or feedback. Supports multiple styles and content variants. Uses React Bootstrap Alert with custom design system styling.',
            },
        },
    },
    argTypes: {
        style: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
            description: 'Alert style variant',
            table: { category: 'Design' },
        },
        title: {
            control: 'text',
            description: 'Alert title',
            table: { category: 'Content' },
        },
        text: {
            control: 'text',
            description: 'Alert body text',
            table: { category: 'Content' },
        },
        dismissable: {
            control: 'boolean',
            description: 'Whether the alert can be dismissed',
            table: { category: 'Behavior' },
        },
        // Development Properties
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' },
        },
        className: {
            control: 'text',
            description: 'Custom CSS classes',
            table: { category: 'Development' },
        },
        variant: {
            control: 'text',
            description: 'React Bootstrap variant override',
            table: { category: 'Development' },
        },
        onDismiss: {
            action: 'dismissed',
            description: 'Dismiss callback',
            table: { category: 'Development' },
        },
    },
};

/**
 * Overview
 * Shows all alert variants: styles and content configurations for comprehensive reference.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 48px)' }}>
        {/* All Styles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md, 24px)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-sm, 12px)' }}>All Styles (With Title, Dismissible)</h6>
            {['primary', 'secondary', 'success', 'danger', 'warning'].map(style => (
                <Alert
                    key={style}
                    style={style}
                    title="Title"
                    text="You have a message here — come check it out!"
                    dismissable={true}
                />
            ))}
        </div>

        {/* Content Variants */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md, 24px)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-sm, 12px)' }}>Content Variants (Primary Style)</h6>

            {/* With Title */}
            <Alert
                style="primary"
                title="Title"
                text="Alert with title and message text."
                dismissable={true}
            />

            {/* Without Title */}
            <Alert
                style="primary"
                text="Alert without title — message only."
                dismissable={true}
            />

            {/* Non-dismissible */}
            <Alert
                style="primary"
                title="Non-dismissible Alert"
                text="This alert cannot be dismissed."
                dismissable={false}
            />
        </div>
    </div>
);

/**
 * Interactive Alert
 * Interactive playground for testing alert variations.
 */
export const Interactive = (args) => <Alert {...args} />;
Interactive.args = {
    title: 'Interactive Alert',
    text: 'This is an interactive alert. Check the console and actions panel when dismissing.', // This was just an auto-correction attempt if needed, but I'll skip and do next steps.
    style: 'info',
    dismissable: true,
};
