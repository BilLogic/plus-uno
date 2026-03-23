import React, { useState } from 'react';
import MultipleChoice from './MultipleChoice';

export default {
    title: 'Forms/Multiple Choice',
    component: MultipleChoice,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Multiple Choice component for vertical lists of radio buttons or checkboxes. Supports both single selection (radio) and multiple selection (checkbox) modes with proper spacing and design system tokens.'
            }
        }
    },
    argTypes: {
        type: {
            control: 'select',
            options: ['radio', 'checkbox'],
            description: 'Selection type: radio for single selection, checkbox for multiple selection',
            table: { category: 'Content' }
        },
        options: {
            control: 'object',
            description: 'Array of option objects with id, value, and label properties',
            table: { category: 'Content' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the choice items',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable all choice items',
            table: { category: 'Behavior' }
        },
        value: {
            control: 'object',
            description: 'Controlled value (single value for radio, array for checkbox)',
            table: { category: 'Content' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Multiple Choice configurations.
 */
export const Overview = () => {
    const [radioValue, setRadioValue] = useState(null);
    const [checkboxValues, setCheckboxValues] = useState([]);

    // Generate 27 options for radio (matching Figma design)
    const radioOptions = Array.from({ length: 27 }, (_, i) => ({
        id: `radio-option-${i}`,
        value: `option-${i}`,
        label: 'Text'
    }));

    // Generate options for checkbox examples
    const checkboxOptions = Array.from({ length: 5 }, (_, i) => ({
        id: `checkbox-option-${i}`,
        value: `option-${i}`,
        label: 'Text'
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Radio - Default */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio - Default</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Vertical list of radio buttons for single selection. All items are unselected by default.
                </p>
                <MultipleChoice
                    id="multiple-choice-radio-default"
                    name="multiple-choice-radio-default"
                    type="radio"
                    options={radioOptions}
                    value={radioValue}
                    onChange={setRadioValue}
                />
            </section>

            {/* Radio - With Selection */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio - With Selection</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Radio button group with a pre-selected option.
                </p>
                <MultipleChoice
                    id="multiple-choice-radio-selected"
                    name="multiple-choice-radio-selected"
                    type="radio"
                    options={radioOptions.slice(0, 5)}
                    defaultValue="option-2"
                />
            </section>

            {/* Radio - Small */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio - Small</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Small size variant for compact layouts.
                </p>
                <MultipleChoice
                    id="multiple-choice-radio-small"
                    name="multiple-choice-radio-small"
                    type="radio"
                    options={radioOptions.slice(0, 5)}
                    size="small"
                />
            </section>

            {/* Radio - Large */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio - Large</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Large size variant for prominent displays.
                </p>
                <MultipleChoice
                    id="multiple-choice-radio-large"
                    name="multiple-choice-radio-large"
                    type="radio"
                    options={radioOptions.slice(0, 5)}
                    size="large"
                />
            </section>

            {/* Radio - Disabled */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio - Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled state prevents interaction with all choice items.
                </p>
                <MultipleChoice
                    id="multiple-choice-radio-disabled"
                    name="multiple-choice-radio-disabled"
                    type="radio"
                    options={radioOptions.slice(0, 5)}
                    defaultValue="option-2"
                    disabled
                />
            </section>

            {/* Checkbox - Default */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox - Default</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Vertical list of checkboxes for multiple selection. All items are unchecked by default.
                </p>
                <MultipleChoice
                    id="multiple-choice-checkbox-default"
                    name="multiple-choice-checkbox-default"
                    type="checkbox"
                    options={checkboxOptions}
                    value={checkboxValues}
                    onChange={setCheckboxValues}
                />
            </section>

            {/* Checkbox - With Selections */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox - With Selections</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Checkbox group with pre-selected options.
                </p>
                <MultipleChoice
                    id="multiple-choice-checkbox-selected"
                    name="multiple-choice-checkbox-selected"
                    type="checkbox"
                    options={checkboxOptions}
                    defaultValue={['option-1', 'option-3']}
                />
            </section>

            {/* Checkbox - Disabled */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox - Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled state prevents interaction with all choice items.
                </p>
                <MultipleChoice
                    id="multiple-choice-checkbox-disabled"
                    name="multiple-choice-checkbox-disabled"
                    type="checkbox"
                    options={checkboxOptions}
                    defaultValue={['option-1', 'option-3']}
                    disabled
                />
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Multiple Choice attributes in real-time.
 */
export const Interactive = (args) => {
    const [radioValue, setRadioValue] = useState(args.type === 'radio' ? (args.value || null) : undefined);
    const [checkboxValues, setCheckboxValues] = useState(args.type === 'checkbox' ? (args.value || []) : undefined);

    const handleChange = args.type === 'radio' ? setRadioValue : setCheckboxValues;
    const currentValue = args.type === 'radio' ? radioValue : checkboxValues;

    return (
        <div style={{ maxWidth: '600px' }}>
            <MultipleChoice
                id="multiple-choice-interactive"
                name="multiple-choice-interactive"
                type={args.type}
                options={args.options}
                value={currentValue}
                onChange={handleChange}
                size={args.size}
                disabled={args.disabled}
            />
        </div>
    );
};

Interactive.args = {
    type: 'radio',
    size: 'medium',
    disabled: false,
    options: [
        { id: 'option-1', value: 'option-1', label: 'Text' },
        { id: 'option-2', value: 'option-2', label: 'Text' },
        { id: 'option-3', value: 'option-3', label: 'Text' },
        { id: 'option-4', value: 'option-4', label: 'Text' },
        { id: 'option-5', value: 'option-5', label: 'Text' }
    ],
    value: null
};
