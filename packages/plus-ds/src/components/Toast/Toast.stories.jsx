import React, { useState } from 'react';
import Toast, { ToastContainer } from './Toast';
import Button from '@/components/Button/Button';

export default {
    title: 'Components/Toast',
    component: Toast,
    tags: ['autodocs'],
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
            options: ['default', 'success', 'danger', 'warning', 'info'],
            description: 'Toast style'
        },
        position: {
            control: 'select',
            options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
            description: 'Toast position (for container)'
        }
    }
};

export const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h5>Static Examples</h5>
                <div style={{ position: 'relative', height: '300px', background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                    <ToastContainer position="top-start" className="p-3">
                        <Toast title="Success Toast" style="success" timestamp="Just now">
                            Action completed successfully!
                        </Toast>
                        <Toast title="Danger Toast" style="danger" timestamp="2 mins ago">
                            Something went wrong.
                        </Toast>
                    </ToastContainer>
                </div>
            </section>
        </div>
    );
};

export const Interactive = () => {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState('top-end');

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Show Toast" onClick={() => setShow(true)} />
                <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px' }}
                >
                    <option value="top-end">Top Right</option>
                    <option value="top-start">Top Left</option>
                    <option value="bottom-end">Bottom Right</option>
                    <option value="bottom-start">Bottom Left</option>
                </select>
            </div>

            <ToastContainer position={position} className="p-3" style={{ zIndex: 1055 }}>
                <Toast
                    show={show}
                    onClose={() => setShow(false)}
                    title="Notification"
                    style="info"
                    timestamp="Now"
                    delay={3000}
                    autohide
                >
                    Hello! This is a dynamic toast message.
                </Toast>
            </ToastContainer>
        </div>
    );
};
