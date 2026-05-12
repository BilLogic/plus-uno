/**
 * Profile - Sections (index)
 *
 * Hub for profile page sections — same sidebar pattern as **Specs / Admin / … / Sections**.
 */
import React from 'react';
import { linkTo } from '@storybook/addon-links';

const SECTION_LINKS = [
    { label: 'Background and matching', title: 'Specs/Profile/Sections/Background and Matching', story: 'Interactive' },
    { label: 'Basic information', title: 'Specs/Profile/Sections/Basic Information', story: 'Interactive' },
    { label: 'Status and clearance', title: 'Specs/Profile/Sections/Status', story: 'AllStates' },
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
    title: 'Specs/Profile/Sections',
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Composable profile sections. Open a story below or expand **Sections** in the sidebar.\n\n[Profile Sections folder](https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile/Sections)',
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
                Profile sections
            </p>
            <p style={{ marginBottom: 'var(--size-card-gap-md)' }}>
                Sections bundle elements for the tutor profile page. Status is read-only on canvas; use{' '}
                <strong className="text-foreground">All states</strong> there for layout reference.
            </p>
            <div>
                {SECTION_LINKS.map(({ label, title, story }) => (
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
