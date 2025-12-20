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
                            placeholder="Placeholder"
                            options={defaultOptions}
                            size="small"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-medium"
                            placeholder="Placeholder"
                            options={defaultOptions}
                            size="medium"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-large"
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
                    Select dropdowns have 3 states: default, focus, read-only.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <Select
                        id="select-default"
                        placeholder="Placeholder"
                        options={defaultOptions}
                        value={value1}
                        onChange={(e) => setValue1(e.target.value)}
                    />
                    <Select
                        id="select-focus"
                        placeholder="Placeholder"
                        options={defaultOptions}
                        value="option2"
                        className="plus-form-select-focused"
                    />
                    <Select
                        id="select-readonly"
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
                            placeholder="Placeholder"
                            options={defaultOptions}
                            value={value5}
                            onChange={(e) => setValue5(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Select
                            id="select-value-style"
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
                            placeholder="Select multiple options"
                            options={[
                                { value: 'opt1', text: 'Option 1' },
                                { value: 'opt2', text: 'Option 2' },
                                { value: 'opt3', text: 'Option 3' },
                                { value: 'opt4', text: 'Option 4' }
                            ]}
                            multiple
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
                readOnly={args.readOnly}
                multiple={args.multiple}
                placeholder={args.placeholder}
                options={args.options || defaultOptions}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium',
    readOnly: false,
    multiple: false,
    placeholder: 'Placeholder',
    value: '',
    options: defaultOptions
};

