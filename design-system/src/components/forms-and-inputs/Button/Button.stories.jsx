import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import Button, { BUTTON_APPEARANCES } from './Button';

const icons = {
    'none': null,
    'plus': 'plus',
    'xmark': 'xmark',
    'check': 'check',
    'arrow-right': 'arrow-right',
    'chevron-right': 'chevron-right',
    'star': 'star',
    'user': 'user',
    'trash': 'trash',
    'upload': 'upload'
};

/**
 * What each appearance paints, by token: ground, label, icon, hovered and
 * pressed ground, and the edge. The tests read the cascade against these, so a
 * rule that drifts from the token fails here.
 */
const PAINT = {
    default: {
        ground: '--ds-background-neutral-subtle', label: '--ds-text-subtle', icon: '--ds-icon-subtle',
        hovered: '--ds-background-neutral-subtle-hovered', pressed: '--ds-background-neutral-subtle-pressed',
        edge: '--ds-border-input',
    },
    primary: {
        ground: '--ds-background-brand-bold', label: '--ds-text-inverse', icon: '--ds-icon-inverse',
        hovered: '--ds-background-brand-bold-hovered', pressed: '--ds-background-brand-bold-pressed',
    },
    subtle: {
        ground: '--ds-background-neutral-subtle', label: '--ds-text-subtle', icon: '--ds-icon-subtle',
        hovered: '--ds-background-neutral-subtle-hovered', pressed: '--ds-background-neutral-subtle-pressed',
    },
    warning: {
        ground: '--ds-background-warning-bold', label: '--ds-text-warning-inverse', icon: '--ds-icon-warning-inverse',
        hovered: '--ds-background-warning-bold-hovered', pressed: '--ds-background-warning-bold-pressed',
    },
    danger: {
        ground: '--ds-background-danger-bold', label: '--ds-text-inverse', icon: '--ds-icon-inverse',
        hovered: '--ds-background-danger-bold-hovered', pressed: '--ds-background-danger-bold-pressed',
    },
    ai: {
        ground: '--ds-ai-background-bold', label: '--ds-text-inverse', icon: '--ds-icon-inverse',
        hovered: '--ds-ai-background-bold-hovered', pressed: '--ds-ai-background-bold-pressed',
    },
    discovery: {
        ground: '--ds-background-discovery-bold', label: '--ds-text-inverse', icon: '--ds-icon-inverse',
        hovered: '--ds-background-discovery-bold-hovered', pressed: '--ds-background-discovery-bold-pressed',
    },
};

const label = (appearance) => appearance === 'ai' ? 'Generate summary' : appearance.charAt(0).toUpperCase() + appearance.slice(1);
const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
/** A hover or pressed read with the transition out of the way. */
const settled = (button) => { button.style.transition = 'none'; };

export default {
    title: 'Components/Forms and inputs/Button/Button',
    component: Button,
    /** Hide CSF stories from the sidebar; docs live on Button.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'Props: `appearance` (default, primary, subtle, warning, danger, discovery), `spacing` (default 32, compact 24), `isSelected`, `isDisabled`, `isLoading`, `shouldFitContainer`, `iconBefore` and `iconAfter`. Radius is 6 at default spacing and 4 at compact, the icon-to-label gap is 4, and hover and pressed take named tokens.' },
            { date: '2026-11-05', kind: 'added', summary: 'Appearance `ai`: the one primary AI action in a region, on `--ds-ai-background-bold` with the sparkle always drawn before its label.' },
        ],
        docs: {
            toc: {
                title: 'On this page'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        // CONTENT
        text: {
            control: 'text',
            description: 'The label. Children work too.',
            table: { category: 'Content' }
        },
        iconBefore: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'A Font Awesome Free glyph name, or a node, before the label.',
            table: { category: 'Content' }
        },
        iconAfter: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'A Font Awesome Free glyph name, or a node, after the label.',
            table: { category: 'Content' }
        },

        // DESIGN
        appearance: {
            control: 'select',
            options: BUTTON_APPEARANCES,
            description: 'The visual style.',
            table: { category: 'Design' }
        },
        spacing: {
            control: 'inline-radio',
            options: ['default', 'compact'],
            description: 'Height and padding: `default` draws 32, `compact` draws 24. Compact is for tables and tight toolbars.',
            table: { category: 'Design' }
        },
        shouldFitContainer: {
            control: 'boolean',
            description: 'Stretches the button to the width of its container.',
            table: { category: 'Design' }
        },

        // BEHAVIOR
        isDisabled: {
            control: 'boolean',
            description: 'Prevents interaction. Avoid it; see Usage.',
            table: { category: 'Behavior' }
        },
        isSelected: {
            control: 'boolean',
            description: 'Marks the button selected and sets `aria-pressed`.',
            table: { category: 'Behavior' }
        },
        isLoading: {
            control: 'boolean',
            description: 'Shows a spinner in place of the label and blocks interaction.',
            table: { category: 'Behavior' }
        },
        href: {
            table: { disable: true, category: 'Behavior' }
        },
        target: {
            table: { disable: true, category: 'Behavior' }
        },
        type: {
            table: { disable: true, category: 'Behavior' }
        },

        // DEVELOPMENT
        title: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        as: {
            table: { disable: true, category: 'Development' }
        }
    }
};

/**
 * Docs-only: hero `Overview` on Button.mdx (React preview + source from PLUS web-app).
 */
export const Overview = {
    parameters: {
        docs: {
            source: {
                language: 'jsx',
                code: webAppSourceSnippets.button
            }
        }
    },
    render: () => <Button text="Button" appearance="primary" />
};

/** One of each appearance. */
export const Appearances = {
    render: () => (
        <div style={row}>
            {BUTTON_APPEARANCES.map((appearance) => (
                <Button key={appearance} appearance={appearance} text={label(appearance)} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const [appearance, paint] of Object.entries(PAINT)) {
            const button = canvas.getByRole('button', { name: label(appearance) });
            settled(button);
            const style = getComputedStyle(button);
            await expect(style.backgroundColor, `${appearance} ground`).toBe(tokenColor(canvasElement, paint.ground));
            await expect(style.color, `${appearance} label`).toBe(tokenColor(canvasElement, paint.label));
            const edge = paint.edge ? tokenColor(canvasElement, paint.edge) : 'rgba(0, 0, 0, 0)';
            await expect(style.borderTopColor, `${appearance} edge`).toBe(edge);
        }
    },
};

/** Default draws 32; compact draws 24. Radius is 6 and 4, the icon-to-label gap 4. */
export const Spacing = {
    render: () => (
        <div style={row}>
            <Button appearance="primary" text="Default" iconBefore="plus" />
            <Button appearance="primary" spacing="compact" text="Compact" iconBefore="plus" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const defaults = canvas.getByRole('button', { name: 'Default' });
        const compact = canvas.getByRole('button', { name: 'Compact' });
        await expect(Math.round(defaults.getBoundingClientRect().height), 'default height').toBe(32);
        await expect(Math.round(compact.getBoundingClientRect().height), 'compact height').toBe(24);
        await expect(px(getComputedStyle(defaults).borderTopLeftRadius), 'default radius').toBe(6);
        await expect(px(getComputedStyle(compact).borderTopLeftRadius), 'compact radius').toBe(4);
        await expect(px(getComputedStyle(defaults).paddingLeft), 'default padding').toBe(tokenLength(canvasElement, '--pad-x-md'));
        await expect(px(getComputedStyle(compact).paddingLeft), 'compact padding').toBe(tokenLength(canvasElement, '--pad-x-sm'));
        for (const button of [defaults, compact]) {
            await expect(px(getComputedStyle(button).columnGap), 'icon-to-label gap').toBe(4);
            await expect(px(getComputedStyle(button.querySelector('.plus-btn-visual i')).fontSize), 'icon size').toBe(16);
            const text = getComputedStyle(button.querySelector('.plus-btn-text'));
            await expect(text.fontSize, 'label size').toBe('14px');
            await expect(text.fontWeight, 'label weight').toBe('500');
        }
    },
};

/** Icons before and after the label. */
export const Icons = {
    render: () => (
        <div style={row}>
            <Button text="Icon before" iconBefore="star" />
            <Button text="Icon after" iconAfter="arrow-right" />
            <Button text="Both" iconBefore="user" iconAfter="chevron-right" />
        </div>
    ),
};

/** Selected, disabled and loading. */
export const States = {
    render: () => (
        <div style={row}>
            <Button text="Selected" isSelected />
            <Button text="Disabled" appearance="primary" isDisabled />
            <Button text="Loading" appearance="primary" isLoading />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const selected = canvas.getByRole('button', { name: 'Selected' });
        settled(selected);
        await expect(selected).toHaveAttribute('aria-pressed', 'true');
        await expect(getComputedStyle(selected).backgroundColor, 'selected ground').toBe(tokenColor(canvasElement, '--ds-background-selected'));
        await expect(getComputedStyle(selected).color, 'selected label').toBe(tokenColor(canvasElement, '--ds-text-selected'));

        const disabled = canvas.getByRole('button', { name: 'Disabled' });
        settled(disabled);
        await expect(disabled).toBeDisabled();
        await expect(getComputedStyle(disabled).backgroundColor, 'disabled ground').toBe(tokenColor(canvasElement, '--ds-background-disabled'));
        await expect(getComputedStyle(disabled).color, 'disabled label').toBe(tokenColor(canvasElement, '--ds-text-disabled'));
        await expect(getComputedStyle(disabled).opacity, 'a color change, not a dim').toBe('1');

        const loading = canvas.getByRole('button', { name: 'Loading' });
        settled(loading);
        await expect(loading).toBeDisabled();
        await expect(loading).toHaveAttribute('aria-busy', 'true');
        await expect(getComputedStyle(loading).backgroundColor, 'loading keeps its ground').toBe(tokenColor(canvasElement, PAINT.primary.ground));
        await expect(getComputedStyle(loading.querySelector('.plus-btn-text')).opacity, 'label is hidden').toBe('0');
        await expect(getComputedStyle(loading, '::after').content, 'spinner').not.toBe('none');
    },
};

/** The default appearance: most actions that are not the main call to action. */
export const Default = { render: () => <Button text="Reschedule session" /> };

/** The main call to action of a page or area. */
export const Primary = { render: () => <Button appearance="primary" text="Book session" /> };

/** Secondary actions beside a primary button. */
export const Subtle = { render: () => <Button appearance="subtle" text="Cancel" /> };

/** Confirms an action that may cause a significant change. */
export const Warning = { render: () => <Button appearance="warning" text="Remove from this week" /> };

/** The final confirmation of a destructive action. */
export const Danger = { render: () => <Button appearance="danger" text="Delete session recording" /> };

/** The call to action for a new experience. */
export const Discovery = { render: () => <Button appearance="discovery" text="Try the new schedule view" /> };

/** The one primary AI action in a region. */
export const Ai = { render: () => <Button appearance="ai" text="Generate summary" /> };

/** Compact spacing, 24 high, for tables and toolbars. */
export const Compact = { render: () => <Button appearance="primary" spacing="compact" text="Compact" /> };

/** Selected sets `aria-pressed`. */
export const Selected = { render: () => <Button text="Selected" isSelected /> };

/** Disabled is a change of color, not of opacity. */
export const Disabled = { render: () => <Button appearance="primary" text="Disabled" isDisabled /> };

/** Loading swaps the label for a spinner and blocks interaction. */
export const Loading = { render: () => <Button appearance="primary" text="Loading" isLoading /> };

/** Fills the width of its container. */
export const FitContainer = {
    render: () => (
        <div style={{ width: '320px' }}>
            <Button appearance="primary" text="Full width button" shouldFitContainer />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Full width button' });
        await expect(Math.round(button.getBoundingClientRect().width)).toBe(320);
    },
};

/** A label that does not fit ends in an ellipsis; the full text stays readable. */
export const Truncation = {
    render: () => (
        <div style={{ width: '160px' }}>
            <Button text="This text is truncated to fit within the container" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button');
        const text = button.querySelector('.plus-btn-text');
        await expect(getComputedStyle(text).textOverflow).toBe('ellipsis');
        await expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(160);
        await expect(button).toHaveAccessibleName('This text is truncated to fit within the container');
    },
};

/**
 * Interactive Playground
 */
export const Interactive = {
    args: {
        text: 'Interactive Button',
        appearance: 'default',
        spacing: 'default',
        iconBefore: 'none',
        iconAfter: 'none',
        isDisabled: false,
        isSelected: false,
        isLoading: false,
        shouldFitContainer: false
    },
    render: ({ isSelected, ...args }) => <Button {...args} isSelected={isSelected || undefined} />
};

/**
 * Hover and pressed take the named tokens, laid straight on the container: a
 * bold appearance its own bold step, default and subtle the neutral subtle
 * step.
 */
export const StateSteps = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            {BUTTON_APPEARANCES.map((appearance) => (
                <Button key={appearance} appearance={appearance} text={label(appearance)} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const read = (button, pseudo) => {
            settled(button);
            return withForcedPseudo(button, pseudo, () => getComputedStyle(button).backgroundColor);
        };
        for (const [appearance, paint] of Object.entries(PAINT)) {
            const button = canvas.getByRole('button', { name: label(appearance) });
            await expect(read(button, ':hover'), `${appearance} hovered`).toBe(tokenColor(canvasElement, paint.hovered));
            await expect(read(button, ':active'), `${appearance} pressed`).toBe(tokenColor(canvasElement, paint.pressed));
        }
    },
};

/** Tabbing onto a button draws the 2px focus ring 2px off its edge, and no fill. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <Button text="Save" />,
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Save' });
        settled(button);
        await userEvent.tab();
        await expect(document.activeElement).toBe(button);
        const style = getComputedStyle(button);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth), 'ring width').toBe(2);
        await expect(px(style.outlineOffset), 'ring gap').toBe(2);
        await expect(style.outlineColor, 'ring color').toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(style.backgroundColor, 'no focus fill').toBe('rgba(0, 0, 0, 0)');
    },
};

/**
 * `href` renders a real anchor — role="button" by default, Enter and Space
 * both fire `onClick`, and a disabled anchor drops its `href` so it can't
 * navigate (no native `disabled` attribute exists for an `<a>`).
 */
export const AnchorKeyboard = {
    parameters: { docs: { disable: true } },
    render: (args) => {
        const [clicks, setClicks] = React.useState(0);
        return (
            <div style={row}>
                {/*
                 * A trivial `#` href, not a real destination: Enter and
                 * Space both fire a real browser navigation on a focused
                 * anchor unless the click is swallowed, and only a trivial
                 * href is swallowed (see Button.jsx's `isTrivialHref`) — a
                 * real `href` navigating away mid-test would crash the
                 * browser context this play function runs in.
                 */}
                <Button text="Enabled link" href="#" onClick={() => setClicks((n) => n + 1)} testId="anchor-enabled" />
                <Button text="Disabled link" href="https://example.com" isDisabled onClick={() => setClicks((n) => n + 1)} testId="anchor-disabled" />
                <p data-testid="anchor-clicks">{clicks}</p>
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByTestId('anchor-enabled');
        await expect(link.tagName).toBe('A');
        await expect(link).toHaveAttribute('role', 'button');

        link.focus();
        await expect(link).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        await waitFor(() => expect(canvas.getByTestId('anchor-clicks').textContent).toBe('2'));

        const disabledLink = canvas.getByTestId('anchor-disabled');
        await expect(disabledLink).not.toHaveAttribute('href');
        await expect(disabledLink).toHaveAttribute('aria-disabled', 'true');
        await expect(disabledLink).not.toHaveAttribute('tabindex');
    },
};

/** A real `href` renders on the anchor untouched — only ever exercised by attribute, never activated (a real destination navigating away would crash the test's browser context). */
export const AnchorHref = () => (
    <Button text="Open schedule" href="https://example.com/schedule" testId="anchor-href" />
);
AnchorHref.parameters = { docs: { disable: true } };
AnchorHref.play = async ({ canvasElement }) => {
    const link = within(canvasElement).getByTestId('anchor-href');
    await expect(link.tagName).toBe('A');
    await expect(link).toHaveAttribute('href', 'https://example.com/schedule');
};
