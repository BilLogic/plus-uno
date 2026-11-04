import React from 'react';
import './App.css';

/**
 * Bryan's Starter Prototype
 * 
 * This is your prototypes! Replace or extend this component
 * with your prototype content.
 * 
 * Available design system imports:
 *   import { Button } from '@/components';
 *   import { Modal } from '@/components';
 *   import { StatusTag } from '@/components';
 *   import { SectionMessage } from '@/components';
 *   import { PageLayout } from '@/specs/Universal/Pages';
 *   ... and more from design-system/src/components/
 * 
 * Design tokens are available as CSS variables:
 *   --color-primary, --color-surface-container, --color-on-surface, etc.
 *   --size-section-gap-lg, --pad-x-md, etc.
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
                backgroundColor: 'var(--ds-surface-container)',
                gap: 'var(--size-section-gap-lg, 24px)',
            }}
        >
            <div
                style={{
                    backgroundColor: 'var(--ds-surface)',
                    borderRadius: 'var(--size-card-radius-md, 12px)',
                    padding: 'var(--size-section-pad-y-lg, 24px) var(--size-section-pad-x-lg, 24px)',
                    border: '1px solid var(--color-outline-variant, #ddd)',
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <h3 className="h3" style={{ color: 'var(--ds-text)', marginBottom: 'var(--space-0625, 16px)' }}>
                    <i className="fa-solid fa-rocket" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                    Bryan's Prototype
                </h3>
                <p className="body1-txt" style={{ color: 'var(--ds-text-subtle)', marginBottom: 'var(--size-section-gap-md, 16px)' }}>
                    Your prototypes is ready! Edit <code>src/App.jsx</code> to start building.
                </p>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--stack-md, 8px)',
                        textAlign: 'left',
                        padding: 'var(--pad-y-md, 8px) var(--pad-x-md, 16px)',
                        backgroundColor: 'var(--ds-surface-container)',
                        borderRadius: 'var(--radius-md, 4px)',
                    }}
                >
                    <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                        Quick start:
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        1. Import components from <code>@/components/</code>
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        2. Use design tokens for all styling
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        3. Reference Figma designs with MCP tools
                    </span>
                </div>
            </div>
        </div>
    );
};

export default App;
