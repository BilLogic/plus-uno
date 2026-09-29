import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
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

export const Styles = () => (
    <div className="d-flex flex-column gap-3">
        <ToastVariantsDemos />
    </div>
);

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
 * tone: 24×24 with a 16px × in surface, and on keyboard focus the inverse ring,
 * each at least 3:1 against the header it sits on (warning is the tightest, at
 * about 3.52:1). Pressing it calls `onClose`.
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

        const { width, height } = button.getBoundingClientRect();
        await expect(Math.round(width), `${style}: width`).toBe(24);
        await expect(Math.round(height), `${style}: height`).toBe(24);
        const glyph = button.querySelector('i');
        await expect(glyph).toHaveAttribute('aria-hidden', 'true');
        await expect(getComputedStyle(glyph).fontSize, `${style}: icon size`).toBe('16px');
        await expect(getComputedStyle(glyph).color, `${style}: × is the inverse tone`).toBe(surface);

        // The × is an icon glyph: WCAG 1.4.11 non-text, 3:1.
        const glyphRatio = contrastRatio(getComputedStyle(glyph).color, ground);
        await expect(glyphRatio, `${style}: × on ${ground} is ${glyphRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);

        button.focus({ focusVisible: true });
        await expect(button.matches(':focus-visible'), `${style}: keyboard-focused`).toBe(true);
        const ring = getComputedStyle(button, '::after');
        await expect(ring.borderTopWidth, `${style}: ring width`).toBe('2px');
        await expect(ring.borderTopColor, `${style}: inverse ring`).toBe(ringInverse);
        const ringRatio = contrastRatio(ring.borderTopColor, ground);
        await expect(ringRatio, `${style}: ring on ${ground} is ${ringRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
        button.blur();
    }

    // Dismissal is unchanged: the button, found by its name, calls onClose.
    const warning = canvas.getByTestId('dismiss-warning');
    await userEvent.click(within(warning).getByRole('button', { name: 'Close' }));
    await expect(canvas.getByTestId('dismiss-closed')).toHaveTextContent('warning');
    await waitFor(() => expect(canvas.queryByTestId('dismiss-warning')).toBeNull());
};
