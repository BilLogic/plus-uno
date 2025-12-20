import React, { useState } from 'react';
import Scale from './RadioButtonGroup';

export default {
    title: 'Forms/Scale',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Scale component with horizontal layout, end labels, and radio buttons with labels above them.'
            }
        }
    }
};

export const Overview = () => {
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
                <h2 className="h2" style={{ marginBottom: '16px' }}>Scale</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Default */}
                    <div>
                        <h3 className="h3" style={{ marginBottom: '16px' }}>Default (3 Options)</h3>
                        <Scale
                            id="scale-default"
                            name="scale-default"
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
                        <Scale
                            id="scale-4"
                            name="scale-4"
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
                        <Scale
                            id="scale-5"
                            name="scale-5"
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
                        <Scale
                            id="scale-6"
                            name="scale-6"
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
                        <Scale
                            id="scale-7"
                            name="scale-7"
                            lowestLabel="Lowest"
                            highestLabel="Highest"
                            options={options7}
                            defaultValue="option4"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

