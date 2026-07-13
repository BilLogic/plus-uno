import React from 'react';
import Badge from '@/components/status-and-loading/Badge/Badge';

export const TutorBadge = ({ className = '' }) => (
    <Badge
        text="You"
        style="info"
        size="b3"
        className={`fw-normal ${className}`}
    />
);

export const LeadBadge = ({ className = '' }) => (
    <Badge
        text="Lead"
        style="info"
        size="b3"
        className={`fw-normal ${className}`}
    />
);

export const CountBadge = ({ count, className = '' }) => (
    <Badge
        text={String(count)}
        style="info"
        size="b3"
        leadingVisual={<i className="fa-solid fa-user-group"></i>}
        className={`fw-normal ${className}`}
    />
);
