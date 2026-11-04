import React from 'react';
import PropTypes from 'prop-types';
import './GenerativeBorder.scss';

/** The radius tokens a ring can follow: the radius the wrapped content already uses. */
export const GENERATIVE_BORDER_RADII = ['radius-025', 'radius-050', 'radius-075', 'radius-100', 'radius-full'];

/**
 * The border that shows PLUS AI is generating content: a 2px rounded stroke in
 * two flat colors, in hard-edged segments that run clockwise around the edge.
 *
 * - **isActive** shows the ring and sets `aria-busy` on the wrapper. Off, the
 *   children render inside the wrapper with no ring at all.
 * - **radius** names the radius token the ring follows; match the content it
 *   wraps. Defaults to `radius-100`.
 *
 * The segments turn slowly while active. The ring is decorative and hidden from
 * assistive technology; `aria-busy` is what says content is changing. Under
 * reduced motion the same segments hold still.
 *
 * Use it only while generating, one ring per piece of content. Do not nest two.
 */
const GenerativeBorder = ({
    isActive = false,
    radius = 'radius-100',
    children,
    className = '',
    style,
    ...props
}) => {
    const token = GENERATIVE_BORDER_RADII.includes(radius) ? radius : 'radius-100';
    const classes = ['plus-generative-border', className].filter(Boolean).join(' ');

    return (
        <div
            {...props}
            className={classes}
            // After the spread, so a caller's `aria-busy` cannot disagree with `isActive`.
            aria-busy={isActive}
            style={{ '--generative-border-radius': `var(--${token})`, ...style }}
        >
            {children}
            {isActive && <span className="plus-generative-border__ring" aria-hidden="true" />}
        </div>
    );
};

GenerativeBorder.propTypes = {
    /** Whether content is being generated. Shows the ring and sets `aria-busy`. */
    isActive: PropTypes.bool,
    /** The radius token the ring follows. Match the wrapped content. */
    radius: PropTypes.oneOf(GENERATIVE_BORDER_RADII),
    /** The content being generated into. */
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default GenerativeBorder;
