import React from 'react';
import PropTypes from 'prop-types';
import './Sparkline.css';

/**
 * Sparkline: a compact line of recent values with the last point marked. No
 * axes and no labels; `label` names it for a screen reader and says what the
 * points are ("Practice minutes, last 7 sessions").
 *
 * Higher values draw higher. The line fits its own min and max unless
 * `domain` fixes the scale, so rows that sit together compare. The line is the
 * brand chart color.
 */
const Sparkline = ({ points, label, domain, width = 124, height = 24, className = '' }) => {
    const pad = 3;
    const [lo, hi] = domain ?? [Math.min(...points), Math.max(...points)];
    const span = hi - lo || 1;
    const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
    const coords = points.map((v, i) => [pad + i * step, pad + (1 - (v - lo) / span) * (height - pad * 2)]);
    const [lx, ly] = coords[coords.length - 1];
    return (
        <svg
            className={['tr-sparkline', className].filter(Boolean).join(' ')}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label}
        >
            <polyline className="tr-sparkline__line" points={coords.map((c) => c.join(',')).join(' ')} />
            <circle className="tr-sparkline__last" data-part="last" cx={lx} cy={ly} r="3" />
        </svg>
    );
};

Sparkline.propTypes = {
    /** The values, oldest first */
    points: PropTypes.arrayOf(PropTypes.number).isRequired,
    /** What the line shows, for a screen reader */
    label: PropTypes.string.isRequired,
    /** `[min, max]` of the scale; rows that sit together share one */
    domain: PropTypes.arrayOf(PropTypes.number),
    width: PropTypes.number,
    height: PropTypes.number,
    className: PropTypes.string,
};

export default Sparkline;
