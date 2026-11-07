import React from 'react';
import { expect, within } from 'storybook/test';

import { contrastRatio } from '@/storybook-docs/lib/contrast.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import CloseButton from './CloseButton';
import { INVERSE_GROUNDS } from './inverseGrounds.js';

const row = { display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' };
const inverseGround = {
    ...row,
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--ds-background-neutral-bold)',
};
const primaryGround = { ...inverseGround, background: 'var(--ds-background-brand-bold)' };

export default {
    title: 'Components/Forms and inputs/Button/Close button',
    component: CloseButton,
    /** Hide CSF stories from the sidebar; docs live on CloseButton.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'An Icon button, subtle. `what` is gone: `label` is the required accessible name. `spacing` added (default 32, compact 24).' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        label: { control: 'text', description: '"Close" for a surface that blocks; "Dismiss {what}" for a message', table: { category: 'Content' } },
        tone: { control: 'inline-radio', options: ['default', 'inverse'], description: '`default` on neutral surfaces; `inverse` only on the declared colored and dark grounds', table: { category: 'Design' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        onClick: { table: { disable: true } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
    args: { label: 'Close', tone: 'default', spacing: 'default' },
};

function tokenColor(canvasElement, token) {
    const probe = canvasElement.ownerDocument.createElement('span');
    probe.style.color = `var(${token})`;
    canvasElement.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
}

function tokenBackground(canvasElement, token) {
    const probe = canvasElement.ownerDocument.createElement('span');
    probe.style.backgroundColor = `var(${token})`;
    canvasElement.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
}

export const Overview = {
    render: (args) => <CloseButton {...args} />,
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Close' });
        await expect(button).toHaveAttribute('type', 'button');
        await expect(button.getBoundingClientRect().width).toBe(32);
        await expect(button.getBoundingClientRect().height).toBe(32);
        await expect(button.querySelector('i')).toHaveAttribute('aria-hidden', 'true');
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <CloseButton label="Close default" />
            <CloseButton label="Close compact" spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const rest = canvas.getByRole('button', { name: 'Close default' });
        const compact = canvas.getByRole('button', { name: 'Close compact' });
        await expect(rest.getBoundingClientRect().height).toBe(32);
        await expect(compact.getBoundingClientRect().height).toBe(24);
    },
};

export const Tones = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
            <div style={row}>
                <CloseButton label="Dismiss default example" />
            </div>
            <div style={inverseGround}>
                <CloseButton tone="inverse" label="Dismiss inverse example on a dark ground" />
            </div>
            <div style={primaryGround}>
                <CloseButton tone="inverse" label="Dismiss inverse example on a colored ground" />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const states = [
            ['Dismiss default example', '--ds-background-neutral-subtle-hovered', '--ds-background-neutral-subtle-pressed'],
            ['Dismiss inverse example on a dark ground', '--ds-interaction-inverse-hovered', '--ds-interaction-inverse-pressed'],
            ['Dismiss inverse example on a colored ground', '--ds-interaction-inverse-hovered', '--ds-interaction-inverse-pressed'],
        ];
        for (const [name, hoverToken, pressedToken] of states) {
            const button = canvas.getByRole('button', { name });
            button.style.transition = 'none';
            await expect(getComputedStyle(button).backgroundColor, `${name} at rest`).toBe('rgba(0, 0, 0, 0)');
            const hover = withForcedPseudo(button, ':hover', () => getComputedStyle(button).backgroundColor);
            await expect(hover, `${name} on hover`).toBe(tokenBackground(canvasElement, hoverToken));
            const pressed = withForcedPseudo(button, ':active', () => getComputedStyle(button).backgroundColor);
            await expect(pressed, `${name} pressed`).toBe(tokenBackground(canvasElement, pressedToken));
        }
    },
};

export const Focus = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
            <div style={row}>
                <CloseButton label="Close default focus example" />
            </div>
            <div style={inverseGround}>
                <CloseButton tone="inverse" label="Close inverse focus example" />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const cases = [
            ['Close default focus example', '--ds-border-focused'],
            ['Close inverse focus example', '--ds-border-focused-inverse'],
        ];
        for (const [name, ringToken] of cases) {
            const button = canvas.getByRole('button', { name });
            button.focus({ focusVisible: true });
            await expect(button.matches(':focus-visible'), `${name} is keyboard-focused`).toBe(true);
            await expect(getComputedStyle(button).outlineColor).toBe(tokenColor(canvasElement, ringToken));
            await expect(getComputedStyle(button).backgroundColor, `${name} focus has no fill`).toBe('rgba(0, 0, 0, 0)');
            button.blur();
        }
    },
};

export const InverseGrounds = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            {INVERSE_GROUNDS.map((ground) => (
                <div key={ground} data-ground={ground} style={{ ...row, padding: '16px', borderRadius: 'var(--radius-md)', background: `var(${ground})` }}>
                    <CloseButton tone="inverse" label={`Dismiss example on ${ground.replace('--ds-background-', '')}`} />
                </div>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        for (const ground of INVERSE_GROUNDS) {
            const wrapper = canvasElement.querySelector(`[data-ground="${ground}"]`);
            const button = within(wrapper).getByRole('button');
            const paint = getComputedStyle(wrapper).backgroundColor;

            button.focus({ focusVisible: true });
            await expect(button.matches(':focus-visible'), `${ground}: keyboard-focused`).toBe(true);
            const ring = getComputedStyle(button).outlineColor;
            const ringRatio = contrastRatio(ring, paint);
            await expect(ringRatio, `${ground}: ring ${ring} on ${paint} is ${ringRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);

            const glyph = getComputedStyle(button.querySelector('i')).color;
            const glyphRatio = contrastRatio(glyph, paint);
            await expect(glyphRatio, `${ground}: × ${glyph} on ${paint} is ${glyphRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
            button.blur();
        }
    },
};

export const Interactive = {
    render: (args) => (
        <div style={args.tone === 'inverse' ? inverseGround : row}>
            <CloseButton {...args} />
        </div>
    ),
};
