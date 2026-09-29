import React from 'react';
import { expect, within } from 'storybook/test';

import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import AiPromptedQuestionBox, { AiPromptedQuestionBoxInteractive } from './AiPromptedQuestionBox';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Dynamic AI Prompted Question Box',
    parameters: {
        layout: 'padded',
    },
};

/** Every `--token` named in a declaration. */
const tokenNames = (declaration) => declaration.match(/--[\w-]+/g) ?? [];

/**
 * Default · Loading · Empty on one canvas (matches Figma set — no subpages).
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <AiPromptedQuestionBoxInteractive state="default" />
            <AiPromptedQuestionBox state="loading" />
            <AiPromptedQuestionBox state="empty" />
        </div>
    ),
};

/**
 * The loading skeleton bars paint Mastering-Content 16, the variable Figma binds
 * to them, and name no token that does not exist.
 */
Overview.play = async ({ canvasElement }) => {
    const bars = within(canvasElement).getAllByTestId('skeleton-bar');
    await expect(bars).toHaveLength(3);
    const want = tokenColor(canvasElement, '--color-mastering-content-state-16');
    for (const bar of bars) {
        await expect(getComputedStyle(bar).backgroundColor, 'skeleton bar color').toBe(want);
        for (const name of tokenNames(bar.style.backgroundColor)) {
            await expect(getComputedStyle(bar).getPropertyValue(name).trim(), `${name} is defined`).not.toBe('');
        }
    }
};
