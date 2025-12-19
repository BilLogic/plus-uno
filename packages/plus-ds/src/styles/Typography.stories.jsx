import React from 'react';

export default {
    title: 'Styles/Typography',
    tags: ['autodocs'],
};

const TypeScale = ({ category, description, examples }) => (
    <div style={{
        marginBottom: '32px',
        padding: '24px',
        backgroundColor: 'var(--color-surface-container-low)',
        borderRadius: '8px'
    }}>
        <h3 className="h4">{category}</h3>
        <p className="body2-txt" style={{ marginBottom: '16px' }}>{description}</p>

        {examples.map((ex, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
                <div className={ex.class}>
                    {ex.label} - {ex.label === 'Display 1' ? 'The quick brown fox' : 'Typography Example'}
                </div>
                <div className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {ex.class} • Size: {ex.size} {ex.weight && `• Weight: ${ex.weight}`}
                </div>
            </div>
        ))}
    </div>
);

export const TypographyScales = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Typography Scales</h2>

        <TypeScale
            category="Display"
            description="Largest text for hero sections"
            examples={[
                { class: 'display1-txt', label: 'Display 1', size: '5rem (80px)' },
                { class: 'display2-txt', label: 'Display 2', size: '4.5rem (72px)' },
                { class: 'display3-txt', label: 'Display 3', size: '4rem (64px)' },
                { class: 'display4-txt', label: 'Display 4', size: '3.5rem (56px)' },
            ]}
        />

        <TypeScale
            category="Headlines"
            description="Main headings for page sections"
            examples={[
                { class: 'h1', label: 'H1', size: '2.5rem (40px)', weight: 'Bold' },
                { class: 'h2', label: 'H2', size: '2rem (32px)', weight: 'Bold' },
                { class: 'h3', label: 'H3', size: '1.75rem (28px)', weight: 'Bold' },
            ]}
        />

        <TypeScale
            category="Titles"
            description="Subheadings and card titles"
            examples={[
                { class: 'h4', label: 'H4', size: '1.5rem (24px)', weight: 'Semibold' },
                { class: 'h5', label: 'H5', size: '1.25rem (20px)', weight: 'Semibold' },
                { class: 'h6', label: 'H6', size: '1rem (16px)', weight: 'Semibold' },
            ]}
        />

        <TypeScale
            category="Body"
            description="Content text"
            examples={[
                { class: 'body1-txt', label: 'Body 1', size: '1rem (16px)', weight: 'Normal' },
                { class: 'body2-txt', label: 'Body 2', size: '0.875rem (14px)', weight: 'Normal' },
                { class: 'body3-txt', label: 'Body 3', size: '0.75rem (12px)', weight: 'Normal' },
            ]}
        />
    </div>
);

export const Interactive = {
    render: (args) => (
        <div className={`${args.textSize} ${args.textColor !== 'default' ? args.textColor : ''}`}>
            {args.text}
        </div>
    ),
    argTypes: {
        textSize: {
            control: 'select',
            options: ['display1-txt', 'h1', 'h2', 'body1-txt', 'body2-txt'],
        },
        textColor: {
            control: 'select',
            options: ['default', 'color-primary', 'color-secondary', 'color-error'],
        },
        text: { control: 'text' },
    },
    args: {
        textSize: 'body2-txt',
        textColor: 'default',
        text: 'Interactive text',
    },
};
