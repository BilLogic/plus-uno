import React from 'react';
import Badge from '../../../../../../packages/plus-ds/src/components/Badge/Badge';

// Reusable "You" Badge
export const TutorBadge = ({ className = '' }) => (
    <Badge
        text="You"
        style="info"
        size="b3"
        className={`fw-normal ${className}`}
    />
);

// Reusable "Lead" Badge
export const LeadBadge = ({ className = '' }) => (
    <Badge
        text="Lead"
        style="info"
        size="b3"
        className={`fw-normal ${className}`}
    />
);

// Reusable Count Badge
export const CountBadge = ({ count, className = '' }) => (
    <Badge
        text={String(count)}
        style="info"
        size="b3"
        leadingVisual={<i className="fa-solid fa-user-group"></i>}
        className={`fw-normal ${className}`}
    />
);
