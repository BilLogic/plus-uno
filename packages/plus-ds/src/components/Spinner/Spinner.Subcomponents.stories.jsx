import React from 'react';
import Spinner from './Spinner';

export default {
    title: 'Components/Loading',
    component: Spinner,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Loading indicator states and variants for different use cases.'
            }
        }
    }
};

// Spinner States
export const SpinnerStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Standard Spinners */}
        <div>
            <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Standard Spinners</h4>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Border (Default)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="grow" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Grow</p>
                </div>
            </div>
        </div>

        {/* Custom Animated Spinners */}
        <div>
            <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Custom Animations</h4>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="growing" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Growing (3×3 Grid)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="rotating" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Rotating (4 Corners)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="stacking" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Stacking (Bars)</p>
                </div>
            </div>
        </div>

        {/* Size Variants */}
        <div>
            <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Size Variants</h4>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Default (48px)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" size="sm" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Small (24px)</p>
                </div>
            </div>
        </div>
    </div>
);
SpinnerStates.storyName = 'Spinner States';
SpinnerStates.parameters = {
    docs: {
        description: {
            story: 'All spinner states including standard Bootstrap spinners and custom animated variants.'
        }
    }
};

// Interactive Loading Button Example
export const LoadingButtonExample = () => {
    const [loading, setLoading] = React.useState(false);

    const handleClick = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div>
            <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Usage Example: Loading Button</h4>
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-surface-container)',
                    color: 'var(--color-on-surface)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-element-radius-md, 8px)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-family-body, inherit)',
                }}
            >
                {loading && <Spinner variant="border" size="sm" />}
                {loading ? 'Loading...' : 'Click to Load'}
            </button>
        </div>
    );
};
LoadingButtonExample.storyName = 'Loading Button Example';
