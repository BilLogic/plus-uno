/**
 * LookForHelpModal Stories
 * Figma Spec: node-id=83-126557
 */

import React, { useState } from 'react';
import LookForHelpModal from './LookForHelpModal';
import Button from '@/components/Button';

export default {
    title: 'Specs/Home/Modals/LookForHelpModal',
    component: LookForHelpModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Modal for asking questions with urgency rating (clock icons), product area dropdown, and question textarea.'
            }
        }
    }
};

export const Overview = {
    render: () => (
        <LookForHelpModal
            show={true}
            noOverlay={true}
            onClose={() => console.log('Closed')}
            onSubmit={(data) => console.log('Question submitted:', data)}
        />
    )
};

export const Interactive = {
    render: (args) => {
        const [open, setOpen] = useState(false);
        return (
            <div>
                <Button text="Open Look For Help Modal" onClick={() => setOpen(true)} />
                <LookForHelpModal
                    {...args}
                    show={open}
                    onClose={() => setOpen(false)}
                    onSubmit={(data) => {
                        console.log('Question submitted:', data);
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
