import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import RichTextEditor from './RichTextEditor';

export default {
    title: 'Components/Forms and inputs/Rich text editor',
    component: RichTextEditor,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-04', kind: 'changed', summary: '`size` became `spacing` (`default` or `compact`), the name every other field uses; the small and large sizes are gone.' },
            { date: '2026-11-04', kind: 'changed', summary: 'The block-style menu opens on the Dropdown menu and its rows are menu items, so it is keyboard-operable (Enter opens, arrows move, Escape closes) and the editor no longer imports react-bootstrap.' },
            { date: '2026-10-24', kind: 'changed', summary: 'Toolbar buttons hover at secondary 08 and press at 12, the block toggle at on-surface 08 and 12; focus is the 2px focus ring. The block menu selects at primary 08 and shows keyboard focus as a ring.' },
            { date: '2026-10-23', kind: 'changed', summary: 'The editing area became 120 high at least, growing with what is typed.' },
            { date: '2026-10-23', kind: 'deprecated', summary: 'The `small` and `large` sizes were deprecated: they draw like `medium` and warn in development.' },
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
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            description: 'Editor spacing',
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
        <div style={{ maxWidth: 'var(--size-5400)' }}>
            <RichTextEditor
                label="Session notes"
                spacing={args.spacing}
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
    spacing: 'default',
    readOnly: false,
    disabled: false,
    minHeight: 200,
    toolbarPreset: 'compact'
};

/** The compact toolbar's block-style menu: open, select, keyboard. */
export const BlockStyleMenu = () => (
    <div style={{ width: '100%', paddingBottom: 200 }}>
        <RichTextEditor label="Session notes" defaultValue="<p>Hello</p>" minHeight={150} />
    </div>
);
BlockStyleMenu.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const editor = canvas.getByRole('textbox');
    const toggle = canvas.getByRole('button', { name: /Normal/ });
    const closed = () => waitFor(() => expect(body.queryByRole('menuitem')).toBeNull());

    // Open with a click: four block styles as menu items, Normal is current.
    await userEvent.click(editor);
    await userEvent.click(toggle);
    const heading = await body.findByRole('menuitem', { name: 'Heading 2' });
    await expect(body.getAllByRole('menuitem')).toHaveLength(4);
    await expect(body.getByRole('menuitem', { name: 'Normal' })).toHaveAttribute('aria-current', 'true');

    // Select: the menu closes and the block style applies.
    await userEvent.click(heading);
    await closed();
    await waitFor(() => expect(canvas.getByRole('button', { name: /Heading 2/ })).toBeInTheDocument());

    // Keyboard: Enter opens, arrows move between items, Enter selects, Escape closes.
    const reopened = canvas.getByRole('button', { name: /Heading 2/ });
    reopened.focus();
    await userEvent.keyboard('{Enter}');
    const first = await body.findByRole('menuitem', { name: 'Normal' });
    first.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(body.getByRole('menuitem', { name: 'Heading 1' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await closed();
    await waitFor(() => expect(canvas.getByRole('button', { name: /Heading 1/ })).toBeInTheDocument());

    canvas.getByRole('button', { name: /Heading 1/ }).focus();
    await userEvent.keyboard('{Enter}');
    await body.findByRole('menuitem', { name: 'Normal' });
    await userEvent.keyboard('{Escape}');
    await closed();
};

/** One story per state, for the Examples tab. */
const writing = (canvasElement) => within(canvasElement).getByRole('textbox');

export const Empty = {
    render: () => <RichTextEditor label="Session notes" placeholder="Type something..." minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        await expect(area).toHaveAttribute('data-placeholder', 'Type something...');
        await expect(area.textContent).toBe('');
    },
};

export const Filled = {
    render: () => <RichTextEditor label="Session notes" defaultValue="<p>Worked through fractions.</p>" minHeight={150} />,
    play: async ({ canvasElement }) => {
        await expect(writing(canvasElement).textContent).toBe('Worked through fractions.');
    },
};

export const Focused = {
    render: () => <RichTextEditor label="Session notes" placeholder="Type something..." minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        const editor = canvasElement.querySelector('.plus-rich-text-editor');
        editor.style.transition = 'none';
        area.focus({ focusVisible: true });
        const style = getComputedStyle(editor);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        area.blur();
    },
};

export const ReadOnly = {
    render: () => <RichTextEditor label="Session notes" readOnly defaultValue="<p>Worked through fractions.</p>" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        await expect(area).toHaveAttribute('aria-readonly', 'true');
        await expect(area).toHaveAttribute('contenteditable', 'false');
        await expect(getComputedStyle(area).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
    },
};

export const DisabledState = {
    render: () => <RichTextEditor label="Session notes" disabled defaultValue="<p>Worked through fractions.</p>" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        await expect(area).toHaveAttribute('contenteditable', 'false');
        await expect(getComputedStyle(area).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await expect(within(canvasElement).getAllByRole('button').every((b) => b.disabled)).toBe(true);
    },
};

export const Compact = {
    render: () => <RichTextEditor label="Session notes" spacing="compact" placeholder="Type something..." minHeight={150} />,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-rich-text-editor')).toHaveClass('plus-rich-text-editor--compact');
    },
};

export const FullToolbar = {
    render: () => <RichTextEditor label="Session notes" toolbarPreset="full" placeholder="Type something..." minHeight={150} />,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-rich-text-editor')).toHaveClass('plus-rich-text-editor--full');
        await expect(within(canvasElement).getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    },
};

const boldButton = (canvasElement) => within(canvasElement).getByRole('button', { name: 'Bold' });

export const ToolbarButtonHovered = {
    render: () => <RichTextEditor label="Session notes" placeholder="Type something..." minHeight={150} />,
    play: async ({ canvasElement }) => {
        const button = boldButton(canvasElement);
        button.style.transition = 'none';
        const fill = withForcedPseudo(button, ':hover', () => getComputedStyle(button).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-hovered'));
    },
};

export const ToolbarButtonPressed = {
    render: () => <RichTextEditor label="Session notes" placeholder="Type something..." minHeight={150} />,
    play: async ({ canvasElement }) => {
        const button = boldButton(canvasElement);
        button.style.transition = 'none';
        const fill = withForcedPseudo(button, ':active', () => getComputedStyle(button).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-pressed'));
    },
};
