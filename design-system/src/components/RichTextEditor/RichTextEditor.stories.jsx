import React, { useEffect, useState } from 'react';
import RichTextEditor from './RichTextEditor';

export default {
    title: 'Components/RichTextEditor',
    component: RichTextEditor,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Rich text editor component with formatting toolbar. Supports bold, italic, lists, and more.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' }
        },
        initialContent: {
            control: 'text',
            description: 'Starting editor content',
            table: { category: 'Content' }
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Editor size',
            table: { category: 'Design' }
        },
        readOnly: {
            control: 'boolean',
            description: 'Read-only state',
            table: { category: 'Behavior' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disabled state',
            table: { category: 'Behavior' }
        },
        minHeight: {
            control: 'number',
            description: 'Minimum editor height',
            table: { category: 'Layout' }
        },
        value: {
            table: { disable: true, category: 'Development' }
        },
        defaultValue: {
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '32px' };

function RichTextEditorContentDemo() {
    return (
        <section>
            <h5>Default (medium)</h5>
            <RichTextEditor
                placeholder="Type something..."
                minHeight={150}
            />
        </section>
    );
}

function RichTextEditorSizesDemos() {
    return (
        <section>
            <h5>Sizes</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <RichTextEditor
                    size="small"
                    placeholder="Small editor..."
                    defaultValue="<p>Small editor content</p>"
                    minHeight={100}
                />
                <RichTextEditor
                    size="large"
                    placeholder="Large editor..."
                    defaultValue="<p>Large editor content</p>"
                    minHeight={200}
                />
            </div>
        </section>
    );
}

function RichTextEditorInteractionStatesDemos() {
    return (
        <section>
            <h5>Read-only and disabled</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <RichTextEditor
                    readOnly
                    defaultValue="<p>Read-only content cannot be edited.</p>"
                    minHeight={120}
                />
                <RichTextEditor
                    disabled
                    placeholder="Disabled editor"
                    minHeight={120}
                />
            </div>
        </section>
    );
}

export const Content = () => (
    <div style={col}>
        <RichTextEditorContentDemo />
    </div>
);

export const Sizes = () => (
    <div style={col}>
        <RichTextEditorSizesDemos />
    </div>
);

export const InteractionStates = () => (
    <div style={col}>
        <RichTextEditorInteractionStatesDemos />
    </div>
);

export const Overview = () => (
    <div style={col}>
        <RichTextEditorContentDemo />
        <RichTextEditorSizesDemos />
        <RichTextEditorInteractionStatesDemos />
    </div>
);

export const Interactive = (args) => {
    const [content, setContent] = useState(args.initialContent);

    useEffect(() => {
        setContent(args.initialContent);
    }, [args.initialContent]);

    return (
        <div style={{ maxWidth: '880px' }}>
            <RichTextEditor
                size={args.size}
                readOnly={args.readOnly}
                disabled={args.disabled}
                placeholder={args.placeholder}
                minHeight={args.minHeight}
                value={content}
                onChange={setContent}
            />
        </div>
    );
};
Interactive.args = {
    placeholder: 'Interactive editor...',
    initialContent: '<p>Initial content...</p>',
    size: 'medium',
    readOnly: false,
    disabled: false,
    minHeight: 200
};
