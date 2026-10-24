import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Modal from '@/components/messaging/Modal';
import { Button } from '@/components';

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
            options: ['sm', 'md', 'lg'],
            description: '6 · 8 · 10 columns of the screen grid plus the modal pad; a number is a fixed width',
            table: { category: 'Layout' },
        },
        headerActions: { table: { disable: true, category: 'Development' } },
        footer: { table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        enforceFocus: { table: { disable: true, category: 'Development' } },
        autoFocus: { table: { disable: true, category: 'Development' } },
        restoreFocus: { table: { disable: true, category: 'Development' } },
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
    border: '1px solid var(--color-outline-variant)',
    background: 'var(--color-surface-container-low)',
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">
                {title}
            </span>
            <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
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
                            style: 'primary',
                            fill: 'filled',
                            onClick: () => console.log('Primary clicked'),
                        }}
                        secondaryButton={{
                            text: 'Secondary',
                            style: 'secondary',
                            fill: 'tonal',
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
                            style: 'primary',
                            fill: 'filled',
                            onClick: () => console.log('Primary clicked'),
                        }}
                        secondaryButton={{
                            text: 'Secondary',
                            style: 'secondary',
                            fill: 'tonal',
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
                        style: 'primary',
                        fill: 'filled',
                        onClick: () => console.log('Primary clicked'),
                    }}
                    secondaryButton={{
                        text: 'Secondary',
                        style: 'secondary',
                        fill: 'tonal',
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
            {['sm', 'md', 'lg'].map((size) => (
                <Modal
                    key={size}
                    show
                    renderAs="inline"
                    width={size}
                    title={`width="${size}"`}
                    description={`${{ sm: 6, md: 8, lg: 10 }[size]} columns of the screen grid plus the modal pad.`}
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
        '--layout-max-height-modal': 'var(--size-2000)',
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
                headerActions={<Button style="secondary" fill="ghost" size="small" leadingVisual="link" title="Copy link" />}
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
        width: 'sm',
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
                              style: 'primary',
                              fill: 'filled',
                              onClick: () => console.log('Primary clicked'),
                          }
                        : null
                }
                secondaryButton={
                    args.showBottomButtons
                        ? {
                              text: 'Secondary',
                              style: 'secondary',
                              fill: 'tonal',
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
