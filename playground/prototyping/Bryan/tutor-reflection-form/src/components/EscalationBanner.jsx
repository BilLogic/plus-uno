import React from 'react';
import Alert from '@/components/Alert';

export default function EscalationBanner({ count }) {
    if (!count || count === 0) return null;

    return (
        <Alert style="warning" dismissable={false}>
            <strong>{count} student{count > 1 ? 's' : ''}</strong> flagged for supervisor review.
            Please provide escalation details in the Review & Submit section.
        </Alert>
    );
}
