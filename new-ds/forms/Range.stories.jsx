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
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the range input component',
            table: { category: 'Behavior' }
        },
        min: {
            control: 'number',
            description: 'Minimum value of the range',
            table: { category: 'Range' }
        },
        max: {
            control: 'number',
            description: 'Maximum value of the range',
            table: { category: 'Range' }
        },
        step: {
            control: 'number',
            description: 'Step increment for the range value',
            table: { category: 'Range' }
        },
        value: {
            control: 'number',
            description: 'Current value of the range (controlled)',
            table: { category: 'Content' }
        },
        defaultValue: {
            control: 'number',
            description: 'Default value of the range (uncontrolled)',
            table: { category: 'Content' }
        },
        showLabel: {
            control: 'boolean',
            description: 'Toggle the label? switch to show or hide the label.',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            description: 'Toggle the required switch to show or hide a * next to the label to show if the range is required.',
            table: { category: 'Content' }
        },
        label: {
            control: 'text',
            description: 'Label text displayed above the range input',
            table: { category: 'Content' }
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
    const [value4, setValue4] = useState(50);
    const [value5, setValue5] = useState(50);
    const [value6, setValue6] = useState(50);
    const [value7, setValue7] = useState(25);
    const [value8, setValue8] = useState(75);
    const [value9, setValue9] = useState(0);
    const [value10, setValue10] = useState(100);

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
                            label="Label"
                            required
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
                            label="Label"
                            required
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
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={value3}
                            onChange={(e) => setValue3(parseFloat(e.target.value))}
                            size="large"
                        />
                    </div>
                </div>
            </section>

            {/* State Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Range inputs have 2 states: default, disabled.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-default"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={value4}
                            onChange={(e) => setValue4(parseFloat(e.target.value))}
                        />
                    </div>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-disabled"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={50}
                            disabled
                        />
                    </div>
                </div>
            </section>

            {/* Value Range Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Value Range</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Range inputs can have different min and max values. The track fill reflects the current value position within the range.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-min-value"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={value7}
                            onChange={(e) => setValue7(parseFloat(e.target.value))}
                        />
                    </div>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-max-value"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={value8}
                            onChange={(e) => setValue8(parseFloat(e.target.value))}
                        />
                    </div>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-at-min"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={value9}
                            onChange={(e) => setValue9(parseFloat(e.target.value))}
                        />
                    </div>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-at-max"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={value10}
                            onChange={(e) => setValue10(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </section>

            {/* Custom Range Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Custom Range</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Range inputs can be configured with custom min, max, and step values for different use cases.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-custom-1"
                            label="Label"
                            required
                            min={0}
                            max={200}
                            step={5}
                            value={value5}
                            onChange={(e) => setValue5(parseFloat(e.target.value))}
                        />
                    </div>
                    <div style={{ flex: '1' }}>
                        <Range
                            id="range-custom-2"
                            label="Label"
                            required
                            min={-50}
                            max={50}
                            step={1}
                            value={value6}
                            onChange={(e) => setValue6(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </section>

            {/* Label Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Label?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Toggle the label? switch to show or hide the label.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Range
                            id="range-with-label"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={50}
                            onChange={(e) => {}}
                            showLabel={true}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Range
                            id="range-without-label"
                            label="Label"
                            required
                            min={0}
                            max={100}
                            value={50}
                            onChange={(e) => {}}
                            showLabel={false}
                        />
                    </div>
                </div>
            </section>

            {/* Required Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Required?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Toggle the required switch to show or hide a * next to the label to show if the range is required.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Range
                            id="range-required"
                            label="Label"
                            required={true}
                            min={0}
                            max={100}
                            value={50}
                            onChange={(e) => {}}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Range
                            id="range-not-required"
                            label="Label"
                            required={false}
                            min={0}
                            max={100}
                            value={50}
                            onChange={(e) => {}}
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
    const [value, setValue] = useState(args.value || args.defaultValue || 50);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Range
                id="range-interactive"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value))}
                size={args.size}
                disabled={args.disabled}
                min={args.min}
                max={args.max}
                step={args.step}
                label={args.label}
                showLabel={args.showLabel}
                required={args.required}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium',
    disabled: false,
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    label: 'Label',
    showLabel: true,
    required: true
};

