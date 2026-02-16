import React, { useState } from 'react';
import TextareaVer2 from './TextareaVer2';

export default {
    title: 'Forms/Textarea ver 2',
    component: TextareaVer2,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Textarea ver 2 provides two variants: Long Form (boxed) and Short Form (underlined), implementing the updated Figma designs.'
            }
        }
    },
    argTypes: {
        variant: {
            control: 'radio',
            options: ['long', 'short'],
            description: 'The visual style of the textarea',
            table: { category: 'Design' }
        },
        state: {
            control: 'select',
            options: ['default', 'focus', 'error', 'read-only', 'disabled'],
            description: 'The visual state of the component',
            table: { category: 'State' }
        }
    }
};

/**
 * Overview
 * Shows both Long and Short variants in all accessible states.
 */
export const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '1000px' }}>

            {/* Long Form Section */}
            <section>
                <h6 className="h6 mb-4">Long Form</h6>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    <TextareaVer2 label="Default" placeholder="Enter text..." variant="long" />
                    <TextareaVer2 label="Focus (Simulated)" placeholder="Enter text..." variant="long" className="focus-simulation" autoFocus />
                    <TextareaVer2 label="Filled" defaultValue="Some content here" variant="long" />
                    <TextareaVer2 label="Error" defaultValue="Invalid content" variant="long" state="error" />
                    <TextareaVer2 label="Disabled" defaultValue="Disabled content" variant="long" disabled />
                    <TextareaVer2 label="Read Only" defaultValue="Read only content" variant="long" readOnly />
                </div>
            </section>

            {/* Short Form Section */}
            <section>
                <h6 className="h6 mb-4">Short Form</h6>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    <TextareaVer2 label="Default" placeholder="Enter text..." variant="short" />
                    <TextareaVer2 label="Focus (Simulated)" placeholder="Enter text..." variant="short" className="focus-simulation" autoFocus />
                    <TextareaVer2 label="Filled" defaultValue="Short content" variant="short" />
                    <TextareaVer2 label="Error" defaultValue="Invalid short content" variant="short" state="error" />
                    <TextareaVer2 label="Disabled" defaultValue="Disabled short content" variant="short" disabled />
                    <TextareaVer2 label="Read Only" defaultValue="Read only short content" variant="short" readOnly />
                </div>
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');
    return (
        <div style={{ maxWidth: '600px', padding: '20px' }}>
            <TextareaVer2
                {...args}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};

Interactive.args = {
    label: 'Interactive Label',
    placeholder: 'Type something...',
    variant: 'long',
    rows: 3,
    state: 'default'
};
