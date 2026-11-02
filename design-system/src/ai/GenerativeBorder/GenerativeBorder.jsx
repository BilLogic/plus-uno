import React from 'react';
import PropTypes from 'prop-types';
import './GenerativeBorder.scss';

/** The corner radii a ring can follow, each a radius token the wrapped content already uses. */
export const GENERATIVE_BORDER_RADII = ['card', 'control', 'rounded', 'pill'];

const RADIUS_TOKENS = {
    card: '--card-radius',
    control: '--size-element-radius-md',
    rounded: '--size-element-radius-lg',
    pill: '--size-element-radius-full',
};

/**
 * A ring around content the agent is generating right now. It turns on when
 * generation starts and off when it ends.
 *
 * - **active** shows the ring and sets `aria-busy` on the wrapper. Off, the
 *   children render inside the wrapper with no ring at all.
 * - **radius** names the corner token the ring follows; match the content it
 *   wraps. Defaults to the card radius.
 *
 * The ring is two flat tones, `--ds-ai-border` and `--ds-ai-background-bold`,
 * turning slowly around the edge. It is decorative and hidden from assistive
 * technology; `aria-busy` is what says content is changing. Under reduced
 * motion it stops turning and is one solid `--ds-ai-border` line.
 *
 * Use one ring per piece of content. Do not nest two.
 */
const GenerativeBorder = ({
    active = false,
    radius = 'card',
    children,
    className = '',
    style,
    ...props
}) => {
    const token = RADIUS_TOKENS[radius] ?? RADIUS_TOKENS.card;
    const classes = ['plus-generative-border', className].filter(Boolean).join(' ');

    return (
        <div
            {...props}
            className={classes}
            // After the spread, so a caller's `aria-busy` cannot disagree with `active`.
            aria-busy={active}
            style={{ '--generative-border-radius': `var(${token})`, ...style }}
        >
            {children}
            {active && <span className="plus-generative-border__ring" aria-hidden="true" />}
        </div>
    );
};

GenerativeBorder.propTypes = {
    /** Whether content is being generated. Shows the ring and sets `aria-busy`. */
    active: PropTypes.bool,
    /** The corner token the ring follows. Match the wrapped content. */
    radius: PropTypes.oneOf(GENERATIVE_BORDER_RADII),
    /** The content being generated into. */
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default GenerativeBorder;
