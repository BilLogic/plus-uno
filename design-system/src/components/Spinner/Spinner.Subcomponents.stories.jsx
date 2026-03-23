import React from 'react';
import Spinner from './Spinner';

export default {
    title: 'Components/Loading/Subcomponents',
    component: Spinner,
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
                    <Spinner variant="border" color="primary" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Border (Default)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="grow" color="primary" />
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
                    <Spinner variant="border" color="primary" />
                    <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>Default (48px)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Spinner variant="border" color="primary" size="sm" />
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

// Color Variants
export const ColorVariants = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Color Options</h4>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {['primary', 'secondary', 'success', 'danger', 'warning', 'info'].map(color => (
                <div key={color} style={{ textAlign: 'center', minWidth: '60px' }}>
                    <Spinner variant="border" color={color} size="sm" />
                    <p style={{ marginTop: '4px', fontSize: '10px', textTransform: 'capitalize' }}>{color}</p>
                </div>
            ))}
        </div>
    </div>
);
ColorVariants.storyName = 'Color Variants';

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
                onClick={handleClick}
                disabled={loading}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading && <Spinner variant="border" color="light" size="sm" />}
                {loading ? 'Loading...' : 'Click to Load'}
            </button>
        </div>
    );
};
LoadingButtonExample.storyName = 'Loading Button Example';
