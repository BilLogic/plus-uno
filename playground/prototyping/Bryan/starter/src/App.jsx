import React from 'react';
import './App.css';

/**
 * Bryan's Starter Prototype
 * 
 * This is your playground! Replace or extend this component
 * with your prototype content.
 * 
 * Available design system imports:
 *   import Button from '@/components/Button';
 *   import Modal from '@/components/Modal';
 *   import Badge from '@/components/Badge';
 *   import Alert from '@/components/Alert';
 *   import PageLayout from '@/components/PageLayout';
 *   ... and more from packages/plus-ds/src/components/
 * 
 * Design tokens are available as CSS variables:
 *   --color-primary, --color-surface-container, --color-on-surface, etc.
 *   --size-section-gap-lg, --size-element-pad-x-md, etc.
 *   --font-family-header, --font-family-body, etc.
 */
const App = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 'var(--size-section-pad-y-lg, 24px)',
                backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
                gap: 'var(--size-section-gap-lg, 24px)',
            }}
        >
            <div
                style={{
                    backgroundColor: 'var(--color-surface-container, #fff)',
                    borderRadius: 'var(--size-card-radius-md, 12px)',
                    padding: 'var(--size-section-pad-y-lg, 24px) var(--size-section-pad-x-lg, 24px)',
                    border: '1px solid var(--color-outline-variant, #ddd)',
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <h3 className="h3" style={{ color: 'var(--color-on-surface)', marginBottom: 'var(--size-element-gap-md, 16px)' }}>
                    <i className="fa-solid fa-rocket" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                    Bryan's Prototype
                </h3>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-section-gap-md, 16px)' }}>
                    Your playground is ready! Edit <code>src/App.jsx</code> to start building.
                </p>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-element-gap-sm, 8px)',
                        textAlign: 'left',
                        padding: 'var(--size-element-pad-y-md, 8px) var(--size-element-pad-x-md, 16px)',
                        backgroundColor: 'var(--color-surface-container-high, #f0f0f0)',
                        borderRadius: 'var(--size-element-radius-md, 4px)',
                    }}
                >
                    <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        Quick start:
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        1. Import components from <code>@/components/</code>
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        2. Use design tokens for all styling
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        3. Reference Figma designs with MCP tools
                    </span>
                </div>
            </div>
        </div>
    );
};

export default App;
