/**
 * ShareIdeasModal Stories
 * Figma Spec: node-id=83-126557
 */

import React, { useState } from 'react';
import ShareIdeasModal from './ShareIdeasModal';
import Button from '@/components/Button';

export default {
    title: 'Specs/Home/Modals/ShareIdeasModal',
    component: ShareIdeasModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Modal for sharing feature suggestions with urgency rating (lightbulb icons), product area dropdown, and suggestions textarea.'
            }
        }
    }
};

export const Overview = {
    render: () => (
        <ShareIdeasModal
            show={true}
            noOverlay={true}
            onClose={() => console.log('Closed')}
            onSubmit={(data) => console.log('Feedback submitted:', data)}
        />
    )
};

export const Interactive = {
    render: (args) => {
        const [open, setOpen] = useState(false);
        return (
            <div>
                <Button text="Open Share Ideas Modal" onClick={() => setOpen(true)} />
                <ShareIdeasModal
                    {...args}
                    show={open}
                    onClose={() => setOpen(false)}
                    onSubmit={(data) => {
                        console.log('Feedback submitted:', data);
                        setOpen(false);
                    }}
                />
            </div>
        );
    },
    args: {
        noOverlay: false
    },
    argTypes: {
        noOverlay: { control: 'boolean', table: { category: 'Behavior' } }
    }
};
