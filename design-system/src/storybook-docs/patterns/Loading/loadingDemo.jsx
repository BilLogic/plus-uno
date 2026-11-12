import React, { useEffect, useRef, useState } from 'react';

import { Button, DropdownMenu, ButtonItem, Flag, FlagGroup, IconButton, ProgressBar, Skeleton, StatusTag } from '@/components';
import { PatternSection } from '@/patterns';
import { StudentsTable, ViewBar, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Loading pattern's examples: what a view shows while PLUS fetches or
 * saves, by what is loading and how long it has taken. The bands are 1 s and
 * 10 s. Each kind of wait composes the real Skeleton, Button, DropdownMenu,
 * Flag and ProgressBar; nothing here draws a spinner or a skeleton of its own.
 *
 *   BANDS             the two thresholds, in seconds
 *   bandOf            the band a wait of so many seconds falls in
 *   LoadingList       a list or cards
 *   LoadingAction     a button action
 *   LoadingPage       a whole page
 *   LoadingMenu       a menu
 *   LoadingTimeline   all four on one clock: scrub the time or press Play
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The width the four kind pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const KIND_STAGE = 640; // docs-literal

/** The time bands, in seconds: under the first nothing new, up to the second the shape, past it an explanation. */
export const BANDS = { shape: 1, explain: 10 };

/** The longest wait the timeline shows, in seconds. */
export const TIMELINE_MAX = 12; // docs-literal

/** The band a wait of `seconds` falls in: `under`, `shape` (1 to 10 s) or `over`. */
export const bandOf = (seconds) => {
    if (seconds < BANDS.shape) return 'under';
    if (seconds < BANDS.explain) return 'shape';
    return 'over';
};

/** The kinds of wait, by id and the name the page gives each. */
export const KINDS = [
    ['list', 'A list or cards'],
    ['action', 'A button action'],
    ['page', 'A whole page'],
    ['menu', 'A menu'],
];

/** Docs geometry, in px: the blank a first load leaves, the action's column, the room a held-open menu keeps. */
const BLANK = 160; // docs-literal
const ACTION_WIDTH = 480; // docs-literal
const MENU_ROOM = 120; // docs-literal

const noop = () => {};
const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' };

/** The live label for a wait: set after mount, outside the busy region, so assistive tech announces it. */
const LiveLabel = ({ children }) => {
    const [text, setText] = useState('');
    useEffect(() => { setText(children); }, [children]);
    return <span role="status" className="visually-hidden">{text}</span>;
};

/** A table-shaped skeleton: the same three columns the students table has, as text bars. `reduced` holds the shimmer still. */
const SkeletonRows = ({ rows = 4, reduced }) => (
    <div aria-hidden="true" style={stack}>
        {Array.from({ length: rows }, (_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', gap: 'var(--inline-lg)', alignItems: 'center' }}>
                <Skeleton shape="text" width="70%" isShimmering={!reduced} />
                <Skeleton shape="text" width="60%" isShimmering={!reduced} />
                <Skeleton shape="text" width="50%" isShimmering={!reduced} />
            </div>
        ))}
    </div>
);

/** The Flag that explains a wait past 10 s: held in the picture, not fixed to the screen. */
const WaitFlag = ({ title, children }) => (
    <FlagGroup position="top-end" containerPosition="static">
        <Flag appearance="information" title={title} autohide={false} dismissible={false} show>{children}</Flag>
    </FlagGroup>
);

/**
 * A list or cards: under 1 s the old rows stay (blank on a first load); from
 * 1 s a skeleton in the rows' own shape; past 10 s the skeleton stays and a
 * Flag explains. The container is busy, and a label beside it says what loads.
 */
export const LoadingList = ({ band = 'shape', first = false, reduced }) => (
    <div style={stack}>
        <PatternSection title="Students" description="Algebra B" tabs={<ViewBar views={['All students']} filters={null} primary={null} />}>
            <section aria-label="Students" aria-busy={band === 'under' ? undefined : 'true'}>
                {band === 'under'
                    ? (first ? <div style={{ minBlockSize: BLANK }} /> : <StudentsTable count={4} />)
                    : <SkeletonRows reduced={reduced} />}
            </section>
        </PatternSection>
        <LiveLabel>{band === 'under' ? '' : 'Loading students…'}</LiveLabel>
        {band === 'over' && <WaitFlag title="Still loading students">This group is large; you can keep working.</WaitFlag>}
    </div>
);

/**
 * A button action: under 1 s nothing yet, the button blocks a second press;
 * from 1 s a spinner inside the button, the fields as they were; past 10 s a
 * Flag says it is still working.
 */
export const LoadingAction = ({ band = 'shape' }) => (
    <div style={stack}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', maxInlineSize: ACTION_WIDTH }}>
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>Ana Ruiz · Thursday at 4:00 PM · Algebra I</p>
            <div style={{ display: 'flex', gap: 'var(--inline-md)' }}>
                <Button text="Save session" appearance="primary" isLoading={band !== 'under'} onClick={noop} />
                <Button text="Cancel" appearance="subtle" onClick={noop} />
            </div>
        </div>
        {band === 'over' && <WaitFlag title="Still saving the session">You can leave this page; we will tell you when it is saved.</WaitFlag>}
    </div>
);

/** A whole page: under 1 s the previous page stays; from 1 s the Frame and header draw and each Section holds a skeleton; past 10 s a labeled progress bar. */
export const LoadingPage = ({ band = 'shape', reduced }) => (
    <div style={stack}>
        {band === 'under' ? (
            <PatternSection title="Sessions" description="This week"><StudentsTable count={3} /></PatternSection>
        ) : (
            <div aria-busy="true" style={stack}>
                <PatternSection title="Roster" description="Algebra B"><SkeletonRows rows={3} reduced={reduced} /></PatternSection>
                <PatternSection title="Sessions" description="This week"><SkeletonRows rows={2} reduced={reduced} /></PatternSection>
            </div>
        )}
        {band === 'over' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text)' }}>Importing roster · 40 of 120 students</span>
                <ProgressBar value={33} ariaLabel="Importing roster" />
            </div>
        )}
        <LiveLabel>{band === 'under' ? '' : 'Loading sessions…'}</LiveLabel>
    </div>
);

/**
 * A menu: under 1 s it opens complete (fetch before the click); from 1 s one
 * "Loading options" row; past 10 s "Couldn't load options" with Retry, still
 * one row. Held open in its picture once the picture's element exists.
 */
export const LoadingMenu = ({ band = 'shape' }) => {
    const [setMount, mount] = useLayerMount();
    return (
        <div ref={setMount} style={{ position: 'relative', boxSizing: 'border-box', padding: 'var(--page-pad)', minBlockSize: MENU_ROOM }}>
            {mount && (
                <DropdownMenu
                    isOpen
                    onOpenChange={noop}
                    container={mount}
                    loading={band === 'shape'}
                    hasError={band === 'over'}
                    onRetry={noop}
                    trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
                >
                    <ButtonItem onClick={noop}>Edit</ButtonItem>
                    <ButtonItem onClick={noop}>Remove from group</ButtonItem>
                </DropdownMenu>
            )}
        </div>
    );
};

/** What the band's cell says, for the timeline's caption. */
const BAND_WORDS = {
    under: 'Under 1 s',
    shape: '1 to 10 s',
    over: 'Over 10 s',
};

const SHAPES = { list: LoadingList, action: LoadingAction, page: LoadingPage, menu: LoadingMenu };

/**
 * The bands live: pick what is loading, then scrub the time or press Play.
 * `seconds` sets the clock for a picture that needs a state; Play steps it on
 * its own. `reduced` holds the shimmer still and Play jumps between bands.
 */
export const LoadingTimeline = ({ kind = 'list', seconds = 2.5, reduced }) => {
    const [which, setWhich] = useState(kind);
    const [time, setTime] = useState(seconds);
    const [playing, setPlaying] = useState(false);
    const timer = useRef(null);

    useEffect(() => { setWhich(kind); }, [kind]);
    useEffect(() => { setTime(seconds); }, [seconds]);

    useEffect(() => {
        if (!playing) return undefined;
        // Play runs the clock at four times real time, so the whole wait fits a viewing; reduced motion steps it a band at a time.
        const step = reduced ? 3 : 0.4; // docs-literal: seconds of the wait per tick
        timer.current = setInterval(() => {
            setTime((t) => {
                if (t >= TIMELINE_MAX) { setPlaying(false); return t; }
                return Math.min(t + step, TIMELINE_MAX);
            });
        }, 100); // docs-literal: ms per tick
        return () => clearInterval(timer.current);
    }, [playing, reduced]);

    const band = bandOf(time);
    const Shape = SHAPES[which];
    return (
        <div style={stack}>
            <div role="radiogroup" aria-label="What is loading" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-md)' }}>
                {KINDS.map(([id, name]) => (
                    <Button key={id} text={name} appearance={which === id ? 'primary' : 'default'} aria-pressed={which === id} onClick={() => setWhich(id)} />
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                <Button text={playing ? 'Pause' : 'Play'} iconBefore={playing ? 'pause' : 'play'} onClick={() => { if (time >= TIMELINE_MAX) setTime(0); setPlaying((p) => !p); }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', flex: '1 1 auto', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                    Time so far
                    <input
                        type="range"
                        min={0}
                        max={TIMELINE_MAX}
                        step={0.5}
                        value={time}
                        onChange={(e) => { setPlaying(false); setTime(Number(e.target.value)); }}
                        style={{ flex: '1 1 auto' }}
                    />
                </label>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text)', fontVariantNumeric: 'tabular-nums' }}>{time.toFixed(1)} s</span>
                <StatusTag appearance={band === 'over' ? 'warning' : 'neutral'}>{BAND_WORDS[band]}</StatusTag>
            </div>
            <div data-probe="stage"><Shape band={band} reduced={reduced} /></div>
        </div>
    );
};
