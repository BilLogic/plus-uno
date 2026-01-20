import React from 'react';
import { Card } from '@/components';

export const SpecOverview = ({ title, description, categories }) => {
    return (
        <div style={{
            padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <h1 className="h1" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>{title}</h1>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>{description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md)' }}>
                {categories.map((category, index) => (
                    <div
                        key={index}
                        style={{
                            padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
                            border: '1px solid var(--color-outline-variant)',
                            borderRadius: 'var(--size-card-radius-sm)',
                            backgroundColor: 'var(--color-surface-container)'
                        }}
                    >
                        <h3 className="h4" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>{category.name}</h3>
                        <p className="body2-txt">{category.description}</p>
                    </div>
                ))}
            </div>

            <p className="body2-txt" style={{
                marginTop: 'var(--size-card-gap-lg)',
                color: 'var(--color-on-surface-variant)'
            }}>
                Navigate to each category in the sidebar to see the individual components and their stories.
            </p>
        </div>
    );
};
