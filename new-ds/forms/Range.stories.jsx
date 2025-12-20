import React, { useState } from 'react';
import Range from './Range';

export default {
    title: 'Forms/Range',
    component: Range,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Range input controls allow users to select a numeric value within a specified range by dragging a slider. The range input provides visual feedback with a filled track indicating the current value position.'
            }
        }
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Available in 3 sizes: small, medium (default), large.',
            table: { category: 'Design' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Range configurations matching Figma specifications.
 */
export const Overview = () => {
    const [value1, setValue1] = useState(50);
    const [value2, setValue2] = useState(50);
    const [value3, setValue3] = useState(50);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '1200px' }}>
            {/* Size Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Size</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Available in 3 sizes: small, medium (default), large.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-small"
                            min={0}
                            max={100}
                            value={value1}
                            onChange={(e) => setValue1(parseFloat(e.target.value))}
                            size="small"
                        />
                    </div>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-medium"
                            min={0}
                            max={100}
                            value={value2}
                            onChange={(e) => setValue2(parseFloat(e.target.value))}
                            size="medium"
                        />
                    </div>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-large"
                            min={0}
                            max={100}
                            value={value3}
                            onChange={(e) => setValue3(parseFloat(e.target.value))}
                            size="large"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Range attributes in real-time.
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(50);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Range
                id="range-interactive"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value))}
                size={args.size}
                min={0}
                max={100}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium'
};

