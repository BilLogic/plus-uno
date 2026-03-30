import React, { useState } from 'react';
import TextareaVer2 from './TextareaVer2';

export default {
    title: 'Forms/Textarea ver 2',
    component: TextareaVer2,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Textarea ver 2 provides two variants: Long Form (boxed) and Short Form (underlined), implementing the updated Figma designs.',
            },
        },
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Field label',
            table: { category: 'Content' },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        rows: {
            control: 'number',
            description: 'Visible text rows',
            table: { category: 'Layout' },
        },
        variant: {
            control: 'radio',
            options: ['long', 'short'],
            description: 'The visual style of the textarea',
            table: { category: 'Design' },
        },
        state: {
            control: 'select',
            options: ['default', 'focus', 'error', 'read-only', 'disabled'],
            description: 'The visual state of the component',
            table: { category: 'Behavior' },
        },
        value: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        defaultValue: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        style: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    },
};

export const Styles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Long (boxed) vs short (underlined) at default state.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <TextareaVer2 label="Long form" placeholder="Enter text..." variant="long" />
            <TextareaVer2 label="Short form" placeholder="Enter text..." variant="short" />
        </div>
    </div>
);

export const InteractionStatesLong = () => (
    <div style={{ maxWidth: '1000px' }}>
        <h6 className="h6 mb-4">Long form</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <TextareaVer2 label="Default" placeholder="Enter text..." variant="long" />
            <TextareaVer2 label="Focus (simulated)" placeholder="Enter text..." variant="long" className="focus-simulation" autoFocus />
            <TextareaVer2 label="Filled" defaultValue="Some content here" variant="long" />
            <TextareaVer2 label="Error" defaultValue="Invalid content" variant="long" state="error" />
            <TextareaVer2 label="Disabled" defaultValue="Disabled content" variant="long" disabled />
            <TextareaVer2 label="Read only" defaultValue="Read only content" variant="long" readOnly />
        </div>
    </div>
);

export const InteractionStatesShort = () => (
    <div style={{ maxWidth: '1000px' }}>
        <h6 className="h6 mb-4">Short form</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <TextareaVer2 label="Default" placeholder="Enter text..." variant="short" />
            <TextareaVer2 label="Focus (simulated)" placeholder="Enter text..." variant="short" className="focus-simulation" autoFocus />
            <TextareaVer2 label="Filled" defaultValue="Short content" variant="short" />
            <TextareaVer2 label="Error" defaultValue="Invalid short content" variant="short" state="error" />
            <TextareaVer2 label="Disabled" defaultValue="Disabled short content" variant="short" disabled />
            <TextareaVer2 label="Read only" defaultValue="Read only short content" variant="short" readOnly />
        </div>
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    return (
        <div style={{ maxWidth: '600px', padding: '20px' }}>
            <TextareaVer2 {...args} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
    );
};

Interactive.args = {
    label: 'Interactive Label',
    placeholder: 'Type something...',
    variant: 'long',
    rows: 3,
    state: 'default',
};
