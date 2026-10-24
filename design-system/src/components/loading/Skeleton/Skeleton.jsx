import React from 'react';
import PropTypes from 'prop-types';
import './Skeleton.scss';

/**
 * `Skeleton` — a gray placeholder shape while content loads.
 *
 * ONE PIECE, MANY SHAPES. A rectangle, a circle or a text bar that can repeat
 * as lines, plus presets sized to the labels: Status (20 and 32), Count (20,
 * round), Tag (22), person Tag (22, round), a tag group and a paragraph. A
 * preset sets shape, height and corners together and wins over them, so a
 * label placeholder is the label's size without anyone looking it up. The
 * preset heights come from `_label-heights.scss`, the file the labels read
 * their own heights from.
 *
 * WHEN TO USE WHICH. A preset when one label loads after its row is already
 * on screen. Inside a loading table or card, plain text bars: the container
 * owns the skeleton, and no label shapes appear inside it.
 *
 * HIDDEN FROM ASSISTIVE TECH, ALWAYS. Every skeleton is `aria-hidden`, has no
 * role, never takes focus and ignores the pointer. The busy state belongs to
 * the loading region (`aria-busy="true"`), which this component cannot see,
 * so the caller sets it once on the container.
 */

export const SKELETON_SHAPES = ['rect', 'circle', 'text'];

/**
 * Every preset, in one place: the shape it draws, the bars it renders, the
 * default number of lines, and the props it ignores. The component and its
 * development warnings both read this map.
 *
 * `bars` lists the shapes a preset draws, each as its modifier names. One bar
 * is a single shape; several are a group, drawn as `group` lays them out.
 */
const PRESETS = {
    status: { shape: 'rect', bars: [['status']], ignores: ['height', 'radius'] },
    'status-spacious': { shape: 'rect', bars: [['status-spacious']], ignores: ['height', 'radius'] },
    count: { shape: 'rect', bars: [['count']], ignores: ['width', 'height', 'radius'] },
    tag: { shape: 'rect', bars: [['tag']], ignores: ['height', 'radius'] },
    'tag-person': { shape: 'rect', bars: [['tag-person']], ignores: ['height', 'radius'] },
    /* Three tag shapes at the TagGroup gap, as Figma draws them. */
    'tag-group': {
        shape: 'rect',
        group: 'tags',
        bars: [['tag'], ['tag', 'tag-narrow'], ['tag', 'tag-widest']],
        ignores: ['width', 'height', 'radius'],
    },
    paragraph: { shape: 'text', lines: 3, ignores: ['height', 'radius'] },
};

export const SKELETON_PRESETS = Object.keys(PRESETS);

/** Radius token names, each the full token with its fallback. */
export const SKELETON_RADII = {
    none: '0',
    'element-radius-sm': 'var(--size-element-radius-sm, 4px)',
    'element-radius-md': 'var(--size-element-radius-md, 4px)',
    'element-radius-lg': 'var(--size-element-radius-lg, 8px)',
    'element-radius-full': 'var(--size-element-radius-full, 999px)',
    'card-radius-sm': 'var(--size-card-radius-sm, 12px)',
    'card-radius-md': 'var(--size-card-radius-md, 16px)',
    'section-radius-sm': 'var(--size-section-radius-sm, 8px)',
    'section-radius-md': 'var(--size-section-radius-md, 12px)',
    'section-radius-lg': 'var(--size-section-radius-lg, 16px)',
};

const toLength = (value) => (typeof value === 'number' ? `${value}px` : value);

/** Class names from parts, skipping the empty ones. */
const cls = (...parts) => parts.filter(Boolean).join(' ');

/** `plus-skeleton--a plus-skeleton--b` from `['a', 'b']`. */
const modifiers = (bar) => bar.map((m) => `plus-skeleton--${m}`);

/*
 * A prop the chosen shape or preset ignores is almost always a mistake, so it
 * warns in development rather than failing silently. It still renders.
 */
const warnIgnored = (props, why) => {
    if (!props.length || process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(`[Skeleton] ${props.map((p) => `\`${p}\``).join(', ')} ${props.length > 1 ? 'are' : 'is'} ignored ${why}.`);
};

/**
 * Which of the passed props this shape or preset ignores, and why, as
 * [props, reason] pairs. What is ignored here is also what the style leaves
 * out, so the warning and the rendering cannot disagree.
 */
const ignoredProps = ({ preset, def, shape, resolvedShape, lines, passed }) => {
    const found = [];
    const add = (names, why) => {
        const hit = names.filter((name) => passed[name] !== undefined);
        if (hit.length) found.push([hit, why]);
    };
    if (def) {
        // A preset wins over `shape`: named only when it asked for something else.
        const overridden = shape !== undefined && shape !== def.shape ? ['shape'] : [];
        add([...def.ignores, ...overridden], `with preset="${preset}", which sets its own size and shape`);
    } else {
        if (resolvedShape === 'circle') {
            add(['radius'], 'on a circle, which is always round');
            // A circle takes one size. Given two that differ, the width wins.
            if (passed.width !== undefined && passed.height !== undefined && toLength(passed.width) !== toLength(passed.height)) {
                add(['height'], 'on a circle when it differs from `width`: a circle takes one size, the width');
            }
        }
        if (lines > 1) add(['height', 'radius'], 'on several lines: each line is a 16-tall text bar');
    }
    if (resolvedShape !== 'text') add(['lines'], 'unless the shape is text');
    return found;
};

export const Skeleton = ({
    shape,
    preset,
    width,
    height,
    radius,
    lines,
    isShimmering = true,
    className = '',
    style,
    ...rest
}) => {
    const def = PRESETS[preset];
    const resolvedShape = def ? def.shape : (shape ?? 'rect');
    const count = resolvedShape === 'text' ? Math.max(1, Math.floor(lines ?? def?.lines ?? 1)) : 1;
    const passed = { shape, width, height, radius, lines };

    const ignored = ignoredProps({ preset, def, shape, resolvedShape, lines: count, passed });
    ignored.forEach(([props, why]) => warnIgnored(props, why));
    const skipped = new Set(ignored.flatMap(([props]) => props));
    const use = (name) => passed[name] !== undefined && !skipped.has(name);

    const vars = {};
    if (use('width')) vars['--plus-skeleton-width'] = toLength(width);
    if (use('height')) vars['--plus-skeleton-height'] = toLength(height);
    if (use('radius') && SKELETON_RADII[radius]) vars['--plus-skeleton-radius'] = SKELETON_RADII[radius];
    // A circle is as wide as it is tall: one size, from whichever was given.
    if (!def && resolvedShape === 'circle' && (width ?? height) !== undefined) {
        vars['--plus-skeleton-width'] = toLength(width ?? height);
        vars['--plus-skeleton-height'] = toLength(width ?? height);
    }

    /*
     * The bars to draw. Several lines are a column of text bars at the Element
     * sm gap, the last one shorter so the block reads as text rather than as a
     * stack of bars.
     */
    const bars = def?.bars ?? Array.from({ length: count }, () => [resolvedShape]);
    const group = def?.group ?? (bars.length > 1 ? 'lines' : null);
    const motion = isShimmering ? 'plus-skeleton--shimmer' : '';
    // Never a role and never focusable, whatever the caller passes: a
    // placeholder is not something to reach or name.
    const shared = { ...rest, style: { ...vars, ...style }, 'aria-hidden': 'true', role: undefined, tabIndex: undefined };

    if (!group) {
        return <span {...shared} className={cls('plus-skeleton', ...modifiers(bars[0]), motion, className)} />;
    }
    return (
        <span {...shared} className={cls('plus-skeleton-group', `plus-skeleton-group--${group}`, className)}>
            {bars.map((bar, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <span key={i} className={cls('plus-skeleton', ...modifiers(bar), motion)} />
            ))}
        </span>
    );
};

Skeleton.propTypes = {
    /** `rect` by default; `circle` for avatars and round counts; `text` is a 16-tall bar that can repeat as `lines`. A preset wins over it, with a warning when they disagree. */
    shape: PropTypes.oneOf(SKELETON_SHAPES),
    /** Sized to a label (`status`, `status-spacious`, `count`, `tag`, `tag-person`), a loading TagGroup (`tag-group`) or three lines of text (`paragraph`). Sets shape, height and corners together and wins over them. */
    preset: PropTypes.oneOf(SKELETON_PRESETS),
    /** Any CSS length, or a number of pixels. Text bars fill the line by default; a label preset has a stand-in width. Ignored by `count` and `tag-group`. A circle takes one size: `width`, or `height` when no width is given. */
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Any CSS length, or a number of pixels. Ignored, with a warning, by presets and by several text `lines`, which are always 16 tall. */
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** A radius token name, such as `element-radius-md` or `card-radius-sm`. Ignored, with a warning, by presets, by `circle` (always round) and by several text `lines`, which keep the text bar's radius. */
    radius: PropTypes.oneOf(Object.keys(SKELETON_RADII)),
    /** `text` (and `paragraph`) only: how many bars. The last of several is shorter. Ignored, with a warning, on any other shape or preset. */
    lines: PropTypes.number,
    /** The shimmer sweep. Off, it is a flat fill, which is also what reduced motion gets. */
    isShimmering: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Skeleton;
