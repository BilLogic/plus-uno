import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { GLOWS, WORDMARK, WORDMARK_WIDTH, CAP_TOP, CAP_BOTTOM } from './logoArt';
import './Logo.scss';

/** Mark heights in pixels. */
export const LOGO_SIZES = [16, 20, 24, 32, 48, 64, 96];

/**
 * The six appearances. `colored` follows the color mode (stronger glows on
 * dark); `colored-dark` always draws the stronger glows.
 */
export const LOGO_APPEARANCES = ['colored', 'colored-dark', 'filled', 'dark', 'outlined', 'outlined-reversed'];

/** Below this height the logo is the mark alone. */
export const LOCKUP_MIN_SIZE = 24;
/** At this height and below the mark uses its small-size drawing. */
const SMALL_MAX_SIZE = 24;

const MARK_BOX = 96;
const GLOW_SCALE = MARK_BOX / 92;
const CAP = CAP_BOTTOM - CAP_TOP;

/** The plus: center (68, 28), arms 24 long and 6 thick, 27 and 7.5 in the small-size drawing. */
function Plus({ small }) {
    const thickness = small ? 7.5 : 6;
    const length = small ? 27 : 24;
    const horizontal = +(thickness * 0.93).toFixed(2);
    const cx = 68;
    const cy = 28;
    return (
        <g className="plus-logo__plus">
            <rect x={cx - length / 2} y={cy - horizontal / 2} width={length} height={horizontal} rx="1.25" />
            <rect x={cx - thickness / 2} y={cy - length / 2} width={thickness} height={length} rx="1.25" />
        </g>
    );
}

Plus.propTypes = { small: PropTypes.bool };

function Glows({ tone, ids }) {
    return (
        <g className={`plus-logo__glows plus-logo__glows--${tone}`}>
            {GLOWS.map((glow, i) => (
                <path key={i} className={`plus-logo__glow plus-logo__glow--${i}`} filter={`url(#${ids}-blur-${i})`} d={glow.d} />
            ))}
        </g>
    );
}

Glows.propTypes = { tone: PropTypes.oneOf(['light', 'dark']).isRequired, ids: PropTypes.string.isRequired };

/** The mark, drawn in the 96 box. */
function Mark({ appearance, small, ids }) {
    let ground = null;
    if (appearance === 'colored' || appearance === 'colored-dark') {
        ground = (
            <>
                <defs>
                    {GLOWS.map((glow, i) => (
                        <filter
                            key={i}
                            id={`${ids}-blur-${i}`}
                            x={glow.box[0]}
                            y={glow.box[1]}
                            width={glow.box[2]}
                            height={glow.box[2]}
                            filterUnits="userSpaceOnUse"
                            colorInterpolationFilters="sRGB"
                        >
                            <feGaussianBlur stdDeviation="27.6" />
                        </filter>
                    ))}
                    <clipPath id={`${ids}-clip`}>
                        <rect width={MARK_BOX} height={MARK_BOX} rx="16" />
                    </clipPath>
                </defs>
                <g clipPath={`url(#${ids}-clip)`}>
                    <rect className="plus-logo__ground" width={MARK_BOX} height={MARK_BOX} />
                    <g transform={`scale(${GLOW_SCALE})`}>
                        {appearance === 'colored' && <Glows tone="light" ids={ids} />}
                        <Glows tone="dark" ids={ids} />
                    </g>
                </g>
            </>
        );
    } else if (appearance === 'filled' || appearance === 'dark') {
        ground = <rect className="plus-logo__tile" width={MARK_BOX} height={MARK_BOX} rx="16" />;
    } else {
        ground = <rect className="plus-logo__ring" x="3" y="3" width="90" height="90" rx="13" fill="none" strokeWidth="6" />;
    }
    return (
        <>
            {ground}
            <Plus small={small} />
        </>
    );
}

Mark.propTypes = { appearance: PropTypes.string.isRequired, small: PropTypes.bool, ids: PropTypes.string.isRequired };

/**
 * Logo
 *
 * The PLUS logo: the mark, or the lockup of mark and wordmark. Seven sizes,
 * six appearances. At 24 and below the mark uses its small-size drawing, and
 * below 24 the lockup gives way to the mark alone.
 */
const Logo = ({ appearance = 'colored', size = 32, wordmark = false, className = '', ...props }) => {
    const ids = `logo-${useId().replace(/:/g, '')}`;
    const small = size <= SMALL_MAX_SIZE;
    const lockup = wordmark && size >= LOCKUP_MIN_SIZE;

    const classNames = [
        'plus-logo',
        `plus-logo--${size}`,
        `plus-logo--${appearance}`,
        lockup && 'plus-logo--lockup',
        className,
    ].filter(Boolean).join(' ');

    // The lockup is drawn in mark units: a quarter-mark gap, then the wordmark
    // at half the mark's height in cap height, centered on the mark.
    const gap = MARK_BOX / 4;
    const scale = (0.5 * MARK_BOX) / CAP;
    const top = MARK_BOX / 2 - (CAP / 2 + CAP_TOP) * scale;
    const total = lockup ? MARK_BOX + gap + WORDMARK_WIDTH * scale : MARK_BOX;

    return (
        <span className={classNames} {...props}>
            <svg
                role="img"
                aria-label="PLUS"
                width={+((size * total) / MARK_BOX).toFixed(2)}
                height={size}
                viewBox={`0 0 ${+total.toFixed(2)} ${MARK_BOX}`}
                xmlns="http://www.w3.org/2000/svg"
            >
                <Mark appearance={appearance} small={small} ids={ids} />
                {lockup && (
                    <g className="plus-logo__wordmark" transform={`translate(${MARK_BOX + gap} ${top.toFixed(2)}) scale(${scale.toFixed(4)})`}>
                        {WORDMARK.map((letter, i) => (
                            <path key={i} transform={`translate(${letter.shift} 0)`} d={letter.d} />
                        ))}
                    </g>
                )}
            </svg>
        </span>
    );
};

Logo.propTypes = {
    /** One of six appearances. `colored` follows the color mode; `colored-dark` always draws the stronger glows. */
    appearance: PropTypes.oneOf(LOGO_APPEARANCES),
    /** Height of the mark in pixels */
    size: PropTypes.oneOf(LOGO_SIZES),
    /** Show the lockup: the wordmark beside the mark. From size 24; below that the mark stands alone. */
    wordmark: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default Logo;
export { Logo };
