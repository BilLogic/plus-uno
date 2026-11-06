import React from 'react';
import StatusTag from '@/components/labels/StatusTag';
import { iconClass } from '../../../../../lib/icon';

export const TutorBadge = ({ className = '' }) => (
    <StatusTag appearance="info" className={`fw-normal ${className}`}>You</StatusTag>
);

export const LeadBadge = ({ className = '' }) => (
    <StatusTag appearance="info" className={`fw-normal ${className}`}>Lead</StatusTag>
);

export const CountBadge = ({ count, className = '' }) => (
    <StatusTag appearance="info" leadingVisual={<i className={iconClass('user-group')}></i>} className={`fw-normal ${className}`}>{String(count)}</StatusTag>
);
