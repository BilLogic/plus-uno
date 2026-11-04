import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Flag, { FlagContainer } from './Flag';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    title: 'Components/Messaging/Flag',
    component: Flag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-25', kind: 'changed', summary: 'The flag moved to the new color tokens: the overlay surface and shadow, whose 1px ring replaces the border, with the role icon colors (info is blue) and color.text and color.text.subtle for the words.' },
            { date: '2026-10-23', kind: 'changed', summary: 'The flag became the Popover family\'s Flag: one surface 400 wide, padded 16, with the style shown in a 16 icon, the title in heading.xsmall and the × in CloseButton\'s default tone. Success and info close after 8 seconds; warning and danger stay. `FlagContainer` sits bottom-left by default, fixed 8 from the screen edge, with flags 16 apart.' },
            { date: '2026-09-29', kind: 'changed', summary: 'The × is the shared CloseButton in its inverse tone on every header color: a fixed 24×24 box with a 16px × and a visible focus ring.' },
        ],
        docs: {
            description: {
                component: 'Flag component for displaying notifications.'
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
            description: 'Flag position (for container)',
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

function FlagVariantsDemos() {
    return (
        <FlagContainer className="p-3" containerPosition="static">
            <Flag title="Primary Flag" style="primary" timestamp="Just now" autohide={false}>
                This is a primary flag.
            </Flag>
            <Flag title="Secondary Flag" style="secondary" timestamp="Just now" autohide={false}>
                This is a secondary flag (default).
            </Flag>
            <Flag title="Success Flag" style="success" timestamp="2 mins ago" autohide={false}>
                Action completed successfully!
            </Flag>
            <Flag title="Danger Flag" style="danger" timestamp="10 mins ago">
                Something went wrong.
            </Flag>
            <Flag title="Warning Flag" style="warning">
                Please be careful.
            </Flag>
            <Flag title="Info Flag" style="info" autohide={false}>
                Here is some information.
            </Flag>
        </FlagContainer>
    );
}

export const Styles = () => (
    <div className="d-flex flex-column gap-3">
        <FlagVariantsDemos />
    </div>
);

export const Overview = () => (
    <FlagContainer className="p-3" containerPosition="static">
        <Flag title="Secondary Flag" style="secondary" timestamp="Just now" autohide={false}>
            This is a secondary flag (default).
        </Flag>
    </FlagContainer>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.flag }
    }
};

const FlagInteractiveWrapper = ({ style, position, title, children, show, autohide, delay }) => {
    const [isOpen, setIsOpen] = useState(show);

    React.useEffect(() => {
        setIsOpen(show);
    }, [show]);

    return (
        <div className="plus-flag-interactive-demo">
            <FlagContainer position={position} className="p-3">
                <Flag
                    show={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={title}
                    style={style}
                    timestamp="Just now"
                    delay={delay}
                    autohide={autohide}
                >
                    {children}
                </Flag>
            </FlagContainer>
            <div className="plus-flag-interactive-demo__trigger">
                <Button appearance="primary" text="Trigger Flag" onClick={() => setIsOpen(true)} />
            </div>
        </div>
    );
};

export const Interactive = (args) => <FlagInteractiveWrapper {...args} />;
Interactive.args = {
    show: false,
    style: 'success',
    position: 'top-end',
    title: 'Flag Title',
    children: 'This is an interactive flag message.',
    autohide: false,
    delay: 3000
};
Interactive.parameters = {
    controls: { exclude: ['position'] },
    docs: {
        description: {
            story:
                'Preview keeps the flag centered. In product code, `position` on `FlagContainer` still controls fixed corner placement.',
        },
    },
};

const FLAG_STYLE_LIST = ['primary', 'secondary', 'danger', 'success', 'info', 'warning'];

/**
 * One flag per style, stacked. `flagProps(style)` supplies what
 * differs per story (test id, visibility, body); `children` follows the stack.
 */
const FlagPerStyle = ({ flagProps, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
        {FLAG_STYLE_LIST.map((style) => (
            <Flag
                key={style}
                style={style}
                title={`${style} flag`}
                timestamp="Just now"
                autohide={false}
                {...flagProps(style)}
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
        <FlagPerStyle
            flagProps={(style) => ({
                show: !closed.includes(style),
                onClose: () => setClosed((list) => [...list, style]),
                'data-testid': `dismiss-${style}`,
                children: 'Press the × to close it.',
            })}
        >
            <span className="body2-txt" data-testid="dismiss-closed">{closed.join(' ')}</span>
        </FlagPerStyle>
    );
};

Dismiss.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--ds-border-focused');

    for (const style of FLAG_STYLE_LIST) {
        const flag = canvas.getByTestId(`dismiss-${style}`);
        const button = within(flag).getByRole('button', { name: 'Close' });
        const ground = getComputedStyle(flag).backgroundColor;

        // The × closes the row, one inline-lg gap after the content.
        const rowGap = px(getComputedStyle(flag).columnGap);
        await expect(rowGap, `${style}: row gap`).toBe(12);
        const content = flag.querySelector('.plus-flag-content').getBoundingClientRect();
        await expect(Math.round(button.getBoundingClientRect().left - content.right), `${style}: content → × gap`).toBe(rowGap);

        // The × is an icon glyph: WCAG 1.4.11 non-text, 3:1.
        const glyph = button.querySelector('i');
        const glyphRatio = contrastRatio(getComputedStyle(glyph).color, ground);
        await expect(glyphRatio, `${style}: × on ${ground} is ${glyphRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);

        button.focus({ focusVisible: true });
        await expect(button.matches(':focus-visible'), `${style}: keyboard-focused`).toBe(true);
        await expect(getComputedStyle(button).outlineColor, `${style}: default ring`).toBe(ring);
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
    <FlagPerStyle
        flagProps={(style) => ({
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

    for (const style of FLAG_STYLE_LIST) {
        const flag = canvas.getByTestId(`flag-${style}`);
        await expect(getComputedStyle(flag).backgroundColor, `${style}: one surface`).toBe(surface);
        await expect(getComputedStyle(flag.querySelector('.plus-flag-title')).color, `${style}: title`).toBe(text);
        await expect(getComputedStyle(flag.querySelector('.plus-flag-body')).color, `${style}: message`).toBe(textSubtle);
        const icon = flag.querySelector('.plus-flag-icon i');
        await expect(getComputedStyle(icon).color, `${style}: icon`).toBe(tokenColor(canvasElement, ICON_COLOR[style]));
        await expect(getComputedStyle(icon).fontSize, `${style}: icon 16`).toBe('16px');
    }
};

/**
 * A style outside the list renders as the default, secondary.
 */
export const UnknownStyle = () => (
    <Flag style="not-a-style" title="Unknown style" show autohide={false} data-testid="unknown-style">
        Falls back to secondary.
    </Flag>
);

UnknownStyle.play = async ({ canvasElement }) => {
    const flag = within(canvasElement).getByTestId('unknown-style');
    await expect(flag).toHaveClass('secondary');
    const icon = flag.querySelector('.plus-flag-icon i');
    await expect(getComputedStyle(icon).color).toBe(tokenColor(canvasElement, '--ds-icon-subtle'));
};
