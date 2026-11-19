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
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import PropTypes from 'prop-types';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HeadingContextProvider } from '@/components';
import { OverlayContainer } from '@/lib/overlay';

import {
    MOTION_FAMILIES,
    MOTION_TIERS,
    MOTION_TRANSITIONS,
    filterMotionLibrary,
    motionLibraryOf,
} from '../../../scripts/lib/tokens/motion-docs.mjs';
import {
    COMPONENT_SUBJECTS,
    COMPONENT_SUBJECT_FALLBACKS,
    MotionLibrary,
    MotionLibraryCard,
} from '@/storybook-docs/motion-library.jsx';
import { speedFor } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';

export default {
    title: 'Foundations/Expression/Motion/Library',
    tags: ['!dev', '!autodocs', 'manifest'],
    parameters: { layout: 'padded' },
};

const ROWS = motionLibraryOf();
const MULTI_EVENT_ROW = ROWS.find((r) => r.tier === 'component' && r.name === 'Popup') ?? ROWS.find((r) => r.tier === 'component' && r.events.length > 1);
const CHECKBOX_ROW = ROWS.find((r) => r.tier === 'component' && r.name === 'Checkbox') ?? MULTI_EVENT_ROW;
const FALLBACK_ROW = ROWS.find((r) => r.tier === 'component' && r.name === 'Sidebar');
const PATTERN_ROW = ROWS.find((r) => r.tier === 'pattern') ?? ROWS[0];
const MILESTONE_ROW = ROWS.find((r) => r.tier === 'template' && r.name === 'Card') ?? ROWS[0];

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

        // TOC hygiene: only the three tier headings (Templates, Patterns, Components) are h2/h3;
        // card titles are non-heading text while keeping each card's name as its accessible label.
        const tocHeadings = [...canvasElement.querySelectorAll('h2, h3')].map((h) => h.textContent.trim());
        await expect(tocHeadings).toEqual(['Templates', 'Patterns', 'Components']);
        const sampleCard = canvasElement.querySelector('[data-motion-card="component:Popup"]');
        await expect(sampleCard).toHaveAttribute('role', 'group');
        await expect(sampleCard).toHaveAccessibleName('Popup');

        // Milestone event uses Expressive mode
        const milestoneCard = canvasElement.querySelector('[data-motion-card="template:Card"]');
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

export const RealComponentCardAnimatesAndSettles = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibraryCard
            row={CHECKBOX_ROW}
            reduced={false}
            fastForward={speedFor(viewMode)}
        />
    ),
    play: async ({ canvasElement }) => {
        const card = canvasElement.querySelector('[data-motion-card="component:Checkbox"]');
        await expect(card).toBeTruthy();
        const demo = card.querySelector('[data-motion-demo]');
        await expect(demo).toBeTruthy();
        await expect(demo.dataset.subject).toBe('component');

        await waitFor(
            () => expect(demo.dataset.phase).toBe('settled'),
            { timeout: 15000, interval: 50 },
        );
        await expect(Number(demo.dataset.passes)).toBeGreaterThanOrEqual(1);
        await expectSceneAtLanding(demo);

        const subjectEl = card.querySelector('[data-motion-component-subject="Checkbox"]');
        await expect(subjectEl).toBeTruthy();
        const checkbox = within(subjectEl).getByRole('checkbox', { name: 'Complete warm-up check' });
        await expect(checkbox).toBeChecked();
    },
};

export const RealComponentCardReducedTwin = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibraryCard
            row={CHECKBOX_ROW}
            reduced
            fastForward={speedFor(viewMode)}
        />
    ),
    play: async ({ canvasElement }) => {
        const card = canvasElement.querySelector('[data-motion-card="component:Checkbox"]');
        await expect(card).toBeTruthy();
        const demo = card.querySelector('[data-motion-demo]');
        await expect(demo.dataset.subject).toBe('component');
        await expect(demo.dataset.reduced).toBe('true');
        await expect(demo.dataset.phase).toBe('still');
        await expectSceneAtLanding(demo);

        await waitFor(() =>
            expect(card.querySelector('[data-motion-component-subject="Checkbox"]')).toBeTruthy(),
        );
        const subjectEl = card.querySelector('[data-motion-component-subject="Checkbox"]');
        const checkbox = within(subjectEl).getByRole('checkbox', { name: 'Complete warm-up check' });
        await expect(checkbox).toBeChecked();

        // Reduced motion still plays once when explicitly requested via the Play button
        const playOnceBtn = card.querySelector('[data-motion-replay]');
        await userEvent.click(playOnceBtn);
        await waitFor(
            () => expect(demo.dataset.phase).toBe('settled'),
            { timeout: 15000, interval: 50 },
        );
        await expect(Number(demo.dataset.passes)).toBeGreaterThanOrEqual(1);
    },
};

export const ComponentSubjectCoverage = {
    render: () => (
        <div style={{ display: 'grid', gap: 'var(--stack-3xl)' }}>
            <MotionLibraryCard row={MULTI_EVENT_ROW} reduced playOnInView={false} />
            {FALLBACK_ROW ? <MotionLibraryCard row={FALLBACK_ROW} reduced playOnInView={false} /> : null}
            <MotionLibraryCard row={PATTERN_ROW} reduced playOnInView={false} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const componentRows = motionLibraryOf().filter((r) => r.tier === 'component');
        const subjectKeys = new Set(Object.keys(COMPONENT_SUBJECTS));
        const fallbackKeys = new Set(Object.keys(COMPONENT_SUBJECT_FALLBACKS));

        const uncovered = [];
        const overlapped = [];
        for (const row of componentRows) {
            const hasSubject = subjectKeys.has(row.name);
            const hasFallback = fallbackKeys.has(row.name);
            if (!hasSubject && !hasFallback) uncovered.push(row.name);
            if (hasSubject && hasFallback) overlapped.push(row.name);
            if (hasSubject) {
                const renderFn = COMPONENT_SUBJECTS[row.name];
                const startEl = renderFn({
                    row,
                    event: row.events[0],
                    step: 'start',
                    progress: 0,
                    isExit: false,
                    reduced: false,
                    mode: 'productive',
                });
                const landingEl = renderFn({
                    row,
                    event: row.events[0],
                    step: 'landing',
                    progress: 1,
                    isExit: false,
                    reduced: false,
                    mode: 'productive',
                });
                await expect(React.isValidElement(startEl)).toBe(true);
                await expect(React.isValidElement(landingEl)).toBe(true);
            }
        }
        await expect(uncovered).toEqual([]);
        await expect(overlapped).toEqual([]);

        // Verify no stale keys exist in COMPONENT_SUBJECTS or COMPONENT_SUBJECT_FALLBACKS
        const validNames = new Set(componentRows.map((r) => r.name));
        const staleSubjects = [...subjectKeys].filter((k) => !validNames.has(k));
        const staleFallbacks = [...fallbackKeys].filter((k) => !validNames.has(k));
        await expect(staleSubjects).toEqual([]);
        await expect(staleFallbacks).toEqual([]);

        // Popup renders its real PLUS subject inside the component card
        const popupCard = canvasElement.querySelector(`[data-motion-card="component:${MULTI_EVENT_ROW.name}"]`);
        await expect(popupCard.querySelector('[data-subject="component"]')).toBeTruthy();
        await expect(popupCard.querySelector('.plus-popup')).toBeTruthy();

        // Fallback component row and pattern row keep their kit drawing
        if (FALLBACK_ROW) {
            const fallbackCard = canvasElement.querySelector(
                `[data-motion-card="component:${FALLBACK_ROW.name}"]`,
            );
            await expect(fallbackCard.querySelector('[data-subject="component"]')).toBeNull();
            await expect(fallbackCard.querySelector('svg')).toBeTruthy();
        }
        const patternCard = canvasElement.querySelector(
            `[data-motion-card="${PATTERN_ROW.tier}:${PATTERN_ROW.name}"]`,
        );
        await expect(patternCard.querySelector('[data-subject="component"]')).toBeNull();
        await expect(patternCard.querySelector('svg')).toBeTruthy();
    },
};

const LEGACY_REACT_ELEMENT_TYPE = Symbol.for('react.element');

const toLegacyReactElementForPropTypes = (val) => {
    if (!val) return val;
    if (Array.isArray(val)) return val.map(toLegacyReactElementForPropTypes);
    if (React.isValidElement(val)) {
        return { ...val, $$typeof: LEGACY_REACT_ELEMENT_TYPE };
    }
    return val;
};

const checkElementTreePropTypes = (node, subjectName) => {
    if (!node) return;
    if (Array.isArray(node)) {
        for (const item of node) checkElementTreePropTypes(item, subjectName);
        return;
    }
    if (!React.isValidElement(node)) return;

    const { type, props } = node;
    const propTypes = type?.propTypes ?? type?.render?.propTypes;
    const compName =
        type?.displayName ||
        type?.name ||
        type?.render?.displayName ||
        type?.render?.name ||
        subjectName;

    if (propTypes && props) {
        const normalizedProps = Object.fromEntries(
            Object.entries(props).map(([k, v]) => [k, toLegacyReactElementForPropTypes(v)]),
        );
        PropTypes.resetWarningCache();
        PropTypes.checkPropTypes(propTypes, normalizedProps, 'prop', `${subjectName} -> ${compName}`);
        for (const key of Object.keys(props)) {
            if (
                key === 'children' ||
                key === 'key' ||
                key === 'ref' ||
                key.startsWith('aria-') ||
                key.startsWith('data-')
            ) {
                continue;
            }
            if (!Object.prototype.hasOwnProperty.call(propTypes, key)) {
                console.error(
                    `Warning: Failed prop type: Invalid prop \`${key}\` supplied to \`${subjectName} -> ${compName}\`, not declared in propTypes.`,
                );
            }
        }
    }

    if (props) {
        for (const [key, val] of Object.entries(props)) {
            if (key === 'children' || React.isValidElement(val) || Array.isArray(val)) {
                checkElementTreePropTypes(val, subjectName);
            } else if (typeof val === 'function' && (key === 'readView' || key === 'editView')) {
                try {
                    checkElementTreePropTypes(
                        val({ value: 'Sample', onChange: () => {}, id: 'sample-id' }),
                        subjectName,
                    );
                } catch {
                    // ignore render-prop probe errors
                }
            }
        }
    }
};

export const ComponentSubjectsMatchPropTypes = {
    render: () => <div data-subject-prop-check-host />,
    play: async ({ canvasElement }) => {
        const componentRows = motionLibraryOf().filter(
            (r) => r.tier === 'component' && Object.prototype.hasOwnProperty.call(COMPONENT_SUBJECTS, r.name),
        );
        const propTypeErrors = [];
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const msg = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
            if (msg.includes('Failed prop type')) {
                propTypeErrors.push(msg);
            }
            originalConsoleError.apply(console, args);
        };

        const host = canvasElement.querySelector('[data-subject-prop-check-host]') ?? canvasElement;
        try {
            for (const row of componentRows) {
                const renderFn = COMPONENT_SUBJECTS[row.name];
                const events = row.events?.length ? row.events : [{ event: 'default' }];
                for (const event of events) {
                    const isExit =
                        event?.event === 'exit' ||
                        event?.event === 'dismiss' ||
                        event?.event === 'floating-exit';
                    for (const [step, progress] of [
                        ['start', 0],
                        ['landing', 1],
                    ]) {
                        const element = renderFn({
                            row,
                            event,
                            step,
                            progress,
                            isExit,
                            reduced: true,
                            mode: 'productive',
                            container: host,
                        });
                        checkElementTreePropTypes(element, row.name);

                        const slot = document.createElement('div');
                        host.appendChild(slot);
                        const root = createRoot(slot);
                        try {
                            flushSync(() => {
                                root.render(
                                    <HeadingContextProvider value={4}>
                                        <OverlayContainer container={slot} boundary={slot}>
                                            {element}
                                        </OverlayContainer>
                                    </HeadingContextProvider>,
                                );
                            });
                        } finally {
                            flushSync(() => root.unmount());
                            slot.remove();
                        }
                    }
                }
            }
        } finally {
            console.error = originalConsoleError;
        }

        await expect(propTypeErrors, propTypeErrors.join('\n')).toEqual([]);
    },
};

const waitSwapSettled = async (canvasElement) => {
    const stage = canvasElement.querySelector('[data-swap-stage]');
    await expect(stage).toBeTruthy();
    await waitFor(
        () => expect(stage.dataset.swapPhase).toBe('settled'),
        { timeout: 10000, interval: 25 },
    );
};

const resultStatus = (canvasElement) => canvasElement.querySelector('[data-motion-library-count]');

const shownCards = (canvasElement) => [
    ...canvasElement.querySelectorAll('[data-swap-incoming] [data-motion-card]'),
];

const openFilterMenu = async (canvasElement) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /^Filters/ });
    await userEvent.click(trigger);
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(doc.querySelector('.plus-filter-menu')).not.toBeNull());
    const menu = doc.querySelector('.plus-filter-menu');
    await waitFor(() => expect(menu.contains(doc.activeElement)).toBe(true));
    return menu;
};

const closeFilterMenuViaApply = async (canvasElement, menu) => {
    await userEvent.click(within(menu).getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(canvasElement.ownerDocument.querySelector('.plus-filter-menu')).toBeNull());
    await waitSwapSettled(canvasElement);
};

export const SearchNarrowsByName = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibrary reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const allRows = motionLibraryOf();
        const expected = filterMotionLibrary(allRows, { query: 'Popup' });
        const canvas = within(canvasElement);

        await expect(resultStatus(canvasElement)).toHaveAttribute('role', 'status');
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${allRows.length} of ${allRows.length}`);

        const searchbox = canvas.getByRole('searchbox', { name: 'Search by name' });
        await userEvent.type(searchbox, 'Popup');
        await waitSwapSettled(canvasElement);

        const cards = shownCards(canvasElement);
        await expect(cards.map((c) => c.dataset.motionCard)).toEqual(
            expected.map((r) => `${r.tier}:${r.name}`),
        );
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${expected.length} of ${allRows.length}`);

        // No tier filter is set, so tier grouping stays for matching tiers
        const expectedTiers = MOTION_TIERS.filter((t) => expected.some((r) => r.tier === t));
        const shownTierGroups = [
            ...canvasElement.querySelectorAll('[data-swap-incoming] [data-motion-tier-group]'),
        ].map((el) => el.dataset.motionTierGroup);
        await expect(shownTierGroups).toEqual(expectedTiers);
    },
};

export const FilterByTierFacet = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibrary reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const allRows = motionLibraryOf();
        const expected = filterMotionLibrary(allRows, { tiers: ['pattern'] });
        const canvas = within(canvasElement);

        const menu = await openFilterMenu(canvasElement);
        const tierGroup = within(menu).getByRole('group', { name: 'Tier' });
        await userEvent.click(within(tierGroup).getByRole('checkbox', { name: 'Patterns' }));
        await closeFilterMenuViaApply(canvasElement, menu);

        await expect(canvas.getByRole('button', { name: 'Filters, 1 applied' })).toBeInTheDocument();
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${expected.length} of ${allRows.length}`);

        const cards = shownCards(canvasElement);
        await expect(cards.map((c) => c.dataset.motionCard)).toEqual(
            expected.map((r) => `${r.tier}:${r.name}`),
        );
        // Tier filter is set: redundant tier headings do not repeat
        await expect(
            canvasElement.querySelectorAll('[data-swap-incoming] [data-motion-tier-group]').length,
        ).toBe(0);
    },
};

export const FilterByTransitionFacet = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibrary reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const allRows = motionLibraryOf();
        const chosen = 'Dock and undock a panel';
        const expected = filterMotionLibrary(allRows, { transitions: [chosen] });
        const canvas = within(canvasElement);

        const menu = await openFilterMenu(canvasElement);
        const transitionGroup = within(menu).getByRole('group', { name: 'Transition' });
        const transitionLabels = within(transitionGroup)
            .getAllByRole('checkbox')
            .map((cb) => cb.parentElement?.querySelector('label')?.textContent?.trim());
        await expect(transitionLabels).toEqual([...MOTION_TRANSITIONS]);

        await userEvent.click(within(transitionGroup).getByRole('checkbox', { name: chosen }));
        await closeFilterMenuViaApply(canvasElement, menu);

        await expect(canvas.getByRole('button', { name: 'Filters, 1 applied' })).toBeInTheDocument();
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${expected.length} of ${allRows.length}`);
        await expect(shownCards(canvasElement).map((c) => c.dataset.motionCard)).toEqual(
            expected.map((r) => `${r.tier}:${r.name}`),
        );
    },
};

export const FilterByFamilyFacet = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibrary reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const allRows = motionLibraryOf();
        const expected = filterMotionLibrary(allRows, { families: ['linear'] });
        const canvas = within(canvasElement);

        const menu = await openFilterMenu(canvasElement);
        const familyGroup = within(menu).getByRole('group', { name: 'Token family' });
        const familyLabels = within(familyGroup)
            .getAllByRole('checkbox')
            .map((cb) => cb.parentElement?.querySelector('label')?.textContent?.trim());
        await expect(familyLabels).toEqual([...MOTION_FAMILIES]);

        await userEvent.click(within(familyGroup).getByRole('checkbox', { name: 'linear' }));
        await closeFilterMenuViaApply(canvasElement, menu);

        await expect(canvas.getByRole('button', { name: 'Filters, 1 applied' })).toBeInTheDocument();
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${expected.length} of ${allRows.length}`);
        await expect(shownCards(canvasElement).map((c) => c.dataset.motionCard)).toEqual(
            expected.map((r) => `${r.tier}:${r.name}`),
        );
    },
};

export const FilterBySoundFacet = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibrary reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const allRows = motionLibraryOf();
        const allSounds = [...new Set(allRows.flatMap((r) => r.sounds))].sort();
        const chosenSound = allSounds[0];
        const expected = filterMotionLibrary(allRows, { sounds: [chosenSound] });
        const canvas = within(canvasElement);

        const menu = await openFilterMenu(canvasElement);
        const soundGroup = within(menu).getByRole('group', { name: 'Sound' });
        await userEvent.click(within(soundGroup).getByRole('checkbox', { name: `sound.${chosenSound}` }));
        await closeFilterMenuViaApply(canvasElement, menu);

        await expect(canvas.getByRole('button', { name: 'Filters, 1 applied' })).toBeInTheDocument();
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${expected.length} of ${allRows.length}`);
        await expect(shownCards(canvasElement).map((c) => c.dataset.motionCard)).toEqual(
            expected.map((r) => `${r.tier}:${r.name}`),
        );
    },
};

export const TwoFacetsAndResetRestoresAll = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibrary reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const allRows = motionLibraryOf();
        const expected = filterMotionLibrary(allRows, {
            tiers: ['component'],
            transitions: ['Open and close an overlay'],
        });
        const canvas = within(canvasElement);

        const menu = await openFilterMenu(canvasElement);
        await userEvent.click(
            within(within(menu).getByRole('group', { name: 'Tier' })).getByRole('checkbox', { name: 'Components' }),
        );
        await userEvent.click(
            within(within(menu).getByRole('group', { name: 'Transition' })).getByRole('checkbox', {
                name: 'Open and close an overlay',
            }),
        );
        await closeFilterMenuViaApply(canvasElement, menu);

        await expect(canvas.getByRole('button', { name: 'Filters, 2 applied' })).toBeInTheDocument();
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${expected.length} of ${allRows.length}`);
        await expect(shownCards(canvasElement).map((c) => c.dataset.motionCard)).toEqual(
            expected.map((r) => `${r.tier}:${r.name}`),
        );

        // Reset in one action restores all rows and tier grouping
        await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
        await waitSwapSettled(canvasElement);

        await expect(canvas.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${allRows.length} of ${allRows.length}`);
        await expect(shownCards(canvasElement).length).toBe(allRows.length);
        await expect(
            canvasElement.querySelectorAll('[data-swap-incoming] [data-motion-tier-group]').length,
        ).toBe(3);
    },
};

export const NoMatchShowsEmptyState = {
    render: (_args, { viewMode } = {}) => (
        <MotionLibrary reduced={false} fastForward={speedFor(viewMode)} />
    ),
    play: async ({ canvasElement }) => {
        const allRows = motionLibraryOf();
        const canvas = within(canvasElement);

        const searchbox = canvas.getByRole('searchbox', { name: 'Search by name' });
        await userEvent.type(searchbox, 'zzzz-no-matching-row');
        await waitSwapSettled(canvasElement);

        await expect(shownCards(canvasElement).length).toBe(0);
        await expect(resultStatus(canvasElement)).toHaveTextContent(`0 of ${allRows.length}`);
        await expect(canvasElement.querySelector('[data-swap-incoming] .plus-empty-state')).not.toBeNull();

        await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
        await waitSwapSettled(canvasElement);

        await expect(searchbox).toHaveValue('');
        await expect(shownCards(canvasElement).length).toBe(allRows.length);
        await expect(resultStatus(canvasElement)).toHaveTextContent(`${allRows.length} of ${allRows.length}`);
    },
};
