/**
 * Profile - Elements (index)
 *
 * Hub for form controls and small profile UI — same sidebar pattern as **Specs / Admin / Tutor Admin / Elements**.
 */
import React from 'react';
import { linkTo } from '@storybook/addon-links';

const ELEMENT_LINKS = [
    { label: 'Clearance status', title: 'Specs/Profile/Elements/Clearance Status', story: 'Interactive' },
    { label: 'Graduation year', title: 'Specs/Profile/Elements/Grad Year Dropdown', story: 'Interactive' },
    { label: 'Language preferences', title: 'Specs/Profile/Elements/Language Preferences', story: 'Interactive' },
    { label: 'Math level', title: 'Specs/Profile/Elements/Math Level', story: 'Interactive' },
    { label: 'Pronouns', title: 'Specs/Profile/Elements/Pronouns', story: 'Interactive' },
    { label: 'Semester at PLUS', title: 'Specs/Profile/Elements/Semester at PLUS', story: 'Interactive' },
    { label: 'Student type', title: 'Specs/Profile/Elements/Student Type Dropdown', story: 'Interactive' },
    { label: 'Tooltip — additional email', title: 'Specs/Profile/Elements/Tooltip Additional Email', story: 'AllStates' },
    { label: 'Tooltip — background and matching', title: 'Specs/Profile/Elements/Tooltip Background and Matching', story: 'AllStates' },
    { label: 'University', title: 'Specs/Profile/Elements/University', story: 'Interactive' },
    { label: 'Update profile toast', title: 'Specs/Profile/Elements/Update Profile Toast', story: 'Interactive' },
    { label: 'Upload profile picture', title: 'Specs/Profile/Elements/Upload Profile Pic', story: 'Interactive' },
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
    title: 'Specs/Profile/Elements',
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Individual profile controls and helpers. Open a story below or pick a leaf in the sidebar — same workflow as Admin spec elements.\n\n[Profile Elements folder](https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile/Elements)',
            },
        },
    },
};

/**
 * Overview
 * Quick navigation into each element spec.
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
                Profile elements
            </p>
            <p style={{ marginBottom: 'var(--size-card-gap-md)' }}>
                Jump to a spec (opens the default canvas story). Use the sidebar for every export (All states,
                Interactive, etc.).
            </p>
            <div>
                {ELEMENT_LINKS.map(({ label, title, story }) => (
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
