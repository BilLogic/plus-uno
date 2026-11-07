import React from 'react';
import StatusTag from '@/components/labels/StatusTag';

/**
 * Engagement Badge Component
 * Reusable badge for displaying engagement status
 * 
 * States:
 * - unknown/select: Gray secondary badge with "Select" text
 * - fully-engaged: Green success badge with "Fully engaged" text
 * - partially-engaged: Yellow warning badge with "Partially engaged" text
 * - not-engaged: Red danger badge with "Not engaged at all" text
 * - na: Gray secondary badge with "N/A" text
 */

const caretIcon = <i className="fa-solid fa-caret-down" aria-hidden="true"></i>;

const statusConfig = {
    'unknown': { text: 'Select', style: 'neutral' },
    'select': { text: 'Select', style: 'neutral' },
    'fully-engaged': { text: 'Fully engaged', style: 'success' },
    'partially-engaged': { text: 'Partially engaged', style: 'warning' },
    'not-engaged': { text: 'Not engaged at all', style: 'danger' },
    'na': { text: 'N/A', style: 'neutral' }
};

export const EngagementBadge = ({
    status = 'unknown',
    showDropdown = true
}) => {
    const config = statusConfig[status] || statusConfig['unknown'];

    return (
        <div className="d-inline-flex align-items-center gap-1">
            <StatusTag appearance={config.style}>{config.text}</StatusTag>
            {showDropdown && caretIcon}
        </div>
    );
};
