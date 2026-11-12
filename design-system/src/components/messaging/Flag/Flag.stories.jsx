import React, { useState } from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Flag, { FlagGroup, FLAG_APPEARANCES } from './Flag';
import Button from '@/components/forms-and-inputs/Button/Button';
import { SoundProvider, useSound } from '@/sound';

export default {
    title: 'Components/Messaging/Flag',
    component: Flag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Flag component for displaying notifications.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        appearance: {
            control: 'select',
            options: FLAG_APPEARANCES,
            table: { category: 'Design' }
        },
        bold: {
            control: 'boolean',
            table: { category: 'Design' }
        },
        position: {
            control: 'select',
            options: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
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
        onDismiss: {
            table: { disable: true, category: 'Development' }
        }
    }
};

export const Overview = () => (
    <FlagGroup style={{ padding: 'var(--card-pad-compact)' }} containerPosition="static">
        <Flag title="Normal flag" timestamp="Just now" autohide={false}>
            This is a normal flag (default).
        </Flag>
    </FlagGroup>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.flag }
    }
};

/** One appearance per story, for the docs page's Appearance section. */
const appearanceStory = (appearance, title, message, props = {}) => {
    const story = () => (
        <FlagGroup containerPosition="static">
            <Flag appearance={appearance} title={title} timestamp="Just now" autohide={false} {...props}>
                {message}
            </Flag>
        </FlagGroup>
    );
    story.play = async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-flag')).toHaveClass(`plus-flag--${appearance}`);
    };
    return story;
};

export const Normal = appearanceStory('normal', 'Notes copied', 'The session notes are on your clipboard.');
export const Information = appearanceStory('information', 'Schedule updated', 'Your Monday sessions now start at 4:00 PM.');
export const Success = appearanceStory('success', 'Plan saved', 'Your session plan is saved for Monday.');
export const Warning = appearanceStory('warning', 'Connection is slow', 'Some changes may take longer to save.', { actions: [{ text: 'Retry' }] });
/** Named so the export does not shadow the global `Error`. */
export const ErrorAppearance = appearanceStory('error', 'Upload failed', 'The file was larger than 10 MB.', { actions: [{ text: 'Try again' }] });
ErrorAppearance.storyName = 'Error';
/**
 * A failure in the background (a sync that did not finish) is an error Flag with
 * Try again. It sets no `autohide`, because error never closes itself: it stays
 * until closed.
 */
export const BackgroundFailure = () => (
    <FlagGroup containerPosition="static">
        <Flag appearance="error" title="Couldn't sync notes" timestamp="Just now" actions={[{ text: 'Try again' }]}>
            Your latest changes are saved on this device only.
        </Flag>
    </FlagGroup>
);
BackgroundFailure.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const flag = canvasElement.querySelector('.plus-flag');
    await expect(flag.getAttribute('role'), 'a failure interrupts').toBe('alert');
    await expect(canvas.getByRole('button', { name: 'Try again' }), 'retry in the flag').toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Dismiss flag' }), 'closable').toBeVisible();
};

export const Bold = appearanceStory('success', 'Plan saved', 'Your session plan is saved for Monday.', { bold: true, defaultExpanded: true });
/** On the bold fill the chevron takes the inverse icon, as the × does, and both sit on the title's line. */
Bold.play = async ({ canvasElement }) => {
    const flag = canvasElement.querySelector('.plus-flag--bold');
    const ground = getComputedStyle(flag).backgroundColor;
    const title = flag.querySelector('.plus-flag-title').getBoundingClientRect();
    for (const name of ['Collapse', 'Dismiss flag']) {
        const button = within(flag).getByRole('button', { name });
        const glyph = getComputedStyle(button.querySelector('i')).color;
        const ratio = contrastRatio(glyph, ground);
        await expect(ratio, `${name} glyph on the bold fill is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
        const box = button.getBoundingClientRect();
        await expect(Math.round(box.height), `${name} is compact`).toBe(24);
        const offset = Math.abs((box.top + box.bottom) / 2 - (title.top + title.bottom) / 2);
        await expect(offset, `${name} is centered on the title line`).toBeLessThanOrEqual(1);
    }
};

const FlagInteractiveWrapper = ({ appearance, bold, position, title, children, show, autohide, delay }) => {
    const [isOpen, setIsOpen] = useState(show);

    React.useEffect(() => {
        setIsOpen(show);
    }, [show]);

    return (
        <div className="plus-flag-interactive-demo">
            <FlagGroup position={position} style={{ padding: 'var(--card-pad-compact)' }}>
                <Flag
                    show={isOpen}
                    onDismiss={() => setIsOpen(false)}
                    title={title}
                    appearance={appearance}
                    bold={bold}
                    timestamp="Just now"
                    delay={delay}
                    autohide={autohide}
                >
                    {children}
                </Flag>
            </FlagGroup>
            <div className="plus-flag-interactive-demo__trigger">
                <Button appearance="primary" text="Trigger Flag" onClick={() => setIsOpen(true)} />
            </div>
        </div>
    );
};

export const Interactive = (args) => <FlagInteractiveWrapper {...args} />;
Interactive.args = {
    show: false,
    appearance: 'success',
    bold: false,
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
                'Preview keeps the flag centered. In product code, `position` on `FlagGroup` still controls fixed corner placement.',
        },
    },
};

const FLAG_STYLE_LIST = FLAG_APPEARANCES;

/**
 * One flag per appearance, stacked. `flagProps(appearance)` supplies what
 * differs per story (test id, visibility, body); `children` follows the stack.
 */
const FlagPerStyle = ({ flagProps, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
        {FLAG_STYLE_LIST.map((style) => (
            <Flag
                key={style}
                appearance={style}
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
 * Pressing it calls `onDismiss`.
 */
export const Dismiss = () => {
    const [closed, setClosed] = useState([]);
    return (
        <FlagPerStyle
            flagProps={(style) => ({
                show: !closed.includes(style),
                onDismiss: () => setClosed((list) => [...list, style]),
                'data-testid': `dismiss-${style}`,
                children: 'Press the × to close it.',
            })}
        >
            <span className="body-default" data-testid="dismiss-closed">{closed.join(' ')}</span>
        </FlagPerStyle>
    );
};

Dismiss.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = tokenColor(canvasElement, '--ds-border-focused');

    for (const style of FLAG_STYLE_LIST) {
        const flag = canvas.getByTestId(`dismiss-${style}`);
        const button = within(flag).getByRole('button', { name: 'Dismiss flag' });
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

    // Dismissal: the button, found by its name, calls onDismiss.
    const warning = canvas.getByTestId('dismiss-warning');
    await userEvent.click(within(warning).getByRole('button', { name: 'Dismiss flag' }));
    await expect(canvas.getByTestId('dismiss-closed')).toHaveTextContent('warning');
    await waitFor(() => expect(canvas.queryByTestId('dismiss-warning')).toBeNull());
};

/**
 * Every flag is the same surface, elevation.surface.overlay; the appearance
 * shows in its icon alone, drawn in the role's icon color. The title is color.text
 * and the message color.text.subtle on every appearance.
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
    normal: '--ds-icon-subtle',
    error: '--ds-icon-danger',
    success: '--ds-icon-success',
    information: '--ds-icon-information',
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
 * An appearance outside the list renders as the default, normal.
 */
export const UnknownAppearance = () => (
    <Flag appearance="not-an-appearance" title="Unknown appearance" show autohide={false} data-testid="unknown-appearance">
        Falls back to normal.
    </Flag>
);

UnknownAppearance.play = async ({ canvasElement }) => {
    const flag = within(canvasElement).getByTestId('unknown-appearance');
    await expect(flag).toHaveClass('plus-flag--normal');
    const icon = flag.querySelector('.plus-flag-icon i');
    await expect(getComputedStyle(icon).color).toBe(tokenColor(canvasElement, '--ds-icon-subtle'));
};

/* ------------------------------------------------------------------- states */

const StateFlag = ({ actions }) => (
    <Flag title="Plan saved" timestamp="Just now" autohide={false} actions={actions}>
        Your session plan is saved for Monday.
    </Flag>
);
const flagRoot = (canvasElement) => within(canvasElement).getByRole('status');
const dismissOf = (canvasElement) => within(canvasElement).getByRole('button', { name: 'Dismiss flag' });
const actionsList = [{ text: 'View plan', onClick: () => {} }];

/** Rest: the flag on the overlay surface, its title in the default text token. */
export const Rest = {
    render: () => <StateFlag />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText('Plan saved')).toBeVisible();
        await expect(dismissOf(canvasElement)).toBeVisible();
    },
};

/** Hovered: the flag itself does not react; its Dismiss takes the subtle hovered ground. */
export const Hovered = {
    render: () => <StateFlag />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(flagRoot(canvasElement), ':hover', 'flag');
        await expectHovered(canvasElement, dismissOf(canvasElement), 'subtle', 'flag dismiss');
    },
};

/** Pressed: Dismiss takes the subtle pressed ground. */
export const Pressed = {
    render: () => <StateFlag />,
    play: async ({ canvasElement }) => {
        await expectPressed(canvasElement, dismissOf(canvasElement), 'subtle', 'flag dismiss');
    },
};

/** Focused: Dismiss and each action show the 2px ring. */
export const Focused = {
    render: () => <StateFlag actions={actionsList} />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, dismissOf(canvasElement), 'flag dismiss');
        const action = within(canvasElement).getByRole('button', { name: 'View plan' });
        action.focus({ focusVisible: true });
        const style = getComputedStyle(action);
        await expect(style.outlineStyle).toBe('solid');
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        action.blur();
    },
};

const LandsWithNotifyStory = () => {
    const [shown, setShown] = useState(false);
    const { enabled, setEnabled } = useSound();
    return (
        <SoundProvider>
            <div style={{ position: 'relative', minHeight: 'calc(var(--space-500) * 3)', padding: 'var(--space-150)', display: 'flex', alignItems: 'flex-start', gap: 'var(--inline-md)' }}>
                <Button appearance="primary" text="Show flag" onClick={() => setShown(true)} />
                <Button appearance="default" text={enabled ? 'Sound on' : 'Sound off'} onClick={() => setEnabled(!enabled)} />
                <FlagGroup position="top-end" containerPosition="absolute">
                    <Flag id="flag-lands-with-notify" show={shown} onDismiss={() => setShown(false)} appearance="success" title="Plan saved">
                        Your session plan is saved for Monday.
                    </Flag>
                </FlagGroup>
            </div>
        </SoundProvider>
    );
};

/**
 * Flag's enter, live: it slides in from the top-right corner on the
 * `spatial.default` spring and fades in on `appearance.default`, and Notify
 * sounds as it lands. The switch beside it is the app's one sound setting.
 */
export const LandsWithNotify = {
    render: () => <LandsWithNotifyStory />,
    parameters: { layout: 'fullscreen' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Show flag' }));
        const flag = await waitFor(() => {
            const el = canvasElement.ownerDocument.getElementById('flag-lands-with-notify');
            if (!el) throw new Error('the flag has not entered');
            return el;
        });
        const style = getComputedStyle(flag);
        const root = getComputedStyle(canvasElement.ownerDocument.documentElement);
        const raw = root.getPropertyValue('--ds-motion-spatial-default-duration').trim();
        const seconds = parseFloat(raw) / (raw.endsWith('ms') ? 1000 : 1);
        await expect(style.animationName, 'slides in on spatial.default').toContain('plus-flag-slide-in');
        await expect(parseFloat(style.animationDuration)).toBeCloseTo(seconds, 3);
        await waitFor(() => expect(flag).toBeVisible());
    },
};
