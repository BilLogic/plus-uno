import React from 'react';
import PropTypes from 'prop-types';
import Badge from '../Badge/Badge';
import { SMART_CONSTANTS } from '../constants';

/**
 * SmartBadges Component
 * 
 * SMART competency area badges built on top of the Badge component.
 * Displays competency labels with appropriate colors and icons.
 * 
 * Types:
 * - socio-emotional (S)
 * - mastering-content (M)
 * - advocacy (A)
 * - relationships (R)
 * - technology-tools (T)
 */
const SmartBadges = ({
    type,
    size = 'b2',
    id,
    className = ''
}) => {
    // Normalize type string
    const normalizedType = type.replace(/\s+/g, '-').toLowerCase();

    // Map type to display text from SMART constants
    const textMap = {
        'socio-emotional': SMART_CONSTANTS.CA_SE_FULL,
        'mastering-content': SMART_CONSTANTS.CA_MC,
        'advocacy': SMART_CONSTANTS.CA_ADV,
        'relationships': SMART_CONSTANTS.CA_RELN,
        'technology-tools': SMART_CONSTANTS.CA_TT
    };

    // Map our type names to Badge style prop names
    // Badge uses 'social-emotional' (with 'social' not 'socio')
    // and 'relationship' (singular, not 'relationships')
    const styleMap = {
        'socio-emotional': 'social-emotional',
        'mastering-content': 'mastering-content',
        'advocacy': 'advocacy',
        'relationships': 'relationship',
        'technology-tools': 'technology-tools'
    };

    const displayText = textMap[normalizedType] || SMART_CONSTANTS.CA_SE_FULL;
    const badgeStyle = styleMap[normalizedType] || 'social-emotional';

    return (
        <Badge
            id={id}
            style={badgeStyle}
            size={size}
            className={`plus-smart-badge plus-smart-badge--${normalizedType} ${className}`}
            leadingVisual={<i className="fas fa-circle-dot" />}
        >
            {displayText}
        </Badge>
    );
};

SmartBadges.propTypes = {
    /** SMART competency area type */
    type: PropTypes.oneOf([
        'socio-emotional',
        'mastering-content',
        'advocacy',
        'relationships',
        'technology-tools'
    ]).isRequired,
    /** Badge size - uses Badge component sizing */
    size: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3']),
    /** HTML id attribute */
    id: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string
};

export default SmartBadges;

// Also export as StaticBadgeSmart for backwards compatibility
export { SmartBadges as StaticBadgeSmart };
