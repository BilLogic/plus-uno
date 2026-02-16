import React from 'react';
import Modal from '@/components/Modal';

export default {
    title: 'Components/Modal',
    component: Modal,
    tags: ['autodocs'],
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
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
        <Modal
            title="Modal title"
            body="Modal body text goes here."
            type="default"
            showBottomButtons={false}
            onClose={() => console.log('Close clicked')}
        />

        <Modal
            title="Modal title"
            body="Modal body text goes here."
            type="default"
            showBottomButtons={true}
            primaryButton={{
                text: 'Confirm',
                onClick: () => console.log('Confirm clicked')
            }}
            secondaryButton={{
                text: 'Cancel',
                onClick: () => console.log('Cancel clicked')
            }}
            onClose={() => console.log('Close clicked')}
        />
    </div>
);

export const Interactive = {
    args: {
        title: 'Modal title',
        body: 'Modal body text goes here.',
        type: 'default',
        showBottomButtons: true,
        width: 340,
    },
    render: (args) => (
        <Modal
            {...args}
            primaryButton={args.showBottomButtons ? {
                text: 'Primary',
                style: 'primary',
                fill: 'filled',
                onClick: () => console.log('Primary clicked')
            } : null}
            secondaryButton={args.showBottomButtons ? {
                text: 'Secondary',
                style: 'secondary',
                fill: 'tonal',
                onClick: () => console.log('Secondary clicked')
            } : null}
            onClose={() => console.log('Close clicked')}
        />
    ),
};
