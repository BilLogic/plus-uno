import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Toast, { ToastContainer } from './Toast';
import Button from '@/components/actions/Button/Button';

export default {
    title: 'Components/Messaging/Toast',
    component: Toast,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-09-29', kind: 'changed', summary: 'The × is the shared CloseButton in its inverse tone on every header color: a fixed 24×24 box with a 16px × and a visible focus ring.' },
        ],
        docs: {
            description: {
                component: 'Toast component for displaying notifications. Based on react-bootstrap Toast.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
            description: 'Color style variant',
            table: { category: 'Design' }
        },
        position: {
            control: 'select',
            options: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
            description: 'Toast position (for container)',
            table: { category: 'Layout' }
        },
        title: {
            control: 'text',
            table: { category: 'Content' }
        },
        show: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        autohide: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        delay: {
            control: 'number',
            table: { category: 'Behavior' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onClose: {
            table: { disable: true, category: 'Development' }
        }
    }
};

function ToastVariantsDemos() {
    return (
        <ToastContainer className="p-3" style={{ position: 'static' }}>
            <Toast title="Primary Toast" style="primary" timestamp="Just now">
                This is a primary toast.
            </Toast>
            <Toast title="Secondary Toast" style="secondary" timestamp="Just now">
                This is a secondary toast (default).
            </Toast>
            <Toast title="Success Toast" style="success" timestamp="2 mins ago">
                Action completed successfully!
            </Toast>
            <Toast title="Danger Toast" style="danger" timestamp="10 mins ago">
                Something went wrong.
            </Toast>
            <Toast title="Warning Toast" style="warning">
                Please be careful.
            </Toast>
            <Toast title="Info Toast" style="info">
                Here is some information.
            </Toast>
        </ToastContainer>
    );
}

/*
 * `color-contrast` skips ONLY the warning header's title and timestamp: the
 * surface color on the Warning fill is 3.52:1, below AA's 4.5:1, and that is
 * an accepted exception (see WarningHeader). The rule still runs on every
 * other element, including the other headers; every other rule stays on.
 */
const WARNING_HEADER_CONTRAST_EXCEPTION = {
    a11y: {
        config: {
            rules: [{
                id: 'color-contrast',
                selector: '*:not(.plus-toast.warning .plus-toast-title):not(.plus-toast.warning .plus-toast-timestamp)',
            }],
        },
    },
};

export const Styles = () => (
    <div className="d-flex flex-column gap-3">
        <ToastVariantsDemos />
    </div>
);
Styles.parameters = WARNING_HEADER_CONTRAST_EXCEPTION;

export const Overview = () => (
    <ToastContainer className="p-3" style={{ position: 'static' }}>
        <Toast title="Secondary Toast" style="secondary" timestamp="Just now">
            This is a secondary toast (default).
        </Toast>
    </ToastContainer>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.toast }
    }
};

const ToastInteractiveWrapper = ({ style, position, title, children, show, autohide, delay }) => {
    const [isOpen, setIsOpen] = useState(show);

    React.useEffect(() => {
        setIsOpen(show);
    }, [show]);

    return (
        <div className="plus-toast-interactive-demo">
            <ToastContainer position={position} className="p-3">
                <Toast
                    show={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={title}
                    style={style}
                    timestamp="Just now"
                    delay={delay}
                    autohide={autohide}
                >
                    {children}
                </Toast>
            </ToastContainer>
            <div className="plus-toast-interactive-demo__trigger">
                <Button text="Trigger Toast" onClick={() => setIsOpen(true)} />
            </div>
        </div>
    );
};

export const Interactive = (args) => <ToastInteractiveWrapper {...args} />;
Interactive.args = {
    show: false,
    style: 'success',
    position: 'top-end',
    title: 'Toast Title',
    children: 'This is an interactive toast message.',
    autohide: false,
    delay: 3000
};
Interactive.parameters = {
    controls: { exclude: ['position'] },
    docs: {
        description: {
            story:
                'Preview keeps the toast centered. In product code, `position` on `ToastContainer` still controls fixed corner placement.',
        },
    },
};

const TOAST_STYLES = ['primary', 'secondary', 'danger', 'success', 'info', 'warning'];

/**
 * The × on every header color. It is the shared `CloseButton` in its inverse
 * tone, so its size and focus ring are CloseButton's own tests; what is tested
 * here is how the Toast uses it. It sits one header gap after the timestamp, as
 * in Figma, and its × and focus ring are each at least 3:1 on every header. The
 * tightest ground is recorded once, in CloseButton's docs. Pressing it calls
 * `onClose`.
 */
export const Dismiss = () => {
    const [closed, setClosed] = useState([]);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            {TOAST_STYLES.map((style) => (
                <Toast
                    key={style}
                    style={style}
                    title={`${style} toast`}
                    timestamp="Just now"
                    show={!closed.includes(style)}
                    autohide={false}
                    onClose={() => setClosed((list) => [...list, style])}
                    data-testid={`dismiss-${style}`}
                >
                    Press the × to close it.
                </Toast>
            ))}
            <span className="body2-txt" data-testid="dismiss-closed">{closed.join(' ')}</span>
        </div>
    );
};

Dismiss.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = tokenColor(canvasElement, '--color-surface');
    const ringInverse = tokenColor(canvasElement, '--color-focus-ring-inverse');

    for (const style of TOAST_STYLES) {
        const toast = canvas.getByTestId(`dismiss-${style}`);
        const button = within(toast).getByRole('button', { name: 'Close' });
        const header = toast.querySelector('.toast-header');
        const ground = getComputedStyle(header).backgroundColor;

        // One header gap between the timestamp and the ×: the Figma header's
        // Meta → Dismiss spacing, with no extra margin on either side.
        const headerGap = px(getComputedStyle(header).columnGap);
        await expect(headerGap, `${style}: header gap`).toBe(8);
        const timestamp = toast.querySelector('.plus-toast-timestamp').getBoundingClientRect();
        const gap = button.getBoundingClientRect().left - timestamp.right;
        await expect(Math.round(gap), `${style}: timestamp → × gap`).toBe(headerGap);

        const glyph = button.querySelector('i');
        await expect(getComputedStyle(glyph).color, `${style}: × is the inverse tone`).toBe(surface);
        // The × is an icon glyph: WCAG 1.4.11 non-text, 3:1.
        const glyphRatio = contrastRatio(getComputedStyle(glyph).color, ground);
        await expect(glyphRatio, `${style}: × on ${ground} is ${glyphRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);

        button.focus({ focusVisible: true });
        await expect(button.matches(':focus-visible'), `${style}: keyboard-focused`).toBe(true);
        const ring = getComputedStyle(button, '::after').borderTopColor;
        await expect(ring, `${style}: inverse ring`).toBe(ringInverse);
        const ringRatio = contrastRatio(ring, ground);
        await expect(ringRatio, `${style}: ring on ${ground} is ${ringRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
        button.blur();
    }

    // Dismissal is unchanged: the button, found by its name, calls onClose.
    const warning = canvas.getByTestId('dismiss-warning');
    await userEvent.click(within(warning).getByRole('button', { name: 'Close' }));
    await expect(canvas.getByTestId('dismiss-closed')).toHaveTextContent('warning');
    await waitFor(() => expect(canvas.queryByTestId('dismiss-warning')).toBeNull());
};

/**
 * The warning header draws its content like every other header: title,
 * timestamp, icon and × all in the surface color, as in Figma. The small
 * timestamp is 3.52:1 on the Warning fill, below AA's 4.5:1: an accepted
 * exception, kept so the warning Toast reads as one of the set. It is recorded
 * in the text-contrast baseline, and in the Toast docs.
 */
export const WarningHeader = () => (
    <Toast style="warning" title="Warning toast" timestamp="Just now" show autohide={false} data-testid="warning-header">
        Header content is the surface color.
    </Toast>
);

WarningHeader.parameters = WARNING_HEADER_CONTRAST_EXCEPTION;

WarningHeader.play = async ({ canvasElement }) => {
    const toast = within(canvasElement).getByTestId('warning-header');
    const header = toast.querySelector('.toast-header');
    const surface = tokenColor(canvasElement, '--color-surface');
    await expect(getComputedStyle(header).backgroundColor, 'header fill').toBe(tokenColor(canvasElement, '--color-warning'));

    const parts = {
        title: toast.querySelector('.plus-toast-title'),
        timestamp: toast.querySelector('.plus-toast-timestamp'),
        icon: toast.querySelector('.plus-toast-icon i'),
        close: within(toast).getByRole('button', { name: 'Close' }).querySelector('i'),
    };
    for (const [part, node] of Object.entries(parts)) {
        await expect(getComputedStyle(node).color, `warning ${part} is the surface color`).toBe(surface);
    }
};

/**
 * A style outside the list renders as the default, secondary, rather than an
 * unfilled header: the × is inverse and would be white on white.
 */
export const UnknownStyle = () => (
    <Toast style="not-a-style" title="Unknown style" show autohide={false} data-testid="unknown-style">
        Falls back to secondary.
    </Toast>
);

UnknownStyle.play = async ({ canvasElement }) => {
    const toast = within(canvasElement).getByTestId('unknown-style');
    const header = toast.querySelector('.toast-header');
    await expect(getComputedStyle(header).backgroundColor).toBe(tokenColor(canvasElement, '--color-secondary'));
    const glyph = within(toast).getByRole('button', { name: 'Close' }).querySelector('i');
    const ratio = contrastRatio(getComputedStyle(glyph).color, getComputedStyle(header).backgroundColor);
    await expect(ratio).toBeGreaterThanOrEqual(3);
};
