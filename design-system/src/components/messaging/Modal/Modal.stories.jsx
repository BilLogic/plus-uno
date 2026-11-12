import React, { useState } from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Modal from '@/components/messaging/Modal';
import { IconButton, Button, Select } from '@/components';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Messaging/Modal dialog',
    component: Modal,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
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
        showBottomButtons: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        show: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        width: {
            control: 'select',
            options: ['6-col', '8-col', '10-col'],
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

const longBody = `${'Long body copy. '.repeat(24)}A Hug modal scrolls its own body once the content runs past the cap.`;

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
            <DemoLabel>
                {title}
            </DemoLabel>
            <p className="body-default" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
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
                title="Long + Buttons"
                description="Use for longer content that still needs explicit footer actions."
                minHeight={340}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body={longBody}
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
                        showBottomButtons={false}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Long + No Buttons"
                description="Use for long read-only content without footer actions."
                minHeight={360}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Modal title"
                        body={longBody}
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

/* ------------------------------------------------- one value per story */

/** One grid width, drawn at the 1024 screen. */
const widthStory = (size) => () => (
    <div style={{ '--plus-overlay-screen': '1024px', width: '100%' }}>
        <Modal
            show
            renderAs="inline"
            width={size}
            title={`width="${size}"`}
            body="Modal body text goes here."
            secondaryButton={{ text: 'Cancel' }}
            primaryButton={{ text: 'Save' }}
            onClose={() => {}}
        />
    </div>
);

export const Width6Col = widthStory('6-col');
Width6Col.storyName = 'Width 6-col';
export const Width8Col = widthStory('8-col');
Width8Col.storyName = 'Width 8-col';
export const Width10Col = widthStory('10-col');
Width10Col.storyName = 'Width 10-col';

/** One height against a 320 cap standing in for the screen less 128. */
const heightStory = (height, title, body) => () => (
    <div
        style={{
            ...modalDocsHostStyle,
            '--blanket-max-height-modal': 'var(--size-2000)',
            minHeight: 'calc(var(--size-2000) + 2 * var(--space-100))',
        }}
    >
        <Modal show renderAs="inline" height={height} title={title} body={body} primaryButton={{ text: 'Done' }} onClose={() => {}} />
    </div>
);

export const HeightHug = heightStory('hug', 'Hug', longBody.repeat(3));
HeightHug.storyName = 'Height hug';
export const HeightFill = heightStory('fill', 'Fill', 'Fill sits at the cap.');
HeightFill.storyName = 'Height fill';

export const HeaderOptions = () => (
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
);

export const WithoutCloseButton = () => (
    <Modal show renderAs="inline" title="Uploading transcript" showCloseButton={false} body="A dialog that has to be answered drops the close button." primaryButton={{ text: 'Cancel upload' }} onClose={() => {}} />
);

export const Loading = () => (
    <Modal show renderAs="inline" loading title="Session details" body="Loaded content" showBottomButtons={false} onClose={() => {}} />
);

export const Content = () => (
    <div style={col}>
        <ModalContentDemos />
    </div>
);

export const Layout = () => <div style={col}><ModalLayoutDemos /></div>;

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

/* ------------------------------------------------------------------- shadow */

// What a token paints as a box-shadow, resolved by the browser so a color-mode switch is covered.
const paintedShadow = (doc, token) => {
    const probe = doc.createElement('div');
    probe.style.boxShadow = `var(${token})`;
    doc.body.appendChild(probe);
    const value = getComputedStyle(probe).boxShadow;
    probe.remove();
    return value;
};

/** The Modal is the one surface on a blanket, so it draws the blocking shadow in every width. */
export const BlockingShadow = {
    render: () => (
        <div style={col}>
            {['6-col', '8-col', '10-col'].map((width) => (
                <Modal key={width} show renderAs="inline" width={width} title={`Modal ${width}`} body="Blocks the page." onClose={() => {}} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const blocking = paintedShadow(canvasElement.ownerDocument, '--ds-shadow-blocking');
        await expect(blocking, 'the two shadow tokens differ').not.toBe(paintedShadow(canvasElement.ownerDocument, '--ds-shadow-overlay'));
        for (const width of ['6-col', '8-col', '10-col']) {
            const panel = canvasElement.querySelector(`.plus-modal.plus-modal-width-${width}`);
            await expect(getComputedStyle(panel).boxShadow, `${width} Modal`).toBe(blocking);
        }
    },
};

/** A Select list opened inside a Modal keeps the overlay shadow: a smaller layer, lower than the Modal. */
export const SelectKeepsOverlayShadow = {
    render: () => (
        <Modal show width="6-col" title="Pick a subject" onClose={() => {}}>
            <Select label="Subject" options={[{ value: 'a', label: 'Algebra' }, { value: 'b', label: 'Biology' }]} placeholder="Select a subject" />
        </Modal>
    ),
    play: async ({ canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        const body = within(doc.body);
        const dialog = await body.findByRole('dialog', { name: 'Pick a subject' });
        await expect(getComputedStyle(dialog).boxShadow, 'the live Modal').toBe(paintedShadow(doc, '--ds-shadow-blocking'));

        await userEvent.click(within(dialog).getByRole('combobox'));
        const list = await body.findByRole('listbox');
        await expect(getComputedStyle(list.closest('.plus-listbox')).boxShadow, 'a Select list inside the Modal').toBe(paintedShadow(doc, '--ds-shadow-overlay'));
    },
};

/* ------------------------------------------------------------------- states */

const StateModal = () => (
    <Modal show renderAs="inline" width="6-col" title="Settings" body="Changes save when you close." onClose={() => {}} />
);
const bodyOf = (canvasElement) => within(canvasElement);
const closeOf = async (canvasElement) => bodyOf(canvasElement).findByRole('button', { name: 'Close modal' });

/** Rest: the panel with its title as the h1 and the close button at rest. Drawn inline so a docs page holds no live overlay; the dialog role is asserted in Overview and ConfirmView. */
export const Rest = {
    render: () => <StateModal />,
    play: async ({ canvasElement }) => {
        await expect(await bodyOf(canvasElement).findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
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
