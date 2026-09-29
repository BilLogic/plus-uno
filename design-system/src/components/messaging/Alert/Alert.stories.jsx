import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Alert, { ALERT_ICONS, ALERT_STYLES } from './Alert';

export default {
    title: 'Components/Messaging/Alert',
    component: Alert,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        changelog: [
            { date: '2026-09-29', kind: 'added', summary: 'A leading icon on the first line of text, with a default per style: success circle-check, danger circle-exclamation, warning triangle-exclamation, and circle-info for primary, secondary and info. `leadingVisual` takes a Font Awesome solid name or a node to replace it, or `false` to remove it.' },
            { date: '2026-09-29', kind: 'changed', summary: 'The × is the shared CloseButton: it stays 24×24 with a 16px icon and centers on the first line of text instead of growing with the title or body.' },
        ],
        docs: {
            description: {
                component: `
Universal element component for displaying alert messages, notifications, or feedback.
Six styles, an optional title, and a leading icon that each style picks by default.

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
        leadingVisual: {
            control: 'select',
            options: [true, false, 'bell', 'circle-question'],
            description: "The leading icon: `true` for the style's default, a Font Awesome solid name or a node to replace it, `false` to remove it",
            table: { category: 'Content', defaultValue: { summary: 'true' } },
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
    leadingVisual: true,
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


/**
 * The leading icon. Every style has a default icon on the first line of text,
 * like the ×: success circle-check, danger circle-exclamation, warning
 * triangle-exclamation, and circle-info for primary, secondary and info. A
 * passed `leadingVisual` replaces it and `false` removes it. The icon is
 * decorative: the alert's role and its text already say what it is.
 */
export const LeadingIcon = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        {ALERT_STYLES.map((style) => (
            <Alert key={style} style={style} title="Title" data-testid={`icon-${style}`}>
                You have an alert message here — come check it out!
            </Alert>
        ))}
        <Alert style="warning" data-testid="icon-body">
            Without a title the icon centers on the first body line, even when the message runs on
            long enough to wrap onto a second and a third line inside a narrow alert.
        </Alert>
        <Alert style="success" title="A title long enough to wrap onto a second line" data-testid="icon-wrap">
            Short body.
        </Alert>
        <Alert style="info" title="Replaced by name" leadingVisual="bell" data-testid="icon-named">
            A Font Awesome solid name replaces the default icon.
        </Alert>
        <Alert style="info" leadingVisual={<i className="fa-solid fa-star" />} data-testid="icon-node">
            A node replaces it too.
        </Alert>
        <Alert style="warning" leadingVisual={false} data-testid="icon-none">
            Sign-in didn&apos;t complete. Please try again.
        </Alert>
    </div>
);

/** The glyph a Font Awesome solid class draws, read through a probe icon. */
const glyphOf = (host, iconClass) => {
    const probe = document.createElement('i');
    probe.className = `fa-solid ${iconClass}`;
    host.appendChild(probe);
    const glyph = getComputedStyle(probe, '::before').content;
    probe.remove();
    return glyph;
};

/** The leading icon of an alert: its one icon that is not inside the × button. */
const leadingIconOf = (alert) => [...alert.querySelectorAll('i')].find((i) => !i.closest('button')) ?? null;

LeadingIcon.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expectOnFirstLine = async (id, icon, lineOwner) => {
        const rect = icon.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const line = firstLine(lineOwner);
        await expect(Math.abs(center - line.center), `${id}: icon is centered on the first line`).toBeLessThanOrEqual(1);
    };

    for (const style of ALERT_STYLES) {
        const id = `icon-${style}`;
        const alert = canvas.getByTestId(id);
        const icon = leadingIconOf(alert);
        await expect(icon, `${id} has a leading icon`).not.toBeNull();
        await expect(getComputedStyle(icon, '::before').content, `${id} icon is ${ALERT_ICONS[style]}`)
            .toBe(glyphOf(canvasElement, `fa-${ALERT_ICONS[style]}`));
        await expect(getComputedStyle(icon).color, `${id} icon color`).toBe(tokenColor(canvasElement, `--color-${style}-icon`));
        await expect(px(getComputedStyle(icon).fontSize), `${id} icon size`).toBe(20);
        const box = icon.getBoundingClientRect();
        await expect(Math.round(box.width), `${id} icon box is 20 wide, the column's width`).toBe(20);
        await expect(Math.round(box.width), `${id} icon fills its column exactly`)
            .toBe(Math.round(icon.parentElement.getBoundingClientRect().width));
        await expect(icon.closest('[aria-hidden="true"]'), `${id} icon is decorative`).not.toBeNull();

        // The icon comes before the message, the × after it.
        const title = within(alert).getByText('Title');
        await expect(icon.getBoundingClientRect().right, `${id}: icon leads the text`).toBeLessThanOrEqual(title.getBoundingClientRect().left);
        await expectOnFirstLine(id, icon, title);
    }

    // The defaults differ in shape, not only in color.
    await expect(glyphOf(canvasElement, 'fa-circle-check')).not.toBe(glyphOf(canvasElement, 'fa-circle-info'));

    // Without a title it sits on the first body line; with a wrapping title, on the first title line.
    const body = canvas.getByTestId('icon-body');
    await expectOnFirstLine('icon-body', leadingIconOf(body), within(body).getByText(/Without a title/));
    const wrap = canvas.getByTestId('icon-wrap');
    await expectOnFirstLine('icon-wrap', leadingIconOf(wrap), within(wrap).getByText(/A title long enough/));

    // A passed icon replaces the default, by name or as a node, and stays decorative.
    const named = leadingIconOf(canvas.getByTestId('icon-named'));
    await expect(getComputedStyle(named, '::before').content).toBe(glyphOf(canvasElement, 'fa-bell'));
    await expect(named.closest('[aria-hidden="true"]')).not.toBeNull();
    const node = leadingIconOf(canvas.getByTestId('icon-node'));
    await expect(getComputedStyle(node, '::before').content).toBe(glyphOf(canvasElement, 'fa-star'));
    await expect(node.closest('[aria-hidden="true"]')).not.toBeNull();
    await expect(px(getComputedStyle(node).fontSize), 'a passed node is drawn at 20px').toBe(20);
    await expect(Math.round(node.getBoundingClientRect().width), 'a passed node is a 20-wide box').toBe(20);
    await expect(canvas.getByTestId('icon-node').querySelectorAll('i:not(button i)').length, 'the node is the only leading icon').toBe(1);

    // `false` removes it: the text starts at the alert's padding edge.
    const none = canvas.getByTestId('icon-none');
    await expect(leadingIconOf(none)).toBeNull();
    const text = within(none).getByText(/Sign-in didn/);
    const s = getComputedStyle(none);
    const contentLeft = none.getBoundingClientRect().left + px(s.borderLeftWidth) + px(s.paddingLeft);
    await expect(Math.round(text.getBoundingClientRect().left), 'text starts at the padding edge').toBe(Math.round(contentLeft));

    // The × is unchanged beside the icon: it still dismisses its alert.
    await userEvent.click(within(none).getByRole('button', { name: 'Close alert' }));
    await expect(canvas.queryByTestId('icon-none')).toBeNull();
};
