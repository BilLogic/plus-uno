/**
 * Profile - Elements - Update Profile Toast
 * 
 * Toast notification prompting users to complete their profile.
 * Appears on login when profile is incomplete.
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5615-214381&m=dev
 * 
 * Typography:
 * - Title: body1-txt font-weight-bold (Merriweather Sans Bold, 16px, line-height 1.5)
 * - Body text: body3-txt font-weight-light (Merriweather Sans Light, 12px, line-height 1.667)
 * - Link text: body3-txt font-weight-bold (Merriweather Sans Bold, 12px, line-height 1.667)
 * - Icon: Font Awesome 7 Free Solid, 14px, line-height 1.714 (--font-size-fa-body1-solid)
 * 
 * Colors:
 * - Header background: --color-primary
 * - Header text/icon: --color-on-primary (white)
 * - Body text: --color-on-surface
 * - Link text: --color-primary-text (#00547e)
 * - Link underline: solid
 * - Surface: --color-surface
 * - Divider: --color-surface-container-high
 * 
 * Spacing:
 * - Header padding: var(--size-element-pad-x-lg, 16px) var(--size-element-pad-y-lg, 8px)
 * - Header gap: var(--size-element-gap-sm, 8px)
 * - Body padding: var(--size-element-pad-x-lg, 16px) var(--size-element-pad-y-lg, 8px)
 * - Border radius: var(--size-modal-radius-md, 6px)
 * 
 * Dimensions:
 * - Width: var(--columns-col-8, 445.33px)
 * 
 * Shadow: Elevation Light/3
 */
import React, { useState } from 'react';
import Toast, { ToastContainer } from '../../../components/Toast';
import Button from '../../../components/Button';

export default {
    title: 'Specs/Profile/Elements/Update Profile Toast',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * UpdateProfileToast
 * Prompts user to complete their profile with a clickable link.
 * Uses the design system Toast component with primary style.
 */
const UpdateProfileToast = ({ show = true, onClose = () => {} }) => {
    return (
        <div style={{ width: 'var(--columns-col-8, 445.33px)' }}>
            <Toast
                show={show}
                onClose={onClose}
                style="primary"
                title="Update Your Profile"
                dismissible={true}
                autohide={false}
            >
                <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    You're almost set!{' '}
                    <a
                        href="#"
                        className="body3-txt font-weight-bold"
                        style={{
                            color: 'var(--color-primary-text, #00547e)',
                            textDecoration: 'underline',
                            textDecorationSkipInk: 'none',
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            // Navigate to profile page
                            console.log('Navigate to profile page');
                        }}
                    >
                        Complete your profile
                    </a>
                    {' '}to finish setup.
                </span>
            </Toast>
        </div>
    );
};

/**
 * Update Profile Toast
 * Shows the toast notification prompting users to complete their profile.
 */
export const UpdateProfileToastStory = () => {
    const [show, setShow] = useState(true);

    return (
        <div style={{ position: 'relative', minHeight: '200px' }}>
            {!show && (
                <Button
                    text="Show Toast"
                    style="primary"
                    fill="filled"
                    size="small"
                    onClick={() => setShow(true)}
                />
            )}
            {show && <UpdateProfileToast show={show} onClose={() => setShow(false)} />}
        </div>
    );
};
