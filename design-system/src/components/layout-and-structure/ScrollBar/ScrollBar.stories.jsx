import React from 'react';
import ScrollBar from '@/components/layout-and-structure/ScrollBar';

export default {
    title: 'Components/Layout and structure/Scroll bar',
    component: ScrollBar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'ScrollBar wraps scrollable content and applies the Design System scrollbar treatment: thin width, outline-colored thumb, and a transparent track. Supports vertical (default, with maxHeight) and horizontal orientations.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        // DESIGN
        maxHeight: {
            control: 'text',
            description: 'Maximum height before vertical scrolling begins (e.g., "240px")',
            table: { category: 'Design' }
        },
        horizontal: {
            control: 'boolean',
            description: 'Scroll horizontally instead of vertically',
            table: { category: 'Design' }
        },

        // DEVELOPMENT
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const demoBox = {
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '8px',
    padding: '16px'
};

function TallContent({ count = 12 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: count }, (_, i) => (
                <p key={i} className="plus-body-2" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                    Row {i + 1} — scrollable content inside the wrapper.
                </p>
            ))}
        </div>
    );
}

function WideContent({ count = 12 }) {
    return (
        <div style={{ display: 'flex', gap: '12px', width: 'max-content' }}>
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    style={{
                        ...demoBox,
                        minWidth: '160px',
                        backgroundColor: 'var(--color-surface-container-low)'
                    }}
                >
                    <p className="plus-body-2" style={{ margin: 0, color: 'var(--color-on-surface)' }}>Card {i + 1}</p>
                </div>
            ))}
        </div>
    );
}

export const Overview = () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={demoBox}>
            <ScrollBar maxHeight="200px">
                <TallContent />
            </ScrollBar>
        </div>
    </div>
);

export const Layout = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', width: '100%', maxWidth: '600px' }}>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">VERTICAL (DEFAULT)</span>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Content scrolls vertically once it exceeds maxHeight.
            </p>
            <div style={demoBox}>
                <ScrollBar maxHeight="160px">
                    <TallContent />
                </ScrollBar>
            </div>
        </section>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">HORIZONTAL</span>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Wide content scrolls sideways with the same thin, tokenized scrollbar.
            </p>
            <div style={demoBox}>
                <ScrollBar horizontal>
                    <WideContent />
                </ScrollBar>
            </div>
        </section>
    </div>
);

export const Content = () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">USE CASE EXAMPLE</span>
        <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
            A list panel with the Design System scrollbar instead of the browser default.
        </p>
        <div style={{ ...demoBox, padding: 0 }}>
            <ScrollBar maxHeight="220px">
                <div style={{ padding: '16px' }}>
                    <TallContent count={16} />
                </div>
            </ScrollBar>
        </div>
    </div>
);

/**
 * Interactive Playground
 * Customize scrollbar wrapper attributes in real-time.
 */
export const Interactive = {
    args: {
        maxHeight: '200px',
        horizontal: false
    },
    render: (args) => (
        <div style={{ width: '100%', maxWidth: '600px' }}>
            <div style={demoBox}>
                <ScrollBar {...args}>
                    {args.horizontal ? <WideContent /> : <TallContent />}
                </ScrollBar>
            </div>
        </div>
    )
};
