import React, { useState } from 'react';
import Toast, { ToastContainer } from './Toast';
import Button from '@/components/Button/Button';

export default {
    title: 'Components/Toast',
    component: Toast,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Toast component for displaying notifications. Based on react-bootstrap Toast.'
            }
        }
    },
    argTypes: {
        style: {
            control: 'select',
            options: ['secondary', 'success', 'danger', 'warning', 'info', 'primary'],
            description: 'Toast style'
        },
        position: {
            control: 'select',
            options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
            description: 'Toast position (for container)'
        }
    }
};

function ToastVariantsDemos() {
    return (
        <ToastContainer className="p-3" style={{ position: 'static' }}>
            <Toast title="Primary Toast" style="primary" timestamp="Just now">
                This is a primary toast.
            </Toast>
            <Toast title="Secondary Toast" style="secondary" timestamp="Just now">
                This is a secondary toast (default).
            </Toast>
            <Toast title="Success Toast" style="success" timestamp="2 mins ago">
                Action completed successfully!
            </Toast>
            <Toast title="Danger Toast" style="danger" timestamp="10 mins ago">
                Something went wrong.
            </Toast>
            <Toast title="Warning Toast" style="warning">
                Please be careful.
            </Toast>
            <Toast title="Info Toast" style="info">
                Here is some information.
            </Toast>
        </ToastContainer>
    );
}

export const Variants = () => (
    <div className="d-flex flex-column gap-3">
        <ToastVariantsDemos />
    </div>
);

export const Overview = () => (
    <div className="d-flex flex-column gap-3">
        <ToastVariantsDemos />
    </div>
);

const ToastInteractiveWrapper = ({ style, position, title, children, show, autohide, delay }) => {
    const [isOpen, setIsOpen] = useState(show);

    React.useEffect(() => {
        setIsOpen(show);
    }, [show]);

    return (
        <div style={{ height: '300px', position: 'relative', background: '#f8f9fa', border: '1px solid #dee2e6' }}>
            <div className="p-3">
                <Button text="Trigger Toast" onClick={() => setIsOpen(true)} />
            </div>

            <ToastContainer position={position} className="p-3" style={{ position: 'absolute' }}>
                <Toast
                    show={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={title}
                    style={style}
                    timestamp="Just now"
                    delay={delay}
                    autohide={autohide}
                >
                    {children}
                </Toast>
            </ToastContainer>
        </div>
    );
};

export const Interactive = (args) => <ToastInteractiveWrapper {...args} />;
Interactive.args = {
    show: true,
    style: 'success',
    position: 'top-end',
    title: 'Toast Title',
    children: 'This is an interactive toast message.',
    autohide: false,
    delay: 3000
};
