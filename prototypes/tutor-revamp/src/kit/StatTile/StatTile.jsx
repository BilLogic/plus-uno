import React from 'react';
import PropTypes from 'prop-types';
import './StatTile.css';

/**
 * StatTile: one number, one label, one caption, on a tinted tile.
 *
 * - **Label** with a 14 icon in the tone's accent, then the **value** in
 *   Metric/large with an optional smaller `unit` ("of 20"), then the
 *   **caption**.
 * - `meter` slots a GoalMeter (non-interactive) between value and caption.
 * - `as` makes the whole tile a link (`a`, or a router `Link` with `to`); it
 *   lifts on hover. Without it the tile is a plain block.
 */
const StatTile = ({ as: Tag = 'div', tone = 'neutral', icon, label, value, unit, caption, meter, className = '', ...rest }) => {
    const interactive = Tag !== 'div';
    return (
        <Tag
            className={['tr-stat-tile', `tr-stat-tile--${tone}`, interactive ? 'tr-stat-tile--link' : '', className].filter(Boolean).join(' ')}
            {...rest}
        >
            <span className="tr-stat-tile__label">
                {icon ? <i className={`fa-solid fa-${icon}`} aria-hidden="true" /> : null}
                {label}
            </span>
            <span className="tr-stat-tile__value">
                {value}
                {unit ? <small>{unit}</small> : null}
            </span>
            {meter ? <span className="tr-stat-tile__meter">{meter}</span> : null}
            {caption ? <span className="tr-stat-tile__caption">{caption}</span> : null}
        </Tag>
    );
};

StatTile.propTypes = {
    /** `a` or a router `Link` makes the tile a link */
    as: PropTypes.elementType,
    /** The tile's tint: an accent family, or neutral */
    tone: PropTypes.oneOf(['teal', 'yellow', 'blue', 'green', 'purple', 'neutral']),
    /** Font Awesome Free solid name */
    icon: PropTypes.string,
    label: PropTypes.node.isRequired,
    value: PropTypes.node.isRequired,
    /** Smaller text after the value: "of 20" */
    unit: PropTypes.node,
    caption: PropTypes.node,
    /** A GoalMeter with `interactive={false}` */
    meter: PropTypes.node,
    className: PropTypes.string,
};

export default StatTile;
