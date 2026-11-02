import React from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px } from '@/storybook-docs/lib/style-probes.js';
import { Avatar } from '@/components';
import AgentAvatar, { AGENT_AVATAR_SIZES } from './AgentAvatar';

/**
 * `AgentAvatar` -- an agent as a hexagon.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and assert what a person could observe: the box on each
 * size, the hexagon shape, the AI ground and inverse glyph resolved from tokens
 * in every color mode, the name a screen reader gets, and the picture falling
 * back to the glyph. Avatars are found by `data-testid`.
 */

export default {
    title: 'AI/Components/Agent avatar',
    component: AgentAvatar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'An agent as a hexagon, in the AI bold ground with a sparkles glyph or a picture. '
                    + 'Circles are people; the hexagon is for agents.',
            },
        },
    },
    argTypes: {
        label: { control: 'text' },
        src: { control: 'text' },
        size: { control: 'inline-radio', options: AGENT_AVATAR_SIZES },
        className: { control: false },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--element-inline-lg)', alignItems: 'center' };

const box = (el) => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
};

/** Test fixture, not styling: a landscape picture, 3:2, so a stretched image would show as a wrong aspect. Its fills are image data, not tokens. */
const PHOTO = 'data:image/svg+xml;utf8,'
    + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">'
        + '<rect width="300" height="200" fill="#6b8f71"/><circle cx="150" cy="100" r="60" fill="#f2c14e"/></svg>',
    );

/* -------------------------------------------------------------------- sizes */

export const Sizes = () => (
    <div style={row}>
        {AGENT_AVATAR_SIZES.map((size) => (
            <AgentAvatar key={size} size={size} label="PLUS AI" data-testid={`agent-${size}`} />
        ))}
    </div>
);

/** Every size is a square box on the Media size, clipped to a hexagon, on the AI ground with an inverse glyph in every color mode. */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of AGENT_AVATAR_SIZES) {
        const el = canvas.getByTestId(`agent-${size}`);
        await expect(box(el), `size ${size}`).toEqual({ width: size, height: size });
        await expect(getComputedStyle(el).clipPath, `size ${size} is a hexagon`).toMatch(/^polygon\(/);
    }
    const agent = canvas.getByTestId('agent-32');
    const glyph = agent.querySelector('.plus-agent-avatar__glyph');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(agent).backgroundColor, `ground, ${mode}`).toBe(token('--ds-ai-background-bold'));
        await expect(getComputedStyle(glyph).color, `glyph, ${mode}`).toBe(token('--ds-text-inverse'));
    });
};

export const DefaultSize = () => <AgentAvatar label="PLUS AI" data-testid="agent" />;

DefaultSize.play = async ({ canvasElement }) => {
    await expect(box(within(canvasElement).getByTestId('agent'))).toEqual({ width: 32, height: 32 });
};

/* --------------------------------------------------------------- the name */

export const NamedForAssistiveTechnology = () => <AgentAvatar label="PLUS AI" />;

/** It is one image with its label as the name, and the glyph inside is decoration. */
NamedForAssistiveTechnology.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'PLUS AI' })).toBeInTheDocument();
    await expect(canvasElement.querySelector('.fa-wand-magic-sparkles').getAttribute('aria-hidden')).toBe('true');
};

/* ----------------------------------------------------------------- picture */

export const Picture = () => (
    <div style={row}>
        <AgentAvatar size={40} label="Study buddy" src={PHOTO} data-testid="photo" />
        <AgentAvatar size={40} label="Study buddy" src="data:image/png;base64,broken" data-testid="broken" />
    </div>
);

/** A picture covers the hexagon; a broken one gives way to the glyph. */
Picture.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const photo = canvas.getByTestId('photo');
    await expect(getComputedStyle(photo.querySelector('img')).objectFit).toBe('cover');
    await expect(getComputedStyle(photo).clipPath, 'picture is clipped to the hexagon').toMatch(/^polygon\(/);
    const broken = canvas.getByTestId('broken');
    await waitFor(() => expect(broken.querySelector('img')).toBeNull());
    await expect(broken.querySelector('.fa-wand-magic-sparkles')).not.toBeNull();
};

/* -------------------------------------------------------------- attribution */

/** The agent leads at 32; the person it acted for follows at 16, offset by the stroke token from the agent's lower edge. */
const offset = 'calc(-1 * var(--size-element-stroke-lg))';

export const WithAPerson = () => (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
        <AgentAvatar size={32} label="PLUS AI" data-testid="agent" />
        <span
            style={{
                position: 'absolute',
                insetInlineEnd: offset,
                insetBlockEnd: offset,
                display: 'inline-flex',
                borderRadius: 'var(--size-element-radius-full)',
                boxShadow: '0 0 0 var(--size-element-stroke-lg) var(--ds-surface)',
            }}
        >
            <Avatar size={16} name="Jane Park" data-testid="person" />
        </span>
    </span>
);

/**
 * Lead with the agent: it is the larger mark, 32 against 16, and it comes first
 * in the reading order. The person is a circle and the agent a hexagon, and each
 * has its own name.
 */
WithAPerson.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const agent = canvas.getByTestId('agent');
    const person = canvas.getByTestId('person');
    await expect(box(agent)).toEqual({ width: 32, height: 32 });
    await expect(box(person)).toEqual({ width: 16, height: 16 });
    await expect(agent.compareDocumentPosition(person) & Node.DOCUMENT_POSITION_FOLLOWING, 'agent first').toBeTruthy();
    await expect(getComputedStyle(agent).clipPath, 'agent is a hexagon').toMatch(/^polygon\(/);
    await expect(px(getComputedStyle(person).borderTopLeftRadius), 'person is a circle').toBeGreaterThanOrEqual(8);
    const a = agent.getBoundingClientRect();
    const p = person.getBoundingClientRect();
    await expect(Math.round(p.right - a.right), 'person sits 2px past the agent').toBe(2);
    await expect(Math.round(p.bottom - a.bottom), 'person sits 2px below the agent').toBe(2);
    await expect(canvas.getByRole('img', { name: 'PLUS AI' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'Jane Park' })).toBeInTheDocument();
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => <AgentAvatar {...args} />;
Interactive.args = { label: 'PLUS AI', size: 32 };
