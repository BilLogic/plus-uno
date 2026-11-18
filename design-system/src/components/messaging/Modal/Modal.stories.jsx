import React, { useState } from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectOverlayExit, settleAnimations, withReducedMotion } from '@/storybook-docs/lib/overlay-motion-plays';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { Modal, MODAL_WIDTHS } from '@/components';
import { FooterActions, IconButton, Button, Select } from '@/components';
import { Do, Dont, DoDont } from '@/storybook-docs/foundation-blocks.jsx';
import { footerTracks } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Messaging/Modal',
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

const col = { display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)', alignItems: 'flex-start' };
const contentVariantGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' /* token gap: 360px */,
    gap: 'var(--section-stack-lg)',
    width: '100%',
};

const longBody =
    'Review the session summary before publishing it to the student profile. Note which two-step equation problems Maya K. solved on her own, which steps still needed a prompt, and which practice set is assigned for Thursday at 4:00 PM ET at Lincoln Middle. Families and lead tutors read this note together before the next check-in. ' +
    'A Hug modal scrolls its own body once the content runs past the cap.';

const modalDocsHostStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '800px' /* token gap: 800px */,
    borderRadius: 'var(--radius-xl)',
    border: 'var(--border-width-default) solid var(--ds-border)',
    background: 'var(--ds-surface-sunken)',
    overflow: 'hidden',
    padding: 'var(--pad-x-lg)',
};

function InlineModalCanvas({ minHeight = 'var(--width-2500)', modal }) {
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
            <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
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
                minHeight="var(--height-2000)"
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Publish session notes?"
                        body="Families can view published notes on the student profile."
                        showBottomButtons
                        primaryButton={{
                            text: 'Publish notes',
                            appearance: 'primary',
                            onClick: () => console.log('Publish notes clicked'),
                        }}
                        secondaryButton={{
                            text: 'Keep draft',
                            appearance: 'default',
                            onClick: () => console.log('Keep draft clicked'),
                        }}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Long + Buttons"
                description="Use for longer content that still needs explicit footer actions."
                minHeight={'340px' /* token gap: 340px */}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Session summary guidelines"
                        body={longBody}
                        showBottomButtons
                        primaryButton={{
                            text: 'Publish notes',
                            appearance: 'primary',
                            onClick: () => console.log('Publish notes clicked'),
                        }}
                        secondaryButton={{
                            text: 'Keep draft',
                            appearance: 'default',
                            onClick: () => console.log('Keep draft clicked'),
                        }}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Default + No Buttons"
                description="Use for informational content where closing from the header is sufficient."
                minHeight="var(--height-2000)"
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Session notes saved"
                        body="Your draft for Maya K. is saved to this device."
                        showBottomButtons={false}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Long + No Buttons"
                description="Use for long read-only content without footer actions."
                minHeight={'360px' /* token gap: 360px */}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Tutoring session checklist"
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
                minHeight={'360px' /* token gap: 360px */}
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Session details"
                        body="Thursday, 4:00 PM ET with Maya K. at Lincoln Middle."
                        showBottomButtons={false}
                        onClose={() => {}}
                    />
                }
            />

            <InlineModalCanvas
                minHeight="var(--width-2500)"
                modal={
                    <Modal
                        show
                        renderAs="inline"
                        title="Publish session plan?"
                        body="Students and families see updated goals right away."
                        showBottomButtons
                        primaryButton={{
                            text: 'Confirm',
                            onClick: () => console.log('Confirm clicked'),
                        }}
                        secondaryButton={{
                            text: 'Discard',
                            onClick: () => console.log('Discard clicked'),
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
    <div style={{ '--plus-overlay-screen': '1024px' /* token gap: 1024px */, width: '100%' }}>
        <Modal
            show
            renderAs="inline"
            width={size}
            title={`width="${size}"`}
            body="Review the session plan and goals before sharing with Maya K.'s family."
            secondaryButton={{ text: 'Discard' }}
            primaryButton={{ text: 'Save' }}
            onClose={() => {}}
        />
    </div>
);

export const Width4Col = widthStory('4-col');
Width4Col.storyName = 'Width 4-col';
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
            '--blanket-max-height-modal': 'var(--height-2000)',
            minHeight: 'calc(var(--height-2000) + 2 * var(--section-stack-md))',
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
    <Modal show renderAs="inline" loading title="Session details" body="Session notes and practice sets for Thursday at 4:00 PM ET." showBottomButtons={false} onClose={() => {}} />
);

export const Content = () => (
    <div style={col}>
        <ModalContentDemos />
    </div>
);

export const Layout = () => <div style={col}><ModalLayoutDemos /></div>;

const modalDocsShellStyle = {
    minHeight: 'var(--width-2500)',
    width: '100%',
};

export const Interactive = {
    args: {
        show: true,
        title: 'Publish session notes?',
        body: 'Families can view published notes on the student profile.',
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
                              text: 'Publish notes',
                              appearance: 'primary',
                              onClick: () => console.log('Publish notes clicked'),
                          }
                        : null
                }
                secondaryButton={
                    args.showBottomButtons
                        ? {
                              text: 'Keep draft',
                              appearance: 'default',
                              onClick: () => console.log('Keep draft clicked'),
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
 * A Modal never opens on another Modal. One raised from inside the open Modal
 * stays closed and calls its `onClose`, so its owner's state says closed; the
 * open Modal confirms inside itself instead.
 */
export const ModalOverModalRefused = {
    render: () => {
        const [firstOpen, setFirstOpen] = useState(false);
        const [secondOpen, setSecondOpen] = useState(false);
        return (
            <>
                <Button text="Open session" onClick={() => setFirstOpen(true)} />
                <Modal
                    show={firstOpen}
                    width="6-col"
                    title="Session details"
                    body="Review Thursday's lesson plan with Maya K."
                    primaryButton={{ text: 'Delete session', onClick: () => setSecondOpen(true) }}
                    onClose={() => setFirstOpen(false)}
                />
                <Modal show={secondOpen} width="6-col" title="Confirm delete" body="A Modal never opens on another Modal." onClose={() => setSecondOpen(false)} />
            </>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const hiddenDialog = (name) => body.queryByRole('dialog', { name, hidden: true });
        const warn = console.warn;
        console.warn = () => {};
        try {
            await userEvent.click(canvas.getByRole('button', { name: 'Open session' }));
            await waitFor(() => expect(dialogNamed(canvasElement, 'Session details')).not.toBeNull());

            await userEvent.click(body.getByRole('button', { name: 'Delete session' }));
            await expect(hiddenDialog('Confirm delete'), 'a Modal over a Modal is refused').toBeNull();
            await expect(dialogNamed(canvasElement, 'Session details'), 'the first Modal stays open').not.toBeNull();
            await expect(canvasElement.ownerDocument.querySelectorAll('.plus-pattern-blanket').length, 'one Blanket').toBe(1);
        } finally {
            console.warn = warn;
        }
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
            {MODAL_WIDTHS.map((width) => (
                <Modal key={width} show renderAs="inline" width={width} title={`Session review (${width})`} body="Confirm before removing this session from the schedule." onClose={() => {}} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const blocking = paintedShadow(canvasElement.ownerDocument, '--ds-shadow-blocking');
        await expect(blocking, 'the two shadow tokens differ').not.toBe(paintedShadow(canvasElement.ownerDocument, '--ds-shadow-overlay'));
        for (const width of MODAL_WIDTHS) {
            const panel = canvasElement.querySelector(`.plus-modal.plus-modal-width-${width}`);
            await expect(getComputedStyle(panel).boxShadow, `${width} Modal`).toBe(blocking);
        }
    },
};

/** A Select list opened inside a Modal keeps the overlay shadow: a smaller layer, lower than the Modal. */
export const SelectKeepsOverlayShadow = {
    render: () => (
        <Modal show width="6-col" title="Pick a site" onClose={() => {}}>
            <Select label="Site" options={[{ value: 'a', label: 'Lincoln Middle' }, { value: 'b', label: 'North High' }]} placeholder="Select a site" />
        </Modal>
    ),
    play: async ({ canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        const body = within(doc.body);
        const dialog = await body.findByRole('dialog', { name: 'Pick a site' });
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
const closeOf = async (canvasElement) => bodyOf(canvasElement).findByRole('button', { name: 'Close' });

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

HeaderOptions.play = async ({ canvasElement }) => {
    await expect(getComputedStyle(canvasElement.querySelector('.plus-modal')).borderTopLeftRadius, 'Modal radius is 16').toBe('16px');
    await expect(getComputedStyle(canvasElement.querySelector('.plus-modal-footer')).borderBottomLeftRadius, 'footer inner corners are square').toBe('0px');
};

/** Footer actions (r5): 4-track placement inside Modal padding, spacious (48) fit buttons, no Cancel. */
export const FooterLayouts = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', '--plus-overlay-screen': '1024px' /* token gap: 1024px */, width: '100%' }}>
            <Modal
                show
                renderAs="inline"
                width="6-col"
                data-testid="modal-footer-one"
                title="Session summary ready"
                body="Parents can view the published summary on the session card."
                primaryButton={{ text: 'Done' }}
                onClose={() => {}}
            />
            <Modal
                show
                renderAs="inline"
                width="6-col"
                data-testid="modal-footer-two"
                title="Unsaved session notes"
                body="Closing now drops your edits to Jordan's session."
                secondaryButton={{ text: 'Discard' }}
                primaryButton={{ text: 'Save notes' }}
                onClose={() => {}}
            />
            <Modal
                show
                renderAs="inline"
                width="8-col"
                data-testid="modal-footer-leading"
                title="Edit session plan"
                body="Update the lesson goals before sharing with the family."
                footer={(
                    <FooterActions>
                        <Button appearance="subtle" text="Skip for now" />
                        <Button text="Save draft" />
                        <Button appearance="primary" text="Publish plan" />
                    </FooterActions>
                )}
                onClose={() => {}}
            />
            <Modal
                show
                renderAs="inline"
                width="6-col"
                data-testid="modal-footer-destructive"
                title="Delete session recording?"
                body="The recording is removed permanently. Archiving hides it from students while keeping supervisor access."
                secondaryButton={{ text: 'Archive instead' }}
                primaryButton={{ text: 'Delete recording', appearance: 'danger' }}
                onClose={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const close = (a, b) => Math.abs(a - b) <= 1.5;

        const oneModal = canvas.getByTestId('modal-footer-one');
        const oneFooter = oneModal.querySelector('.plus-footer-actions');
        const oneTracks = footerTracks(oneFooter);
        const done = within(oneModal).getByRole('button', { name: 'Done' });
        await expect(close(done.getBoundingClientRect().left, oneTracks.span(3, 4).left), 'single Modal button starts at track 3').toBe(true);
        await expect(close(done.getBoundingClientRect().height, 48), 'Modal footer button draws 48 high').toBe(true);

        const twoModal = canvas.getByTestId('modal-footer-two');
        const twoFooter = twoModal.querySelector('.plus-footer-actions');
        const twoTracks = footerTracks(twoFooter);
        const discard = within(twoModal).getByRole('button', { name: 'Discard' });
        const save = within(twoModal).getByRole('button', { name: 'Save notes' });
        await expect(close(discard.getBoundingClientRect().left, twoTracks.span(1, 2).left), 'secondary starts at track 1').toBe(true);
        await expect(close(save.getBoundingClientRect().left, twoTracks.span(3, 4).left), 'primary starts at track 3').toBe(true);

        const leadingModal = canvas.getByTestId('modal-footer-leading');
        const leadingFooter = leadingModal.querySelector('.plus-footer-actions');
        const leadingTracks = footerTracks(leadingFooter);
        const skip = within(leadingModal).getByRole('button', { name: 'Skip for now' });
        const draft = within(leadingModal).getByRole('button', { name: 'Save draft' });
        await expect(close(skip.getBoundingClientRect().left, leadingTracks.box.left), 'leading subtle button hugs left edge').toBe(true);
        await expect(close(draft.getBoundingClientRect().left, leadingTracks.track(3).left), 'filled buttons sit in tracks 3 and 4').toBe(true);

        const destructiveModal = canvas.getByTestId('modal-footer-destructive');
        const del = within(destructiveModal).getByRole('button', { name: 'Delete recording' });
        await expect(del).toHaveClass('plus-btn--danger');
    },
};

const narrowPairScreen = { '--plus-overlay-screen': 'var(--width-3000)', width: '100%' };

/** Size the Modal to its content with a step of MODAL_WIDTHS. */
export const SizeToContent = {
    render: () => (
        <DoDont>
            <Do caption="The narrowest step for a short question.">
                <div style={narrowPairScreen}>
                    <Modal
                        show
                        renderAs="inline"
                        width="6-col"
                        title="Remove this session?"
                        body="The student is told it was canceled."
                        secondaryButton={{ text: 'Keep session' }}
                        primaryButton={{ text: 'Remove', appearance: 'danger' }}
                        onClose={() => {}}
                    />
                </div>
            </Do>
            <Dont caption="The widest step around one sentence.">
                <div style={narrowPairScreen}>
                    <Modal
                        show
                        renderAs="inline"
                        width="10-col"
                        title="Remove this session?"
                        body="The student is told it was canceled."
                        secondaryButton={{ text: 'Keep session' }}
                        primaryButton={{ text: 'Remove', appearance: 'danger' }}
                        onClose={() => {}}
                    />
                </div>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('heading', { name: 'Remove this session?' })).toHaveLength(2);
        await expect(canvas.getAllByRole('button', { name: 'Remove' })).toHaveLength(2);
    },
};

function ModalMotionDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button text="Open session modal" onClick={() => setOpen(true)} />
            <Modal
                show={open}
                width="6-col"
                title="Publish session notes?"
                body="Families can view published notes on the student profile."
                secondaryButton={{ text: 'Keep draft', onClick: () => setOpen(false) }}
                primaryButton={{ text: 'Publish notes', onClick: () => setOpen(false) }}
                onClose={() => setOpen(false)}
            />
        </>
    );
}

export const MotionOpenAndClose = {
    render: () => <ModalMotionDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const docBody = canvasElement.ownerDocument.body;
        await userEvent.click(canvas.getByRole('button', { name: 'Open session modal' }));
        const dialog = await within(docBody).findByRole('dialog', { name: 'Publish session notes?' });
        await expect(getComputedStyle(dialog).animationName, 'Modal scales in on open').toContain('plus-overlay-scale-in');
        await settleAnimations(docBody);

        await expectOverlayExit(dialog, () => fireEvent.keyDown(dialog, { key: 'Escape' }), false);
        await settleAnimations(docBody);
    },
};

export const MotionReduced = {
    decorators: [withReducedMotion],
    render: () => <ModalMotionDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const docBody = canvasElement.ownerDocument.body;
        await userEvent.click(canvas.getByRole('button', { name: 'Open session modal' }));
        const dialog = await within(docBody).findByRole('dialog', { name: 'Publish session notes?' });
        await expect(dialog).toHaveAttribute('data-reduced', 'true');
        await expect(getComputedStyle(dialog).animationName).toBe('none');
        await settleAnimations(docBody);

        await expectOverlayExit(dialog, () => fireEvent.keyDown(dialog, { key: 'Escape' }), true);
    },
};
