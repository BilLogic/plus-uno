/**
 * Profile - Elements - Upload Profile Pic
 *
 * Allows users to upload or update their profile picture.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4282-2368&m=dev
 */
import React from 'react';
import Button from '@/components/actions/Button';
import placeholderAvatar from '@/assets/images/avatars/profile-placeholder.svg';
import filledAvatar from '@/assets/images/avatars/profile-filled.svg';

export default {
    title: 'Specs/Profile/Elements/Upload Profile Pic',
    excludeStories: ['UploadProfilePic'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Avatar upload control for tutor profile (unfilled / filled). Token notes are in the file header comment.',
            },
        },
    },
};

/** UploadProfilePic Element */
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
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-small-gap-xs, 4px)',
                    alignItems: 'flex-start',
                    overflow: 'hidden',
                }}
            >
                <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    Upload a square image (e.g., 200 × 200 px)
                </span>
            </div>
            <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                Accepted formats: PNG, JPG, or JPEG
            </span>
            {isFilled ? (
                <Button text="Update photo" style="primary" fill="tonal" size="small" />
            ) : (
                <Button text="Upload photo" style="primary" fill="filled" size="small" />
            )}
        </div>
    );
};

export const Overview = () => (
    <div
        style={{
            padding: 'var(--size-element-pad-y-lg, 12px)',
            display: 'flex',
            justifyContent: 'center',
        }}
    >
        <UploadProfilePic state="unfilled" />
    </div>
);

export const Variants = () => (
    <div
        style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--size-section-gap-xl, 32px)',
            padding: 'var(--size-element-pad-y-lg, 12px)',
            justifyContent: 'center',
        }}
    >
        <UploadProfilePic state="unfilled" />
        <UploadProfilePic state="filled" />
    </div>
);

export const Interactive = {
    args: {
        state: 'unfilled',
    },
    argTypes: {
        state: {
            control: 'radio',
            options: ['unfilled', 'filled'],
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div
            style={{
                padding: 'var(--size-element-pad-y-lg, 12px)',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <UploadProfilePic state={args.state} />
        </div>
    ),
};
