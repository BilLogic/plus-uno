import React from 'react';
import Alert from '../../../../../packages/plus-ds/src/components/Alert';

export default {
    title: 'Specs/Toolkit/Pre-Session/Cards/Tutor View Session Management',
    parameters: {
        layout: 'padded',
    },
};

// ─── Stories ─────────────────────────────────────────────────

/**
 * Overview
 * Shows all alert variants for the Tutor View Session Management card.
 *
 * Variants:
 * 1. One-time session — "Please re-confirm your availability for this session."
 * 2. Recurring session — "Please re-confirm your availability for this recurring session."
 *
 * Uses the Alert component with `warning` style and no title.
 *
 * Tokens:
 * - Alert style: warning
 * - Typography: body1-txt (light weight) via Alert component
 * - Color: --color-on-surface (text), warning border/background via Alert
 * - Spacing: card pad via Alert component internals
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            maxWidth: '672px',
        }}
    >
        <section>
            <h6 className="h6 mb-3">One-Time Session</h6>
            <Alert style="warning" dismissable={false}>
                Please re-confirm your availability for this session.
            </Alert>
        </section>

        <section>
            <h6 className="h6 mb-3">Recurring Session</h6>
            <Alert style="warning" dismissable={false}>
                Please re-confirm your availability for this recurring session.
            </Alert>
        </section>
    </div>
);

/**
 * One-Time Session
 * Alert for a one-time session availability re-confirmation.
 */
export const One_Time_Session = () => (
    <div style={{ maxWidth: '672px' }}>
        <Alert style="warning" dismissable={false}>
            Please re-confirm your availability for this session.
        </Alert>
    </div>
);

/**
 * Recurring Session
 * Alert for a recurring session availability re-confirmation.
 */
export const Recurring_Session = () => (
    <div style={{ maxWidth: '672px' }}>
        <Alert style="warning" dismissable={false}>
            Please re-confirm your availability for this recurring session.
        </Alert>
    </div>
);
