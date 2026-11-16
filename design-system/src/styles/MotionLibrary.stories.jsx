/**
 * The Motion · Library gallery stories and play tests:
 * (1) a card animates through arrows/playing and settles at its landing;
 * (2) its reduced-motion twin shows the still landing;
 * (3) picking another event and pressing replay restarts the pass on that event's drawing;
 * (4) every registry row renders a card (`motionLibraryOf().length`).
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionLibrary.stories.jsx
 */
import React from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';

import { motionLibraryOf } from '../../../scripts/lib/tokens/motion-docs.mjs';
import { MotionLibrary, MotionLibraryCard } from '@/storybook-docs/motion-library.jsx';
import { speedFor } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';

export default {
    title: 'Foundations/Expression/Motion/Library',
    tags: ['!dev', '!autodocs', 'manifest'],
    parameters: { layout: 'padded' },
};

const ROWS = motionLibraryOf();
const MULTI_EVENT_ROW = ROWS.find((r) => r.tier === 'component' && r.name === 'Modal') ?? ROWS.find((r) => r.events.length > 1);
const MILESTONE_ROW = ROWS.find((r) => r.tier === 'template' && r.name === 'PatternCard') ?? ROWS[0];

const expectSceneAtLanding = async (demoEl) => {
    const expected = JSON.parse(demoEl.dataset.landing);
    for (const [id, want] of Object.entries(expected)) {
        const fig = demoEl.querySelector(`[data-scene="${id}"]`);
        await expect(fig).toBeTruthy();
        const actual = JSON.parse(fig.dataset.state);
        for (const [k, v] of Object.entries(want)) {
            await expect(actual[k]).toBeCloseTo(v, 1);
        }
    }
};

export const CardAnimatesAndSettles = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibraryCard row={MULTI_EVENT_ROW} reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const card = canvasElement.querySelector('[data-motion-card]');
        await expect(card).toBeTruthy();
        const demo = card.querySelector('[data-motion-demo]');
        await expect(demo).toBeTruthy();
        await waitFor(
            () => expect(['arrows', 'playing']).toContain(demo.dataset.phase),
            { timeout: 5000, interval: 16 },
        );
        await waitFor(
            () => expect(demo.dataset.phase).toBe('settled'),
            { timeout: 15000, interval: 50 },
        );
        await expect(Number(demo.dataset.passes)).toBeGreaterThanOrEqual(1);
        await expectSceneAtLanding(demo);
    },
};

export const CardReducedTwin = {
    render: () => <MotionLibraryCard row={MULTI_EVENT_ROW} reduced />,
    play: async ({ canvasElement }) => {
        const card = canvasElement.querySelector('[data-motion-card]');
        await expect(card).toBeTruthy();
        const demo = card.querySelector('[data-motion-demo]');
        await expect(demo.dataset.reduced).toBe('true');
        await expect(demo.dataset.phase).toBe('still');
        await expectSceneAtLanding(demo);
    },
};

export const CardEventSwitchAndReplay = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibraryCard row={MULTI_EVENT_ROW} reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const card = canvasElement.querySelector('[data-motion-card]');
        const initialEvent = MULTI_EVENT_ROW.events[0];
        const secondEvent = MULTI_EVENT_ROW.events[1];

        const firstDemo = card.querySelector('[data-motion-demo]');
        await waitFor(
            () => expect(firstDemo.dataset.phase).toBe('settled'),
            { timeout: 15000, interval: 50 },
        );
        await expect(card.dataset.activeEvent).toBe(initialEvent.event);
        const passesAfterFirst = Number(firstDemo.dataset.passes);

        // Pick another event tab
        const tabs = [...card.querySelectorAll('[role="tab"]')];
        const secondTab = tabs.find((t) => t.textContent.trim() === secondEvent.event);
        await expect(secondTab).toBeTruthy();
        await userEvent.click(secondTab);

        await waitFor(() => expect(card.dataset.activeEvent).toBe(secondEvent.event));
        const switchedDemo = card.querySelector('[data-motion-demo]');
        await waitFor(
            () => expect(Number(switchedDemo.dataset.passes)).toBeGreaterThan(passesAfterFirst),
            { timeout: 15000, interval: 50 },
        );
        await waitFor(
            () => expect(switchedDemo.dataset.phase).toBe('settled'),
            { timeout: 15000, interval: 50 },
        );
        await expectSceneAtLanding(switchedDemo);

        // Press Replay button and verify pass restarts and settles again
        const passesBefore = Number(switchedDemo.dataset.passes);
        const replayBtn = card.querySelector('[data-motion-replay]');
        await expect(replayBtn).toBeTruthy();
        await userEvent.click(replayBtn);

        await waitFor(
            () => expect(Number(switchedDemo.dataset.passes)).toBeGreaterThan(passesBefore),
            { timeout: 15000, interval: 50 },
        );
        await waitFor(
            () => expect(switchedDemo.dataset.phase).toBe('settled'),
            { timeout: 15000, interval: 50 },
        );
        await expectSceneAtLanding(switchedDemo);
    },
};

export const EveryRegistryRowRendersACard = {
    render: () => <MotionLibrary reduced />,
    play: async ({ canvasElement }) => {
        const expectedRows = motionLibraryOf();
        const cards = canvasElement.querySelectorAll('[data-motion-card]');
        await expect(cards.length).toBe(expectedRows.length);

        const sections = canvasElement.querySelectorAll('[data-motion-tier-group]');
        await expect(sections.length).toBe(3);

        // Milestone event uses Expressive mode
        const milestoneCard = canvasElement.querySelector('[data-motion-card="template:PatternCard"]');
        await expect(milestoneCard).toBeTruthy();
        const milestoneTab = [...milestoneCard.querySelectorAll('[role="tab"]')].find(
            (t) => t.textContent.trim() === 'milestone',
        );
        if (milestoneTab) {
            await userEvent.click(milestoneTab);
            await waitFor(() => expect(milestoneCard.dataset.activeMode).toBe('expressive'));
        }
    },
};

export const ExpressiveMilestoneCard = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibraryCard
            row={MILESTONE_ROW}
            defaultEvent="milestone"
            reduced={false}
            fastForward={speedFor(viewMode)}
        />
    ),
    play: async ({ canvasElement }) => {
        const card = canvasElement.querySelector('[data-motion-card]');
        await expect(card.dataset.activeMode).toBe('expressive');
        const demo = card.querySelector('[data-motion-demo]');
        await waitFor(
            () => expect(demo.dataset.phase).toBe('settled'),
            { timeout: 15000, interval: 50 },
        );
        await expectSceneAtLanding(demo);
    },
};
