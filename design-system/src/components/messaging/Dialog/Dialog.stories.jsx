import React from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expect, userEvent, within } from 'storybook/test';
import { Button, Dialog, DIALOG_WIDTHS, DIALOG_WIDTH_PX, FooterActions, IconButton } from '@/components';
import { Do, Dont, DoDont } from '@/storybook-docs/foundation-blocks.jsx';
import { FigureScreen } from '@/storybook-docs/ds-docs-layout.jsx';
import { footerTracks } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Messaging/Dialog',
    component: Dialog,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
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
        width: {
            // The prop also takes a number or a CSS length; the options are the named widths.
            optionsUnchecked: true,
            control: 'select',
            options: DIALOG_WIDTHS,
            table: { category: 'Layout' },
        },
        header: { table: { disable: true, category: 'Development' } },
        headerActions: { table: { disable: true, category: 'Development' } },
        footer: { table: { disable: true, category: 'Development' } },
        tabs: { table: { disable: true, category: 'Development' } },
        activeTab: { table: { disable: true, category: 'Development' } },
        defaultActiveTab: { table: { disable: true, category: 'Development' } },
        onTabChange: { table: { disable: true, category: 'Development' } },
        ariaLabel: { table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        onClose: { table: { disable: true, category: 'Development' } },
        primaryButton: { table: { disable: true, category: 'Development' } },
        secondaryButton: { table: { disable: true, category: 'Development' } },
    },
};

const col = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-2xl)', alignItems: 'flex-start' };
const contentVariantGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' /* token gap: 360px */,
    gap: 'var(--stack-2xl) var(--inline-2xl)',
    width: '100%',
};

const longBody =
    'Review the session summary before publishing it to the student profile. Note which two-step equation problems Maya K. solved on her own, which steps still needed a prompt, and which practice set is assigned for Thursday at 4:00 PM ET at Lincoln Middle. Families and lead tutors read this note together before the next check-in. ' +
    'A Hug dialog scrolls its own body once the content runs past the cap.';

const dialogDocsHostStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '800px' /* token gap: 800px */,
    borderRadius: 'var(--radius-xl)',
    border: 'var(--border-width-default) solid var(--ds-border)',
    background: 'var(--ds-surface-sunken)',
    overflow: 'hidden',
    padding: 'var(--pad-x-lg)',
};

function InlineDialogCanvas({ minHeight = 'var(--width-2500)', dialog }) {
    return (
        <div style={{ ...dialogDocsHostStyle, minHeight }}>
            {dialog}
        </div>
    );
}

function ContentVariantCanvas({ title, description, minHeight, dialog }) {
    return (
        <section>
            <DemoLabel>
                {title}
            </DemoLabel>
            <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                {description}
            </p>
            <InlineDialogCanvas minHeight={minHeight} dialog={dialog} />
        </section>
    );
}

function DialogContentDemos() {
    return (
        <div style={contentVariantGrid}>
            <ContentVariantCanvas
                title="Default + Buttons"
                description="Use for short confirmation content with primary and secondary actions."
                minHeight="var(--height-2000)"
                dialog={
                    <Dialog
                        title="Publish session notes?"
                        body="Families can view published notes on the student profile."
                        showBottomButtons
                        primaryButton={{
                            text: 'Publish notes',
                            appearance: 'primary',
                            onClick: () => {},
                        }}
                        secondaryButton={{
                            text: 'Keep draft',
                            appearance: 'default',
                            onClick: () => {},
                        }}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Long + Buttons"
                description="Use for longer content that still needs explicit footer actions."
                minHeight={'340px' /* token gap: 340px */}
                dialog={
                    <Dialog
                        title="Session summary guidelines"
                        body={longBody}
                        showBottomButtons
                        primaryButton={{
                            text: 'Publish notes',
                            appearance: 'primary',
                            onClick: () => {},
                        }}
                        secondaryButton={{
                            text: 'Keep draft',
                            appearance: 'default',
                            onClick: () => {},
                        }}
                        onClose={() => {}}
                    />
                }
            />
            <ContentVariantCanvas
                title="Default + No Buttons"
                description="Use for informational content where closing from the header is sufficient."
                minHeight="var(--height-2000)"
                dialog={
                    <Dialog
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
                dialog={
                    <Dialog
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

function DialogLayoutDemos() {
    return (
        <>
            <InlineDialogCanvas
                minHeight={'360px' /* token gap: 360px */}
                dialog={
                    <Dialog
                        title="Session details"
                        body="Thursday, 4:00 PM ET with Maya K. at Lincoln Middle."
                        showBottomButtons={false}
                        onClose={() => {}}
                    />
                }
            />

            <InlineDialogCanvas
                minHeight="var(--width-2500)"
                dialog={
                    <Dialog
                        title="Publish session plan?"
                        body="Students and families see updated goals right away."
                        showBottomButtons
                        primaryButton={{
                            text: 'Confirm',
                            onClick: () => {},
                        }}
                        secondaryButton={{
                            text: 'Discard',
                            onClick: () => {},
                        }}
                        onClose={() => {}}
                    />
                }
            />
        </>
    );
}

/* ------------------------------------------------- one value per story */

const widthStory = (size) => ({
    render: () => (
        <div style={{ '--plus-overlay-screen': '1024px' /* token gap: 1024px */, width: '100%' }}>
            <Dialog
                width={size}
                title={`width="${size}"`}
                body="Review the session plan and goals before sharing with Maya K.'s family."
                secondaryButton={{ text: 'Discard' }}
                primaryButton={{ text: 'Save' }}
                onClose={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('.plus-dialog');
        const expected = DIALOG_WIDTH_PX[size][1];
        await expect(panel).toHaveClass(`plus-dialog-width-${size}`);
        await expect(Math.round(panel.getBoundingClientRect().width), `${size} at 1024 resolves to ${expected}px`).toBe(expected);
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { level: 1, name: `width="${size}"` })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    },
});

export const Width4Col = widthStory('4-col');
Width4Col.storyName = 'Width 4-col';
export const Width6Col = widthStory('6-col');
Width6Col.storyName = 'Width 6-col';
export const Width8Col = widthStory('8-col');
Width8Col.storyName = 'Width 8-col';
export const Width10Col = widthStory('10-col');
Width10Col.storyName = 'Width 10-col';

const heightStory = (height, title, body) => ({
    render: () => (
        <div style={{ '--plus-overlay-screen': '1024px' /* token gap: 1024px */, '--dialog-max-height': 'var(--height-2000)', width: '100%' }}>
            <Dialog height={height} title={title} body={body} primaryButton={{ text: 'Done' }} onClose={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('.plus-dialog');
        await expect(panel).toHaveClass(`plus-dialog-height-${height}`);
        await expect(panel.getBoundingClientRect().height).toBeLessThanOrEqual(321);
    },
});

export const HeightHug = heightStory('hug', 'Hug', longBody.repeat(3));
HeightHug.storyName = 'Height hug';
export const HeightFill = heightStory('fill', 'Fill', 'Fill sits at the cap.');
HeightFill.storyName = 'Height fill';

export const HeaderOptions = {
    render: () => (
        <Dialog
            title="Share report"
            description="People with the link can view it."
            headerActions={<IconButton appearance="subtle" spacing="compact" icon="link" label="Copy link" />}
            dividers
            body="Header actions sit before the close button; dividers rule off the header and footer."
            primaryButton={{ text: 'Done' }}
            onClose={() => {}}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { level: 1, name: 'Share report' })).toBeInTheDocument();
        await expect(canvas.getByText('People with the link can view it.')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
        await expect(canvasElement.querySelectorAll('.plus-dialog-divider')).toHaveLength(2);
        await expect(getComputedStyle(canvasElement.querySelector('.plus-dialog')).borderTopLeftRadius, 'Dialog radius is 16').toBe('16px');
        await expect(getComputedStyle(canvasElement.querySelector('.plus-dialog')).paddingTop, 'Dialog pad is 20 on every side').toBe('20px');
        await expect(getComputedStyle(canvasElement.querySelector('.plus-dialog-footer')).borderBottomLeftRadius, 'footer inner corners are square').toBe('0px');
    },
};

export const WithoutCloseButton = {
    render: () => (
        <Dialog
            title="Uploading transcript"
            showCloseButton={false}
            body="A dialog that has to be answered drops the close button."
            primaryButton={{ text: 'Cancel upload' }}
            onClose={() => {}}
        />
    ),
    play: async ({ canvas }) => {
        await expect(canvas.queryByRole('button', { name: 'Close' })).toBeNull();
        await expect(canvas.getByRole('button', { name: 'Cancel upload' })).toBeInTheDocument();
    },
};

const sampleTabs = [
    { key: 'details', label: 'Details', content: <p>Session notes and goals for Thursday at 4:00 PM ET.</p> },
    { key: 'students', label: 'Students', content: <p>Maya K., Leo T., and Samira R. are assigned.</p> },
];

export const Tabs = {
    render: () => (
        <Dialog
            title="Session settings"
            tabs={sampleTabs}
            defaultActiveTab="details"
            primaryButton={{ text: 'Save' }}
            onClose={() => {}}
        />
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/Session notes and goals/)).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Students' }));
        await expect(canvas.getByText(/Maya K., Leo T., and Samira R./)).toBeInTheDocument();
    },
};

export const Loading = {
    render: () => (
        <Dialog
            loading
            title="Session details"
            body="Session notes and practice sets for Thursday at 4:00 PM ET."
            showBottomButtons={false}
            onClose={() => {}}
        />
    ),
    play: async ({ canvasElement }) => {
        const body = canvasElement.querySelector('.plus-dialog-body');
        await expect(body).toHaveAttribute('aria-busy', 'true');
        await expect(canvasElement.querySelector('.plus-dialog-skeleton')).toBeInTheDocument();
    },
};

export const Content = () => (
    <div style={col}>
        <DialogContentDemos />
    </div>
);

export const Layout = () => <div style={col}><DialogLayoutDemos /></div>;

const dialogDocsShellStyle = {
    minHeight: 'var(--width-2500)',
    width: '100%',
};

export const Interactive = {
    args: {
        title: 'Publish session notes?',
        body: 'Families can view published notes on the student profile.',
        width: '6-col',
        height: 'hug',
        showBottomButtons: true,
        showCloseButton: true,
        dividers: false,
        loading: false,
    },
    render: (args) => (
        <div style={dialogDocsShellStyle}>
            <Dialog
                {...args}
                primaryButton={
                    args.showBottomButtons
                        ? {
                              text: 'Publish notes',
                              appearance: 'primary',
                              onClick: () => {},
                          }
                        : null
                }
                secondaryButton={
                    args.showBottomButtons
                        ? {
                              text: 'Keep draft',
                              appearance: 'default',
                              onClick: () => {},
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
};

/** Footer actions: 4-track placement inside Dialog padding, spacious (48) fit buttons, no Cancel. */
export const FooterLayouts = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', '--plus-overlay-screen': '1024px' /* token gap: 1024px */, width: '100%' }}>
            <Dialog
                width="6-col"
                data-testid="dialog-footer-one"
                title="Session summary ready"
                body="Parents can view the published summary on the session card."
                primaryButton={{ text: 'Done' }}
                onClose={() => {}}
            />
            <Dialog
                width="6-col"
                data-testid="dialog-footer-two"
                title="Unsaved session notes"
                body="Closing now drops your edits to Jordan's session."
                secondaryButton={{ text: 'Discard' }}
                primaryButton={{ text: 'Save notes' }}
                onClose={() => {}}
            />
            <Dialog
                width="8-col"
                data-testid="dialog-footer-leading"
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
            <Dialog
                width="6-col"
                data-testid="dialog-footer-destructive"
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

        const oneDialog = canvas.getByTestId('dialog-footer-one');
        const oneFooter = oneDialog.querySelector('.plus-footer-actions');
        const oneTracks = footerTracks(oneFooter);
        const done = within(oneDialog).getByRole('button', { name: 'Done' });
        await expect(close(done.getBoundingClientRect().left, oneTracks.span(3, 4).left), 'single Dialog button starts at track 3').toBe(true);
        await expect(close(done.getBoundingClientRect().height, 48), 'Dialog footer button draws 48 high').toBe(true);

        const twoDialog = canvas.getByTestId('dialog-footer-two');
        const twoFooter = twoDialog.querySelector('.plus-footer-actions');
        const twoTracks = footerTracks(twoFooter);
        const discard = within(twoDialog).getByRole('button', { name: 'Discard' });
        const save = within(twoDialog).getByRole('button', { name: 'Save notes' });
        await expect(close(discard.getBoundingClientRect().left, twoTracks.span(1, 2).left), 'secondary starts at track 1').toBe(true);
        await expect(close(save.getBoundingClientRect().left, twoTracks.span(3, 4).left), 'primary starts at track 3').toBe(true);

        const leadingDialog = canvas.getByTestId('dialog-footer-leading');
        const leadingFooter = leadingDialog.querySelector('.plus-footer-actions');
        const leadingTracks = footerTracks(leadingFooter);
        const skip = within(leadingDialog).getByRole('button', { name: 'Skip for now' });
        const draft = within(leadingDialog).getByRole('button', { name: 'Save draft' });
        await expect(close(skip.getBoundingClientRect().left, leadingTracks.box.left), 'leading subtle button hugs left edge').toBe(true);
        await expect(close(draft.getBoundingClientRect().left, leadingTracks.track(3).left), 'filled buttons sit in tracks 3 and 4').toBe(true);

        const destructiveDialog = canvas.getByTestId('dialog-footer-destructive');
        const del = within(destructiveDialog).getByRole('button', { name: 'Delete recording' });
        await expect(del).toHaveClass('plus-btn--danger');
    },
};

/** Size the Dialog to its content with a step of DIALOG_WIDTHS. */
export const SizeToContent = {
    render: () => (
        <DoDont>
            <Do caption="The narrowest step for a short question.">
                <FigureScreen>
                    <Dialog
                        width="6-col"
                        title="Remove this session?"
                        body="The student is told it was canceled."
                        secondaryButton={{ text: 'Keep session' }}
                        primaryButton={{ text: 'Remove', appearance: 'danger' }}
                        onClose={() => {}}
                    />
                </FigureScreen>
            </Do>
            <Dont caption="The widest step around one sentence.">
                <FigureScreen>
                    <Dialog
                        width="10-col"
                        title="Remove this session?"
                        body="The student is told it was canceled."
                        secondaryButton={{ text: 'Keep session' }}
                        primaryButton={{ text: 'Remove', appearance: 'danger' }}
                        onClose={() => {}}
                    />
                </FigureScreen>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('heading', { name: 'Remove this session?' })).toHaveLength(2);
        await expect(canvas.getAllByRole('button', { name: 'Remove' })).toHaveLength(2);
    },
};

const StateDialog = () => (
    <Dialog width="6-col" title="Settings" body="Changes save when you close." onClose={() => {}} />
);
const bodyOf = (canvasElement) => within(canvasElement);
const closeOf = async (canvasElement) => bodyOf(canvasElement).findByRole('button', { name: 'Close' });

export const Rest = {
    render: () => <StateDialog />,
    play: async ({ canvasElement }) => {
        await expect(await bodyOf(canvasElement).findByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
        await expect(await closeOf(canvasElement)).toBeVisible();
    },
};

export const Hovered = {
    render: () => <StateDialog />,
    play: async ({ canvasElement }) => {
        await expectHovered(canvasElement, await closeOf(canvasElement), 'subtle', 'dialog close');
    },
};

export const Pressed = {
    render: () => <StateDialog />,
    play: async ({ canvasElement }) => {
        await expectPressed(canvasElement, await closeOf(canvasElement), 'subtle', 'dialog close');
    },
};

export const Focused = {
    render: () => <StateDialog />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, await closeOf(canvasElement), 'dialog close');
    },
};
