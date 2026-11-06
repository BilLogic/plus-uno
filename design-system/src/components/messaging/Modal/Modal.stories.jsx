import React, { useState } from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Modal from '@/components/messaging/Modal';
import { IconButton, Button } from '@/components';

export default {
    title: 'Components/Messaging/Modal',
    component: Modal,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } }, // Reserved for inline CSS overrides, not a color variant
        title: {
            control: 'text',
            table: { category: 'Content' },
        },
        body: {
            control: 'text',
            table: { category: 'Content' },
        },
        description: {
            control: 'text',
            table: { category: 'Content' },
        },
        height: {
            control: 'select',
            options: ['hug', 'fill'],
            description: 'Hug grows to the screen less 128, then scrolls its body; Fill sits at that cap',
            table: { category: 'Layout' },
        },
        dividers: {
            control: 'boolean',
            table: { category: 'Design' },
        },
        loading: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        showCloseButton: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        type: {
            control: 'select',
            options: ['default', 'scrollable'],
            description: 'Deprecated: use height',
            table: { category: 'Design' },
        },
        showBottomButtons: {
            control: 'boolean',
            description: 'Show bottom buttons',
            table: { category: 'Behavior' },
        },
        show: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        width: {
            control: 'select',
            options: ['6-col', '8-col', '10-col'],
            description: '6 · 8 · 10 columns of the screen grid plus the modal pad; a number is a fixed width',
            table: { category: 'Layout' },
        },
        headerActions: { table: { disable: true, category: 'Development' } },
        footer: { table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        renderAs: { table: { disable: true, category: 'Development' } },
        onClose: { table: { disable: true, category: 'Development' } },
        primaryButton: { table: { disable: true, category: 'Development' } },
        secondaryButton: { table: { disable: true, category: 'Development' } },
    },
};

const col = { display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' };
const contentVariantGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
    width: '100%',
};

const scrollableBody = `${'Long body copy. '.repeat(24)}Use a scrollable modal when content exceeds the viewport.`;

const modalDocsHostStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: 800,
    borderRadius: 12,
    border: '1px solid var(--ds-border)',
    background: 'var(--ds-surface-sunken)',
    overflow: 'hidden',
    padding: 16,
};

function InlineModalCanvas({ minHeight = 400, modal }) {
    return (
        <div style={{ ...modalDocsHostStyle, minHeight }}>
            {modal}
        </div>
    );
}

function ContentVariantCanvas({ title, description, minHeight, modal }) {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-[color:var(--ds-text-subtle)] font-semibold block mb-3">
                {title}
            </span>
            <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                {description}
            </p>
            <InlineModalCanvas minHeight={minHeight} modal={modal} />
        </section>
    );
}

function ModalContentDemos() {
    return (
        <div style={contentVariantGrid}>
            <ContentVariantCanvas
                title="Default + Buttons"
                description="Use for short confirmation content with primary and secondary actions."
                minHeight={320}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body="Modal body text goes here."
                        type="default"
                        showBottomButtons
                        primaryButton={{
                            text: 'Primary',
                            appearance: 'primary',
                            onClick: () => console.log('Primary clicked'),
                        }}
                        secondaryButton={{
                            text: 'Secondary',
                            appearance: 'default',
                            onClick: () => console.log('Secondary clicked'),
                        }}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Scrollable + Buttons"
                description="Use for longer content that still needs explicit footer actions."
                minHeight={340}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body={scrollableBody}
                        type="scrollable"
                        showBottomButtons
                        primaryButton={{
                            text: 'Primary',
                            appearance: 'primary',
                            onClick: () => console.log('Primary clicked'),
                        }}
                        secondaryButton={{
                            text: 'Secondary',
                            appearance: 'default',
                            onClick: () => console.log('Secondary clicked'),
                        }}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Default + No Buttons"
                description="Use for informational content where closing from the header is sufficient."
                minHeight={320}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body="Modal body text goes here."
                        type="default"
                        showBottomButtons={false}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Scrollable + No Buttons"
                description="Use for long read-only content without footer actions."
                minHeight={360}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body={scrollableBody}
                        type="scrollable"
                        showBottomButtons={false}
                        onClose={() => {}}
                    />
                }
            />
        </div>
    );
}

function ModalLayoutDemos() {
    return (
        <>
            <InlineModalCanvas
                minHeight={360}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body="Modal body text goes here."
                        type="default"
                        showBottomButtons={false}
                        onClose={() => {}}
                    />
                }
            />

            <InlineModalCanvas
                minHeight={400}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body="Modal body text goes here."
                        type="default"
                        showBottomButtons
                        primaryButton={{
                            text: 'Confirm',
                            onClick: () => console.log('Confirm clicked'),
                        }}
                        secondaryButton={{
                            text: 'Cancel',
                            onClick: () => console.log('Cancel clicked'),
                        }}
                        onClose={() => {}}
                    />
                }
            />
        </>
    );
}

function ModalScrollableDemo() {
    return (
        <InlineModalCanvas
            minHeight={480}
            modal={
                <Modal
                    show
                    renderAs="inline"
                    title="Scrollable modal"
                    body={scrollableBody}
                    type="scrollable"
                    showBottomButtons
                    primaryButton={{
                        text: 'Primary',
                        appearance: 'primary',
                        onClick: () => console.log('Primary clicked'),
                    }}
                    secondaryButton={{
                        text: 'Secondary',
                        appearance: 'default',
                        onClick: () => console.log('Secondary clicked'),
                    }}
                    onClose={() => {}}
                />
            }
        />
    );
}

/** Three widths from the screen grid, drawn at the 1024 screen. */
function ModalSizeDemos() {
    return (
        <div style={{ ...col, '--plus-modal-screen': '1024px', width: '100%' }}>
            {['6-col', '8-col', '10-col'].map((size) => (
                <Modal
                    key={size}
                    show
                    renderAs="inline"
                    width={size}
                    title={`width="${size}"`}
                    description={`${parseInt(size, 10)} columns of the screen grid plus the modal pad.`}
                    body="Modal body text goes here."
                    secondaryButton={{ text: 'Cancel' }}
                    primaryButton={{ text: 'Save' }}
                    onClose={() => {}}
                />
            ))}
        </div>
    );
}

/** Hug and Fill against a 320 cap standing in for the screen less 128. */
function ModalHeightDemos() {
    const frame = {
        ...modalDocsHostStyle,
        '--blanket-max-height-modal': 'var(--size-2000)',
        display: 'flex',
        gap: 'var(--space-100)',
        alignItems: 'flex-start',
        minHeight: 'calc(var(--size-2000) + 2 * var(--space-100))',
    };
    return (
        <div style={frame}>
            <Modal show renderAs="inline" height="hug" title="Hug, short" body="Short content hugs." primaryButton={{ text: 'Done' }} onClose={() => {}} />
            <Modal show renderAs="inline" height="hug" title="Hug, long" body={scrollableBody.repeat(3)} primaryButton={{ text: 'Done' }} onClose={() => {}} />
            <Modal show renderAs="inline" height="fill" title="Fill" body="Fill sits at the cap." primaryButton={{ text: 'Done' }} onClose={() => {}} />
        </div>
    );
}

/** Description, header actions, dividers, no close button, loading. */
function ModalOptionDemos() {
    return (
        <div style={contentVariantGrid}>
            <Modal
                show
                renderAs="inline"
                title="Share report"
                description="People with the link can view it."
                headerActions={<IconButton appearance="subtle" spacing="compact" icon="link" label="Copy link" />}
                dividers
                body="Header actions sit before the close button; dividers rule off the header and footer."
                primaryButton={{ text: 'Done' }}
                onClose={() => {}}
            />
            <Modal show renderAs="inline" title="Uploading transcript" showCloseButton={false} body="A dialog that has to be answered drops the close button." primaryButton={{ text: 'Cancel upload' }} onClose={() => {}} />
            <Modal show renderAs="inline" loading title="Session details" body="Loaded content" showBottomButtons={false} onClose={() => {}} />
        </div>
    );
}

export const Sizes = () => <ModalSizeDemos />;

export const Heights = () => <ModalHeightDemos />;

export const Options = () => <ModalOptionDemos />;

export const Content = () => (
    <div style={col}>
        <ModalContentDemos />
    </div>
);

export const Layout = () => <div style={col}><ModalLayoutDemos /></div>;

export const Types = () => (
    <div style={col}>
        <ModalScrollableDemo />
    </div>
);

const modalDocsShellStyle = {
    minHeight: 400,
    width: '100%',
};

export const Interactive = {
    args: {
        show: true,
        title: 'Modal title',
        body: 'Modal body text goes here.',
        width: '6-col',
        height: 'hug',
        showBottomButtons: true,
    },
    render: (args) => (
        <div style={modalDocsShellStyle}>
            <Modal
                {...args}
                renderAs="inline"
                primaryButton={
                    args.showBottomButtons
                        ? {
                              text: 'Primary',
                              appearance: 'primary',
                              onClick: () => console.log('Primary clicked'),
                          }
                        : null
                }
                secondaryButton={
                    args.showBottomButtons
                        ? {
                              text: 'Secondary',
                              appearance: 'default',
                              onClick: () => console.log('Secondary clicked'),
                          }
                        : null
                }
                onClose={() => {}}
            />
        </div>
    ),
};

export const Overview = {
    ...Interactive,
    parameters: {
        docs: {
            source: { language: 'jsx', code: webAppSourceSnippets.modal }
        }
    }
};

/* ----------------------------------------------------------- confirm view */

const dialogNamed = (canvasElement, name) => within(canvasElement.ownerDocument.body).queryByRole('dialog', { name });

/**
 * A follow-up that needs confirming does not stack a second Modal: the
 * caller swaps `title`, `body` and the footer buttons in place, driven by
 * its own `confirming` state, so at most one dialog is ever open for this flow.
 */
const ConfirmViewDemo = () => {
    const [open, setOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);

    return (
        <>
            <Button text="Open settings" onClick={() => setOpen(true)} />
            <Modal
                show={open}
                width="6-col"
                title={confirming ? 'Delete account?' : 'Settings'}
                body={confirming ? 'This cannot be undone.' : 'Closing asks you to confirm.'}
                secondaryButton={confirming ? { text: 'Back', onClick: () => setConfirming(false) } : undefined}
                primaryButton={
                    confirming
                        ? { text: 'Delete', appearance: 'danger', onClick: () => setOpen(false) }
                        : { text: 'Delete account', onClick: () => setConfirming(true) }
                }
                onClose={() => setOpen(false)}
            />
        </>
    );
};

/** The named action swaps the dialog's content in place; Back swaps it back. */
export const ConfirmView = {
    render: () => <ConfirmViewDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open settings' }));
        const dialog = dialogNamed(canvasElement, 'Settings');
        await waitFor(() => expect(dialog).not.toBeNull());

        await userEvent.click(within(dialog).getByRole('button', { name: 'Delete account' }));
        // Still one dialog: the content swapped in place, named for the confirm now.
        await waitFor(() => expect(dialogNamed(canvasElement, 'Delete account?')).toBe(dialog));
        const deleteButton = within(dialog).getByRole('button', { name: 'Delete' });
        await expect(deleteButton, 'the danger action takes the danger appearance').toHaveClass('plus-btn--danger');

        // Back returns to the default content without closing the dialog.
        await userEvent.click(within(dialog).getByRole('button', { name: 'Back' }));
        await waitFor(() => expect(dialogNamed(canvasElement, 'Settings')).toBe(dialog));
    },
};

/** Escape closes the dialog from either state, and focus returns to what raised it. */
export const ConfirmViewEscape = {
    render: () => <ConfirmViewDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const openSettings = canvas.getByRole('button', { name: 'Open settings' });
        await userEvent.click(openSettings);
        await waitFor(() => expect(dialogNamed(canvasElement, 'Settings')).not.toBeNull());

        await userEvent.click(within(dialogNamed(canvasElement, 'Settings')).getByRole('button', { name: 'Delete account' }));
        await waitFor(() => expect(dialogNamed(canvasElement, 'Delete account?')).not.toBeNull());

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialogNamed(canvasElement, 'Delete account?')).toBeNull());
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus is back on the trigger').toBe(openSettings));
    },
};

/**
 * At most two overlays stack (B4): a modal and the confirm it raises. Each
 * opens from inside the one below it, the only way in once a blanket covers
 * the page, and a third raised from the confirm is refused.
 */
export const TwoOverlayLimit = {
    render: () => {
        const [firstOpen, setFirstOpen] = useState(false);
        const [secondOpen, setSecondOpen] = useState(false);
        const [thirdOpen, setThirdOpen] = useState(false);
        return (
            <>
                <Button text="Open first" onClick={() => setFirstOpen(true)} />
                <Modal
                    show={firstOpen}
                    width="6-col"
                    title="First"
                    body="One."
                    primaryButton={{ text: 'Open second', onClick: () => setSecondOpen(true) }}
                    onClose={() => setFirstOpen(false)}
                />
                <Modal
                    show={secondOpen}
                    width="6-col"
                    title="Second"
                    body="Two."
                    primaryButton={{ text: 'Open third', onClick: () => setThirdOpen(true) }}
                    onClose={() => setSecondOpen(false)}
                />
                <Modal show={thirdOpen} width="6-col" title="Third" body="At most two stack; this one is refused." onClose={() => setThirdOpen(false)} />
            </>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const hiddenDialog = (name) => body.queryByRole('dialog', { name, hidden: true });
        await userEvent.click(canvas.getByRole('button', { name: 'Open first' }));
        await waitFor(() => expect(dialogNamed(canvasElement, 'First')).not.toBeNull());
        await userEvent.click(body.getByRole('button', { name: 'Open second' }));
        await waitFor(() => expect(dialogNamed(canvasElement, 'Second')).not.toBeNull());

        await userEvent.click(body.getByRole('button', { name: 'Open third' }));
        await expect(hiddenDialog('Third'), 'a third overlay is refused').toBeNull();
        await expect(dialogNamed(canvasElement, 'Second'), 'the second dialog stays open on top').not.toBeNull();
        await expect(hiddenDialog('First'), 'the first dialog stays open underneath').not.toBeNull();

        // Topmost Escape: the second closes, the first is back in front.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(hiddenDialog('Second')).toBeNull());
        await waitFor(() => expect(dialogNamed(canvasElement, 'First')).not.toBeNull());
    },
};

/* ------------------------------------------------------------------- states */

const StateModal = () => (
    <Modal show width="6-col" title="Settings" body="Changes save when you close." onClose={() => {}} />
);
const bodyOf = (canvasElement) => within(canvasElement.ownerDocument.body);
const closeOf = async (canvasElement) => bodyOf(canvasElement).findByRole('button', { name: 'Close modal' });

/** Rest: an open dialog named by its title, with the close button at rest. */
export const Rest = {
    render: () => <StateModal />,
    play: async ({ canvasElement }) => {
        await expect(await bodyOf(canvasElement).findByRole('dialog', { name: 'Settings' })).toBeVisible();
        await expect(await closeOf(canvasElement)).toBeVisible();
    },
};

/** Hovered: the close button takes the subtle hovered ground. */
export const Hovered = {
    render: () => <StateModal />,
    play: async ({ canvasElement }) => {
        await expectHovered(canvasElement, await closeOf(canvasElement), 'subtle', 'modal close');
    },
};

/** Pressed: the close button takes the subtle pressed ground. */
export const Pressed = {
    render: () => <StateModal />,
    play: async ({ canvasElement }) => {
        await expectPressed(canvasElement, await closeOf(canvasElement), 'subtle', 'modal close');
    },
};

/** Focused: the 2px ring, 2px off the close button. */
export const Focused = {
    render: () => <StateModal />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, await closeOf(canvasElement), 'modal close');
    },
};
