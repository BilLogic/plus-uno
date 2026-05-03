import React, { useEffect, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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

const overviewOptions = [
    { value: 'option1', label: 'Text' },
    { value: 'option2', label: 'Text' },
    { value: 'option3', label: 'Text' }
];

export const Overview = () => {
    const [value, setValue] = useState('option2');

    return (
        <div style={{ maxWidth: '800px' }}>
            <Scale
                id="scale-overview"
                name="scale-overview"
                label="Confidence"
                lowestLabel="Lowest"
                highestLabel="Highest"
                options={overviewOptions}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.formScale }
    }
};

export const Content = () => {
    const [value, setValue] = useState('option2');

    return (
        <div style={scaleCol}>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BASELINE SCALE</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FOUR OPTIONS</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FIVE OPTIONS</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SEVEN OPTIONS</span>
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
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


