import React, { useState } from 'react';
import Textarea from './Textarea';

export default {
    title: 'Forms/Textarea',
    component: Textarea,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Textarea form control allows users to enter multi-line textual inputs. The labeled textarea box supports various sizes, states, and row configurations.',
            },
        },
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Available in 3 sizes: small, medium (default), large.',
            table: { category: 'Design' },
        },
        rows: {
            control: 'number',
            description: 'Number of visible text lines (default: 3)',
            table: { category: 'Layout' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the textarea component',
            table: { category: 'Behavior' },
        },
        readOnly: {
            control: 'boolean',
            description: 'Make the textarea read-only',
            table: { category: 'Behavior' },
        },
        label: {
            control: 'text',
            description: 'Label text displayed above the textarea',
            table: { category: 'Content' },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        value: {
            control: 'text',
            description: 'Textarea value',
            table: { category: 'Content' },
        },
    },
};

const pageWrap = { maxWidth: '1200px' };

function TextareaContentDemos() {
    const [value5, setValue5] = useState('');
    const [value6, setValue6] = useState('Value');
    const [value10, setValue10] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Placeholder versus filled value (border and text weight).
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Textarea
                            id="textarea-placeholder-style"
                            label="Label"
                            placeholder="Placeholder"
                            value={value5}
                            onChange={(e) => setValue5(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Textarea
                            id="textarea-value-style"
                            label="Label"
                            placeholder="Placeholder"
                            value={value6}
                            onChange={(e) => setValue6(e.target.value)}
                        />
                    </div>
                </div>
            </section>
            <section>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    With or without a visible label.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Textarea
                            id="textarea-with-label"
                            label="Label"
                            placeholder="Placeholder"
                            value={value10}
                            onChange={(e) => setValue10(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Textarea
                            id="textarea-without-label"
                            placeholder="Placeholder"
                            value={value10}
                            onChange={(e) => setValue10(e.target.value)}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function TextareaLayoutDemos() {
    const [value7, setValue7] = useState('');
    const [value8, setValue8] = useState('');
    const [value9, setValue9] = useState('');

    return (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
                <Textarea
                    id="textarea-rows-2"
                    label="Label"
                    placeholder="Placeholder"
                    rows={2}
                    value={value7}
                    onChange={(e) => setValue7(e.target.value)}
                />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
                <Textarea
                    id="textarea-rows-3"
                    label="Label"
                    placeholder="Placeholder"
                    rows={3}
                    value={value8}
                    onChange={(e) => setValue8(e.target.value)}
                />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
                <Textarea
                    id="textarea-rows-5"
                    label="Label"
                    placeholder="Placeholder"
                    rows={5}
                    value={value9}
                    onChange={(e) => setValue9(e.target.value)}
                />
            </div>
        </div>
    );
}

function TextareaSizesDemos() {
    return (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
                <Textarea id="textarea-small" label="Label" placeholder="Placeholder" size="small" />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
                <Textarea id="textarea-medium" label="Label" placeholder="Placeholder" size="medium" />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
                <Textarea id="textarea-large" label="Label" placeholder="Placeholder" size="large" />
            </div>
        </div>
    );
}

function TextareaInteractionStatesDemos() {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('Value');
    const [value3, setValue3] = useState('');
    const [value4, setValue4] = useState('Value');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <Textarea
                    id="textarea-default-placeholder"
                    label="Label"
                    placeholder="Placeholder"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                />
                <Textarea
                    id="textarea-default-value"
                    label="Label"
                    placeholder="Placeholder"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                />
                <Textarea
                    id="textarea-focus-placeholder"
                    label="Label"
                    placeholder="Placeholder"
                    value={value3}
                    onChange={(e) => setValue3(e.target.value)}
                    autoFocus
                />
                <Textarea
                    id="textarea-focus-value"
                    label="Label"
                    placeholder="Placeholder"
                    value={value4}
                    onChange={(e) => setValue4(e.target.value)}
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <Textarea id="textarea-disabled-placeholder" label="Label" placeholder="Placeholder" disabled />
                <Textarea
                    id="textarea-disabled-value"
                    label="Label"
                    placeholder="Placeholder"
                    value="Value"
                    disabled
                />
                <Textarea id="textarea-readonly-placeholder" label="Label" placeholder="Placeholder" readOnly />
                <Textarea
                    id="textarea-readonly-value"
                    label="Label"
                    placeholder="Placeholder"
                    value="Value"
                    readOnly
                />
            </div>
        </div>
    );
}

export const Content = () => (
    <div style={pageWrap}>
        <TextareaContentDemos />
    </div>
);

export const Layout = () => (
    <div style={pageWrap}>
        <TextareaLayoutDemos />
    </div>
);

export const Sizes = () => (
    <div style={pageWrap}>
        <TextareaSizesDemos />
    </div>
);

export const InteractionStates = () => (
    <div style={pageWrap}>
        <TextareaInteractionStatesDemos />
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    return (
        <div style={{ maxWidth: '600px' }}>
            <Textarea
                id="textarea-interactive"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                size={args.size}
                rows={args.rows}
                disabled={args.disabled}
                readOnly={args.readOnly}
                label={args.label}
                placeholder={args.placeholder}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium',
    rows: 3,
    disabled: false,
    readOnly: false,
    label: 'Label',
    placeholder: 'Placeholder',
    value: '',
};
