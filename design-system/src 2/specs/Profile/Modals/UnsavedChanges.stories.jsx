/**
 * Profile - Modals - Unsaved Changes
 * 
 * Pop-up modal that appears when there are unsaved edits and the user
 * attempts to leave the page.
 * 
 * Re-uses the Button component from the design system.
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5696-13933&m=dev
 * 
 * States:
 * - Default: The single state of this modal
 * 
 * Typography:
 * - Title: h4 (Lato SemiBold, 24px, line-height 1.333) in --color-on-surface
 * - Close icon: Font Awesome 7 Solid, 20px in --color-on-surface-variant
 * - Body: body1-txt font-weight-light (Merriweather Sans Light, 16px, line-height 1.5) in --color-on-surface
 * - Button text: h6 (Lato SemiBold, 16px, line-height 1.5)
 *   - "Exit without saving": --color-secondary-text
 *   - "Save & Exit": --color-on-primary (white)
 * 
 * Colors:
 * - Modal background: --color-surface-container-high (#e7e8eb)
 * - Modal border: --color-outline-variant
 * - "Exit without saving" button: tonal secondary (--color-secondary-state-08 bg, --color-secondary-text text)
 * - "Save & Exit" button: filled primary (--color-primary bg, --color-on-primary text)
 * 
 * Spacing:
 * - Modal padding: var(--size-modal-pad-x-lg, 20px) / var(--size-modal-pad-y-lg, 16px)
 * - Modal gap: var(--size-modal-gap-lg, 20px)
 * - Body padding-y: var(--size-element-pad-y-lg, 8px)
 * - Button footer gap: var(--size-modal-gap-sm, 8px)
 * - Modal border-radius: var(--size-border-radius-large, 12px)
 * 
 * Width: ~388.67px (var(--columns-col-7))
 */
import React from 'react';
import Button from '../../../components/Button/Button';

export default {
    title: 'Specs/Profile/Modals/Unsaved Changes',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Reusable Unsaved Changes Modal component for stories
 */
const UnsavedChangesModal = () => {
    return (
        <div
            style={{
                width: '388.67px',
                backgroundColor: 'var(--color-surface-container-high, #e7e8eb)',
                border: '1px solid var(--color-outline-variant, #bec8ca)',
                borderRadius: 'var(--size-border-radius-large, 12px)',
                padding: 'var(--size-modal-pad-y-lg, 16px) var(--size-modal-pad-x-lg, 20px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-lg, 20px)',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    width: '100%',
                }}
            >
                <span
                    className="h4"
                    style={{
                        flex: '1 0 0',
                        color: 'var(--color-on-surface)',
                    }}
                >
                    You have unsaved changes
                </span>
                <i
                    className="fa-solid fa-xmark"
                    style={{
                        fontSize: '20px',
                        color: 'var(--color-on-surface-variant)',
                        cursor: 'pointer',
                    }}
                />
            </div>

            {/* Body */}
            <div
                style={{
                    width: '100%',
                    padding: 'var(--size-element-pad-y-lg, 8px) 0',
                }}
            >
                <p
                    className="body1-txt font-weight-light"
                    style={{
                        color: 'var(--color-on-surface)',
                        margin: 0,
                    }}
                >
                    If you leave now, your changes will be lost.
                </p>
            </div>

            {/* Footer - Buttons */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 'var(--size-modal-gap-sm, 8px)',
                    width: '100%',
                }}
            >
                <div style={{ flex: '1 0 0' }}>
                    <Button
                        text="Exit without saving"
                        style="secondary"
                        fill="tonal"
                        size="medium"
                        block={true}
                    />
                </div>
                <div style={{ flex: '1 0 0' }}>
                    <Button
                        text="Save & Exit"
                        style="primary"
                        fill="filled"
                        size="medium"
                        block={true}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * All States
 * Shows the Unsaved Changes modal.
 */
export const UnsavedChangesStory = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-xl, 32px)',
                padding: 'var(--size-element-pad-y-lg, 12px)',
            }}
        >
            {/* Default State */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Default
                </h6>
                <UnsavedChangesModal />
            </div>
        </div>
    );
};
