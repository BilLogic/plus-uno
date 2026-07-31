import React from 'react';
import PropTypes from 'prop-types';
import sparkleUrl from './assets/sparkle.svg';

/**
 * Mastering-content spark glyph from Figma Dynamic AI Prompted Question Box
 * (exported asset from `10661:8711`).
 *
 * @param {object} props
 * @param {number|string} [props.size=24]
 * @param {string} [props.className]
 */
const SparkleIcon = ({ size = 24, className = '' }) => (
    <img
        src={sparkleUrl}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        className={className}
        style={{ display: 'block', flexShrink: 0 }}
    />
);

SparkleIcon.propTypes = {
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
};

export default SparkleIcon;
