/**
 * UserTypeIndicator Component
 *
 * Universal pill that indicates which user role the current viewer belongs to
 * (lead tutor, regular tutor, tutor supervisors, system admin, type5 / demo).
 *
 * Built on the Status tag so it inherits typography, spacing, radius and the
 * role colors of its appearances.
 *
 * Figma Spec: node-id=2370-191400
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatusTag from '@/components/labels/StatusTag';

const TYPE_CONFIG = {
    'lead tutor': { badgeStyle: 'info', label: 'Lead' },
    'regular tutor': { badgeStyle: 'info', label: 'Tutor' },
    'tutor supervisors': { badgeStyle: 'mastering-content', label: 'Super' },
    'system admin': { badgeStyle: 'relationship', label: 'Admin' },
    'type5': { badgeStyle: 'neutral', label: 'Demo' },
};

const UserTypeIndicator = ({
    type = 'lead tutor',
    spacing = 'default',
    id,
    className = '',
}) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG['lead tutor'];

    return (
        <StatusTag appearance={config.badgeStyle} spacing={spacing} id={id} className={`plus-user-type-indicator plus-user-type-indicator--${type.replace(/\s+/g, '-')} ${className}`}>
            {config.label}
        </StatusTag>
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
    /** Status tag spacing (forwarded to Status tag) */
    spacing: PropTypes.oneOf(['default', 'compact', 'spacious']),
    /** HTML id attribute */
    id: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default UserTypeIndicator;
