import React from 'react';
import PropTypes from 'prop-types';
import { Story } from '@storybook/addon-docs/blocks';

import { Tag } from '@/components';
import { useFitScale } from './use-fit-scale.js';
import { ANATOMY_REGIONS, isOwnRegion } from './anatomy-regions.js';
import { HeroCard } from '../docs-landing/HeroCard.jsx';

/**
 * The blocks a template page is built from (Section first; Frame, Page, Form,
 * Modal, Panel and Popup copy it). Every picture on a template page is a live
 * story of real PLUS components; these only frame and label it.
 *
 *   <TypeGrid>       the opening grid of a template's types
 *   <TypeCard>       one type: a live story, its name and one line
 *   <ScaledStory>    a live story laid out at a stage width, drawn to fit
 *   <LiveAnatomy>    a live story with numbered markers on its parts
 *   <PlannedTag>     marks a slot the template does not build yet
 *
 * The page model (`scripts/lib/docs-page.mjs`) reads each `TypeCard` as one
 * line, `- **Title.** line`, so the type grid reaches the generated agent file
 * as words.
 */

/**
 * A live story laid out at `width` and scaled to fit its box, its height
 * following the content. It is a picture: inert and hidden from assistive
 * technology, so the docs page gains no tab stops, headings or landmarks.
 * The story itself runs at full size in Storybook and its test run.
 */
export const ScaledStory = ({ width, children }) => {
    const [ref, scale] = useFitScale(width);
    const inner = React.useRef(null);
    const [height, setHeight] = React.useState(0);
    React.useLayoutEffect(() => {
        const el = inner.current;
        if (!el) return undefined;
        const read = () => setHeight(el.offsetHeight);
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return (
        // `docs-story` puts the picture's headings on Tocbot's ignore list, so "On this page" lists the page's own.
        <div ref={ref} className="docs-story not-prose sb-unstyled" inert aria-hidden="true" style={{ width: '100%', height: height * scale, flexShrink: 0, overflow: 'hidden' }}>
            <div ref={inner} style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                {children}
            </div>
        </div>
    );
};

ScaledStory.propTypes = {
    /** The stage width the story lays out at: docs geometry, not a design value. */
    width: PropTypes.number.isRequired,
    children: PropTypes.node,
};

/** The stage a type card's story lays out at, so every card shows one scale; wide enough for a list beside its detail. */
const TYPE_STAGE = 1024;

/**
 * The opening grid of a template's types: two across, a Section group apart.
 * `wide` puts one type per row, for types that each show a whole screen, so
 * the screen draws at a size that reads.
 */
export const TypeGrid = ({ wide = false, children }) => (
    <div
        className="not-prose"
        style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0, 1fr)' : 'repeat(auto-fill, minmax(min(100%, var(--card-min-width-lg)), 1fr))', gap: 'var(--section-stack-md)' }}
    >
        {children}
    </div>
);

TypeGrid.propTypes = { wide: PropTypes.bool, children: PropTypes.node };

/** One type: its live story (or, with `hero`, a page's registry hero) on the raised card, then its name and one line. */
export const TypeCard = ({ of, thumb, hero, title, stage = TYPE_STAGE, to, thumbRatio, children }) => (
    <figure
        style={{
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--card-stack-lg)',
            padding: 'var(--card-pad-default)',
            borderRadius: 'var(--card-radius)',
            background: 'var(--ds-surface-raised)',
            boxShadow: 'var(--ds-shadow-raised)',
        }}
    >
        {/* A fixed ratio crops the picture to one height, so cards that sit side by side match. */}
        <div data-type-thumb style={!hero && thumbRatio ? { aspectRatio: thumbRatio, overflow: 'hidden' } : undefined}>
            {hero ? (
                <HeroCard page={hero} />
            ) : (
                <ScaledStory width={stage}>
                    {thumb ?? <Story of={of} inline />}
                </ScaledStory>
            )}
        </div>
        <figcaption style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-sm)' }}>
            <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>
                {to ? <a href={`?path=/docs/${to}--docs`} style={{ color: 'var(--ds-link)', textDecoration: 'underline' }}>{title}</a> : title}
            </span>
            <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{children}</span>
        </figcaption>
    </figure>
);

TypeCard.propTypes = {
    /** The type's story export. */
    of: PropTypes.any,
    /** A node drawn in place of the story, at the same stage. */
    thumb: PropTypes.node,
    /** A hero-registry page id: the card shows that page's hero, cropped from its stage, in place of a story. */
    hero: PropTypes.string,
    title: PropTypes.string.isRequired,
    /** The width the story lays out at, when the type needs more than the shared stage (a Frame docks its Sidebar from 1024 of its own width, inside the window's border). */
    stage: PropTypes.number,
    /** A docs id (`templates-frame`): the title links to that page. */
    to: PropTypes.string,
    /** A CSS aspect ratio (`16 / 10`) that crops every thumbnail to one height. */
    thumbRatio: PropTypes.string,
    /** The one line: what the type is and when it fits. */
    children: PropTypes.node,
};

/**
 * A live story with a numbered marker on each part, the numbers matching the
 * Parts list beside it. Markers sit in a gutter outside the picture, each
 * level with its part and joined to the part's outline by a hairline, so no
 * marker covers content. The story is scaled to fit, the markers are not, so
 * they read at one size.
 *
 * @param {object} props
 * @param {number} props.width  the stage width the story lays out at
 * @param {{selector: string, label: string, side?: 'start'|'top'|'end', at?: 'start'|'middle'|'end'}[]} props.parts
 *   each part's CSS selector inside the story, in Parts-list order, and its
 *   name for the figure's accessible description. `side` picks the gutter
 *   (start by default; top puts the marker above the part with a short vertical
 *   leader; `at: end` drops it just outside the part's trailing edge and turns in); `at` picks where along the part the marker sits: level with it for
 *   start and end (its top by default), along its top edge for top.
 */
const MARKER = 24; // docs-literal: the marker's own size, --control-sm, in px for the layout math
const ELBOW = 8; // docs-literal: how far outside a part's edge an elbow leader drops, px for the layout math
const GUTTER = 'var(--control-lg)';

/**
 * Each marker's place, in order. Start and end markers sit level with their part
 * (moved down past an earlier marker on the same side, never below the part);
 * top markers sit above it, `at` choosing where along its top edge, nudged
 * apart from an earlier top marker. `markerTop` / `markerLeft` are the marker's
 * own corner in the figure box's coordinates, and `lead` the leader's start.
 */
const placeMarkers = (rects, parts) => {
    const taken = { start: [], end: [], top: [] };
    return rects.map((r, i) => {
        if (!r) return null;
        const side = parts[i].side === 'end' || parts[i].side === 'top' ? parts[i].side : 'start';
        const at = parts[i].at;
        if (side === 'top') {
            // `end` drops the leader in the strip just outside the part's trailing edge, then turns into the edge: the way down to a part that sits under another.
            const elbow = at === 'end';
            let left = elbow ? r.left + r.width + ELBOW - MARKER / 2 : at === 'middle' ? r.left + (r.width - MARKER) / 2 : r.left + MARKER / 2;
            taken.top.forEach((l) => { if (Math.abs(l - left) < MARKER * 1.5) left = l + MARKER * 1.5; });
            taken.top.push(left);
            return { ...r, side, markerLeft: left, elbow };
        }
        let top = at === 'end' ? r.top + r.height - MARKER : at === 'middle' ? r.top + (r.height - MARKER) / 2 : r.top;
        taken[side].forEach((t) => { if (Math.abs(t - top) < MARKER) top = t + MARKER; });
        top = Math.min(top, r.top + r.height - MARKER);
        taken[side].push(top);
        return { ...r, side, markerTop: top };
    });
};

export const LiveAnatomy = ({ width, parts, title, children }) => {
    const box = React.useRef(null);
    const [marks, setMarks] = React.useState([]);
    const [boxWidth, setBoxWidth] = React.useState(0);
    React.useLayoutEffect(() => {
        const root = box.current;
        if (!root) return undefined;
        const read = () => {
            const origin = root.getBoundingClientRect();
            setBoxWidth(origin.width);
            const regions = [...root.querySelectorAll(ANATOMY_REGIONS)];
            const placed = parts.map((part) => {
                const el = root.querySelector(part.selector);
                if (!el) return { part, rect: null };
                const r = el.getBoundingClientRect();
                // A start leader runs left from the part to the gutter: when a region it does not label (the Sidebar) sits in that run, the marker moves to the end gutter, nearest the part.
                const blocked = (part.side ?? 'start') === 'start' && regions.some((region) => {
                    if (isOwnRegion(region, el)) return false;
                    const g = region.getBoundingClientRect();
                    return g.right <= r.left + 1 && g.right > origin.left && g.bottom > r.top + 1 && g.top < r.bottom - 1;
                });
                return { part: blocked ? { ...part, side: 'end' } : part, rect: { top: r.top - origin.top, left: r.left - origin.left, width: r.width, height: r.height } };
            });
            setMarks(placeMarkers(placed.map((p) => p.rect), placed.map((p) => p.part)));
        };
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(root);
        root.querySelectorAll('*').forEach((el) => observer.observe(el));
        // A layer that mounts or is placed after the first read (a Popup floating into its stage) moves a part: read again.
        const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(read);
        mutations?.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
        return () => { observer.disconnect(); mutations?.disconnect(); };
    }, [parts]);
    return (
        <figure
            role="img"
            aria-label={`${title}: ${parts.map((p, i) => `${i + 1}, ${p.label}`).join('; ')}`}
            className="not-prose"
            style={{ margin: 0, position: 'relative', paddingInline: GUTTER, paddingBlockStart: parts.some((p) => p.side === 'top') ? GUTTER : 0 }}
        >
            <div ref={box} style={{ position: 'relative' }}>
                <ScaledStory width={width}>{children}</ScaledStory>
                {marks.map((m, i) => m && (
                    <React.Fragment key={parts[i].selector}>
                        <span
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: m.top,
                                left: m.left,
                                width: m.width,
                                height: m.height,
                                outline: 'var(--border-default) dashed var(--ds-border-brand)',
                                borderRadius: 'var(--radius-sm)',
                                pointerEvents: 'none',
                            }}
                        />
                        <span
                            aria-hidden="true"
                            data-anatomy-leader={i + 1}
                            style={{
                                position: 'absolute',
                                ...(m.side === 'top'
                                    ? {
                                        left: m.elbow ? m.left + m.width : m.markerLeft + MARKER / 2,
                                        top: `calc(-1 * (${GUTTER} - ${MARKER}px) / 2)`,
                                        width: m.elbow ? ELBOW : 0,
                                        height: `calc(${m.top + (m.elbow ? MARKER / 2 : 0)}px + (${GUTTER} - ${MARKER}px) / 2)`,
                                        ...(m.elbow
                                            ? { borderRight: 'var(--border-default) dashed var(--ds-border-brand)', borderBottom: 'var(--border-default) dashed var(--ds-border-brand)' }
                                            : { borderLeft: 'var(--border-default) dashed var(--ds-border-brand)' }),
                                    }
                                    : {
                                        top: m.markerTop + MARKER / 2,
                                        height: 0,
                                        borderTop: 'var(--border-default) dashed var(--ds-border-brand)',
                                        ...(m.side === 'end'
                                            ? { left: m.left + m.width, width: Math.max(boxWidth - m.left - m.width, 0) }
                                            : { right: boxWidth - m.left, width: Math.max(m.left, 0) }),
                                    }),
                            }}
                        />
                        <span
                            aria-hidden="true"
                            data-anatomy-marker={i + 1}
                            style={{
                                position: 'absolute',
                                ...(m.side === 'top' ? { top: `calc(-1 * (${GUTTER} + ${MARKER}px) / 2)`, left: m.markerLeft } : { top: m.markerTop }),
                                ...(m.side === 'top' ? {} : m.side === 'end' ? { left: `calc(${boxWidth}px + (${GUTTER} - ${MARKER}px) / 2)` } : { left: `calc(-1 * (${GUTTER} + ${MARKER}px) / 2)` }),
                                width: 'var(--control-sm)',
                                height: 'var(--control-sm)',
                                display: 'grid',
                                placeItems: 'center',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--ds-background-brand-bold)',
                                color: 'var(--ds-text-inverse)',
                                font: 'var(--body-small)',
                                fontWeight: 'var(--type-weight-semibold)',
                            }}
                        >
                            {i + 1}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        </figure>
    );
};

LiveAnatomy.propTypes = {
    width: PropTypes.number.isRequired,
    parts: PropTypes.arrayOf(PropTypes.shape({
        selector: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        side: PropTypes.oneOf(['start', 'top', 'end']),
        at: PropTypes.oneOf(['start', 'middle', 'end']),
    })).isRequired,
    /** What the figure shows, read before its numbered parts. */
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
};

/** Marks a slot or prop the template does not build yet, in a Code tab's Slots table. */
export const PlannedTag = () => <Tag text="Planned" color="gray" />;

/**
 * A browser window around a live example: a title bar with the window's
 * controls and the address, over a body of fixed height that the example
 * fills. The Frame's types sit in one, so the reader sees the app in a window
 * and not a bare rectangle. Chrome only; it paints with `--ds-*` tokens.
 */
export const BrowserWindow = ({ address = 'app.plus.org', height, fill = false, children }) => (
    <div
        className="not-prose"
        style={{
            blockSize: fill ? '100%' : undefined,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            border: 'var(--border-default) solid var(--ds-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            // The body is the Page's surface: a window that holds a Frame shows the Frame's own sunken fill.
            background: 'var(--ds-surface)',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)', background: 'var(--ds-surface-sunken)', padding: 'var(--space-050) var(--space-100)', borderBottom: 'var(--border-default) solid var(--ds-border)' }}>
            <span aria-hidden="true" style={{ display: 'flex', gap: 'var(--space-050)' }}>
                {[0, 1, 2].map((i) => (
                    <span key={i} style={{ inlineSize: 'var(--space-075)', blockSize: 'var(--space-075)', borderRadius: 'var(--radius-full)', background: 'var(--ds-background-neutral)' }} />
                ))}
            </span>
            <span style={{ flex: '1 1 auto', padding: 'var(--space-025) var(--space-100)', borderRadius: 'var(--radius-full)', background: 'var(--ds-surface)', font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                {address}
            </span>
        </div>
        <div style={{ blockSize: fill ? undefined : height, flex: fill ? '1 1 0' : undefined, minBlockSize: 0, position: 'relative', overflow: 'hidden' }}>{children}</div>
    </div>
);

BrowserWindow.propTypes = {
    /** The address in the bar. */
    address: PropTypes.string,
    /** The body's height: docs geometry, in px. Not needed with `fill`. */
    height: PropTypes.number,
    /** Fill the box the window sits in, the body taking what the bar leaves. */
    fill: PropTypes.bool,
    children: PropTypes.node,
};
