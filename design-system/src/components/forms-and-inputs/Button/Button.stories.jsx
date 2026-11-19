import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { footerTracks } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import Button, { BUTTON_APPEARANCES, BUTTON_SPACINGS } from './Button';
import { CountTag, FooterActions, Icon, SectionMessage } from '@/components';
const icons = {
    'none': null,
    'plus': 'plus',
    'xmark': 'xmark',
    'check': 'check',
    'arrow-right': 'arrow-right',
    'chevron-right': <Icon name="chevron-right" size={12} />,
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
        ground: '--ds-background-neutral', label: '--ds-text', icon: '--ds-icon',
        hovered: '--ds-background-neutral-hovered', pressed: '--ds-background-neutral-pressed',
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
    link: {
        ground: '--ds-background-neutral-subtle', label: '--ds-link', icon: '--ds-icon-brand',
        hovered: '--ds-background-neutral-subtle', pressed: '--ds-background-neutral-subtle',
    },
    'danger-link': {
        ground: '--ds-background-neutral-subtle', label: '--ds-text-danger', icon: '--ds-icon-danger',
        hovered: '--ds-background-neutral-subtle', pressed: '--ds-background-neutral-subtle',
    },
};

/** The link appearances draw no fill: hovering underlines the label and pressing darkens it. */
const LINK_PRESSED = { link: '--ds-link-pressed', 'danger-link': '--ds-text-danger-bolder' };

const label = (appearance) => appearance === 'ai' ? 'Generate summary' : appearance === 'danger-link' ? 'Danger link' : appearance.charAt(0).toUpperCase() + appearance.slice(1);
const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-xl) var(--inline-xl)', alignItems: 'center' };
/** A hover or pressed read with the transition out of the way. */
const settled = (button) => { button.style.transition = 'none'; };

export default {
    title: 'Components/Forms and inputs/Button/Button',
    component: Button,
    /** Hide CSF stories from the sidebar; docs live on Button.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
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
            // The prop takes any glyph name or node; the options are example glyphs.
            optionsUnchecked: true,
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'A Font Awesome Free glyph name, or a node, before the label.',
            table: { category: 'Content' }
        },
        iconAfter: {
            // The prop takes any glyph name or node; the options are example glyphs.
            optionsUnchecked: true,
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
            options: BUTTON_SPACINGS,
            description: 'Height and padding: `default` draws 32, `compact` draws 24, `spacious` draws 48. Compact is for tables and tight toolbars; spacious is for modal and panel footers.',
            table: { category: 'Design' }
        },
        shouldFitContainer: {
            control: 'boolean',
            description: 'Stretches the button to the width of its container, with the label centered.',
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
    play: async ({ canvas, canvasElement }) => {
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

/** Default draws 32, compact draws 24, spacious draws 48. Padding and radius come from tokens; the icon-to-label gap is 4. */
export const Spacing = {
    render: () => (
        <div style={row}>
            <Button appearance="primary" text="Default" iconBefore="plus" />
            <Button appearance="primary" spacing="compact" text="Compact" iconBefore="plus" />
            <Button appearance="primary" spacing="spacious" text="Spacious" iconBefore="plus" />
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        const defaults = canvas.getByRole('button', { name: 'Default' });
        const compact = canvas.getByRole('button', { name: 'Compact' });
        const spacious = canvas.getByRole('button', { name: 'Spacious' });
        await expect(Math.round(defaults.getBoundingClientRect().height), 'default height').toBe(32);
        await expect(Math.round(compact.getBoundingClientRect().height), 'compact height').toBe(24);
        await expect(Math.round(spacious.getBoundingClientRect().height), 'spacious height').toBe(48);
        await expect(Math.round(defaults.getBoundingClientRect().height), 'default --control-md').toBe(tokenLength(canvasElement, '--control-md'));
        await expect(Math.round(compact.getBoundingClientRect().height), 'compact --control-sm').toBe(tokenLength(canvasElement, '--control-sm'));
        await expect(Math.round(spacious.getBoundingClientRect().height), 'spacious --control-xl').toBe(tokenLength(canvasElement, '--control-xl'));
        await expect(px(getComputedStyle(defaults).borderTopLeftRadius), 'default radius').toBe(tokenLength(canvasElement, '--button-radius-default'));
        await expect(px(getComputedStyle(compact).borderTopLeftRadius), 'compact radius').toBe(tokenLength(canvasElement, '--button-radius-compact'));
        await expect(px(getComputedStyle(spacious).borderTopLeftRadius), 'spacious radius').toBe(tokenLength(canvasElement, '--button-radius-spacious'));
        await expect(px(getComputedStyle(defaults).paddingLeft), 'default padding').toBe(tokenLength(canvasElement, '--pad-x-md'));
        await expect(px(getComputedStyle(compact).paddingLeft), 'compact padding').toBe(tokenLength(canvasElement, '--pad-x-sm'));
        await expect(px(getComputedStyle(spacious).paddingLeft), 'spacious padding').toBe(tokenLength(canvasElement, '--pad-x-lg'));
        for (const button of [defaults, compact, spacious]) {
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
            <Button text="Both" iconBefore="user" iconAfter={<Icon name="chevron-right" size={12} />} />
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        const both = canvas.getByRole('button', { name: 'Both' });
        await expect(px(getComputedStyle(both.querySelector('.plus-btn-visual--before')).fontSize), 'leading icon is --icon-md').toBe(tokenLength(canvasElement, '--icon-md'));
        await expect(px(getComputedStyle(both.querySelector('.plus-btn-visual--after')).fontSize), 'chevron is --icon-sm').toBe(tokenLength(canvasElement, '--icon-sm'));
    },
};

/** Counts sit at 16 across compact (24), default (32) and spacious (48) buttons; filled appearances take `isInverse`. */
export const WithCount = {
    render: () => (
        <div style={{ display: 'grid', gap: 'var(--stack-lg)' }}>
            <div style={row}>
                <Button spacing="compact" iconAfter={<CountTag value={4} />} text="Compact 24" />
                <Button spacing="default" iconAfter={<CountTag value={4} />} text="Default 32" />
                <Button spacing="spacious" iconAfter={<CountTag value={4} />} text="Spacious 48" />
                <Button appearance="subtle" iconAfter={<CountTag value={4} />} text="Subtle" />
            </div>
            <div style={row}>
                <Button appearance="primary" spacing="compact" iconAfter={<CountTag value={4} isInverse />} text="Primary 24" />
                <Button appearance="primary" iconAfter={<CountTag value={4} isInverse />} text="Primary 32" />
                <Button appearance="primary" spacing="spacious" iconAfter={<CountTag value={4} isInverse />} text="Primary 48" />
                <Button appearance="warning" iconAfter={<CountTag value={4} isInverse />} text="Warning" />
                <Button appearance="danger" iconAfter={<CountTag value={4} isInverse />} text="Danger" />
                <Button appearance="discovery" iconAfter={<CountTag value={4} isInverse />} text="Discovery" />
                <Button appearance="ai" iconAfter={<CountTag value={4} isInverse />} text="AI" />
            </div>
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        const expectedHeights = [
            ['Compact 24', 24],
            ['Default 32', 32],
            ['Spacious 48', 48],
            ['Subtle', 32],
            ['Primary 24', 24],
            ['Primary 32', 32],
            ['Primary 48', 48],
            ['Warning', 32],
            ['Danger', 32],
            ['Discovery', 32],
            ['AI', 32],
        ];
        for (const [name, height] of expectedHeights) {
            const button = canvas.getByRole('button', { name: new RegExp(`^${name}\\b`) });
            const btnRect = button.getBoundingClientRect();
            const count = button.querySelector('.plus-count');
            const countRect = count.getBoundingClientRect();
            await expect(Math.round(btnRect.height), `${name} height`).toBe(height);
            await expect(countRect.height, `${name} count height`).toBe(16);
            await expect(
                Math.abs((countRect.top + countRect.bottom) / 2 - (btnRect.top + btnRect.bottom) / 2),
                `${name} count centered`,
            ).toBeLessThanOrEqual(0.5);
        }

        const surface = tokenColor(canvasElement, '--ds-surface');
        const subtleInk = tokenColor(canvasElement, '--ds-text-subtle');
        for (const name of ['Primary 24', 'Primary 32', 'Primary 48', 'Warning', 'Danger', 'Discovery', 'AI']) {
            const count = canvas.getByRole('button', { name: new RegExp(`^${name}\\b`) }).querySelector('.plus-count');
            const s = getComputedStyle(count);
            await expect(s.backgroundColor, `${name} uses inverse ground`).toBe(surface);
            await expect(s.color, `${name} uses inverse ink`).toBe(subtleInk);
        }
    },
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
    play: async ({ canvas, canvasElement }) => {
        const selected = canvas.getByRole('button', { name: 'Selected' });
        settled(selected);
        await expect(selected).toHaveAttribute('aria-pressed', 'true');
        await expect(getComputedStyle(selected).backgroundColor, 'selected ground').toBe(tokenColor(canvasElement, '--ds-background-selected'));
        await expect(getComputedStyle(selected).color, 'selected label').toBe(tokenColor(canvasElement, '--ds-text-selected'));
        await expect(getComputedStyle(selected).borderTopColor, 'selected edge').toBe(tokenColor(canvasElement, '--ds-border-selected'));
        await expect(withForcedPseudo(selected, ':hover', () => getComputedStyle(selected).backgroundColor), 'selected hovered').toBe(tokenColor(canvasElement, '--ds-background-selected-hovered'));
        await expect(withForcedPseudo(selected, ':active', () => getComputedStyle(selected).backgroundColor), 'selected pressed').toBe(tokenColor(canvasElement, '--ds-background-selected-pressed'));

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
        const spinner = loading.querySelector('.plus-spinner');
        await expect(spinner, 'the Spinner component draws the wait').not.toBeNull();
        await expect(spinner.parentElement).toHaveAttribute('aria-hidden', 'true');
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

/** An action that leaves, such as Save and exit or Open profile. Brand-colored text with no fill. */
export const Link = { render: () => <Button appearance="link" text="Save and exit" /> };

/** A footer's leading destructive action, such as Delete or Discard. Danger-colored text with no fill. */
export const DangerLink = { render: () => <Button appearance="danger-link" text="Delete draft" /> };

/** The call to action for a new experience. */
export const Discovery = { render: () => <Button appearance="discovery" text="Try the new schedule view" /> };

/** The one primary AI action in a region. */
export const Ai = { render: () => <Button appearance="ai" text="Generate summary" /> };

/** Compact spacing, 24 high, for tables and toolbars. */
export const Compact = {
    render: () => <Button appearance="primary" spacing="compact" text="Compact" />,
    play: async ({ canvas }) => {
        const button = canvas.getByRole('button', { name: 'Compact' });
        await expect(Math.round(button.getBoundingClientRect().height)).toBe(24);
    },
};

/** Spacious spacing, 48 high, for modal and panel footers. */
export const Spacious = {
    render: () => <Button appearance="primary" spacing="spacious" text="Spacious" />,
    play: async ({ canvas }) => {
        const button = canvas.getByRole('button', { name: 'Spacious' });
        await expect(Math.round(button.getBoundingClientRect().height)).toBe(48);
    },
};

/** Selected sets `aria-pressed`. */
export const Selected = { render: () => <Button text="Selected" isSelected /> };

/** Disabled is a change of color, not of opacity. */
export const Disabled = { render: () => <Button appearance="primary" text="Disabled" isDisabled /> };

/** Loading swaps the label for a 16 Spinner, across all spacings, and blocks interaction. */
export const Loading = {
    render: () => (
        <div style={row}>
            <Button appearance="primary" text="Loading" isLoading />
            <Button appearance="primary" spacing="compact" text="Compact loading" isLoading />
            <Button appearance="primary" spacing="spacious" text="Spacious loading" isLoading />
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        const icon = tokenLength(canvasElement, '--icon-md');
        for (const name of ['Loading', 'Compact loading', 'Spacious loading']) {
            const button = canvas.getByRole('button', { name });
            const spinner = button.querySelector('.plus-spinner');
            await expect(spinner, `${name}: renders the Spinner`).not.toBeNull();
            await expect(spinner.getBoundingClientRect().width, `${name}: sized by the icon token`).toBe(icon);
            await expect(getComputedStyle(spinner).borderTopColor, `${name}: in the label color`).toBe(getComputedStyle(button).color);
        }
    },
};

/** An enabled action that is not ready explains what is missing when it is pressed. */
export const ExplainsOnPress = {
    render: () => {
        const Demo = () => {
            const [pressed, setPressed] = React.useState(false);
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--stack-md)', maxWidth: '360px' }}>
                    <Button appearance="primary" text="Save notes" onClick={() => setPressed(true)} />
                    {pressed && <SectionMessage appearance="warning">Add the session notes before saving.</SectionMessage>}
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvas, canvasElement }) => {
        const save = canvas.getByRole('button', { name: 'Save notes' });
        await expect(save).toBeEnabled();
        await expect(canvas.queryByText('Add the session notes before saving.')).toBeNull();
        await userEvent.click(save);
        await waitFor(() => expect(canvas.getByText('Add the session notes before saving.')).toBeVisible());
        await expect(save).toBeEnabled();
    },
};

/** Fills the width of its container, with the label centered. */
export const FitContainer = {
    render: () => (
        <div data-testid="fit-host" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <Button appearance="primary" text="Full width button" shouldFitContainer />
            <Button spacing="spacious" text="Spacious full width" shouldFitContainer />
        </div>
    ),
    play: async ({ canvas }) => {
        const host = canvas.getByTestId('fit-host');
        const hostRect = host.getBoundingClientRect();
        for (const [name, expectedHeight] of [['Full width button', 32], ['Spacious full width', 48]]) {
            const button = canvas.getByRole('button', { name });
            const btnRect = button.getBoundingClientRect();
            const textRect = button.querySelector('.plus-btn-text').getBoundingClientRect();
            await expect(Math.round(btnRect.width), `${name} stretches to parent width`).toBe(Math.round(hostRect.width));
            await expect(Math.round(btnRect.height), `${name} height`).toBe(expectedHeight);
            const btnCenter = btnRect.left + btnRect.width / 2;
            const textCenter = textRect.left + textRect.width / 2;
            await expect(Math.abs(textCenter - btnCenter), `${name} label is centered`).toBeLessThanOrEqual(1);
        }
    },
};

/** A label that does not fit ends in an ellipsis; the full text stays readable. */
export const Truncation = {
    render: () => (
        <div style={{ width: '160px' }}>
            <Button text="This text is truncated to fit within the container" />
        </div>
    ),
    play: async ({ canvas }) => {
        const button = canvas.getByRole('button');
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
 * bold appearance its own bold step, default the neutral step, and subtle the
 * neutral subtle step.
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
    play: async ({ canvas, canvasElement }) => {
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

/** A link appearance keeps a clear ground in every state, underlines on hover and darkens its label on press. */
export const LinkStates = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={row}>
            <Button appearance="link" text="Link" />
            <Button appearance="danger-link" text="Danger link" />
            <Button appearance="link" text="Link disabled" isDisabled />
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        for (const appearance of ['link', 'danger-link']) {
            const button = canvas.getByRole('button', { name: label(appearance) });
            settled(button);
            await expect(getComputedStyle(button).textDecorationLine, `${appearance} rest`).toBe('none');
            // Read inside the callback: the computed style is live, and the forced state is gone once it returns.
            const hoveredLine = withForcedPseudo(button, ':hover', () => getComputedStyle(button).textDecorationLine);
            await expect(hoveredLine, `${appearance} hovered underline`).toBe('underline');
            await expect(withForcedPseudo(button, ':active', () => getComputedStyle(button).color), `${appearance} pressed label`).toBe(tokenColor(canvasElement, LINK_PRESSED[appearance]));
        }
        const disabled = canvas.getByRole('button', { name: 'Link disabled' });
        await expect(getComputedStyle(disabled).backgroundColor, 'disabled keeps no fill').toBe('rgba(0, 0, 0, 0)');
        await expect(getComputedStyle(disabled).color, 'disabled label').toBe(tokenColor(canvasElement, '--ds-text-disabled'));
    },
};

/** Tabbing onto a button draws the 2px focus ring 2px off its edge, and keeps the rest fill. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <Button text="Save" />,
    play: async ({ canvas, canvasElement }) => {
        const button = canvas.getByRole('button', { name: 'Save' });
        settled(button);
        await userEvent.tab();
        await expect(document.activeElement).toBe(button);
        const style = getComputedStyle(button);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth), 'ring width').toBe(2);
        await expect(px(style.outlineOffset), 'ring gap').toBe(2);
        await expect(style.outlineColor, 'ring color').toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(style.backgroundColor, 'focus keeps the rest fill').toBe(tokenColor(canvasElement, '--ds-background-neutral'));
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
    play: async ({ canvas }) => {
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
AnchorHref.play = async ({ canvas }) => {
    const link = canvas.getByTestId('anchor-href');
    await expect(link.tagName).toBe('A');
    await expect(link).toHaveAttribute('href', 'https://example.com/schedule');
};

const ANATOMY_PARTS = [
    { selector: '[data-testid="button-anatomy"]', label: 'Container', side: 'top', at: 'start', holds: true },
    { selector: '[data-testid="button-anatomy"] .plus-btn-visual--before', label: 'Icon before', side: 'start', at: 'middle' },
    { selector: '[data-testid="button-anatomy"] .plus-btn-text', label: 'Label', side: 'top', at: 'middle' },
    { selector: '[data-testid="button-anatomy"] .plus-btn-visual--after', label: 'Icon after', side: 'end', at: 'middle' },
];

/** Anatomy: soft neutral container with no border, optional leading icon, medium-weight label and optional trailing chevron. */
export const Anatomy = {
    render: () => (
        <LiveAnatomy live scrollable width={280} title="A button with its container, leading icon, label and trailing chevron numbered" parts={ANATOMY_PARTS}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--pad-y-lg) var(--pad-x-lg)' }}>
                <Button
                    testId="button-anatomy"
                    text="Session options"
                    iconBefore="calendar"
                    iconAfter={<Icon name="chevron-down" size={12} />}
                />
            </div>
        </LiveAnatomy>
    ),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const btn = canvas.getByTestId('button-anatomy');
        settled(btn);
        const cs = getComputedStyle(btn);
        await expect(cs.backgroundColor, 'soft neutral fill').toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await expect(cs.borderTopColor, 'default draws no visible border').toBe('rgba(0, 0, 0, 0)');
        await expect(px(cs.height), 'default spacing draws 32').toBe(tokenLength(canvasElement, '--control-md'));
        await expect(canvasElement.querySelectorAll('[data-anatomy-marker]')).toHaveLength(4);
        btn.focus();
        await expect(btn).toHaveFocus();
    },
};

const footerStageStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--stack-lg)',
    width: '100%',
    maxWidth: '560px',
};

const footerCardStyle = {
    padding: 'var(--pad-y-md) var(--pad-x-lg)',
    borderRadius: 'var(--card-radius)',
    border: 'var(--border-width-default) solid var(--ds-border)',
    background: 'var(--ds-surface-overlay)',
};

const footerCaptionStyle = {
    margin: '0 0 var(--stack-sm)',
    color: 'var(--ds-text-subtle)',
    font: 'var(--body-sm)',
};

/** Footer tracks (r5): 4 equal tracks inside container padding, spacious (48) buttons with shouldFitContainer. */
export const FooterLayouts = {
    render: () => (
        <div style={footerStageStyle}>
            <div style={footerCardStyle}>
                <p style={footerCaptionStyle}>One button — right half (tracks 3–4)</p>
                <FooterActions data-testid="footer-one">
                    <Button appearance="primary" text="Done" />
                </FooterActions>
            </div>
            <div style={footerCardStyle}>
                <p style={footerCaptionStyle}>Two buttons — 50/50 split, soft neutral secondary left, primary right</p>
                <FooterActions data-testid="footer-two">
                    <Button text="Discard" />
                    <Button appearance="primary" text="Save changes" />
                </FooterActions>
            </div>
            <div style={footerCardStyle}>
                <p style={footerCaptionStyle}>Three buttons — tracks 2, 3 and 4, rightmost primary</p>
                <FooterActions data-testid="footer-three">
                    <Button text="Save draft" />
                    <Button text="Preview" />
                    <Button appearance="primary" text="Publish" />
                </FooterActions>
            </div>
            <div style={footerCardStyle}>
                <p style={footerCaptionStyle}>Declining action — "Not now" is a default secondary in the left half</p>
                <FooterActions data-testid="footer-decline">
                    <Button text="Not now" />
                    <Button appearance="primary" text="Turn on reminders" />
                </FooterActions>
            </div>
            <div style={footerCardStyle}>
                <p style={footerCaptionStyle}>Leading action — a danger side action hugs the left edge; the two outcomes take tracks 3 and 4</p>
                <FooterActions data-testid="footer-leading">
                    <Button appearance="danger" text="Delete" />
                    <Button text="Save draft" />
                    <Button appearance="primary" text="Publish" />
                </FooterActions>
            </div>
            <div style={footerCardStyle}>
                <p style={footerCaptionStyle}>Destructive — safer alternative left, danger primary right, 50/50</p>
                <FooterActions data-testid="footer-destructive">
                    <Button text="Archive instead" />
                    <Button appearance="danger" text="Delete session" />
                </FooterActions>
            </div>
            <div style={footerCardStyle}>
                <p style={footerCaptionStyle}>Steps — Back and Next split 50/50</p>
                <FooterActions data-testid="footer-steps">
                    <Button text="Back" />
                    <Button appearance="primary" text="Next" />
                </FooterActions>
            </div>
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        const close = (a, b) => Math.abs(a - b) <= 1.5;

        const one = canvas.getByTestId('footer-one');
        const oneTracks = footerTracks(one);
        const done = within(one).getByRole('button', { name: 'Done' });
        await expect(close(done.getBoundingClientRect().left, oneTracks.span(3, 4).left), '1 button starts at track 3').toBe(true);
        await expect(close(done.getBoundingClientRect().right, oneTracks.span(3, 4).right), '1 button ends at track 4').toBe(true);
        await expect(close(done.getBoundingClientRect().height, 48), 'footer buttons draw 48 high').toBe(true);
        await expect(done).toHaveClass('plus-btn--spacious');
        await expect(done).toHaveClass('plus-btn--fit-container');

        const two = canvas.getByTestId('footer-two');
        const twoTracks = footerTracks(two);
        const discard = within(two).getByRole('button', { name: 'Discard' });
        const save = within(two).getByRole('button', { name: 'Save changes' });
        settled(discard);
        await expect(getComputedStyle(discard).backgroundColor, 'secondary uses soft neutral fill').toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await expect(close(discard.getBoundingClientRect().left, twoTracks.span(1, 2).left), 'secondary starts at track 1').toBe(true);
        await expect(close(discard.getBoundingClientRect().width, save.getBoundingClientRect().width), '50/50 equal widths').toBe(true);
        await expect(close(save.getBoundingClientRect().right, twoTracks.span(3, 4).right), 'primary ends at track 4').toBe(true);

        const three = canvas.getByTestId('footer-three');
        const threeTracks = footerTracks(three);
        const draft = within(three).getByRole('button', { name: 'Save draft' });
        const publish = within(three).getByRole('button', { name: 'Publish' });
        await expect(close(draft.getBoundingClientRect().left, threeTracks.track(2).left), 'first of 3 starts at track 2').toBe(true);
        await expect(close(publish.getBoundingClientRect().left, threeTracks.track(4).left), 'third of 3 starts at track 4').toBe(true);

        const leading = canvas.getByTestId('footer-leading');
        const leadingTracks = footerTracks(leading);
        const del = within(leading).getByRole('button', { name: 'Delete' });
        const saveDraft = within(leading).getByRole('button', { name: 'Save draft' });
        await expect(del).not.toHaveClass('plus-btn--fit-container');
        await expect(close(del.getBoundingClientRect().left, leadingTracks.box.left), 'danger action hugs left edge').toBe(true);
        await expect(close(saveDraft.getBoundingClientRect().left, leadingTracks.track(3).left), 'filled pair starts at track 3').toBe(true);

        const decline = canvas.getByTestId('footer-decline');
        const declineTracks = footerTracks(decline);
        const notNow = within(decline).getByRole('button', { name: 'Not now' });
        await expect(notNow, 'declining is a default secondary, not subtle').toHaveClass('plus-btn--default');
        await expect(notNow).toHaveClass('plus-btn--fit-container');
        await expect(close(notNow.getBoundingClientRect().left, declineTracks.span(1, 2).left), 'secondary starts at track 1').toBe(true);
    },
};
