/**
 * Profile - Pages
 *
 * Full-page profile layouts. See **TutorProfilePage** in the sidebar for the primary spec (MDX + stories).
 */
import React from 'react';

export default {
    title: 'Specs/Profile/Pages',
    tags: ['!autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Page-level layouts for Profile. The **Tutor Profile** full-page spec lives under TutorProfilePage (Figma node 5615-214865).',
            },
        },
    },
};

/**
 * Index
 * Open **TutorProfilePage** in the tree for the responsive full-page story and documentation.
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
            <p style={{ marginBottom: 0 }}>
                Use <strong className="text-foreground">Specs / Profile / Pages / TutorProfilePage</strong>{' '}
                for the full <code className="text-foreground">PageLayout</code> shell, overview canvas, and
                interactive playground (same docs pattern as Admin and Home full-page specs).
            </p>
        </div>
    ),
};
