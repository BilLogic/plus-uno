import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Supervisor Management Buttons',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Supervisor Management Button Components
 * Reusable CTA buttons for session management modals (supervisor view).
 * All buttons use the Button component from the design system.
 *
 * Filled (primary): Create Session, Save Changes, Save, Continue, Confirm
 * Outline (primary): Cancel, Back
 * Outline (danger): Confirm (cancel/destructive variant)
 * Filled (primary): I Understand
 *
 * Tokens:
 * - Border radius: --radius-md
 * - Padding: --pad-y-md / --pad-x-md
 * - Gap: --space-0625
 * - Typography: h6 (Lato SemiBold, 16px, line-height 1.5)
 */

// ─── Filled Primary Buttons ──────────────────────────────────

export const CreateSessionButton = ({ block = false, ...props }) => (
    <Button text="Create Session" appearance="primary" shouldFitContainer={block} {...props} />
);

export const SaveChangesButton = ({ block = false, ...props }) => (
    <Button text="Save Changes" appearance="primary" shouldFitContainer={block} {...props} />
);

export const SaveButton = ({ block = false, ...props }) => (
    <Button text="Save" appearance="primary" shouldFitContainer={block} {...props} />
);

export const ContinueButton = ({ block = false, ...props }) => (
    <Button text="Continue" appearance="primary" shouldFitContainer={block} {...props} />
);

export const ConfirmButton = ({ block = false, ...props }) => (
    <Button text="Confirm" appearance="primary" shouldFitContainer={block} {...props} />
);

export const IUnderstandButton = ({ block = false, ...props }) => (
    <Button text="I Understand" appearance="primary" shouldFitContainer={block} {...props} />
);

// ─── Outline Primary Buttons ─────────────────────────────────

export const CancelButton = ({ block = false, ...props }) => (
    <Button text="Cancel" shouldFitContainer={block} {...props} />
);

export const BackButton = ({ block = false, ...props }) => (
    <Button text="Back" shouldFitContainer={block} {...props} />
);

// ─── Outline Danger Button ───────────────────────────────────

export const ConfirmCancelButton = ({ block = false, ...props }) => (
    <Button text="Confirm" shouldFitContainer={block} {...props} />
);

// ─── Overview Story ──────────────────────────────────────────

/**
 * Overview
 * All supervisor session management buttons displayed together.
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            maxWidth: 400,
        }}
    >
        {/* Filled Primary Buttons */}
        <section>
            <h6 className="h6 mb-3">Filled Primary</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)' }}>
                <CreateSessionButton shouldFitContainer />
                <SaveChangesButton shouldFitContainer />
                <SaveButton shouldFitContainer />
                <ContinueButton shouldFitContainer />
                <ConfirmButton shouldFitContainer />
            </div>
        </section>

        {/* Outline Primary Buttons */}
        <section>
            <h6 className="h6 mb-3">Outline Primary</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)', alignItems: 'flex-start' }}>
                <CancelButton />
                <BackButton />
            </div>
        </section>

        {/* Outline Danger Button */}
        <section>
            <h6 className="h6 mb-3">Outline Danger</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)' }}>
                <ConfirmCancelButton shouldFitContainer />
            </div>
        </section>

        {/* Filled Primary - I Understand */}
        <section>
            <h6 className="h6 mb-3">Filled Primary - Acknowledgment</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)' }}>
                <IUnderstandButton shouldFitContainer />
            </div>
        </section>
    </div>
);
