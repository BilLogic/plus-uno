import React from 'react';

/**
 * Shared presentational helpers for the Pre-Session page mocks.
 * Previously these were copy-pasted verbatim into every page's stories file
 * (SectionTitle in 12, UpdateAlert in 4) — extracted here so they stay in sync.
 */

/**
 * Full-bleed modal scrim overlay for the *WithModals page mocks. Replaces the
 * hand-rolled `rgba(0,0,0,0.5)` overlay that was copy-pasted into ~9 pages.
 */
export const ModalScrim = ({ open, children }) => (
    <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--size-section-pad-x-lg)',
        zIndex: 1000,
    }}>
        {children}
    </div>
);

/** Placeholder card shown inside a scrim when no modal matches the current args. */
export const MissingModal = ({ children }) => (
    <div style={{
        backgroundColor: 'var(--color-surface-container-high)',
        borderRadius: 'var(--size-modal-radius-lg)',
        padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
        width: '672px',
        textAlign: 'center',
    }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
            {children}
        </p>
    </div>
);

/**
 * Section heading with an info affordance.
 *
 * The level is a prop because this component lands at two different depths.
 * On most session pages it sits under the page's own "Your Sessions" header, so
 * it is an `h3`; on the Reflection page there is no such header and it is the
 * first heading under the page's `<h1>`, so it has to be an `h2` or axe reports
 * a skipped level. Same shape as `OverviewCard`'s `titleAs` (#242) — the class
 * carries the appearance either way, so nothing about it changes visually.
 */
export const SectionTitle = ({ title, titleAs: Heading = 'h3' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm)' }}>
        <Heading className="h4 font-weight-semibold" style={{ color: 'var(--color-on-surface)', margin: 0 }}>
            {title}
        </Heading>
        <i
            className="fa-solid fa-circle-info"
            style={{
                fontSize: 'var(--font-size-fa-h6-solid)',
                color: 'var(--color-on-surface-variant)',
                cursor: 'pointer'
            }}
        />
    </div>
);

/** Dismissible "what changed" banner shown atop several session pages. */
export const UpdateAlert = ({ title, description, onClose }) => (
    <div
        style={{
            backgroundColor: 'var(--color-primary-container-state-16)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            gap: 'var(--size-card-gap-sm)',
            width: '100%'
        }}
    >
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)'
            }}
        >
            <span className="h6" style={{ color: 'var(--color-on-surface)' }}>
                {title}
            </span>
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                {description}
            </span>
        </div>
        <button
            onClick={onClose}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                alignSelf: 'flex-start'
            }}
        >
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h6-solid)',
                    color: 'var(--color-on-surface-variant)'
                }}
            />
        </button>
    </div>
);
