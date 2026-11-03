import React from 'react';
import SectionMessage from '@/components/messaging/SectionMessage';

export default {
    tags: ['!dev', '!autodocs'],
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
 * Uses the SectionMessage component with `warning` style and no title.
 *
 * Tokens:
 * - SectionMessage style: warning
 * - Typography: body1-txt (light weight) via SectionMessage component
 * - Color: --color-on-surface (text), warning background via SectionMessage
 * - Spacing: card pad via SectionMessage component internals
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
            <SectionMessage appearance="warning" dismissible={false}>
                Please re-confirm your availability for this session.
            </SectionMessage>
        </section>

        <section>
            <h6 className="h6 mb-3">Recurring Session</h6>
            <SectionMessage appearance="warning" dismissible={false}>
                Please re-confirm your availability for this recurring session.
            </SectionMessage>
        </section>
    </div>
);

/**
 * One-Time Session
 * SectionMessage for a one-time session availability re-confirmation.
 */
export const One_Time_Session = () => (
    <div style={{ maxWidth: '672px' }}>
        <SectionMessage appearance="warning" dismissible={false}>
            Please re-confirm your availability for this session.
        </SectionMessage>
    </div>
);

/**
 * Recurring Session
 * SectionMessage for a recurring session availability re-confirmation.
 */
export const Recurring_Session = () => (
    <div style={{ maxWidth: '672px' }}>
        <SectionMessage appearance="warning" dismissible={false}>
            Please re-confirm your availability for this recurring session.
        </SectionMessage>
    </div>
);
