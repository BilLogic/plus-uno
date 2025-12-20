import React, { useState } from 'react';
import RadioButtonGroup from './RadioButtonGroup';

export default {
    title: 'Forms/Radio Button Group',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'RadioButtonGroup component with horizontal layout, end labels, and radio buttons with labels above them.'
            }
        }
    }
};

export const RadioButtonGroupStory = () => {
    const [value1, setValue1] = useState('option2');
    const [value2, setValue2] = useState('option1');
    const [value3, setValue3] = useState('option3');
    const [value4, setValue4] = useState('option2');

    // Default options (3 radio buttons)
    const defaultOptions = [
        { value: 'option1', label: 'Text' },
        { value: 'option2', label: 'Text' },
        { value: 'option3', label: 'Text' }
    ];

    // 4 options
    const options4 = [
        { value: 'option1', label: 'Text' },
        { value: 'option2', label: 'Text' },
        { value: 'option3', label: 'Text' },
        { value: 'option4', label: 'Text' }
    ];

    // 5 options
    const options5 = [
        { value: 'option1', label: 'Text' },
        { value: 'option2', label: 'Text' },
        { value: 'option3', label: 'Text' },
        { value: 'option4', label: 'Text' },
        { value: 'option5', label: 'Text' }
    ];

    // 6 options
    const options6 = [
        { value: 'option1', label: 'Text' },
        { value: 'option2', label: 'Text' },
        { value: 'option3', label: 'Text' },
        { value: 'option4', label: 'Text' },
        { value: 'option5', label: 'Text' },
        { value: 'option6', label: 'Text' }
    ];

    // 7 options
    const options7 = [
        { value: 'option1', label: 'Text' },
        { value: 'option2', label: 'Text' },
        { value: 'option3', label: 'Text' },
        { value: 'option4', label: 'Text' },
        { value: 'option5', label: 'Text' },
        { value: 'option6', label: 'Text' },
        { value: 'option7', label: 'Text' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
            {/* Default (3 options) */}
            <div>
                <h2 className="h2" style={{ marginBottom: '16px' }}>Radio Button Group</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Default */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Default (3 Options)</h3>
                        <RadioButtonGroup
                            id="radio-group-default"
                            name="radio-group-default"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={defaultOptions}
                            value={value1}
                            onChange={setValue1}
                        />
                    </div>

                    {/* 4 Options */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>4 Options</h3>
                        <RadioButtonGroup
                            id="radio-group-4"
                            name="radio-group-4"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={options4}
                            value={value2}
                            onChange={setValue2}
                        />
                    </div>

                    {/* 5 Options */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>5 Options</h3>
                        <RadioButtonGroup
                            id="radio-group-5"
                            name="radio-group-5"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={options5}
                            value={value3}
                            onChange={setValue3}
                        />
                    </div>

                    {/* 6 Options */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>6 Options</h3>
                        <RadioButtonGroup
                            id="radio-group-6"
                            name="radio-group-6"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={options6}
                            value={value4}
                            onChange={setValue4}
                        />
                    </div>

                    {/* 7 Options */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>7 Options</h3>
                        <RadioButtonGroup
                            id="radio-group-7"
                            name="radio-group-7"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={options7}
                            defaultValue="option4"
                        />
                    </div>

                    {/* With Label */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>With Label</h3>
                        <RadioButtonGroup
                            id="radio-group-labeled"
                            name="radio-group-labeled"
                            label="Rating"
                            required
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={defaultOptions}
                            defaultValue="option2"
                        />
                    </div>

                    {/* Disabled */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Disabled</h3>
                        <RadioButtonGroup
                            id="radio-group-disabled"
                            name="radio-group-disabled"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={defaultOptions}
                            value="option2"
                            disabled
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
