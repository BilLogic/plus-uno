import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Tutors Button',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

// ─── Reusable Button Components ──────────────────────────────

/**
 * Available Button
 * Success outline button for tutors to confirm availability.
 */
export const AvailableButton = ({ block = false, ...props }) => (
    <Button text="Available" style="success" fill="outline" size="medium" block={block} {...props} />
);

/**
 * Unavailable Button
 * Danger outline button for tutors to mark unavailability.
 */
export const UnavailableButton = ({ block = false, ...props }) => (
    <Button text="Unavailable" style="danger" fill="outline" size="medium" block={block} {...props} />
);

// ─── Stories ─────────────────────────────────────────────────

/**
 * Overview
 * Shows all CTA Tutors Button variants.
 *
 * Variants:
 * 1. Available — success outline
 * 2. Unavailable — danger outline
 *
 * Uses the Button component from the design system with outline fill.
 *
 * Tokens:
 * - Border radius: --size-element-radius-md
 * - Padding: --size-element-pad-y-md / --size-element-pad-x-md
 * - Gap: --size-element-gap-md
 * - Typography: h6 (Lato SemiBold, 16px, line-height 1.5)
 * - Border: success (--color-success) / danger (--color-danger)
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-md)',
            alignItems: 'flex-start',
        }}
    >
        <AvailableButton />
        <UnavailableButton />
    </div>
);

