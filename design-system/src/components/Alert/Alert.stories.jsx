import React from 'react';
import Alert from './Alert';

export default {
    title: 'Components/Alert',
    component: Alert,
    tags: ['!dev'],
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        onDismiss: {
            table: { disable: true, category: 'Development' },
        },
    },
};

const alertCol = { display: 'flex', flexDirection: 'column', gap: '48px' };
const contentVariantCol = { display: 'flex', flexDirection: 'column', gap: '24px' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function AlertVariantsDemos() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ALL STYLES (WITH TITLE, DISMISSIBLE)</span>
            {['primary', 'secondary', 'success', 'danger', 'warning', 'info'].map(style => (
                <Alert key={style} style={style} title="Title" dismissable>
                    You have a message here — come check it out!
                </Alert>
            ))}
        </div>
    );
}

function AlertContentDemos() {
    return (
        <div style={contentVariantCol}>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">CONTENT VARIANTS (PRIMARY STYLE)</span>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH TITLE</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Use when the message benefits from a short heading.
                </p>
                <Alert style="primary" title="With Title" dismissable>
                    Alert with title and message text.
                </Alert>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BODY ONLY</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Use when concise copy does not require a heading.
                </p>
                <Alert style="primary" dismissable>
                    Alert without title — message only. Dismiss button adapts to body text size.
                </Alert>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">NON-DISMISSIBLE</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Use for critical information that must remain visible.
                </p>
                <Alert style="primary" title="Non-dismissible Alert" dismissable={false}>
                    This alert cannot be dismissed.
                </Alert>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">RICH CONTENT</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Supports inline emphasis and links inside the alert body.
                </p>
                <Alert style="info" title="Rich Content">
                    <strong>Note:</strong> You can include <em>rich HTML content</em> and even{' '}
                    <a href="#">links</a> inside alerts.
                </Alert>
            </section>
        </div>
    );
}

export const Styles = () => (
    <div style={alertCol}>
        <AlertVariantsDemos />
    </div>
);

export const Content = () => (
    <div style={alertCol}>
        <AlertContentDemos />
    </div>
);

export const Overview = () => (
    <div style={alertCol}>
        <AlertVariantsDemos />
        <AlertContentDemos />
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

