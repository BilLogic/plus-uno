import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Dropdown from './Dropdown';

export default {
    title: 'Components/Forms and inputs/Dropdown',
    component: Dropdown,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-09-29', kind: 'changed', summary: 'Escape inside an open menu closed it, returned focus to the toggle once it had closed, and stopped propagating, so an enclosing Modal no longer closed on the same key.' },
            { date: '2026-09-29', kind: 'added', summary: 'Items took `href` (and `linkComponent`) to render as a link, `isToggle` to report `selected` as `aria-pressed`, `isStatic` for a row that is not a control, and `isBusy` for an item still working.' },
            { date: '2026-09-29', kind: 'fixed', summary: '`trailingIcon` became decorative (`aria-hidden`), like `leadingIcon`, so its glyph no longer leaked into the item name.' },
        ],
        docs: {
            description: {
                component: 'Dropdown component for displaying actionable lists and menus. Supports multi-select, icons, dividers, and different directions.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default'],
            description: 'Trigger color style',
            table: { category: 'Design' }
        },
        buttonText: {
            control: 'text',
            description: 'Text displayed on the dropdown toggle button',
            table: { category: 'Content' }
        },
        items: {
            table: { disable: true, category: 'Content' }
        },
        contentPreset: {
            control: 'select',
            options: ['basic', 'with-divider', 'with-icons', 'with-selection'],
            description: 'Preset menu content for the interactive demo',
            table: { category: 'Content' }
        },
        size: {
            control: 'radio',
            options: ['small', 'default', 'large'],
            description: 'Button size',
            table: { category: 'Design' }
        },
        direction: {
            control: 'select',
            options: ['dropdown', 'dropup', 'dropleft', 'dropright'],
            description: 'Direction the menu opens',
            table: { category: 'Design' }
        },
        split: {
            control: 'boolean',
            description: 'Split button style with separate action and toggle',
            table: { category: 'Design' }
        },
        fill: {
            control: 'radio',
            options: ['outline', 'ghost'],
            description: 'Trigger surface treatment (outline default per spec; ghost for minimal emphasis)',
            table: { category: 'Design' }
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

const basicItems = [
    { text: 'Action', onClick: () => console.log('Action clicked') },
    { text: 'Another action', onClick: () => console.log('Another action clicked') },
    { text: 'Something else here', onClick: () => console.log('Something else clicked') }
];

const itemsWithDivider = [
    { text: 'Action' },
    { text: 'Another action' },
    { text: 'Something else', divider: true },
    { text: 'Separated link' }
];

const itemsWithIcons = [
    { text: 'Edit', leadingIcon: 'edit' },
    { text: 'Duplicate', leadingIcon: 'copy' },
    { text: 'Archive', leadingIcon: 'archive', divider: true },
    { text: 'Delete', leadingIcon: 'trash', trailingIcon: 'exclamation-triangle' }
];

const itemsWithSelection = [
    { text: 'Option 1', selected: true },
    { text: 'Option 2' },
    { text: 'Option 3' }
];

const contentItems = [
    { text: 'Form', leadingIcon: 'file-lines', counter: 20, dropright: true },
    { text: 'Form', leadingIcon: 'file-lines', counter: 20, dropright: true },
    { text: 'Form', leadingIcon: 'file-lines', counter: 20, dropright: true }
];

const dropdownCol = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '700px' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function DropdownContentDemos() {
    return (
        <section>
            <div
                style={{
                    ...contentVariantCard,
                    padding: '28px 48px 164px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))',
                    columnGap: '96px',
                    rowGap: '24px',
                    alignItems: 'start',
                    overflow: 'visible',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Dropdown" style="primary" size="small" items={contentItems} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Split Dropdown" style="primary" size="small" split items={contentItems} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Dropdown" style="primary" size="small" items={contentItems} isOpen />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Dropdown buttonText="Split Dropdown" style="primary" size="small" split items={contentItems} isOpen />
                </div>
            </div>
        </section>
    );
}

const SEMANTIC_STYLES = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default'];

function DropdownVariantsDemos() {
    return (
        <section>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {SEMANTIC_STYLES.map((s) => (
                    <Dropdown
                        key={s}
                        buttonText={s.charAt(0).toUpperCase() + s.slice(1)}
                        style={s}
                        items={basicItems}
                    />
                ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                <Dropdown buttonText="Ghost" style="primary" fill="ghost" items={basicItems} />
            </div>
        </section>
    );
}

function DropdownSizesDemos() {
    return (
        <section>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Dropdown buttonText="Small" size="small" items={basicItems} />
                <Dropdown buttonText="Default" size="default" items={basicItems} />
                <Dropdown buttonText="Large" size="large" items={basicItems} />
            </div>
        </section>
    );
}

function DropdownLayoutDemos() {
    return (
        <>
            <section>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Dropdown buttonText="Primary split" split style="primary" items={basicItems} />
                    <Dropdown buttonText="Secondary split" split style="secondary" items={basicItems} />
                    <Dropdown buttonText="Default split" split style="default" items={basicItems} />
                    <Dropdown buttonText="Ghost split" split style="primary" fill="ghost" items={basicItems} />
                </div>
            </section>
            <section style={{ marginTop: '48px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '120px', paddingBottom: '120px' }}>
                    <Dropdown buttonText="Dropdown" direction="dropdown" items={basicItems} />
                    <Dropdown buttonText="Dropup" direction="dropup" items={basicItems} />
                    <Dropdown buttonText="Dropright" direction="dropright" items={basicItems} />
                    <Dropdown buttonText="Dropleft" direction="dropleft" items={basicItems} />
                </div>
            </section>
        </>
    );
}

export const Content = () => (
    <div style={dropdownCol}>
        <DropdownContentDemos />
    </div>
);

export const StyleVariants = () => (
    <div style={dropdownCol}>
        <DropdownVariantsDemos />
    </div>
);

export const Sizes = () => (
    <div style={dropdownCol}>
        <DropdownSizesDemos />
    </div>
);

export const Layout = () => (
    <div style={dropdownCol}>
        <DropdownLayoutDemos />
    </div>
);

export const Overview = () => (
    <div style={{ padding: '100px 24px 160px' }}>
        <Dropdown buttonText="Dropdown" style="primary" items={basicItems} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.dropdown }
    }
};

/* ------------------------------------------------------------------ Escape */

const ESCAPE_ITEMS = [{ text: 'Rename' }, { text: 'Archive' }];

/** Open with the keyboard, Tab into the menu, then Escape: closed, focus on `toggle`. */
const escapeReturnsFocus = async (canvas, toggle) => {
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const first = canvas.getByRole('button', { name: 'Rename' });
    first.focus();
    await expect(first).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('button', { name: 'Rename' }), 'the menu is gone').toBeNull();
    await expect(toggle, 'focus is back on the toggle').toHaveFocus();
};

/**
 * Escape closes the menu from inside it and returns focus to the toggle, so a
 * keyboard user is never left on an item that has disappeared.
 */
export const EscapeCloses = () => (
    <div style={{ padding: '24px 24px 160px' }}>
        <Dropdown buttonText="Actions" items={ESCAPE_ITEMS} />
    </div>
);

EscapeCloses.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await escapeReturnsFocus(canvas, canvas.getByRole('button', { name: 'Actions' }));
};

/**
 * In a split button focus goes back to the caret half, not the action half,
 * on whichever side the caret sits.
 */
export const EscapeClosesSplit = () => (
    <div style={{ display: 'flex', gap: '48px', padding: '24px 24px 160px 240px' }}>
        <Dropdown split buttonText="Save" items={ESCAPE_ITEMS} />
        <Dropdown split direction="dropleft" buttonText="Send" items={ESCAPE_ITEMS} />
    </div>
);

EscapeClosesSplit.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await escapeReturnsFocus(canvas, canvas.getByRole('button', { name: 'Save options' }));
    await escapeReturnsFocus(canvas, canvas.getByRole('button', { name: 'Send options' }));
};

/**
 * A custom toggle with nothing focusable in it, opened by a caller that
 * controls `isOpen`: Escape returns focus to what had it when the menu opened,
 * never to the page.
 */
export const EscapeClosesCustomToggle = () => {
    const [open, setOpen] = React.useState(false);
    return (
        <div style={{ display: 'flex', gap: '24px', padding: '24px 24px 160px' }}>
            <button type="button" onClick={() => setOpen(true)}>Open sections</button>
            <Dropdown toggle={<span>Sections</span>} items={ESCAPE_ITEMS} isOpen={open} onToggle={setOpen} />
        </div>
    );
};

EscapeClosesCustomToggle.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: 'Open sections' });
    opener.focus();
    await userEvent.keyboard('{Enter}');

    const first = await canvas.findByRole('button', { name: 'Rename' });
    first.focus();
    await userEvent.keyboard('{Escape}');

    await expect(canvas.queryByRole('button', { name: 'Rename' }), 'the menu is gone').toBeNull();
    await expect(opener, 'focus is back on what opened it').toHaveFocus();
};

/* ------------------------------------------------------ links and toggles */

/**
 * An item with `href` is a real link, with its trailing icon kept out of its
 * name. A `toggle` item reports `selected` as `aria-pressed`.
 */
export const LinkAndToggleItems = () => (
    <div style={{ padding: '24px 24px 200px' }}>
        <Dropdown
            buttonText="Views"
            items={[
                { text: 'Open report', href: '#report', trailingIcon: 'arrow-right' },
                { text: 'Pinned', isToggle: true, selected: true, keepOpen: true },
                { text: 'Archived', isToggle: true, selected: false, keepOpen: true },
                { text: 'Rename' },
            ]}
        />
    </div>
);

LinkAndToggleItems.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Views' }));

    const link = canvas.getByRole('link', { name: 'Open report' });
    await expect(link).toHaveAttribute('href', '#report');
    await expect(link.tabIndex).toBe(0);

    await expect(canvas.getByRole('button', { name: 'Pinned' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Archived' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('button', { name: 'Rename' }), 'a plain item is not a toggle')
        .not.toHaveAttribute('aria-pressed');
};

/**
 * A controlled caller that keeps the menu open when Escape asks to close it:
 * focus stays where it is, on the item, and does not jump to the toggle of a
 * menu that is still open.
 */
export const EscapeIgnoredWhenControlledStaysOpen = () => (
    <div style={{ padding: '24px 24px 160px' }}>
        <Dropdown buttonText="Pinned open" items={ESCAPE_ITEMS} isOpen onToggle={() => {}} />
    </div>
);

EscapeIgnoredWhenControlledStaysOpen.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: 'Rename' });
    first.focus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', { name: 'Rename' }), 'the menu is still open').toBeVisible();
    await expect(first, 'focus stays on the item').toHaveFocus();
};

/**
 * The caller refuses Escape, the person moves on, and later the caller closes
 * the menu itself. Focus stays where the person went: the refused Escape is
 * not remembered and replayed onto the toggle.
 */
export const EscapeRefusedThenParentCloses = () => {
    const [open, setOpen] = React.useState(true);
    return (
        <div style={{ display: 'flex', gap: '24px', padding: '24px 24px 160px' }}>
            <Dropdown buttonText="Held open" items={ESCAPE_ITEMS} isOpen={open} onToggle={() => {}} />
            <button type="button" onClick={() => setOpen(false)}>Close from outside</button>
        </div>
    );
};

EscapeRefusedThenParentCloses.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: 'Rename' });
    first.focus();
    await userEvent.keyboard('{Escape}');
    await expect(first, 'the refused Escape leaves focus on the item').toHaveFocus();

    const closer = canvas.getByRole('button', { name: 'Close from outside' });
    closer.focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByRole('button', { name: 'Rename' }), 'the caller closed it').toBeNull();
    await expect(closer, 'focus does not jump to the toggle').toHaveFocus();
};

export const Interactive = {
    args: {
        buttonText: 'Dropdown',
        style: 'default',
        fill: 'outline',
        size: 'default',
        direction: 'dropdown',
        split: false,
        contentPreset: 'basic'
    },
    render: (args) => (
        <div style={{ padding: '100px 50px' }}>
            <Dropdown
                {...args}
                items={{
                    'basic': basicItems,
                    'with-divider': itemsWithDivider,
                    'with-icons': itemsWithIcons,
                    'with-selection': itemsWithSelection
                }[args.contentPreset] || basicItems}
            />
        </div>
    )
};
