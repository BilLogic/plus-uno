import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Code, IconButton, Link, Tabs, Tag } from '@/components';
import { PatternCard } from '@/patterns';
import { MOTION_TIERS, motionLibraryOf } from '../../../scripts/lib/tokens/motion-docs.mjs';
import { MotionDemo } from './illustrations/motion.jsx';
import {
    climbOneScene,
    drillScene,
    focusedScene,
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
        if (event.event.startsWith('focused-')) return focusedScene(tokens);
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
            row.name === 'PatternModal' ||
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
        if (row.name === 'Modal' || row.name === 'PatternModal') {
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

/**
 * One animated card in the Motion · Library gallery.
 *
 * Plays the selected event's transition drawing once when scrolled into view,
 * holds at the landing, and replays on demand. `subject` (a node or render
 * function `(row, event, { replayKey, reduced, mode }) => node`) is the seam
 * for #2653's live component subjects.
 */
export const MotionLibraryCard = ({
    row,
    defaultEvent,
    subject,
    reduced,
    fastForward = 1,
    playOnInView = true,
}) => {
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
            ? subject(row, activeEvent, { replayKey, reduced, mode, fastForward })
            : subject;

    return (
        <PatternCard
            title={row.name}
            minWidth="var(--card-min-width-md)"
            data-motion-card={`${row.tier}:${row.name}`}
            data-tier={row.tier}
            data-active-event={activeEvent.event}
            data-active-mode={mode}
            data-active-transition={activeEvent.transition}
            actions={
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
        </PatternCard>
    );
};

MotionLibraryCard.propTypes = {
    row: PropTypes.shape({
        name: PropTypes.string.isRequired,
        tier: PropTypes.oneOf(MOTION_TIERS).isRequired,
        href: PropTypes.string,
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

/**
 * The Motion · Library gallery: one animated card per row in the motion
 * registry, grouped templates → patterns → components.
 *
 * Accepts `rows` (for #2652's search and facet filtering) and `renderSubject`
 * (for #2653's live component subjects).
 */
export const MotionLibrary = ({
    rows: rowsProp,
    renderSubject,
    reduced,
    fastForward = 1,
    playOnInView = true,
}) => {
    const rows = useMemo(() => rowsProp ?? motionLibraryOf(), [rowsProp]);
    const groups = useMemo(
        () =>
            MOTION_TIERS.map((tier) => ({
                tier,
                title: TIER_TITLES[tier] ?? tier,
                rows: rows.filter((r) => r.tier === tier),
            })).filter((g) => g.rows.length > 0),
        [rows],
    );

    return (
        <div
            className="not-prose"
            data-motion-library
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
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fill, minmax(min(100%, var(--card-min-width-md)), 1fr))',
                            gap: 'var(--grid-gutter)',
                            alignItems: 'stretch',
                        }}
                    >
                        {group.rows.map((row) => (
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
                </section>
            ))}
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
