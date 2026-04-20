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
                component: `
Universal element component for displaying alert messages, notifications, or feedback. 
Supports multiple styles and optional title.

**Uses React children pattern for content** (matching React Bootstrap convention):
\`\`\`jsx
<Alert style="warning">Warning message here</Alert>
<Alert style="info" title="Info">This is an info alert.</Alert>
\`\`\`
                `,
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
            description: 'Optional alert title/heading',
            table: { category: 'Content' },
        },
        dismissable: {
            control: 'boolean',
            description: 'Whether the alert can be dismissed',
            table: { category: 'Behavior' },
        },
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
        onDismiss: {
            action: 'dismissed',
            description: 'Dismiss callback',
            table: { category: 'Development' },
        },
    },
};

/**
 * Overview
 * Shows all alert variants: styles and content configurations.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* All Styles with Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h6 className="h6">All Styles (With Title, Dismissible)</h6>
            {['primary', 'secondary', 'success', 'danger', 'warning', 'info'].map(style => (
                <Alert key={style} style={style} title="Title" dismissable>
                    You have a message here — come check it out!
                </Alert>
            ))}
        </div>

        {/* Content Variants */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h6 className="h6">Content Variants (Primary Style)</h6>

            {/* With Title */}
            <Alert style="primary" title="With Title" dismissable>
                Alert with title and message text.
            </Alert>

            {/* Without Title */}
            <Alert style="primary" dismissable>
                Alert without title — message only. Dismiss button adapts to body text size.
            </Alert>

            {/* Non-dismissible */}
            <Alert style="primary" title="Non-dismissible Alert" dismissable={false}>
                This alert cannot be dismissed.
            </Alert>

            {/* Rich Content */}
            <Alert style="info" title="Rich Content">
                <strong>Note:</strong> You can include <em>rich HTML content</em> and even{' '}
                <a href="#">links</a> inside alerts.
            </Alert>
        </div>
    </div>
);

/**
 * Interactive Alert
 * Interactive playground for testing alert variations.
 */
export const Interactive = (args) => (
    <Alert {...args}>
        This is an interactive alert. Use the controls below to customize it.
    </Alert>
);
Interactive.args = {
    title: 'Interactive Alert',
    style: 'info',
    dismissable: true,
};

