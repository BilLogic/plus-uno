/**
 * Profile - Pages
 *
 * Full-page profile layouts. Browse **TutorProfilePage** for the primary CSF (Overview + Interactive).
 */
import React from 'react';
import { linkTo } from '@storybook/addon-links';

export default {
    title: 'Specs/Profile/Pages',
    tags: ['!autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Page-level layouts for Profile — same pattern as **Specs / Admin / … / Pages**: open **TutorProfilePage** for the full `PageLayout` shell (Figma node 5615-214865), responsive controls, and stories.\n\n[Profile Pages folder](https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile/Pages)',
            },
        },
    },
};

/**
 * Index
 * Jump to the main tutor profile page stories.
 */
export const Index = {
    render: () => (
        <div
            className="body2-txt"
            style={{
                padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
                maxWidth: '720px',
                color: 'var(--color-on-surface-variant)',
            }}
        >
            <p className="body1-txt" style={{ color: 'var(--color-on-surface)', marginTop: 0 }}>
                Profile pages
            </p>
            <p style={{ marginBottom: 'var(--size-element-gap-md)' }}>
                Open{' '}
                <strong className="text-foreground">Specs / Profile / Pages / TutorProfilePage</strong> in the sidebar
                for the full <code className="text-foreground">PageLayout</code> shell, or use the button below.
            </p>
            <button
                type="button"
                className="body2-txt"
                style={{
                    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                    borderRadius: 'var(--size-border-radius-50)',
                    border: '1px solid var(--color-outline-variant)',
                    backgroundColor: 'var(--color-surface-container)',
                    color: 'var(--color-on-surface)',
                    cursor: 'pointer',
                }}
                onClick={() => linkTo('Specs/Profile/Pages/TutorProfilePage', 'Overview')()}
            >
                Go to TutorProfilePage — Overview
            </button>
        </div>
    ),
};
