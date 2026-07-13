/**
 * Profile - Elements - Update Profile Toast
 *
 * Toast notification prompting users to complete their profile.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5615-214381&m=dev
 */
import React from 'react';
import Toast from '@/components/messaging/Toast';

export default {
    title: 'Specs/Profile/Elements/Update Profile Toast',
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Toast feedback after profile updates / completion prompts. Token notes are in the file header comment.',
            },
        },
    },
};

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
                        }}
                    >
                        Complete your profile
                    </a>{' '}
                    to finish setup.
                </span>
            </Toast>
        </div>
    );
};

export const Overview = () => (
    <div
        style={{
            position: 'relative',
            minHeight: '200px',
            padding: 'var(--size-element-pad-y-lg, 12px)',
        }}
    >
        <UpdateProfileToast show onClose={() => {}} />
    </div>
);

export const Variants = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-xl, 32px)',
            padding: 'var(--size-element-pad-y-lg, 12px)',
        }}
    >
        <div style={{ position: 'relative', minHeight: '200px' }}>
            <UpdateProfileToast show onClose={() => {}} />
        </div>
        <div style={{ position: 'relative', minHeight: '120px' }}>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
                Hidden — use Interactive playground to toggle <code>show</code>.
            </p>
        </div>
    </div>
);

export const Interactive = {
    args: {
        show: true,
    },
    argTypes: {
        show: {
            control: 'boolean',
            description: 'Whether the toast is visible',
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div
            key={String(args.show)}
            style={{ position: 'relative', minHeight: '200px', padding: 'var(--size-element-pad-y-lg, 12px)' }}
        >
            {args.show ? (
                <UpdateProfileToast show onClose={() => {}} />
            ) : (
                <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
                    Hidden — set show to true in controls.
                </p>
            )}
        </div>
    ),
};
