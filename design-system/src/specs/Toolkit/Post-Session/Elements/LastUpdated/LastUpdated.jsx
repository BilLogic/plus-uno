import React from 'react';
import PropTypes from 'prop-types';
import { formatLastUpdated } from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * “Last updated” caption under reflection section titles
 * (Figma: Last Updated — Body/B3).
 *
 * @param {object} props
 * @param {Date|string} [props.value] - Date (or parseable string) to format
 * @param {string} [props.text] - Preformatted caption (skips formatting)
 * @param {string} [props.className]
 */
const LastUpdated = ({ value, text, className = '' }) => (
    <p
        className={`body3-txt m-0 ${className}`.trim()}
        style={{ color: 'var(--color-on-surface-variant)' }}
    >
        {text || formatLastUpdated(value)}
    </p>
);

LastUpdated.propTypes = {
    value: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    text: PropTypes.string,
    className: PropTypes.string,
};

export default LastUpdated;
