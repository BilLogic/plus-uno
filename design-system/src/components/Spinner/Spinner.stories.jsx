import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Spinner from './Spinner';

export default {
    title: 'Components/Loading',
    component: Spinner,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Loading indicators for asynchronous operations. Standard Bootstrap spinners (border, grow) and custom variants (growing, rotating, stacking) all use the neutral on-surface-variant color token.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        variant: {
            control: 'select',
            options: ['border', 'grow', 'growing', 'rotating', 'stacking'],
            description: 'Animation variant type',
            table: { category: 'Design', defaultValue: { summary: 'border' } }
        },
        size: {
            control: 'select',
            options: [null, 'sm'],
            description: 'Size variant',
            table: { category: 'Design', defaultValue: { summary: null } }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' };

function SpinnerVariantsDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">VARIANTS</span>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Different animation styles for loading indicators.
            </p>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Border</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="grow" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Grow</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="growing" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Growing (3x3)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="rotating" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Rotating</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="stacking" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Stacking</p>
                </div>
            </div>
        </section>
    );
}

function SpinnerStylesDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">COLOR</span>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                All loading indicators use the neutral token <code className="text-foreground">--color-on-surface-variant</code>{' '}
                (border, grow, and custom animations).
            </p>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Border</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="grow" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Grow</p>
                </div>
            </div>
        </section>
    );
}

function SpinnerSizesDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SIZES</span>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Default and small border spinner.
            </p>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Default</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" size="sm" />
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Small (sm)</p>
                </div>
            </div>
        </section>
    );
}

export const StyleVariants = () => (
    <div style={col}>
        <SpinnerVariantsDemos />
    </div>
);

export const Styles = () => (
    <div style={col}>
        <SpinnerStylesDemos />
    </div>
);

export const Sizes = () => (
    <div style={col}>
        <SpinnerSizesDemos />
    </div>
);

export const Overview = () => <Spinner variant="border" />;

Overview.parameters = {
    docs: {
        description: {
            story: 'Default border spinner. See other stories for grow, sizes, and custom animations.'
        },
        source: { language: 'html', code: webAppSourceSnippets.spinner }
    }
};

export const Interactive = (args) => <Spinner {...args} />;
Interactive.args = {
    variant: 'border',
    size: null
};
Interactive.parameters = {
    docs: {
        description: {
            story: 'Interactive playground - use the controls panel to customize the spinner.'
        }
    }
};
