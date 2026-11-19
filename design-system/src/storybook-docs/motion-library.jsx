import React, { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Code,
    EmptyState,
    FilterMenu,
    IconButton,
    Link,
    SearchField,
    Tabs,
    Tag,
} from '@/components';
import { HeadingContextProvider } from '@/lib/headingLevel';
import { SwapInPlace } from '@/lib/swapMotion';
import { Card } from '@/templates';
import {
    MOTION_FAMILIES,
    MOTION_TIERS,
    MOTION_TRANSITIONS,
    filterMotionLibrary,
    motionLibraryOf,
} from '../../../scripts/lib/tokens/motion-docs.mjs';
import { MotionDemo } from './illustrations/motion.jsx';
import {
    COMPONENT_SUBJECTS,
    COMPONENT_SUBJECT_FALLBACKS,
    renderComponentSubject,
} from './motion-library-subjects.jsx';
import {
    climbOneScene,
    drillScene,
    goToScene,
    stepScene,
    switchViewsScene,
} from './illustrations/motion-transitions.jsx';
import {
    addRemoveScene,
    attentionScene,
    confirmScene,
    dockScene,
    errFieldScene,
    errModalScene,
    expandScene,
    flagScene,
    floatPanelScene,
    loadScene,
    modalScene,
    popupScene,
    reorderScene,
    scrollToScene,
    swapScene,
    updateScene,
} from './illustrations/motion-transitions-place.jsx';
import { SoundCell } from './motion-section.jsx';

const TIER_TITLES = {
    template: 'Templates',
    pattern: 'Patterns',
    component: 'Components',
};

const CLOSING_EVENT_RE = /(?:^|-)(?:exit|close|undock|dismiss|timeout|cancel|shrink|remove|reset)$/;

const isClosingEvent = (event) => CLOSING_EVENT_RE.test(event?.event ?? '');

const motionTokenLabel = (token) => (String(token).startsWith('motion.') ? token : `motion.${token}`);

const spatialTokenOf = (event) =>
    event?.spatial ??
    event?.tokens?.find((t) => t.startsWith('spatial.') || t === 'linear') ??
    undefined;

const appearanceTokenOf = (event) =>
    event?.appearance ??
    event?.tokens?.find((t) => t.startsWith('appearance.') || t === 'loop') ??
    undefined;

/**
 * Productive by default; an event whose name, note or sound marks a milestone
 * or completion runs Expressive (`springFor(token, 'expressive')`).
 */
export function modeForEvent(event) {
    if (!event) return 'productive';
    if (
        event.event === 'milestone' ||
        event.sound?.token?.startsWith('done.') ||
        /\b(?:expressive|milestone)\b/i.test(event.note ?? '')
    ) {
        return 'expressive';
    }
    return 'productive';
}

/**
 * Maps each of the 14 locked transition names to its kit Do scene factory,
 * parameterized by the event's own `spatial` and `appearance` tokens.
 */
export const TRANSITION_SCENE_FACTORIES = Object.freeze({
    'Go to another area': ({ id, event }) =>
        goToScene({
            id,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Drill into and climb back out': ({ id, event }) => {
        const tokens = {
            id,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        };
        if (isClosingEvent(event) || event.event === 'climb') return climbOneScene(tokens);
        return drillScene(tokens);
    },
    'Switch views': ({ id, event }) =>
        switchViewsScene({
            id,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Step to the next or previous': ({ id, event }) =>
        stepScene({
            id,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Scroll to a spot on the page': ({ id, event }) =>
        scrollToScene({
            id,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Swap content in place': ({ id, event }) =>
        swapScene({
            id,
            crossfade: false,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Add or remove an item': ({ id, event }) =>
        addRemoveScene({
            id,
            removing: isClosingEvent(event),
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Reorder items': ({ id, event }) =>
        reorderScene({
            id,
            spatial: spatialTokenOf(event),
        }),
    'Expand and collapse': ({ id, event }) =>
        expandScene({
            id,
            closing: isClosingEvent(event),
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Load content': ({ id, event }) =>
        loadScene({
            id,
            skeleton: true,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        }),
    'Open and close an overlay': ({ id, row, event }) => {
        const closing = isClosingEvent(event);
        const tokens = {
            id,
            closing,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        };
        if (row.name === 'Flag' || event.event.startsWith('flag-')) return flagScene(tokens);
        if (event.event === 'confirm' || event.event === 'cancel') {
            return confirmScene({
                id,
                confirm: event.event === 'confirm',
                spatial: spatialTokenOf(event),
                appearance: appearanceTokenOf(event),
            });
        }
        if (
            row.name === 'Modal' ||
            row.name === 'Blanket' ||
            event.event.startsWith('narrow-')
        ) {
            return modalScene(tokens);
        }
        return popupScene(tokens);
    },
    'Dock and undock a panel': ({ id, event }) => {
        const closing = isClosingEvent(event);
        if (event.event.startsWith('floating-') && !closing) {
            return floatPanelScene({ id, spatial: spatialTokenOf(event) });
        }
        return dockScene({
            id,
            closing,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        });
    },
    'Update a value or state': ({ id, event }) =>
        updateScene({
            id,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
            fadeAppearance: appearanceTokenOf(event),
        }),
    'Call attention': ({ id, row, event }) => {
        const tokens = {
            id,
            spatial: spatialTokenOf(event),
            appearance: appearanceTokenOf(event),
        };
        if (row.name === 'Form' || row.name === 'Forms' || event.event === 'error') {
            return errFieldScene({ ...tokens, early: false });
        }
        if (row.name === 'Modal') {
            return errModalScene({ ...tokens, shakes: false });
        }
        return attentionScene({
            id,
            appearance: appearanceTokenOf(event),
        });
    },
});

/**
 * Builds the Do scene for a registry row's event, running on that event's own
 * `spatial` and `appearance` tokens.
 */
export function sceneForEvent(row, event) {
    const id = `${row.tier}-${row.name}-${event.event}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-');
    const factory = TRANSITION_SCENE_FACTORIES[event.transition] ?? TRANSITION_SCENE_FACTORIES['Update a value or state'];
    const base = factory({ id, row, event });
    return {
        ...base,
        id,
        title: '',
        caption: '',
        verdict: undefined,
    };
}

export { COMPONENT_SUBJECTS, COMPONENT_SUBJECT_FALLBACKS, renderComponentSubject };

/**
 * One animated card in the Motion · Library gallery.
 *
 * Plays the selected event's transition drawing once when scrolled into view,
 * holds at the landing, and replays on demand. `subject` (a node or render
 * function `(row, event, { replayKey, reduced, mode }) => node`) defaults to
 * `renderComponentSubject` so component-tier rows render their real PLUS
 * component while template, pattern, and fallback rows render their kit drawing.
 */
export const MotionLibraryCard = ({
    row,
    defaultEvent,
    subject = renderComponentSubject,
    reduced,
    fastForward = 1,
    playOnInView = true,
}) => {
    const titleId = useId();
    const events = row.events ?? [];
    const initialKey =
        defaultEvent && events.some((e) => e.event === defaultEvent)
            ? defaultEvent
            : (events[0]?.event ?? '');
    const [selectedKey, setSelectedKey] = useState(initialKey);
    const [replayKey, setReplayKey] = useState(0);

    const activeEvent = events.find((e) => e.event === selectedKey) ?? events[0];
    const mode = modeForEvent(activeEvent);
    const scenes = useMemo(
        () => (activeEvent ? [sceneForEvent(row, activeEvent)] : []),
        [row, activeEvent],
    );

    if (!activeEvent) return null;

    const handleSelectEvent = (nextKey) => {
        setSelectedKey(String(nextKey));
        setReplayKey(0);
    };

    const handleReplay = () => {
        setReplayKey((n) => n + 1);
    };

    const customSubject =
        typeof subject === 'function'
            ? subject(row, activeEvent, { replayKey, reduced, mode, fastForward, playOnInView })
            : subject;

    return (
        <Card
            role="group"
            aria-labelledby={titleId}
            minWidth="var(--card-min-width-md)"
            data-motion-card={`${row.tier}:${row.name}`}
            data-tier={row.tier}
            data-active-event={activeEvent.event}
            data-active-mode={mode}
            data-active-transition={activeEvent.transition}
            header={
                <div className="plus-template-card-header--default">
                    <div className="plus-template-card-heading">
                        <span id={titleId} className="plus-template-card-title">
                            {row.name}
                        </span>
                    </div>
                    <div className="plus-template-card-actions">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-sm)' }}>
                            <Tag color="gray">{row.tier}</Tag>
                            <IconButton
                                icon={reduced ? 'play' : 'rotate-right'}
                                appearance="subtle"
                                spacing="compact"
                                label={
                                    reduced
                                        ? `Play ${row.name} ${activeEvent.event} motion once`
                                        : `Replay ${row.name} ${activeEvent.event} motion`
                                }
                                data-motion-replay
                                onClick={handleReplay}
                            />
                        </div>
                    </div>
                </div>
            }
            footer={
                row.href ? (
                    <Link href={row.href}>Motion section</Link>
                ) : null
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                <Tabs
                    appearance="pill"
                    spacing="compact"
                    activeKey={activeEvent.event}
                    onSelect={handleSelectEvent}
                >
                    {events.map((e) => (
                        <Tabs.Tab key={e.event} eventKey={e.event}>
                            {e.event}
                        </Tabs.Tab>
                    ))}
                </Tabs>

                <div data-motion-card-subject>
                    {customSubject ?? (
                        <MotionDemo
                            scenes={scenes}
                            mode={mode}
                            loop={false}
                            playOnInView={playOnInView}
                            replayKey={replayKey}
                            controls={false}
                            reduced={reduced}
                            fastForward={fastForward}
                        />
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 'var(--inline-sm)',
                            font: 'var(--body-sm)',
                            color: 'var(--ds-text-subtle)',
                        }}
                    >
                        <strong style={{ font: 'var(--heading-xxs)', color: 'var(--ds-text)' }}>
                            {activeEvent.event}
                        </strong>
                        <span aria-hidden="true">·</span>
                        <span>{activeEvent.transition}</span>
                        {mode === 'expressive' && <Tag color="purple">expressive</Tag>}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 'var(--inline-sm)',
                        }}
                    >
                        {activeEvent.tokens.map((t) => (
                            <Code key={t}>{motionTokenLabel(t)}</Code>
                        ))}
                    </div>

                    {activeEvent.note && (
                        <p
                            style={{
                                margin: 0,
                                font: 'var(--body-sm)',
                                color: 'var(--ds-text-subtle)',
                            }}
                        >
                            {activeEvent.note}
                        </p>
                    )}

                    {activeEvent.sound && (
                        <div style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>
                            <SoundCell sound={activeEvent.sound} />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

MotionLibraryCard.propTypes = {
    row: PropTypes.shape({
        name: PropTypes.string.isRequired,
        tier: PropTypes.oneOf(MOTION_TIERS).isRequired,
        href: PropTypes.string,
        transitions: PropTypes.arrayOf(PropTypes.string),
        families: PropTypes.arrayOf(PropTypes.string),
        sounds: PropTypes.arrayOf(PropTypes.string),
        events: PropTypes.arrayOf(
            PropTypes.shape({
                event: PropTypes.string.isRequired,
                transition: PropTypes.string.isRequired,
                spatial: PropTypes.string,
                appearance: PropTypes.string,
                tokens: PropTypes.arrayOf(PropTypes.string).isRequired,
                note: PropTypes.string,
                sound: PropTypes.object,
            }),
        ).isRequired,
    }).isRequired,
    defaultEvent: PropTypes.string,
    subject: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    reduced: PropTypes.bool,
    fastForward: PropTypes.number,
    playOnInView: PropTypes.bool,
};

const BLANK_FILTERS = Object.freeze({
    tiers: [],
    transitions: [],
    families: [],
    sounds: [],
});

const CARD_GRID_STYLE = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, var(--card-min-width-md)), 1fr))',
    gap: 'var(--grid-gutter)',
    alignItems: 'stretch',
};

/**
 * The Motion · Library gallery: one animated card per row in the motion
 * registry, grouped templates → patterns → components when no tier filter is
 * active, with search by name and facet filters for tier, transition, token
 * family and sound.
 */
export const MotionLibrary = ({
    rows: rowsProp,
    renderSubject,
    reduced,
    fastForward = 1,
    playOnInView = true,
}) => {
    const baseRows = useMemo(() => rowsProp ?? motionLibraryOf(), [rowsProp]);
    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState(BLANK_FILTERS);

    const soundTokens = useMemo(
        () => [...new Set(baseRows.flatMap((r) => r.sounds ?? []))].sort(),
        [baseRows],
    );

    const categories = useMemo(() => {
        const list = [
            {
                id: 'tiers',
                label: 'Tier',
                options: MOTION_TIERS.map((tier) => ({
                    value: tier,
                    label: TIER_TITLES[tier] ?? tier,
                })),
            },
            {
                id: 'transitions',
                label: 'Transition',
                options: [...MOTION_TRANSITIONS],
            },
            {
                id: 'families',
                label: 'Token family',
                options: [...MOTION_FAMILIES],
            },
        ];
        if (soundTokens.length > 0) {
            list.push({
                id: 'sounds',
                label: 'Sound',
                options: soundTokens.map((token) => ({
                    value: token,
                    label: `sound.${token}`,
                })),
            });
        }
        return list;
    }, [soundTokens]);

    const filteredRows = useMemo(
        () =>
            filterMotionLibrary(baseRows, {
                query,
                tiers: appliedFilters.tiers,
                transitions: appliedFilters.transitions,
                families: appliedFilters.families,
                sounds: appliedFilters.sounds,
            }),
        [baseRows, query, appliedFilters],
    );

    const appliedFilterCount = useMemo(
        () =>
            Object.values(appliedFilters).reduce(
                (sum, picked) => sum + (picked?.length ?? 0),
                0,
            ),
        [appliedFilters],
    );
    const hasQuery = query.trim().length > 0;
    const isFiltered = hasQuery || appliedFilterCount > 0;
    const hasTierFilter = (appliedFilters.tiers?.length ?? 0) > 0;

    const groups = useMemo(
        () =>
            MOTION_TIERS.map((tier) => ({
                tier,
                title: TIER_TITLES[tier] ?? tier,
                rows: filteredRows.filter((r) => r.tier === tier),
            })).filter((g) => g.rows.length > 0),
        [filteredRows],
    );

    const handleResetAll = () => {
        setQuery('');
        setAppliedFilters(BLANK_FILTERS);
    };

    const renderCards = (cardRows) => (
        <div style={CARD_GRID_STYLE}>
            {cardRows.map((row) => (
                <MotionLibraryCard
                    key={`${row.tier}:${row.name}`}
                    row={row}
                    subject={renderSubject}
                    reduced={reduced}
                    fastForward={fastForward}
                    playOnInView={playOnInView}
                />
            ))}
        </div>
    );

    const swapKey = `${query.trim().toLowerCase()}|${JSON.stringify(appliedFilters)}`;

    let resultsContent;
    if (filteredRows.length === 0) {
        resultsContent = (
            <HeadingContextProvider value={2}>
                <EmptyState
                    spacing="compact"
                    icon="magnifying-glass"
                    header="No motion matches these filters"
                    description="Reset the filters to see every template, pattern and component."
                    primaryAction={
                        <Button
                            text="Reset filters"
                            appearance="default"
                            spacing="default"
                            onClick={handleResetAll}
                        />
                    }
                />
            </HeadingContextProvider>
        );
    } else if (hasTierFilter) {
        resultsContent = renderCards(filteredRows);
    } else {
        resultsContent = (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--section-stack-lg)',
                }}
            >
                {groups.map((group) => (
                    <section
                        key={group.tier}
                        data-motion-tier-group={group.tier}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--section-stack-md)',
                        }}
                    >
                        <h3 style={{ margin: 0, font: 'var(--heading-md)', color: 'var(--ds-text)' }}>
                            {group.title}
                        </h3>
                        {renderCards(group.rows)}
                    </section>
                ))}
            </div>
        );
    }

    return (
        <div
            className="not-prose"
            data-motion-library
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--section-stack-md)',
            }}
        >
            <div
                data-motion-library-bar
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--inline-md)',
                }}
            >
                <span
                    role="status"
                    aria-live="polite"
                    data-motion-library-count
                    style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}
                >
                    {`${filteredRows.length} of ${baseRows.length}`}
                </span>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 'var(--inline-sm)',
                        marginInlineStart: 'auto',
                    }}
                >
                    {isFiltered && filteredRows.length > 0 && (
                        <Button
                            text="Reset filters"
                            appearance="subtle"
                            spacing="default"
                            onClick={handleResetAll}
                        />
                    )}
                    <SearchField
                        placeholder="Search by name"
                        spacing="compact"
                        value={query}
                        onValueChange={setQuery}
                    />
                    <FilterMenu
                        label="Filters"
                        categories={categories}
                        value={appliedFilters}
                        onApply={(next) => setAppliedFilters({ ...BLANK_FILTERS, ...next })}
                        width="4-col"
                    />
                </div>
            </div>

            <SwapInPlace swapKey={swapKey} reducedMotion={reduced}>
                {resultsContent}
            </SwapInPlace>
        </div>
    );
};

MotionLibrary.propTypes = {
    rows: PropTypes.arrayOf(MotionLibraryCard.propTypes.row),
    renderSubject: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    reduced: PropTypes.bool,
    fastForward: PropTypes.number,
    playOnInView: PropTypes.bool,
};

export default MotionLibrary;
