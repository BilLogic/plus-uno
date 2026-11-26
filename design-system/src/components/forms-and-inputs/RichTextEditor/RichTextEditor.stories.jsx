import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import RichTextEditor from './RichTextEditor';
import { LONG_SENTENCE, expectNoSilentClip, expectInsideWell } from '../../_internal/overflowPlays';

export default {
    title: 'Components/Forms and inputs/Rich text editor',
    component: RichTextEditor,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Rich text editor component with formatting toolbar. Supports bold, italic, lists, and more.'
            }
        }
    },
    argTypes: {
        children: {
            storyOnly: true,
            table: { disable: true },
        },
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: { table: { disable: true } },
        placeholder: {
            control: 'text',
            table: { category: 'Content' }
        },
        initialContent: {
            storyOnly: true,
            control: 'text',
            description: 'Starting editor content',
            table: { category: 'Content' }
        },
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            table: { category: 'Design' }
        },
        isReadOnly: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        minHeight: {
            control: 'number',
            table: { category: 'Layout' }
        },
        toolbarPreset: {
            control: 'select',
            options: ['compact', 'full'],
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
        <RichTextEditor label="Session notes" placeholder="What did you cover?" minHeight={150} />
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
        <div style={{ maxWidth: 'var(--content-max-width-reading)' }}>
            <RichTextEditor
                label="Session notes"
                spacing={args.spacing}
                isReadOnly={args.isReadOnly}
                isDisabled={args.isDisabled}
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
    placeholder: 'What did you cover?',
    initialContent: '<p>Maya K. solved three two-step equation problems.</p>',
    spacing: 'default',
    isReadOnly: false,
    isDisabled: false,
    minHeight: 200,
    toolbarPreset: 'compact'
};

/** The compact toolbar's block-style menu: open, select, keyboard. */
export const BlockStyleMenu = () => (
    <div style={{ width: '100%', paddingBottom: '200px' /* token gap: 200px */ }}>
        <RichTextEditor label="Session notes" defaultValue="<p>Reviewed linear equations and slope intercepts.</p>" minHeight={150} />
    </div>
);
BlockStyleMenu.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const editor = canvas.getByRole('textbox');
    const toggle = canvas.getByRole('button', { name: /Normal/ });
    const closed = () => waitFor(() => expect(body.queryByRole('menuitem')).toBeNull());

    // The trigger shows the standard menu angle, as DropdownMenu and PopupSelect do.
    await expect(toggle.querySelector('.fa-angle-down')).not.toBeNull();
    await expect(toggle.querySelector('.fa-arrows-up-down')).toBeNull();

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
    render: () => <RichTextEditor label="Session notes" placeholder="What did you cover?" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        await expect(area).toHaveAttribute('data-placeholder', 'What did you cover?');
        await expect(area.textContent).toBe('');
    },
};

export const Filled = {
    render: () => <RichTextEditor label="Session notes" defaultValue="<p>Worked through fractions.</p>" minHeight={150} />,
    play: async ({ canvasElement }) => {
        await expect(writing(canvasElement).textContent).toBe('Worked through fractions.');
    },
};

/** Fields, multi-line ones included, round at the 40-high control radius. */
export const BoxRadius = {
    render: () => <RichTextEditor label="Session notes" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const box = canvasElement.querySelector('.plus-rich-text-editor-box');
        await expect(px(getComputedStyle(box).borderTopLeftRadius)).toBe(tokenLength(canvasElement, '--radius-control-lg'));
        await expect(tokenLength(canvasElement, '--radius-control-lg')).toBe(10);
    },
};

export const Focused = {
    render: () => <RichTextEditor label="Session notes" placeholder="What did you cover?" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        // The ring wraps the box that holds the toolbar and the writing area.
        const editor = canvasElement.querySelector('.plus-rich-text-editor-box');
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
    render: () => <RichTextEditor label="Session notes" isReadOnly defaultValue="<p>Worked through fractions.</p>" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        await expect(area).toHaveAttribute('aria-readonly', 'true');
        await expect(area).toHaveAttribute('contenteditable', 'false');
        // Read-only is not disabled: the writing area stays in the tab order, at full contrast.
        await expect(area.tabIndex).toBe(0);
        await expect(area).not.toHaveAttribute('aria-disabled');
        await expect(getComputedStyle(area).color).toBe(tokenColor(canvasElement, '--ds-text'));
        // The box takes the read-only fill; the writing area is clear on it.
        await expect(getComputedStyle(area.closest('.plus-rich-text-editor-box')).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
    },
};

export const DisabledState = {
    render: () => <RichTextEditor label="Session notes" isDisabled defaultValue="<p>Worked through fractions.</p>" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const area = writing(canvasElement);
        await expect(area).toHaveAttribute('contenteditable', 'false');
        await expect(area).toHaveAttribute('aria-disabled', 'true');
        await expect(area.tabIndex).toBe(-1);
        await expect(within(canvasElement).getAllByRole('button').every((b) => b.disabled)).toBe(true);
        // Disabled is a change of color, not a fade, in every color mode.
        const box = area.closest('.plus-rich-text-editor-box');
        const toolbar = canvasElement.querySelector('.plus-rich-text-editor-toolbar');
        const label = canvasElement.querySelector('.plus-rich-text-editor-label');
        await expect(getComputedStyle(toolbar).opacity, 'the toolbar does not fade').toBe('1');
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(box).backgroundColor, `${mode}: fill`).toBe(token('--ds-background-disabled'));
            await expect(getComputedStyle(box).borderTopColor, `${mode}: border`).toBe(token('--ds-border-disabled'));
            await expect(getComputedStyle(area).color, `${mode}: text`).toBe(token('--ds-text-disabled'));
            await expect(getComputedStyle(label).color, `${mode}: label`).toBe(token('--ds-text-disabled'));
        });
    },
};

export const Compact = {
    render: () => <RichTextEditor label="Session notes" spacing="compact" placeholder="What did you cover?" minHeight={150} />,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-rich-text-editor')).toHaveClass('plus-rich-text-editor--compact');
    },
};

export const FullToolbar = {
    render: () => <RichTextEditor label="Session notes" toolbarPreset="full" placeholder="What did you cover?" minHeight={150} />,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-rich-text-editor')).toHaveClass('plus-rich-text-editor--full');
        await expect(within(canvasElement).getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    },
};

const boldButton = (canvasElement) => within(canvasElement).getByRole('button', { name: 'Bold' });

export const ToolbarButtonHovered = {
    render: () => <RichTextEditor label="Session notes" placeholder="What did you cover?" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const button = boldButton(canvasElement);
        button.style.transition = 'none';
        const fill = withForcedPseudo(button, ':hover', () => getComputedStyle(button).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-hovered'));
    },
};

export const ToolbarButtonPressed = {
    render: () => <RichTextEditor label="Session notes" placeholder="What did you cover?" minHeight={150} />,
    play: async ({ canvasElement }) => {
        const button = boldButton(canvasElement);
        button.style.transition = 'none';
        const fill = withForcedPseudo(button, ':active', () => getComputedStyle(button).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-pressed'));
    },
};

/** Grow: pasted text longer than the writing area wraps inside the editor's width and grows the area by whole lines; the toolbar wraps instead of scrolling sideways. */
export const Overflow = {
    render: () => (
        <div style={{ width: '300px' /* demo frame */ }}>
            <RichTextEditor
                label="Session notes"
                minHeight={100}
                defaultValue={`<p>${LONG_SENTENCE}</p><p>${LONG_SENTENCE}</p>`}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const box = canvasElement.querySelector('.plus-rich-text-editor-box');
        const content = canvasElement.querySelector('.plus-rich-text-editor-content');
        await expectNoSilentClip(canvasElement);
        await expectInsideWell(box, canvasElement.firstElementChild);
        await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth + 1);
        await expect(content).toHaveTextContent(LONG_SENTENCE);
        await expect(content.getBoundingClientRect().height).toBeGreaterThan(100);
    },
};
