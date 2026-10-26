import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Toast, { ToastContainer } from './Toast';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    title: 'Components/Messaging/Flag',
    component: Toast,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-25', kind: 'changed', summary: 'The flag moved to the new color tokens: the overlay surface and shadow, whose 1px ring replaces the border, with the role icon colors (info is blue) and color.text and color.text.subtle for the words.' },
            { date: '2026-10-23', kind: 'changed', summary: 'The toast became the Popover family\'s Flag: one surface 400 wide, padded 16, with the style shown in a 16 icon, the title in heading.xsmall and the × in CloseButton\'s default tone. Success and info close after 8 seconds; warning and danger stay. `ToastContainer` sits bottom-left by default, fixed 8 from the screen edge, with flags 16 apart.' },
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
        <ToastContainer className="p-3" containerPosition="static">
            <Toast title="Primary Toast" style="primary" timestamp="Just now" autohide={false}>
                This is a primary toast.
            </Toast>
            <Toast title="Secondary Toast" style="secondary" timestamp="Just now" autohide={false}>
                This is a secondary toast (default).
            </Toast>
            <Toast title="Success Toast" style="success" timestamp="2 mins ago" autohide={false}>
                Action completed successfully!
            </Toast>
            <Toast title="Danger Toast" style="danger" timestamp="10 mins ago">
                Something went wrong.
            </Toast>
            <Toast title="Warning Toast" style="warning">
                Please be careful.
            </Toast>
            <Toast title="Info Toast" style="info" autohide={false}>
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
    <ToastContainer className="p-3" containerPosition="static">
        <Toast title="Secondary Toast" style="secondary" timestamp="Just now" autohide={false}>
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
 * One flag per style, stacked. `toastProps(style)` supplies what
 * differs per story (test id, visibility, body); `children` follows the stack.
 */
const ToastPerStyle = ({ toastProps, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
        {TOAST_STYLES.map((style) => (
            <Toast
                key={style}
                style={style}
                title={`${style} toast`}
                timestamp="Just now"
                autohide={false}
                {...toastProps(style)}
            />
        ))}
        {children}
    </div>
);

/**
 * The × on every flag. It is the shared `CloseButton` in its default tone on
 * the flag's surface, so its size and focus ring are CloseButton's own tests;
 * what is tested here is how the flag uses it: the last thing in the row, one
 * Element/inline-lg gap after the content, its × at least 3:1 on the surface.
 * Pressing it calls `onClose`.
 */
export const Dismiss = () => {
    const [closed, setClosed] = useState([]);
    return (
        <ToastPerStyle
            toastProps={(style) => ({
                show: !closed.includes(style),
                onClose: () => setClosed((list) => [...list, style]),
                'data-testid': `dismiss-${style}`,
                children: 'Press the × to close it.',
            })}
        >
            <span className="body2-txt" data-testid="dismiss-closed">{closed.join(' ')}</span>
        </ToastPerStyle>
    );
};

Dismiss.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--ds-border-focused');

    for (const style of TOAST_STYLES) {
        const toast = canvas.getByTestId(`dismiss-${style}`);
        const button = within(toast).getByRole('button', { name: 'Close' });
        const ground = getComputedStyle(toast).backgroundColor;

        // The × closes the row, one inline-lg gap after the content.
        const rowGap = px(getComputedStyle(toast).columnGap);
        await expect(rowGap, `${style}: row gap`).toBe(12);
        const content = toast.querySelector('.plus-toast-content').getBoundingClientRect();
        await expect(Math.round(button.getBoundingClientRect().left - content.right), `${style}: content → × gap`).toBe(rowGap);

        // The × is an icon glyph: WCAG 1.4.11 non-text, 3:1.
        const glyph = button.querySelector('i');
        const glyphRatio = contrastRatio(getComputedStyle(glyph).color, ground);
        await expect(glyphRatio, `${style}: × on ${ground} is ${glyphRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);

        button.focus({ focusVisible: true });
        await expect(button.matches(':focus-visible'), `${style}: keyboard-focused`).toBe(true);
        await expect(getComputedStyle(button, '::after').borderTopColor, `${style}: default ring`).toBe(ring);
        button.blur();
    }

    // Dismissal: the button, found by its name, calls onClose.
    const warning = canvas.getByTestId('dismiss-warning');
    await userEvent.click(within(warning).getByRole('button', { name: 'Close' }));
    await expect(canvas.getByTestId('dismiss-closed')).toHaveTextContent('warning');
    await waitFor(() => expect(canvas.queryByTestId('dismiss-warning')).toBeNull());
};

/**
 * Every flag is the same surface, elevation.surface.overlay; the style shows
 * in its icon alone, drawn in the role's icon color. The title is color.text
 * and the message color.text.subtle on every style.
 */
export const FlagContent = () => (
    <ToastPerStyle
        toastProps={(style) => ({
            show: true,
            'data-testid': `flag-${style}`,
            children: `The ${style} flag's message.`,
        })}
    />
);

const ICON_COLOR = {
    primary: '--ds-icon-brand',
    secondary: '--ds-icon-subtle',
    danger: '--ds-icon-danger',
    success: '--ds-icon-success',
    info: '--ds-icon-information',
    warning: '--ds-icon-warning',
};

FlagContent.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = tokenColor(canvasElement, '--ds-surface-overlay');
    const text = tokenColor(canvasElement, '--ds-text');
    const textSubtle = tokenColor(canvasElement, '--ds-text-subtle');

    for (const style of TOAST_STYLES) {
        const toast = canvas.getByTestId(`flag-${style}`);
        await expect(getComputedStyle(toast).backgroundColor, `${style}: one surface`).toBe(surface);
        await expect(getComputedStyle(toast.querySelector('.plus-toast-title')).color, `${style}: title`).toBe(text);
        await expect(getComputedStyle(toast.querySelector('.plus-toast-body')).color, `${style}: message`).toBe(textSubtle);
        const icon = toast.querySelector('.plus-toast-icon i');
        await expect(getComputedStyle(icon).color, `${style}: icon`).toBe(tokenColor(canvasElement, ICON_COLOR[style]));
        await expect(getComputedStyle(icon).fontSize, `${style}: icon 16`).toBe('16px');
    }
};

/**
 * A style outside the list renders as the default, secondary.
 */
export const UnknownStyle = () => (
    <Toast style="not-a-style" title="Unknown style" show autohide={false} data-testid="unknown-style">
        Falls back to secondary.
    </Toast>
);

UnknownStyle.play = async ({ canvasElement }) => {
    const toast = within(canvasElement).getByTestId('unknown-style');
    await expect(toast).toHaveClass('secondary');
    const icon = toast.querySelector('.plus-toast-icon i');
    await expect(getComputedStyle(icon).color).toBe(tokenColor(canvasElement, '--ds-icon-subtle'));
};
