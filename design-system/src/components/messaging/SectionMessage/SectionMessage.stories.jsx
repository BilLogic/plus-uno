import React from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { expect, userEvent, within } from 'storybook/test';
import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { contrastRatio, paintedOver } from '@/storybook-docs/lib/contrast.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import SectionMessage, { SECTION_MESSAGE_ICONS, SECTION_MESSAGE_APPEARANCES } from './SectionMessage';
import { iconClass } from '../../../lib/icon';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

const ICON_TOKEN = {
    primary: '--ds-icon-brand',
    secondary: '--ds-icon-subtle',
    success: '--ds-icon-success',
    danger: '--ds-icon-danger',
    warning: '--ds-icon-warning',
    info: '--ds-icon-information',
};

export default {
    title: 'Components/Messaging/Section message',
    component: SectionMessage,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
A message that belongs to the page and stays there until it is resolved or
dismissed. Six styles, an optional title, and a leading icon that each style
picks by default.

\`\`\`jsx
<SectionMessage appearance="warning">Warning message here</SectionMessage>
<SectionMessage appearance="info" title="Info">This is an info message.</SectionMessage>
\`\`\`
                `,
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        appearance: { table: { disable: true } },
        title: {
            control: 'text',
            table: { category: 'Content' },
        },
        leadingVisual: {
            control: 'select',
            options: [true, false, 'bell', 'circle-question'],
            table: { category: 'Content', defaultValue: { summary: 'true' } },
        },
        dismissible: {
            control: 'boolean',
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

const GROUND_TOKEN = {
    primary: '--ds-background-brand-subtlest',
    secondary: '--ds-background-neutral',
    success: '--ds-background-success',
    danger: '--ds-background-danger',
    warning: '--ds-background-warning',
    info: '--ds-background-information',
};

const sectionMessageCol = { display: 'flex', flexDirection: 'column', gap: '48px' };
const contentVariantCol = { display: 'flex', flexDirection: 'column', gap: '24px' };

function SectionMessageContentDemos() {
    return (
        <div style={contentVariantCol}>
            <DemoLabel>CONTENT VARIANTS (PRIMARY STYLE)</DemoLabel>
            <section>
                <DemoLabel>WITH TITLE</DemoLabel>
                <p className="body-default" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Use when the message benefits from a short heading.
                </p>
                <SectionMessage appearance="primary" title="With Title" dismissible>
                    Message with title and body text.
                </SectionMessage>
            </section>
            <section>
                <DemoLabel>BODY ONLY</DemoLabel>
                <p className="body-default" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Use when concise copy does not require a heading.
                </p>
                <SectionMessage appearance="primary" dismissible>
                    Message without title — body only. The dismiss button centers on the first body line.
                </SectionMessage>
            </section>
            <section>
                <DemoLabel>NON-DISMISSIBLE</DemoLabel>
                <p className="body-default" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Use for critical information that must remain visible.
                </p>
                <SectionMessage appearance="primary" title="Non-dismissible message" dismissible={false}>
                    This message cannot be dismissed.
                </SectionMessage>
            </section>
            <section>
                <DemoLabel>RICH CONTENT</DemoLabel>
                <p className="body-default" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Supports inline emphasis and links inside the body.
                </p>
                <SectionMessage appearance="info" title="Rich Content">
                    <strong>Note:</strong> You can include <em>rich HTML content</em> and even{' '}
                    <a href="#">links</a> inside a message.
                </SectionMessage>
            </section>
            <section>
                <DemoLabel>ACTIONS</DemoLabel>
                <p className="body-default" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Up to two link-button actions after the body.
                </p>
                <SectionMessage
                    appearance="warning"
                    title="This term's schedule is provisional"
                    dismissible={false}
                    actions={[
                        { text: 'Reschedule', onClick: () => {} },
                        { text: 'Learn more', href: '#' },
                    ]}
                >
                    Dates may still change before the term starts.
                </SectionMessage>
            </section>
        </div>
    );
}

/** One appearance per story, for the docs page's Appearance section. */
const appearanceStory = (appearance, title, message) => {
    const story = () => <SectionMessage appearance={appearance} title={title}>{message}</SectionMessage>;
    story.play = async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('alert')).toHaveClass(appearance);
    };
    return story;
};

export const Primary = appearanceStory('primary', 'New rubric this term', 'Sessions are scored on the rubric agreed at intake.');
export const Secondary = appearanceStory('secondary', 'Read-only view', 'You can view this plan but not edit it.');
export const Success = appearanceStory('success', 'Goal reached', 'This student met their attendance goal for the term.');
export const Danger = appearanceStory('danger', 'Session could not be booked', 'The tutor is no longer available at this time.');
export const Warning = appearanceStory('warning', 'Schedule is provisional', 'Dates may still change before the term starts.');
export const Info = appearanceStory('info', 'Times are in your time zone', 'Tutors confirm times by Friday.');

export const Content = () => (
    <div style={sectionMessageCol}>
        <SectionMessageContentDemos />
    </div>
);

export const Overview = () => (
    <SectionMessage appearance="primary" title="With Title" dismissible>
        Message with title and body text.
    </SectionMessage>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.sectionMessage }
    }
};

/**
 * Interactive Section message
 * Interactive playground for testing message variations.
 */
export const Interactive = (args) => (
    <SectionMessage {...args}>
        This is an interactive message. Use the controls below to customize it.
    </SectionMessage>
);
Interactive.args = {
    title: 'Interactive message',
    appearance: 'info',
    leadingVisual: true,
    dismissible: true,
};


/**
 * Where the × sits. It is centered on the FIRST line of text — the title line
 * when there is a title, otherwise the first body line — and it stays there
 * when the text wraps. It is the shared `CloseButton`, so it is 24×24 with a
 * 16px icon whatever the text size beside it.
 */
export const DismissPlacement = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        <SectionMessage appearance="primary" title="With a title" data-testid="placement-title">
            The × centers on the title line, not on the message.
        </SectionMessage>
        <SectionMessage appearance="warning" data-testid="placement-body">
            Without a title the × centers on the first body line, even when the message runs on
            long enough to wrap onto a second and a third line inside a narrow message.
        </SectionMessage>
        <SectionMessage appearance="info" title="A title long enough to wrap onto a second line" data-testid="placement-wrap">
            Short body.
        </SectionMessage>
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
        ['placement-title', '.plus-section-message-title'],
        ['placement-body', '.plus-section-message-text'],
        ['placement-wrap', '.plus-section-message-title'],
    ];
    for (const [id, lineOwner] of cases) {
        const message = canvas.getByTestId(id);
        const button = within(message).getByRole('button', { name: 'Dismiss message' });
        const rect = button.getBoundingClientRect();
        await expect(Math.round(rect.width), `${id}: width`).toBe(32);
        await expect(Math.round(rect.height), `${id}: height`).toBe(32);
        await expect(getComputedStyle(button.querySelector('i')).fontSize, `${id}: icon`).toBe('16px');

        const line = firstLine(message.querySelector(lineOwner));
        const center = rect.top + rect.height / 2;
        await expect(center, `${id}: × center is inside the first line box`).toBeGreaterThanOrEqual(line.top);
        await expect(center, `${id}: × center is inside the first line box`).toBeLessThanOrEqual(line.bottom);
        await expect(Math.abs(center - line.center), `${id}: × is centered on the first line`).toBeLessThanOrEqual(1);
    }

    // Dismissal is unchanged: the button removes its message.
    const body = canvas.getByTestId('placement-body');
    await userEvent.click(within(body).getByRole('button', { name: 'Dismiss message' }));
    await expect(canvas.queryByTestId('placement-body')).toBeNull();
};


/**
 * The leading icon. Every style has a default icon on the first line of text,
 * like the ×: success circle-check, danger circle-exclamation, warning
 * triangle-exclamation, and circle-info for primary, secondary and info. A
 * passed `leadingVisual` replaces it and `false` removes it. The icon is
 * decorative: the message's role and its text already say what it is.
 */
export const LeadingIcon = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        {SECTION_MESSAGE_APPEARANCES.map((appearance) => (
            <SectionMessage key={appearance} appearance={appearance} title="Title" data-testid={`icon-${appearance}`}>
                You have a message here — come check it out!
            </SectionMessage>
        ))}
        <SectionMessage appearance="warning" data-testid="icon-body">
            Without a title the icon centers on the first body line, even when the message runs on
            long enough to wrap onto a second and a third line inside a narrow message.
        </SectionMessage>
        <SectionMessage appearance="success" title="A title long enough to wrap onto a second line" data-testid="icon-wrap">
            Short body.
        </SectionMessage>
        <SectionMessage appearance="info" title="Replaced by name" leadingVisual="bell" data-testid="icon-named">
            A Font Awesome solid name replaces the default icon.
        </SectionMessage>
        <SectionMessage appearance="info" leadingVisual={<i className={iconClass('star')} />} data-testid="icon-node">
            A node replaces it too.
        </SectionMessage>
        <SectionMessage appearance="warning" leadingVisual={false} data-testid="icon-none">
            Sign-in didn&apos;t complete. Please try again.
        </SectionMessage>
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

/** The leading icon of a message: its one icon that is not inside the × button. */
const leadingIconOf = (message) => [...message.querySelectorAll('i')].find((i) => !i.closest('button')) ?? null;

LeadingIcon.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expectOnFirstLine = async (id, icon, lineOwner) => {
        const rect = icon.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const line = firstLine(lineOwner);
        await expect(Math.abs(center - line.center), `${id}: icon is centered on the first line`).toBeLessThanOrEqual(1);
    };

    for (const appearance of SECTION_MESSAGE_APPEARANCES) {
        const id = `icon-${appearance}`;
        const message = canvas.getByTestId(id);
        const icon = leadingIconOf(message);
        await expect(icon, `${id} has a leading icon`).not.toBeNull();
        await expect(getComputedStyle(icon, '::before').content, `${id} icon is ${SECTION_MESSAGE_ICONS[appearance]}`)
            .toBe(glyphOf(canvasElement, `fa-${SECTION_MESSAGE_ICONS[appearance]}`));
        await expect(getComputedStyle(icon).color, `${id} icon color`).toBe(tokenColor(canvasElement, ICON_TOKEN[appearance]));
        await expect(px(getComputedStyle(icon).fontSize), `${id} icon size`).toBe(24);
        const box = icon.getBoundingClientRect();
        await expect(Math.round(box.width), `${id} icon box is 24 wide, the column's width`).toBe(24);
        await expect(Math.round(box.width), `${id} icon fills its column exactly`)
            .toBe(Math.round(icon.parentElement.getBoundingClientRect().width));
        await expect(icon.closest('[aria-hidden="true"]'), `${id} icon is decorative`).not.toBeNull();

        // The icon comes before the message, the × after it.
        const title = within(message).getByText('Title');
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
    await expect(px(getComputedStyle(node).fontSize), 'a passed node is drawn at 24px').toBe(24);
    await expect(Math.round(node.getBoundingClientRect().width), 'a passed node is a 24-wide box').toBe(24);
    await expect(canvas.getByTestId('icon-node').querySelectorAll('i:not(button i)').length, 'the node is the only leading icon').toBe(1);

    // `false` removes it: the text starts at the message's padding edge.
    const none = canvas.getByTestId('icon-none');
    await expect(leadingIconOf(none)).toBeNull();
    const text = within(none).getByText(/Sign-in didn/);
    const s = getComputedStyle(none);
    const contentLeft = none.getBoundingClientRect().left + px(s.paddingLeft);
    await expect(Math.round(text.getBoundingClientRect().left), 'text starts at the padding edge').toBe(Math.round(contentLeft));

    // The × is unchanged beside the icon: it still dismisses its message.
    await userEvent.click(within(none).getByRole('button', { name: 'Dismiss message' }));
    await expect(canvas.queryByTestId('icon-none')).toBeNull();
};

/**
 * The ground and the text. Each style's ground is its named background
 * token and the corners are 4px. No side stripe: meaning is carried by the
 * fill and the icon alone. The title, the body and any link in it are
 * on-surface, whatever the style. Shown on the darkest surface step.
 */
export const GroundAndText = () => (
    <div
        data-testid="ground"
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--section-stack-lg)',
            padding: 'var(--section-pad-y-default) var(--section-pad-x-default)',
            background: 'var(--ds-surface-sunken)',
        }}
    >
        {SECTION_MESSAGE_APPEARANCES.map((appearance) => (
            <SectionMessage key={appearance} appearance={appearance} title="Title" data-testid={`ground-${appearance}`}>
                You have a message here, with <a href="#">a link</a> in it.
            </SectionMessage>
        ))}
    </div>
);

GroundAndText.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ground = getComputedStyle(canvas.getByTestId('ground')).backgroundColor;
    const onSurface = tokenColor(canvasElement, '--ds-text');

    for (const appearance of SECTION_MESSAGE_APPEARANCES) {
        const id = `ground-${appearance}`;
        const message = canvas.getByTestId(id);
        const s = getComputedStyle(message);

        // No side stripe: nothing drawn on any edge.
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            await expect(px(s[`border${side}Width`]), `${id}: no ${side.toLowerCase()} border`).toBe(0);
        }

        // --radius-md corners and the role's named background ground.
        const radius = tokenLength(canvasElement, '--radius-md');
        await expect(radius, 'the radius token is 4px, as Figma draws it').toBe(4);
        for (const corner of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']) {
            await expect(px(s[`border${corner}Radius`]), `${id}: ${corner} radius is the modal-radius-sm token`).toBe(radius);
        }
        await expect(s.backgroundColor, `${id}: ground is the role's named background token`)
            .toBe(tokenColor(canvasElement, GROUND_TOKEN[appearance]));
        await expect(contrastRatio(onSurface, paintedOver(s.backgroundColor, ground)), `${id}: text holds contrast on its own ground`)
            .toBeGreaterThanOrEqual(4.5);

        // Title, body and link are on-surface.
        const title = within(message).getByText('Title');
        const body = within(message).getByText(/You have a message here/);
        const link = within(message).getByRole('link', { name: 'a link' });
        await expect(getComputedStyle(title).color, `${id}: title color`).toBe(onSurface);
        await expect(getComputedStyle(body).color, `${id}: body color`).toBe(onSurface);
        await expect(getComputedStyle(link).color, `${id}: link inherits the text color`).toBe(onSurface);
    }
};

/** Up to two link-button actions after the body, with a divider between them. */
export const Actions = () => (
    <SectionMessage
        appearance="warning"
        title="This term's schedule is provisional"
        dismissible={false}
        actions={[
            { text: 'Reschedule', onClick: () => {} },
            { text: 'Learn more', href: '#' },
        ]}
        data-testid="actions"
    >
        Dates may still change before the term starts.
    </SectionMessage>
);

Actions.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const message = canvas.getByTestId('actions');
    await expect(within(message).getByRole('button', { name: 'Reschedule' })).toBeVisible();
    await expect(within(message).getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '#');
};

/* ------------------------------------------------------------------- states */

const StateMessage = ({ actions }) => (
    <SectionMessage appearance="warning" title="Two sessions overlap" actions={actions}>
        Monday at 4:00 PM is booked twice.
    </SectionMessage>
);
const messageRoot = (canvasElement) => within(canvasElement).getByRole('alert');
const dismissOf = (canvasElement) => within(canvasElement).getByRole('button', { name: 'Dismiss message' });

/** Rest: the warning ground, with the leading icon in the warning icon token. */
export const Rest = {
    render: () => <StateMessage />,
    play: async ({ canvasElement }) => {
        await expect(getComputedStyle(messageRoot(canvasElement)).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-warning'));
        await expect(getComputedStyle(canvasElement.querySelector('.plus-section-message-leading')).color).toBe(tokenColor(canvasElement, '--ds-icon-warning'));
    },
};

/** Hovered: the message does not react; Dismiss takes the subtle hovered ground. */
export const Hovered = {
    render: () => <StateMessage />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(messageRoot(canvasElement), ':hover', 'section message');
        await expectHovered(canvasElement, dismissOf(canvasElement), 'subtle', 'section message dismiss');
    },
};

/** Pressed: Dismiss takes the subtle pressed ground. */
export const Pressed = {
    render: () => <StateMessage />,
    play: async ({ canvasElement }) => {
        await expectPressed(canvasElement, dismissOf(canvasElement), 'subtle', 'section message dismiss');
    },
};

/** Focused: Dismiss and each action show the 2px ring. */
export const Focused = {
    render: () => <StateMessage actions={[{ text: 'Reschedule', onClick: () => {} }]} />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, dismissOf(canvasElement), 'section message dismiss');
        const action = within(canvasElement).getByRole('button', { name: 'Reschedule' });
        action.focus({ focusVisible: true });
        const style = getComputedStyle(action);
        await expect(style.outlineStyle).toBe('solid');
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        action.blur();
    },
};
