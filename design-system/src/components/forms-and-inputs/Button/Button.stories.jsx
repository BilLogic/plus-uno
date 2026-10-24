import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Button from './Button';
import { ButtonSizesFilledRowContainer } from './button-segmented-demos.jsx';

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

export default {
    title: 'Components/Forms and inputs/Button',
    component: Button,
    /** Hide CSF stories from the sidebar; docs live on Button.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-24', kind: 'changed', summary: 'Pressed lays the 12 state layer, a step past hover\'s 08. Keyboard focus draws the 2px focus ring 2px off the edge, with no fill.' },
            { date: '2026-10-23', kind: 'changed', summary: '`medium` draws 32 and `small` draws 24 compact, for table rows and inline toolbars only. Every label is Body/default (14/20) at the medium weight, and every icon draws at 16.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="large"` was deprecated: it draws like `medium` and warns in development.' },
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
            description: 'Button label text',
            table: { category: 'Content' }
        },
        leadingVisual: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'Icon at start of button',
            table: { category: 'Content' }
        },
        trailingVisual: {
            control: 'select',
            options: Object.keys(icons),
            mapping: icons,
            description: 'Icon at end of button',
            table: { category: 'Content' }
        },

        // DESIGN
        style: {
            control: 'select',
            options: [
                'primary', 'secondary', 'tertiary',
                'success', 'warning', 'danger', 'info',
                'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools', 'default'
            ],
            table: { category: 'Design' }
        },
        fill: {
            control: 'select',
            options: ['filled', 'tonal', 'outline', 'ghost'],
            table: { category: 'Design' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: '`medium` 32 (default) · `small` 24 compact, for table rows and inline toolbars only · `large` deprecated, draws like `medium`',
            table: { category: 'Design' }
        },
        vertical: {
            table: { disable: true, category: 'Design' }
        },
        block: {
            control: 'boolean',
            description: 'Full width button',
            table: { category: 'Design' }
        },

        // BEHAVIOR
        disabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        active: {
            table: { disable: true, category: 'Behavior' }
        },
        loading: {
            control: 'boolean',
            description: 'Show loading spinner',
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
 * Docs-only: hero `Overview` on Button.mdx (React preview + HTML source from PLUS web-app).
 * The canvas uses the design-system `Button`; the code panel is overridden to match production
 * (JSP + Bootstrap `btn btn-primary` in `java/docroot/...`).
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
    render: () => <Button text="Button" style="primary" fill="filled" size="medium" />
};

/** Docs-only embed for Button.mdx (`Canvas`); sidebar hidden via meta `!dev`. */
export const SizesFilledRow = {
    render: () => <ButtonSizesFilledRowContainer />
};

/**
 * Interactive Playground
 */
export const Interactive = {
    args: {
        text: 'Interactive Button',
        style: 'primary',
        fill: 'filled',
        size: 'medium',
        leadingVisual: 'none',
        trailingVisual: 'none',
        disabled: false,
        loading: false,
        block: false
    },
    render: args => <Button {...args} />
};

/**
 * The state steps, read from the cascade: hover lays the 08 state layer,
 * pressed the 12. A filled or tonal button lays the shadow layer over its
 * fill; an outline or ghost button takes its intent's own layer.
 */
export const StateSteps = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--element-inline-md)' }}>
            <Button text="Filled" style="primary" fill="filled" />
            <Button text="Tonal" style="primary" fill="tonal" />
            <Button text="Outline" style="primary" fill="outline" />
            <Button text="Ghost" style="primary" fill="ghost" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const read = (button, pseudo, measure) => {
            button.style.transition = 'none';
            return withForcedPseudo(button, pseudo, () => measure(getComputedStyle(button)));
        };
        const layer = (style) => style.getPropertyValue('--plus-btn-state-layer').trim();

        for (const name of ['Filled', 'Tonal']) {
            const button = canvas.getByRole('button', { name });
            await expect(read(button, ':hover', layer), `${name} hover`).toBe(tokenColor(canvasElement, '--color-shadow-state-08'));
            await expect(read(button, ':active', layer), `${name} pressed`).toBe(tokenColor(canvasElement, '--color-shadow-state-12'));
        }
        for (const name of ['Outline', 'Ghost']) {
            const button = canvas.getByRole('button', { name });
            const fill = (style) => style.backgroundColor;
            await expect(read(button, ':hover', fill), `${name} hover`).toBe(tokenColor(canvasElement, '--color-primary-state-08'));
            await expect(read(button, ':active', fill), `${name} pressed`).toBe(tokenColor(canvasElement, '--color-primary-state-12'));
        }
    },
};

/** Tabbing onto a button draws the 2px focus ring 2px off its edge, and no fill. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <Button text="Save" style="primary" fill="outline" />,
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Save' });
        button.style.transition = 'none';
        await userEvent.tab();
        await expect(document.activeElement).toBe(button);
        const style = getComputedStyle(button);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth), 'ring width').toBe(2);
        await expect(px(style.outlineOffset), 'ring gap').toBe(2);
        await expect(style.outlineColor, 'ring color').toBe(tokenColor(canvasElement, '--color-focus-ring'));
        await expect(style.backgroundColor, 'no focus fill').toBe('rgba(0, 0, 0, 0)');
    },
};
