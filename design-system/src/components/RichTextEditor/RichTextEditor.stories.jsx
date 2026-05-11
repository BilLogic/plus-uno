import React, { useEffect, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
        toolbarPreset: {
            control: 'select',
            options: ['compact', 'full'],
            description:
                'compact = Figma email/default toolbar; full = extended control set',
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

export const Overview = () => (
    <div style={{ width: '100%' }}>
        <RichTextEditor placeholder="Type something..." minHeight={150} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.richTextEditor }
    }
};

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
                toolbarPreset={args.toolbarPreset}
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
    minHeight: 200,
    toolbarPreset: 'compact'
};
