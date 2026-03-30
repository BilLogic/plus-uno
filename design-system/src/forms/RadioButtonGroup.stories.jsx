import React, { useEffect, useState } from 'react';
import Scale from './RadioButtonGroup';

export default {
    title: 'Forms/Scale',
    component: Scale,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Scale component with horizontal layout, end labels, and radio buttons with labels above them.'
            }
        }
    },
    argTypes: {
        label: {
            control: 'text',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            table: { category: 'Content' }
        },
        lowestLabel: {
            control: 'text',
            table: { category: 'Content' }
        },
        highestLabel: {
            control: 'text',
            table: { category: 'Content' }
        },
        optionCount: {
            control: 'select',
            options: [3, 5, 7],
            table: { category: 'Content' }
        },
        selectedIndex: {
            control: { type: 'range', min: 1, max: 7, step: 1 },
            table: { category: 'Behavior' }
        },
        disabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        options: {
            table: { disable: true, category: 'Development' }
        },
        value: {
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            table: { disable: true, category: 'Development' }
        }
    }
};

const scaleCol = { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' };

export const Content = () => {
    const [value, setValue] = useState('option2');

    return (
        <div style={scaleCol}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Baseline scale</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Three-point scale with end labels and labels above each radio button.
                </p>
                <Scale
                    id="scale-content"
                    name="scale-content"
                    label="Confidence"
                    lowestLabel="Lowest"
                    highestLabel="Highest"
                    options={[
                        { value: 'option1', label: 'Text' },
                        { value: 'option2', label: 'Text' },
                        { value: 'option3', label: 'Text' }
                    ]}
                    value={value}
                    onChange={setValue}
                />
            </section>
        </div>
    );
};

export const Variants = () => {
    const [value4, setValue4] = useState('option2');
    const [value5, setValue5] = useState('option3');
    const [value7, setValue7] = useState('option4');

    return (
        <div style={scaleCol}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Four options</h6>
                <Scale
                    id="scale-4-options"
                    name="scale-4-options"
                    lowestLabel="Lowest"
                    highestLabel="Highest"
                    options={[
                        { value: 'option1', label: 'Text' },
                        { value: 'option2', label: 'Text' },
                        { value: 'option3', label: 'Text' },
                        { value: 'option4', label: 'Text' }
                    ]}
                    value={value4}
                    onChange={setValue4}
                />
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Five options</h6>
                <Scale
                    id="scale-5-options"
                    name="scale-5-options"
                    lowestLabel="Lowest"
                    highestLabel="Highest"
                    options={[
                        { value: 'option1', label: 'Text' },
                        { value: 'option2', label: 'Text' },
                        { value: 'option3', label: 'Text' },
                        { value: 'option4', label: 'Text' },
                        { value: 'option5', label: 'Text' }
                    ]}
                    value={value5}
                    onChange={setValue5}
                />
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Seven options</h6>
                <Scale
                    id="scale-7-options"
                    name="scale-7-options"
                    lowestLabel="Lowest"
                    highestLabel="Highest"
                    options={[
                        { value: 'option1', label: 'Text' },
                        { value: 'option2', label: 'Text' },
                        { value: 'option3', label: 'Text' },
                        { value: 'option4', label: 'Text' },
                        { value: 'option5', label: 'Text' },
                        { value: 'option6', label: 'Text' },
                        { value: 'option7', label: 'Text' }
                    ]}
                    value={value7}
                    onChange={setValue7}
                />
            </section>
        </div>
    );
};

export const InteractionStates = () => (
    <div style={scaleCol}>
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Disabled scales remain readable but cannot be changed.
            </p>
            <Scale
                id="scale-disabled"
                name="scale-disabled"
                lowestLabel="Lowest"
                highestLabel="Highest"
                options={[
                    { value: 'option1', label: 'Text' },
                    { value: 'option2', label: 'Text' },
                    { value: 'option3', label: 'Text' }
                ]}
                defaultValue="option2"
                disabled
            />
        </section>
    </div>
);

export const Interactive = (args) => {
    const options = Array.from({ length: args.optionCount }, (_, index) => ({
        value: `option${index + 1}`,
        label: 'Text'
    }));
    const [value, setValue] = useState(`option${args.selectedIndex}`);

    useEffect(() => {
        setValue(`option${Math.min(args.selectedIndex, args.optionCount)}`);
    }, [args.selectedIndex, args.optionCount]);

    return (
        <div style={{ maxWidth: '800px' }}>
            <Scale
                {...args}
                options={options}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
Interactive.args = {
    label: 'Scale',
    required: false,
    lowestLabel: 'Lowest',
    highestLabel: 'Highest',
    optionCount: 3,
    selectedIndex: 2,
    disabled: false,
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

