import React from 'react';
import Badge from '../../../../components/Badge/Badge';

/**
 * Engagement Badge Component
 * Reusable badge for displaying engagement status
 * 
 * States:
 * - unknown/select: Grey secondary badge with "Select" text
 * - fully-engaged: Green success badge with "Fully engaged" text
 * - partially-engaged: Yellow warning badge with "Partially engaged" text
 * - not-engaged: Red danger badge with "Not engaged at all" text
 * - na: Grey secondary badge with "N/A" text
 */

const caretIcon = <i className="fa-solid fa-caret-down"></i>;

const statusConfig = {
    'unknown': { text: 'Select', style: 'secondary' },
    'select': { text: 'Select', style: 'secondary' },
    'fully-engaged': { text: 'Fully engaged', style: 'success' },
    'partially-engaged': { text: 'Partially engaged', style: 'warning' },
    'not-engaged': { text: 'Not engaged at all', style: 'danger' },
    'na': { text: 'N/A', style: 'secondary' }
};

export const EngagementBadge = ({
    status = 'unknown',
    showDropdown = true,
    disabled = false
}) => {
    const config = statusConfig[status] || statusConfig['unknown'];

    return (
        <div style={{ opacity: disabled ? 0.38 : 1 }}>
            <Badge
                text={config.text}
                style={config.style}
                size="b3"
                trailingVisual={showDropdown ? caretIcon : null}
                className="fw-normal"
            />
        </div>
    );
};
