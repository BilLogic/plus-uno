/**
 * Profile - Modals (index)
 *
 * Hub for profile dialogs — same sidebar pattern as **Specs / Admin / … / Modals**.
 */
import React from 'react';
import { linkTo } from '@storybook/addon-links';

const MODAL_LINKS = [
    { label: 'Preview image', title: 'Specs/Profile/Modals/Preview Image', story: 'AllStates' },
    { label: 'Unsaved changes', title: 'Specs/Profile/Modals/Unsaved Changes', story: 'AllStates' },
];

const buttonStyle = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
    marginBottom: 'var(--size-small-gap-xs)',
    borderRadius: 'var(--size-border-radius-50)',
    border: '1px solid var(--color-outline-variant)',
    backgroundColor: 'var(--color-surface-container)',
    color: 'var(--color-on-surface)',
    cursor: 'pointer',
};

export default {
    title: 'Specs/Profile/Modals',
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Profile modals. These specs use **All states** canvases for multiple variants.\n\n[Profile Modals folder](https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile/Modals)',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <div
            className="body2-txt"
            style={{
                padding: 'var(--size-section-pad-y-md) 0',
                maxWidth: '480px',
                color: 'var(--color-on-surface-variant)',
            }}
        >
            <p className="body1-txt" style={{ color: 'var(--color-on-surface)', marginTop: 0 }}>
                Profile modals
            </p>
            <p style={{ marginBottom: 'var(--size-card-gap-md)' }}>
                Open a modal spec below. Controls and individual states live on each leaf story.
            </p>
            <div>
                {MODAL_LINKS.map(({ label, title, story }) => (
                    <button
                        key={title}
                        type="button"
                        className="body2-txt"
                        style={buttonStyle}
                        onClick={() => linkTo(title, story)()}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    ),
};
