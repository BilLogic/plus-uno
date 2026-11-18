import React from 'react';
import { expect, userEvent } from 'storybook/test';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { ScrollBar } from '@/components';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Layout and structure/Scrollbar',
    component: ScrollBar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'ScrollBar wraps scrollable content and applies the Design System scrollbar treatment: thin width, border-colored thumb, and a transparent track. Supports vertical (default, with maxHeight) and horizontal orientations.'
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
    border: 'var(--border-width-default) solid var(--ds-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--pad-x-lg)'
};

const sessionRows = [
    'Maya K. — Two-step equations (Lincoln Middle)',
    'Jordan T. — Linear graphs (North High)',
    'Elena R. — Fraction operations (Roosevelt K-8)',
    'Marcus B. — Reading comprehension (Lincoln Middle)',
    'Priya S. — Ratios and rates (Oak Creek Elementary)',
    'Noah W. — Paragraph structure (Westview Academy)',
    'Sofia L. — Slope-intercept form (North High)',
    'Liam D. — Main idea summary (Roosevelt K-8)',
    'Chloe M. — Proportional reasoning (Lincoln Middle)',
    'Ethan H. — Vocabulary in context (Oak Creek Elementary)',
    'Zoe P. — Systems of equations (North High)',
    'Ava C. — Informational text (Westview Academy)',
    'Leo G. — Order of operations (Roosevelt K-8)',
    'Nora F. — Evidence-based claims (Lincoln Middle)',
    'Owen K. — Function tables (North High)',
    'Hannah V. — Inference practice (Westview Academy)',
    'Lucas M. — Decimal division (Roosevelt K-8)',
    'Grace T. — Point of view (Oak Creek Elementary)',
    'Caleb R. — Angle pairs (Lincoln Middle)',
    'Ruby S. — Argument writing (North High)',
];

const lessonCards = [
    'Warm-up check',
    'Two-step equations',
    'Graphing lines',
    'Slope practice',
    'Function tables',
    'Word problems',
    'Ratios and rates',
    'Fraction review',
    'Reading fluency',
    'Main idea claims',
    'Exit ticket',
    'Session reflection',
];

function TallContent({ count = 12 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {sessionRows.slice(0, count).map((row, i) => (
                <p key={i} className="body-sm" style={{ margin: 0, color: 'var(--ds-text)' }}>
                    {row}
                </p>
            ))}
        </div>
    );
}

function WideContent({ count = 12 }) {
    return (
        <div style={{ display: 'flex', gap: 'var(--inline-lg)', width: 'max-content' }}>
            {lessonCards.slice(0, count).map((title, i) => (
                <div
                    key={i}
                    style={{
                        ...demoBox,
                        minWidth: 'var(--width-1000)',
                        backgroundColor: 'var(--ds-surface-container)'
                    }}
                >
                    <p className="body-sm" style={{ margin: 0, color: 'var(--ds-text)' }}>{title}</p>
                </div>
            ))}
        </div>
    );
}

export const Overview = () => (
    <div style={{ width: '100%', maxWidth: '600px' /* token gap: 600px */ }}>
        <div style={demoBox}>
            <ScrollBar maxHeight={'200px' /* token gap: 200px */}>
                <TallContent />
            </ScrollBar>
        </div>
    </div>
);

export const Layout = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' /* token gap: 48px */, width: '100%', maxWidth: '600px' /* token gap: 600px */ }}>
        <section>
            <DemoLabel>VERTICAL (DEFAULT)</DemoLabel>
            <p className="body-sm" style={{ marginBottom: 'var(--section-stack-md)', color: 'var(--ds-text)' }}>
                Content scrolls vertically once it exceeds maxHeight.
            </p>
            <div style={demoBox}>
                <ScrollBar maxHeight="var(--width-1000)">
                    <TallContent />
                </ScrollBar>
            </div>
        </section>
        <section>
            <DemoLabel>HORIZONTAL</DemoLabel>
            <p className="body-sm" style={{ marginBottom: 'var(--section-stack-md)', color: 'var(--ds-text)' }}>
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
    <div style={{ width: '100%', maxWidth: '600px' /* token gap: 600px */ }}>
        <DemoLabel>USE CASE EXAMPLE</DemoLabel>
        <p className="body-sm" style={{ marginBottom: 'var(--section-stack-md)', color: 'var(--ds-text)' }}>
            A list panel with the Design System scrollbar instead of the browser default.
        </p>
        <div style={{ ...demoBox, padding: 0 }}>
            <ScrollBar maxHeight={'220px' /* token gap: 220px */}>
                <div style={{ padding: 'var(--pad-x-lg)' }}>
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
        maxHeight: '200px' /* token gap: 200px */,
        horizontal: false
    },
    render: (args) => (
        <div style={{ width: '100%', maxWidth: '600px' /* token gap: 600px */ }}>
            <div style={demoBox}>
                <ScrollBar {...args}>
                    {args.horizontal ? <WideContent /> : <TallContent />}
                </ScrollBar>
            </div>
        </div>
    )
};

/* ------------------------------------------------------------------- states */


const Subject = (props) => (
    <ScrollBar maxHeight="var(--width-1000)" aria-label="Session notes" {...props}>
        {sessionRows.map((row, i) => <p key={i}>{row}</p>)}
    </ScrollBar>
);
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: scroll region. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        const el = root(canvasElement);
        await expect(getComputedStyle(el).overflowY).toBe('auto');
        await expect(el.scrollHeight).toBeGreaterThan(el.clientHeight);
    },
};

/** Hovered: a display component has no hover layer, so nothing moves. */
export const Hovered = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':hover', 'scroll region');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':active', 'scroll region');
    },
};

/** Focused: the region takes focus from Tab so the keyboard can scroll it. */
export const Focused = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await userEvent.tab();
        await expect(root(canvasElement)).toHaveFocus();
    },
};
