import React from 'react';
import PropTypes from 'prop-types';
import '../kit.css';
import './Delta.css';

const ICON = { up: 'arrow-up', down: 'arrow-down', flat: 'minus' };

/**
 * Delta: a change against a period, as an arrow and the words ("12% than
 * November"). Up is success, down is warning (never danger: a dip is a
 * prompt, not an alarm), flat is subtle. The arrow is decorative, so the
 * direction is said in words to a screen reader.
 */
const Delta = ({ direction, children, className = '' }) => (
    <span className={['tr-delta', `tr-delta--${direction}`, className].filter(Boolean).join(' ')} data-direction={direction}>
        <i className={`fa-solid fa-${ICON[direction]}`} aria-hidden="true" />
        <span className="tr-sr-only">{{ up: 'Up', down: 'Down', flat: 'No change,' }[direction]} </span>
        {children}
    </span>
);

Delta.propTypes = {
    direction: PropTypes.oneOf(['up', 'down', 'flat']).isRequired,
    /** The amount and the period: "12% than November" */
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export default Delta;
