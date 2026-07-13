/**
 * UserTypeIndicator Component
 *
 * Universal pill that indicates which user role the current viewer belongs to
 * (lead tutor, regular tutor, tutor supervisors, system admin, type5 / demo).
 *
 * Built on top of the PLUS Badge component so it inherits typography, spacing,
 * radius, and the role-specific color tokens already defined for Badge styles.
 *
 * Figma Spec: node-id=2370-191400
 */

import React from 'react';
import PropTypes from 'prop-types';
import Badge from '@/components/status-and-loading/Badge/Badge';

const TYPE_CONFIG = {
    'lead tutor': { badgeStyle: 'info', label: 'Lead' },
    'regular tutor': { badgeStyle: 'primary', label: 'Tutor' },
    'tutor supervisors': { badgeStyle: 'mastering-content', label: 'Super' },
    'system admin': { badgeStyle: 'relationship', label: 'Admin' },
    'type5': { badgeStyle: 'secondary', label: 'Demo' },
};

const UserTypeIndicator = ({
    type = 'lead tutor',
    size = 'b3',
    id,
    className = '',
}) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG['lead tutor'];

    return (
        <Badge
            id={id}
            style={config.badgeStyle}
            size={size}
            className={`plus-user-type-indicator plus-user-type-indicator--${type.replace(/\s+/g, '-')} ${className}`}
        >
            {config.label}
        </Badge>
    );
};

UserTypeIndicator.propTypes = {
    /** User role to indicate */
    type: PropTypes.oneOf([
        'lead tutor',
        'regular tutor',
        'tutor supervisors',
        'system admin',
        'type5',
    ]),
    /** Badge typography size (forwarded to Badge) */
    size: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3']),
    /** HTML id attribute */
    id: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default UserTypeIndicator;
