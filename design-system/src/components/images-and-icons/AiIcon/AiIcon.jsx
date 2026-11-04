import React from 'react';
import PropTypes from 'prop-types';
import { AI_ICON_NAMES, AI_ICON_SHAPES } from './aiIconShapes';
import './AiIcon.scss';

export { AI_ICON_NAMES, AI_ICON_SIZES } from './aiIconShapes';

/** Every size the set draws. A given icon has a subset: see `AI_ICON_SIZES`. */
export const AI_ICON_ALL_SIZES = [12, 16, 24];

/**
 * An icon for a PLUS AI action: generate, ask, rewrite, summarize, plan, suggest
 * or stop generating. Each badged icon is a Font Awesome Free glyph with one
 * four-point sparkle in its top-right corner and a clean gap cut around it. Generate is the
 * sparkle alone, and stop generating has none because stopping is not generative.
 *
 * - **name** picks the icon.
 * - **size** is 16 (the default) or 24. Generate and stop generating also have 12.
 *   Asking another icon for 12 draws it at 16 and warns.
 * - **label** names the icon for assistive technology. Without it the icon is
 *   hidden, so pair it with visible text.
 *
 * The shapes fill with `currentColor`, which starts at the icon color; set `color`
 * to change it. Pair every icon with a label unless its meaning is obvious.
 */
const AiIcon = ({ name = 'generate', size = 16, label, className = '', style, ...props }) => {
    const bySize = AI_ICON_SHAPES[name];
    if (!bySize) return null;
    let drawn = size;
    if (!bySize[size]) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[AiIcon] "${name}" has no ${size}px size; drawing it at 16.`);
        }
        drawn = 16;
    }
    const { viewBox, paths, fillRule } = bySize[drawn];
    const classes = ['plus-ai-icon', className].filter(Boolean).join(' ');
    // After the spread, so a caller's role or aria-hidden cannot contradict `label`.
    const accessibility = label
        ? { role: 'img', 'aria-label': label, 'aria-hidden': undefined }
        : { role: undefined, 'aria-label': undefined, 'aria-hidden': true, focusable: 'false' };

    return (
        <svg
            {...props}
            {...accessibility}
            className={classes}
            style={style}
            width={drawn}
            height={drawn}
            viewBox={viewBox}
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            {paths.map((d) => <path key={d} d={d} fillRule={fillRule} />)}
        </svg>
    );
};

AiIcon.propTypes = {
    /** Which action the icon stands for. */
    name: PropTypes.oneOf(AI_ICON_NAMES),
    /** The icon's size in px. 12 exists for generate and stop-generating only. */
    size: PropTypes.oneOf(AI_ICON_ALL_SIZES),
    /** An accessible name. Without it the icon is hidden from assistive technology. */
    label: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default AiIcon;
