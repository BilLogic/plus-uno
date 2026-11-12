import React from 'react';
import PropTypes from 'prop-types';
import { Story } from '@storybook/addon-docs/blocks';

import { Tag } from '@/components';
import { useFitScale } from './use-fit-scale.js';

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
        <div ref={ref} className="docs-story not-prose sb-unstyled" inert aria-hidden="true" style={{ width: '100%', height: height * scale, overflow: 'hidden' }}>
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

/** The opening grid of a template's types: two across, a Section group apart. */
export const TypeGrid = ({ children }) => (
    <div
        className="not-prose"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, var(--card-min-width-lg)), 1fr))', gap: 'var(--section-stack-md)' }}
    >
        {children}
    </div>
);

TypeGrid.propTypes = { children: PropTypes.node };

/** One type: its live story on the raised card, then its name and one line. */
export const TypeCard = ({ of, title, children }) => (
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
        <ScaledStory width={TYPE_STAGE}>
            <Story of={of} inline />
        </ScaledStory>
        <figcaption style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-sm)' }}>
            <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{title}</span>
            <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{children}</span>
        </figcaption>
    </figure>
);

TypeCard.propTypes = {
    /** The type's story export. */
    of: PropTypes.any.isRequired,
    title: PropTypes.string.isRequired,
    /** The one line: what the type is and when it fits. */
    children: PropTypes.node,
};

/**
 * A live story with a numbered marker on each part, the numbers matching the
 * Parts list beside it. Markers sit in a gutter at the start, each joined to
 * its part's outline, and follow the story as it lays out; the story is
 * scaled to fit, the markers are not, so they read at one size.
 *
 * @param {object} props
 * @param {number} props.width  the stage width the story lays out at
 * @param {{selector: string, label: string}[]} props.parts  each part's CSS
 *   selector inside the story, in Parts-list order, and its name for the
 *   figure's accessible description
 */
/** Whether an earlier marker starts within a marker's height of this one, so the gutter is taken. */
const MARKER_CLEARANCE = 24; // docs-literal: the marker's own size, --control-sm, in px for the layout math
const sharesLine = (marks, i) => marks.slice(0, i).some((m) => m && marks[i] && Math.abs(m.top - marks[i].top) < MARKER_CLEARANCE);

export const LiveAnatomy = ({ width, parts, title, children }) => {
    const box = React.useRef(null);
    const [marks, setMarks] = React.useState([]);
    React.useLayoutEffect(() => {
        const root = box.current;
        if (!root) return undefined;
        const read = () => {
            const origin = root.getBoundingClientRect();
            setMarks(parts.map(({ selector }) => {
                const el = root.querySelector(selector);
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return { top: r.top - origin.top, left: r.left - origin.left, width: r.width, height: r.height };
            }));
        };
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(root);
        root.querySelectorAll('*').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [parts]);
    return (
        <figure
            role="img"
            aria-label={`${title}: ${parts.map((p, i) => `${i + 1}, ${p.label}`).join('; ')}`}
            className="not-prose"
            style={{ margin: 0, position: 'relative', paddingInlineStart: 'var(--control-lg)' }}
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
                            style={{
                                position: 'absolute',
                                // Two parts that start on one line (a body and its detail): the
                                // second marker moves onto its part's corner instead of the gutter.
                                ...(sharesLine(marks, i)
                                    ? { top: `calc(${m.top}px - var(--control-sm) / 2)`, left: `calc(${m.left}px - var(--control-sm) / 2)` }
                                    : { top: m.top, left: 'calc(-1 * var(--control-lg))' }),
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
    parts: PropTypes.arrayOf(PropTypes.shape({ selector: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired,
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
export const BrowserWindow = ({ address = 'app.plus.org', height, children }) => (
    <div
        className="not-prose"
        style={{
            display: 'flex',
            flexDirection: 'column',
            border: 'var(--border-default) solid var(--ds-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--ds-surface-sunken)',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)', padding: 'var(--space-050) var(--space-100)', borderBottom: 'var(--border-default) solid var(--ds-border)' }}>
            <span aria-hidden="true" style={{ display: 'flex', gap: 'var(--space-050)' }}>
                {[0, 1, 2].map((i) => (
                    <span key={i} style={{ inlineSize: 'var(--space-075)', blockSize: 'var(--space-075)', borderRadius: 'var(--radius-full)', background: 'var(--ds-background-neutral)' }} />
                ))}
            </span>
            <span style={{ flex: '1 1 auto', padding: 'var(--space-025) var(--space-100)', borderRadius: 'var(--radius-full)', background: 'var(--ds-surface)', font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                {address}
            </span>
        </div>
        <div style={{ blockSize: height, minBlockSize: 0, position: 'relative', overflow: 'hidden' }}>{children}</div>
    </div>
);

BrowserWindow.propTypes = {
    /** The address in the bar. */
    address: PropTypes.string,
    /** The body's height: docs geometry, in px. */
    height: PropTypes.number.isRequired,
    children: PropTypes.node,
};
