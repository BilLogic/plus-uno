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
 *   --ds-text, --ds-surface, --ds-background-brand-bold, etc.
 *   --section-stack-lg, --pad-x-md, etc.
 *   --heading-medium, --body-default, --type-family-body, etc.
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
                padding: 'var(--section-pad-y-spacious)',
                backgroundColor: 'var(--ds-surface-container)',
                gap: 'var(--section-stack-lg)',
            }}
        >
            <div
                style={{
                    backgroundColor: 'var(--ds-surface)',
                    borderRadius: 'var(--card-radius)',
                    padding: 'var(--section-pad-y-spacious) var(--section-pad-x-spacious)',
                    border: '1px solid var(--ds-border)',
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <h3 className="h3" style={{ color: 'var(--ds-text)', marginBottom: 'var(--space-0625, 16px)' }}>
                    <i className="fa-solid fa-rocket" style={{ marginRight: '8px', color: 'var(--ds-icon-brand)' }} />
                    Bryan's Prototype
                </h3>
                <p className="body1-txt" style={{ color: 'var(--ds-text-subtle)', marginBottom: 'var(--section-stack-md)' }}>
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
