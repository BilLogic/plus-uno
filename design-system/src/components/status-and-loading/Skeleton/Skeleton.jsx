import React from 'react';
import PropTypes from 'prop-types';
import './Skeleton.scss';

/**
 * `Skeleton` — a grey placeholder shape while content loads.
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
export const SKELETON_PRESETS = [
    'status',
    'status-spacious',
    'count',
    'tag',
    'tag-person',
    'tag-group',
    'paragraph',
];

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

/** The presets that stand in for one label. */
const LABEL_PRESETS = ['status', 'status-spacious', 'count', 'tag', 'tag-person'];

/** The three tag shapes of a loading TagGroup, as Figma draws them. */
const TAG_GROUP_WIDTHS = ['wide', 'narrow', 'widest'];

const toLength = (value) => (typeof value === 'number' ? `${value}px` : value);

export const Skeleton = ({
    shape = 'rect',
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
    const motion = isShimmering ? 'plus-skeleton--shimmer' : '';

    /*
     * A tag group is three tag shapes at the group's gap. The group is hidden
     * as a whole; the shapes inside it take their size from the tag preset.
     */
    if (preset === 'tag-group') {
        return (
            <span
                {...rest}
                className={['plus-skeleton-group', 'plus-skeleton-group--tags', className].filter(Boolean).join(' ')}
                style={style}
                aria-hidden="true"
            >
                {TAG_GROUP_WIDTHS.map((w) => (
                    <span key={w} className={['plus-skeleton', 'plus-skeleton--tag', `plus-skeleton--tag-${w}`, motion].filter(Boolean).join(' ')} />
                ))}
            </span>
        );
    }

    const isParagraph = preset === 'paragraph';
    const isLabel = LABEL_PRESETS.includes(preset);
    const resolvedShape = isParagraph ? 'text' : shape;

    const vars = {};
    if (preset !== 'count' && width !== undefined) vars['--plus-skeleton-width'] = toLength(width);
    if (!isLabel && !isParagraph) {
        if (height !== undefined) vars['--plus-skeleton-height'] = toLength(height);
        if (radius !== undefined && SKELETON_RADII[radius]) vars['--plus-skeleton-radius'] = SKELETON_RADII[radius];
        // A circle is as wide as it is tall: one size, from whichever was given.
        if (resolvedShape === 'circle' && (width ?? height) !== undefined) {
            vars['--plus-skeleton-width'] = toLength(width ?? height);
            vars['--plus-skeleton-height'] = toLength(width ?? height);
        }
    }

    const shapeClass = isLabel ? `plus-skeleton--${preset}` : `plus-skeleton--${resolvedShape}`;
    const count = resolvedShape === 'text' ? Math.max(1, Math.floor(lines ?? (isParagraph ? 3 : 1))) : 1;

    /*
     * Several lines are a column of text bars at the Element sm gap, the last
     * one shorter so the block reads as text rather than as a stack of bars.
     */
    if (count > 1) {
        return (
            <span
                {...rest}
                className={['plus-skeleton-group', 'plus-skeleton-group--lines', className].filter(Boolean).join(' ')}
                style={{ ...vars, ...style }}
                aria-hidden="true"
            >
                {Array.from({ length: count }, (_, i) => (
                    <span key={i} className={['plus-skeleton', 'plus-skeleton--text', motion].filter(Boolean).join(' ')} />
                ))}
            </span>
        );
    }

    return (
        <span
            {...rest}
            className={['plus-skeleton', shapeClass, motion, className].filter(Boolean).join(' ')}
            style={{ ...vars, ...style }}
            aria-hidden="true"
        />
    );
};

Skeleton.propTypes = {
    /** `rect` by default; `circle` for avatars and round counts; `text` is a 16-tall bar that can repeat as `lines`. A preset wins over it. */
    shape: PropTypes.oneOf(SKELETON_SHAPES),
    /** Sized to a label (`status`, `status-spacious`, `count`, `tag`, `tag-person`), a loading TagGroup (`tag-group`) or three lines of text (`paragraph`). Sets shape, height and corners together and wins over them. */
    preset: PropTypes.oneOf(SKELETON_PRESETS),
    /** Any CSS length, or a number of pixels. Text bars fill the line by default; a label preset has a stand-in width. Ignored by `count` and `tag-group`. */
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Any CSS length, or a number of pixels. Ignored by presets. */
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** A radius token name, such as `element-radius-md` or `card-radius-sm`. Ignored by presets and by `circle`. */
    radius: PropTypes.oneOf(Object.keys(SKELETON_RADII)),
    /** `text` only: how many bars. The last of several is shorter. */
    lines: PropTypes.number,
    /** The shimmer sweep. Off, it is a flat fill, which is also what reduced motion gets. */
    isShimmering: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Skeleton;
