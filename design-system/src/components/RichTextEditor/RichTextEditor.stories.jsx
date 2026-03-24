import React, { useState } from 'react';
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
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Editor size'
        },
        readOnly: {
            control: 'boolean',
            description: 'Read-only state'
        },
        disabled: {
            control: 'boolean',
            description: 'Disabled state'
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

export const Interactive = () => {
    const [content, setContent] = useState('<p>Initial content...</p>');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Interactive editor..."
                minHeight={200}
            />
            <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                <h6>Current Content:</h6>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{content}</pre>
            </div>
        </div>
    );
};
