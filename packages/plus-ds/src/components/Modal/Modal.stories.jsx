import React, { useState } from 'react';
import BootstrapModalManager from 'react-bootstrap/esm/BootstrapModalManager';
import Modal from '@/components/Modal';

/** Do not set `overflow: hidden` on `document.body` — otherwise Storybook docs cannot scroll. */
class StorybookDocsModalManager extends BootstrapModalManager {
    constructor(options = {}) {
        super({ ...options, handleContainerOverflow: false });
    }
}

const storybookDocsModalManager = new StorybookDocsModalManager({ isRTL: false });

export default {
    title: 'Components/Modal',
    component: Modal,
    tags: ['!dev'],
    argTypes: {
        type: {
            control: 'select',
            options: ['default', 'scrollable'],
            description: 'Modal type',
        },
        showBottomButtons: {
            control: 'boolean',
            description: 'Show bottom buttons',
        },
        width: {
            control: 'number',
            description: 'Modal width',
        },
        container: { table: { disable: true } },
        manager: { table: { disable: true } },
        enforceFocus: { table: { disable: true } },
        autoFocus: { table: { disable: true } },
        restoreFocus: { table: { disable: true } },
    },
};

const col = { display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' };

const scrollableBody = `${'Long body copy. '.repeat(24)}Use a scrollable modal when content exceeds the viewport.`;

/**
 * Storybook docs render inline; Bootstrap modals portal to `document.body` by default and cover the page.
 * `transform` creates a containing block so `position: fixed` modal + backdrop stay inside this host.
 */
const modalDocsHostStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: 800,
    borderRadius: 12,
    border: '1px solid var(--color-outline-variant)',
    background: 'var(--color-surface-container-low)',
    transform: 'translateZ(0)',
    overflow: 'hidden',
};

function InlineModalCanvas({ minHeight = 400, modal }) {
    const [host, setHost] = useState(null);
    return (
        <div ref={setHost} style={{ ...modalDocsHostStyle, minHeight }}>
            {host
                ? React.cloneElement(modal, {
                      container: host,
                      manager: storybookDocsModalManager,
                      enforceFocus: false,
                      autoFocus: false,
                      restoreFocus: false,
                  })
                : null}
        </div>
    );
}

function ModalContentDemos() {
    return (
        <>
            <InlineModalCanvas
                minHeight={300}
                modal={
                    <Modal
                        show
                        title="Delete item?"
                        body="This action cannot be undone."
                        type="default"
                        showBottomButtons={false}
                        onClose={() => console.log('Close clicked')}
                    />
                }
            />
            <InlineModalCanvas
                minHeight={360}
                modal={
                    <Modal
                        show
                        title="More context"
                        body="Use the body prop for string copy. Split longer explanations into short paragraphs so the modal stays readable."
                        type="default"
                        showBottomButtons={false}
                        onClose={() => console.log('Close clicked')}
                    />
                }
            />
            <InlineModalCanvas
                minHeight={320}
                modal={
                    <Modal
                        show
                        title="Custom body"
                        type="default"
                        showBottomButtons={false}
                        onClose={() => console.log('Close clicked')}
                    >
                        <ul className="body2-txt" style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            <li>Pass JSX as children for lists, links, or formatted content.</li>
                            <li>You can still use captions or secondary text inside the body region.</li>
                        </ul>
                    </Modal>
                }
            />
        </>
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
                        title="Modal title"
                        body="Modal body text goes here."
                        type="default"
                        showBottomButtons={false}
                        onClose={() => console.log('Close clicked')}
                    />
                }
            />

            <InlineModalCanvas
                minHeight={400}
                modal={
                    <Modal
                        show
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
                        onClose={() => console.log('Close clicked')}
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
                    onClose={() => console.log('Close clicked')}
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
                    onClose={() => console.log('Close clicked')}
                />
            }
        />
    ),
};
