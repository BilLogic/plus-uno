import React, { useState } from 'react';
import MultipleChoice from './MultipleChoice';

export default {
    title: 'Forms/Multiple Choice',
    component: MultipleChoice,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Multiple Choice component for vertical lists of radio buttons or checkboxes. Supports both single selection (radio) and multiple selection (checkbox) modes with proper spacing and design system tokens.',
            },
        },
    },
    argTypes: {
        type: {
            control: 'select',
            options: ['radio', 'checkbox'],
            description: 'Selection type: radio for single selection, checkbox for multiple selection',
            table: { category: 'Content' },
        },
        options: {
            control: 'object',
            description: 'Array of option objects with id, value, and label properties',
            table: { category: 'Content' },
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the choice items',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable all choice items',
            table: { category: 'Behavior' },
        },
        value: {
            control: 'object',
            description: 'Controlled value (single value for radio, array for checkbox)',
            table: { category: 'Content' },
        },
    },
};

const shortRadioOptions = Array.from({ length: 5 }, (_, i) => ({
    id: `radio-option-${i}`,
    value: `option-${i}`,
    label: 'Text',
}));

const shortCheckboxOptions = Array.from({ length: 5 }, (_, i) => ({
    id: `checkbox-option-${i}`,
    value: `option-${i}`,
    label: 'Text',
}));

const longRadioOptions = Array.from({ length: 27 }, (_, i) => ({
    id: `radio-option-${i}`,
    value: `option-${i}`,
    label: 'Text',
}));

const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

export const Styles = () => {
    const [radioValue, setRadioValue] = useState(null);
    const [checkboxValues, setCheckboxValues] = useState([]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
            <div>
                <h6 className="h6 mb-2">Radio</h6>
                <MultipleChoice
                    id="multiple-choice-radio-default"
                    name="multiple-choice-radio-default"
                    type="radio"
                    options={shortRadioOptions}
                    value={radioValue}
                    onChange={setRadioValue}
                />
            </div>
            <div>
                <h6 className="h6 mb-2">Checkbox</h6>
                <MultipleChoice
                    id="multiple-choice-checkbox-default"
                    name="multiple-choice-checkbox-default"
                    type="checkbox"
                    options={shortCheckboxOptions}
                    value={checkboxValues}
                    onChange={setCheckboxValues}
                />
            </div>
        </div>
    );
};

export const Content = () => (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
            <h6 className="h6 mb-2">Long list (radio)</h6>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Long vertical option set for single-selection flows.
            </p>
            <div style={contentVariantCard}>
                <MultipleChoice
                    id="multiple-choice-radio-long"
                    name="multiple-choice-radio-long"
                    type="radio"
                    options={longRadioOptions}
                />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-2">Radio — with selection</h6>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Pre-selected item in a single-select list.
            </p>
            <div style={contentVariantCard}>
                <MultipleChoice
                    id="multiple-choice-radio-selected"
                    name="multiple-choice-radio-selected"
                    type="radio"
                    options={shortRadioOptions}
                    defaultValue="option-2"
                />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-2">Checkbox — with selections</h6>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Pre-selected values for multi-select behavior.
            </p>
            <div style={contentVariantCard}>
                <MultipleChoice
                    id="multiple-choice-checkbox-selected"
                    name="multiple-choice-checkbox-selected"
                    type="checkbox"
                    options={shortCheckboxOptions}
                    defaultValue={['option-1', 'option-3']}
                />
            </div>
        </section>
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div>
            <h6 className="h6 mb-2">Small</h6>
            <MultipleChoice
                id="multiple-choice-radio-small"
                name="multiple-choice-radio-small"
                type="radio"
                options={shortRadioOptions}
                size="small"
            />
        </div>
        <div>
            <h6 className="h6 mb-2">Large</h6>
            <MultipleChoice
                id="multiple-choice-radio-large"
                name="multiple-choice-radio-large"
                type="radio"
                options={shortRadioOptions}
                size="large"
            />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div>
            <h6 className="h6 mb-2">Radio — disabled</h6>
            <MultipleChoice
                id="multiple-choice-radio-disabled"
                name="multiple-choice-radio-disabled"
                type="radio"
                options={shortRadioOptions}
                defaultValue="option-2"
                disabled
            />
        </div>
        <div>
            <h6 className="h6 mb-2">Checkbox — disabled</h6>
            <MultipleChoice
                id="multiple-choice-checkbox-disabled"
                name="multiple-choice-checkbox-disabled"
                type="checkbox"
                options={shortCheckboxOptions}
                defaultValue={['option-1', 'option-3']}
                disabled
            />
        </div>
    </div>
);

export const Interactive = (args) => {
    const [radioValue, setRadioValue] = useState(args.type === 'radio' ? args.value || null : undefined);
    const [checkboxValues, setCheckboxValues] = useState(args.type === 'checkbox' ? args.value || [] : undefined);

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
        { id: 'option-5', value: 'option-5', label: 'Text' },
    ],
    value: null,
};
