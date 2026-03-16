import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Supervisor Management Buttons',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
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
 * - Border radius: --size-element-radius-md
 * - Padding: --size-element-pad-y-md / --size-element-pad-x-md
 * - Gap: --size-element-gap-md
 * - Typography: h6 (Lato SemiBold, 16px, line-height 1.5)
 */

// ─── Filled Primary Buttons ──────────────────────────────────

export const CreateSessionButton = ({ block = false, ...props }) => (
    <Button text="Create Session" style="primary" fill="filled" size="medium" block={block} {...props} />
);

export const SaveChangesButton = ({ block = false, ...props }) => (
    <Button text="Save Changes" style="primary" fill="filled" size="medium" block={block} {...props} />
);

export const SaveButton = ({ block = false, ...props }) => (
    <Button text="Save" style="primary" fill="filled" size="medium" block={block} {...props} />
);

export const ContinueButton = ({ block = false, ...props }) => (
    <Button text="Continue" style="primary" fill="filled" size="medium" block={block} {...props} />
);

export const ConfirmButton = ({ block = false, ...props }) => (
    <Button text="Confirm" style="primary" fill="filled" size="medium" block={block} {...props} />
);

export const IUnderstandButton = ({ block = false, ...props }) => (
    <Button text="I Understand" style="primary" fill="filled" size="medium" block={block} {...props} />
);

// ─── Outline Primary Buttons ─────────────────────────────────

export const CancelButton = ({ block = false, ...props }) => (
    <Button text="Cancel" style="primary" fill="outline" size="medium" block={block} {...props} />
);

export const BackButton = ({ block = false, ...props }) => (
    <Button text="Back" style="primary" fill="outline" size="medium" block={block} {...props} />
);

// ─── Outline Danger Button ───────────────────────────────────

export const ConfirmCancelButton = ({ block = false, ...props }) => (
    <Button text="Confirm" style="danger" fill="outline" size="medium" block={block} {...props} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                <CreateSessionButton block />
                <SaveChangesButton block />
                <SaveButton block />
                <ContinueButton block />
                <ConfirmButton block />
            </div>
        </section>

        {/* Outline Primary Buttons */}
        <section>
            <h6 className="h6 mb-3">Outline Primary</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)', alignItems: 'flex-start' }}>
                <CancelButton />
                <BackButton />
            </div>
        </section>

        {/* Outline Danger Button */}
        <section>
            <h6 className="h6 mb-3">Outline Danger</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                <ConfirmCancelButton block />
            </div>
        </section>

        {/* Filled Primary - I Understand */}
        <section>
            <h6 className="h6 mb-3">Filled Primary - Acknowledgment</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                <IUnderstandButton block />
            </div>
        </section>
    </div>
);
