import React from 'react';
import Modal from '@/components/Modal';

export default {
    title: 'Components/Modal',
    component: Modal,
    tags: ['!dev'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        title: {
            control: 'text',
            table: { category: 'Content' },
        },
        body: {
            control: 'text',
            table: { category: 'Content' },
        },
        type: {
            control: 'select',
            options: ['default', 'scrollable'],
            description: 'Modal type',
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
            control: 'number',
            description: 'Modal width',
            table: { category: 'Layout' },
        },
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
                    width={400}
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

export const Overview = () => (
    <div style={{ ...col, gap: '48px' }}>
        <ModalContentDemos />
        <ModalLayoutDemos />
        <ModalScrollableDemo />
    </div>
);

export const Interactive = {
    args: {
        show: true,
        title: 'Modal title',
        body: 'Modal body text goes here.',
        type: 'default',
        showBottomButtons: true,
        width: 340,
    },
    render: (args) => (
        <InlineModalCanvas
            minHeight={420}
            modal={
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
            }
        />
    ),
};
