import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import RichTextEditor from './RichTextEditor';

export default {
    title: 'Components/Forms and inputs/Rich text editor',
    component: RichTextEditor,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-04', kind: 'changed', summary: 'The block-style menu opens on the Dropdown menu and its rows are menu items, so it is keyboard-operable (Enter opens, arrows move, Escape closes) and the editor no longer imports react-bootstrap.' },
            { date: '2026-10-24', kind: 'changed', summary: 'Toolbar buttons hover at secondary 08 and press at 12, the block toggle at on-surface 08 and 12; focus is the 2px focus ring. The block menu selects at primary 08 and shows keyboard focus as a ring.' },
            { date: '2026-10-23', kind: 'changed', summary: 'The editing area became 120 high at least, growing with what is typed.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="small"` and `size="large"` were deprecated: they draw like `medium` and warn in development.' },
        ],
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
        <RichTextEditor label="Session notes" placeholder="Type something..." minHeight={150} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.richTextEditor }
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
                label="Session notes"
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

/** The compact toolbar's block-style menu: open, select, keyboard. */
export const BlockStyleMenu = () => (
    <div style={{ width: '100%', minHeight: 320 }}>
        <RichTextEditor label="Session notes" placeholder="Type something..." minHeight={150} />
    </div>
);
BlockStyleMenu.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const toggle = canvas.getByRole('button', { name: /Normal/ });

    // Open with a click: the four block styles are menu items, Normal is current.
    await userEvent.click(toggle);
    const heading = await body.findByRole('menuitem', { name: 'Heading 2' });
    await expect(body.getAllByRole('menuitem')).toHaveLength(4);
    await expect(body.getByRole('menuitem', { name: 'Normal' })).toHaveAttribute('aria-current', 'true');

    // Select: the menu closes and focus returns to the toggle.
    await userEvent.click(heading);
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
    await expect(toggle).toHaveFocus();

    // Keyboard: Enter opens, ArrowDown moves, Enter selects, Escape closes.
    await userEvent.keyboard('{Enter}');
    await body.findByRole('menu');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
    await userEvent.keyboard('{Enter}');
    await body.findByRole('menu');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
    await expect(toggle).toHaveFocus();
};
