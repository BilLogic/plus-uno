import React, { useState } from 'react';
import Select from './Select';

export default {
    title: 'Forms/Select',
    component: Select,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Select dropdown form control. The labeled select dropdown allows users to choose from a list of options and receive validation feedback with message.'
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
            description: 'Disable the select component',
            table: { category: 'Behavior' }
        },
        readOnly: {
            control: 'boolean',
            description: 'Make the select read-only',
            table: { category: 'Behavior' }
        },
        multiple: {
            control: 'boolean',
            description: 'Enable multiple selection. When enabled, users can select multiple options.',
            table: { category: 'Behavior' }
        },
        required: {
            control: 'boolean',
            description: 'Toggle the required switch to show or hide a * next to the label to show if the select is required.',
            table: { category: 'Content' }
        },
        label: {
            control: 'text',
            description: 'Label text for the select field',
            table: { category: 'Content' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' }
        },
        value: {
            control: 'text',
            description: 'Selected value',
            table: { category: 'Content' }
        },
        options: {
            control: 'object',
            description: 'Array of option objects with value and text properties',
            table: { category: 'Content' }
        }
    }
};

const defaultOptions = [
    { value: 'option1', text: 'Option 1' },
    { value: 'option2', text: 'Option 2' },
    { value: 'option3', text: 'Option 3' },
    { value: 'option4', text: 'Option 4' }
];

/**
 * Overview
 * Comprehensive view of Select configurations matching Figma specifications.
 */
export const Overview = () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('option2');
    const [value3, setValue3] = useState('');
    const [value4, setValue4] = useState('option3');
    const [value5, setValue5] = useState('');
    const [value6, setValue6] = useState('option1');
    const [value7, setValue7] = useState('');
    const [value8, setValue8] = useState('option2');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '1200px' }}>
            {/* Size Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Size</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Available in 3 sizes: small, medium (default), large.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-small"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            options={defaultOptions}
                            size="small"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-medium"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            options={defaultOptions}
                            size="medium"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-large"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            options={defaultOptions}
                            size="large"
                        />
                    </div>
                </div>
            </section>

            {/* State Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Select dropdowns have 3 states: default, disabled, read-only.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <Select
                        id="select-default-placeholder"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        options={defaultOptions}
                        value={value1}
                        onChange={(e) => setValue1(e.target.value)}
                    />
                    <Select
                        id="select-default-value"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        options={defaultOptions}
                        value={value2}
                        onChange={(e) => setValue2(e.target.value)}
                    />
                    <Select
                        id="select-disabled-placeholder"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        options={defaultOptions}
                        disabled
                    />
                    <Select
                        id="select-disabled-value"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        options={defaultOptions}
                        value="option2"
                        disabled
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
                    <Select
                        id="select-readonly-placeholder"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        options={defaultOptions}
                        readOnly
                    />
                    <Select
                        id="select-readonly-value"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        options={defaultOptions}
                        value="option3"
                        readOnly
                    />
                </div>
            </section>

            {/* Select Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Select</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    There are 2 styles for the select box: placeholder, value. Placeholder has a lighter color for both box border and text, while value has a darker color for both.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-placeholder-style"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            options={defaultOptions}
                            value={value5}
                            onChange={(e) => setValue5(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-value-style"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            options={defaultOptions}
                            value={value6}
                            onChange={(e) => setValue6(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Options Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Options</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Select dropdowns can display multiple options. Options can have both value and text properties, or just value.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-multiple-options"
                            label="Label"
                            required
                            placeholder="Select an option"
                            options={[
                                { value: 'opt1', text: 'First Option' },
                                { value: 'opt2', text: 'Second Option' },
                                { value: 'opt3', text: 'Third Option' },
                                { value: 'opt4', text: 'Fourth Option' },
                                { value: 'opt5', text: 'Fifth Option' }
                            ]}
                            value={value7}
                            onChange={(e) => setValue7(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-options-value-only"
                            label="Label"
                            required
                            placeholder="Select an option"
                            options={[
                                { value: 'value1' },
                                { value: 'value2' },
                                { value: 'value3' }
                            ]}
                            value={value8}
                            onChange={(e) => setValue8(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Label Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Label</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Select can be displayed with or without a label. The label is optional and will only render if provided.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-with-label"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            options={defaultOptions}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-without-label"
                            placeholder="Placeholder"
                            options={defaultOptions}
                        />
                    </div>
                </div>
            </section>

            {/* Required Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Required?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Toggle the required switch to show or hide a * next to the label to show if the select is required.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-required"
                            label="Label"
                            required={true}
                            placeholder="Placeholder"
                            options={defaultOptions}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-not-required"
                            label="Label"
                            required={false}
                            placeholder="Placeholder"
                            options={defaultOptions}
                        />
                    </div>
                </div>
            </section>

            {/* Multiple Select Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Multiple Select</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Select dropdowns can support multiple selection. When multiple is enabled, users can select multiple options by holding Ctrl (or Cmd on Mac) and clicking, or by using Shift to select ranges.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-multiple-default"
                            label="Label"
                            required
                            placeholder="Select multiple options"
                            options={[
                                { value: 'opt1', text: 'Option 1' },
                                { value: 'opt2', text: 'Option 2' },
                                { value: 'opt3', text: 'Option 3' },
                                { value: 'opt4', text: 'Option 4' },
                                { value: 'opt5', text: 'Option 5' },
                                { value: 'opt6', text: 'Option 6' }
                            ]}
                            multiple
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-multiple-disabled"
                            label="Label"
                            required
                            placeholder="Select multiple options"
                            options={[
                                { value: 'opt1', text: 'Option 1' },
                                { value: 'opt2', text: 'Option 2' },
                                { value: 'opt3', text: 'Option 3' },
                                { value: 'opt4', text: 'Option 4' }
                            ]}
                            multiple
                            disabled
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Select attributes in real-time.
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(args.multiple ? (args.value || []) : (args.value || ''));

    const handleChange = (e) => {
        if (args.multiple) {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setValue(selectedOptions);
        } else {
            setValue(e.target.value);
        }
        if (args.onChange) {
            args.onChange(e);
        }
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <Select
                id="select-interactive"
                value={value}
                onChange={handleChange}
                size={args.size}
                disabled={args.disabled}
                readOnly={args.readOnly}
                multiple={args.multiple}
                required={args.required}
                label={args.label}
                placeholder={args.placeholder}
                options={args.options || defaultOptions}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium',
    disabled: false,
    readOnly: false,
    multiple: false,
    required: true,
    label: 'Label',
    placeholder: 'Placeholder',
    value: '',
    options: defaultOptions
};

