/**
 * Profile - Elements - Upload Profile Pic
 * 
 * Allows users to upload or update their profile picture.
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4282-2368&m=dev
 * 
 * States:
 * - Unfilled: placeholder avatar + "Upload photo" (filled primary small button)
 * - Filled: profile photo (circle-clipped) + "Update photo" (tonal primary small button)
 * 
 * Typography:
 * - Caption: body3-txt font-weight-light (Merriweather Sans Light, 12px, line-height 1.667)
 * - Format text: body3-txt font-weight-light (Merriweather Sans Light, 12px, line-height 1.667)
 * - Button: body3-txt font-weight-semibold (Merriweather Sans Regular, 12px) — handled by Button size="small"
 * 
 * Colors:
 * - Text: --color-on-surface
 * - Unfilled button: primary filled (--color-primary bg, --color-on-primary text)
 * - Filled button: primary tonal (--color-primary-state-08 bg, --color-primary-text text)
 * 
 * Spacing:
 * - Container gap: var(--size-element-pad-x-sm, 8px) between items
 * - Caption gap: var(--size-small-gap-xs, 4px)
 * 
 * Dimensions:
 * - Avatar: 120px × 120px
 */
import React from 'react';
import Button from '../../../components/Button';

const placeholderAvatar = 'https://www.figma.com/api/mcp/asset/2639388b-a606-45a9-9eef-47aeb0ac2c74';
const filledAvatar = 'https://www.figma.com/api/mcp/asset/ba92c16a-334e-43a3-a4c9-006b17b8dc2b';

export default {
    title: 'Specs/Profile/Elements/Upload Profile Pic',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * UploadProfilePic Element
 * Renders avatar image, helper text, and upload/update button.
 * 
 * @param {Object} props
 * @param {'unfilled' | 'filled'} props.state - Whether the user has uploaded a photo
 * @param {string} [props.avatarSrc] - Custom avatar source URL (for filled state)
 */
export const UploadProfilePic = ({ state = 'unfilled', avatarSrc }) => {
    const isFilled = state === 'filled';
    const imgSrc = avatarSrc || (isFilled ? filledAvatar : placeholderAvatar);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-pad-x-sm, 8px)',
                alignItems: 'center',
            }}
        >
            {/* Avatar Container */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: isFilled ? '50%' : '0',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}
                >
                    <img
                        src={imgSrc}
                        alt={isFilled ? 'Profile photo' : 'Upload profile photo placeholder'}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                </div>
            </div>

            {/* Caption */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-small-gap-xs, 4px)',
                    alignItems: 'flex-start',
                    overflow: 'hidden',
                }}
            >
                <span
                    className="body3-txt font-weight-light"
                    style={{ color: 'var(--color-on-surface)' }}
                >
                    Upload a square image (e.g., 200 × 200 px)
                </span>
            </div>

            {/* Format info */}
            <span
                className="body3-txt font-weight-light"
                style={{ color: 'var(--color-on-surface)' }}
            >
                Accepted formats: PNG, JPG, or JPEG
            </span>

            {/* CTA Button */}
            {isFilled ? (
                <Button
                    text="Update photo"
                    style="primary"
                    fill="tonal"
                    size="small"
                />
            ) : (
                <Button
                    text="Upload photo"
                    style="primary"
                    fill="filled"
                    size="small"
                />
            )}
        </div>
    );
};

/**
 * Unfilled State
 * Default state before the user has uploaded a profile photo.
 * Uses a placeholder illustration and a filled primary "Upload photo" button.
 */
export const Unfilled = () => (
    <UploadProfilePic state="unfilled" />
);
Unfilled.storyName = 'Unfilled';

/**
 * Filled State
 * After the user has uploaded a profile photo.
 * Shows circle-clipped photo and a tonal primary "Update photo" button.
 */
export const Filled = () => (
    <UploadProfilePic state="filled" />
);
Filled.storyName = 'Filled';

/**
 * All States Overview
 * Shows both states side by side for comparison.
 */
export const AllStates = () => (
    <div
        style={{
            display: 'flex',
            gap: 'var(--size-section-gap-xl, 32px)',
            padding: 'var(--size-element-pad-y-lg, 12px)',
            alignItems: 'flex-start',
        }}
    >
        <div style={{ textAlign: 'center' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md, 16px)', color: 'var(--color-on-surface)' }}>Unfilled</h6>
            <UploadProfilePic state="unfilled" />
        </div>
        <div style={{ textAlign: 'center' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md, 16px)', color: 'var(--color-on-surface)' }}>Filled</h6>
            <UploadProfilePic state="filled" />
        </div>
    </div>
);
AllStates.storyName = 'All States';
