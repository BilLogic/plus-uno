import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

export default {
    title: 'Components/RichTextEditor',
    component: RichTextEditor,
    tags: ['autodocs'],
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

const Template = (args) => <RichTextEditor {...args} />;

export const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h5>Default (Medium)</h5>
                <RichTextEditor
                    placeholder="Type something..."
                    minHeight={150}
                />
            </section>

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
        </div>
    );
};

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
