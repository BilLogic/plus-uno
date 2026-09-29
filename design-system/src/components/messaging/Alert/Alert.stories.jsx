import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Alert from './Alert';

export default {
    title: 'Components/Messaging/Alert',
    component: Alert,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        changelog: [
            { date: '2026-09-29', kind: 'changed', summary: 'The × is the shared CloseButton: it stays 24×24 with a 16px icon and centers on the first line of text instead of growing with the title or body.' },
        ],
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
                    Alert without title — message only. The dismiss button centers on the first body line.
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
    <Alert style="primary" title="With Title" dismissable>
        Alert with title and message text.
    </Alert>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.alert }
    }
};

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


/**
 * Where the × sits. It is centered on the FIRST line of text — the title line
 * when there is a title, otherwise the first body line — and it stays there
 * when the text wraps. It is the shared `CloseButton`, so it is 24×24 with a
 * 16px icon whatever the text size beside it.
 */
export const DismissPlacement = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        <Alert style="primary" title="With a title" data-testid="placement-title">
            The × centers on the title line, not on the alert.
        </Alert>
        <Alert style="warning" data-testid="placement-body">
            Without a title the × centers on the first body line, even when the message runs on
            long enough to wrap onto a second and a third line inside a narrow alert.
        </Alert>
        <Alert style="info" title="A title long enough to wrap onto a second line" data-testid="placement-wrap">
            Short body.
        </Alert>
    </div>
);

/** The first line box of `element`: its content-box top plus one line height. */
function firstLine(element) {
    const style = getComputedStyle(element);
    const top = element.getBoundingClientRect().top + parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth);
    const height = parseFloat(style.lineHeight);
    return { top, bottom: top + height, center: top + height / 2 };
}

DismissPlacement.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cases = [
        ['placement-title', '.plus-alert-title'],
        ['placement-body', '.plus-alert-text'],
        ['placement-wrap', '.plus-alert-title'],
    ];
    for (const [id, lineOwner] of cases) {
        const alert = canvas.getByTestId(id);
        const button = within(alert).getByRole('button', { name: 'Close alert' });
        const rect = button.getBoundingClientRect();
        await expect(Math.round(rect.width), `${id}: width`).toBe(24);
        await expect(Math.round(rect.height), `${id}: height`).toBe(24);
        await expect(getComputedStyle(button.querySelector('i')).fontSize, `${id}: icon`).toBe('16px');

        const line = firstLine(alert.querySelector(lineOwner));
        const center = rect.top + rect.height / 2;
        await expect(center, `${id}: × center is inside the first line box`).toBeGreaterThanOrEqual(line.top);
        await expect(center, `${id}: × center is inside the first line box`).toBeLessThanOrEqual(line.bottom);
        await expect(Math.abs(center - line.center), `${id}: × is centered on the first line`).toBeLessThanOrEqual(1);
    }

    // Dismissal is unchanged: the button removes its alert.
    const body = canvas.getByTestId('placement-body');
    await userEvent.click(within(body).getByRole('button', { name: 'Close alert' }));
    await expect(canvas.queryByTestId('placement-body')).toBeNull();
};
