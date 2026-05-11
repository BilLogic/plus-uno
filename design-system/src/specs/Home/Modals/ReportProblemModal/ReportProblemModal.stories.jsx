/**
 * ReportProblemModal Stories
 * Figma Spec: node-id=83-126557
 */

import React, { useState } from 'react';
import ReportProblemModal from './ReportProblemModal';
import Button from '@/components/Button';

export default {
    title: 'Specs/Home/Modals/ReportProblemModal',
    component: ReportProblemModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Modal for reporting problems with impact rating (flag icons), product area dropdown, description textarea, and image upload.'
            }
        }
    }
};

export const Overview = {
    render: () => (
        <ReportProblemModal
            show={true}
            noOverlay={true}
            onClose={() => console.log('Closed')}
            onSubmit={(data) => console.log('Problem submitted:', data)}
        />
    )
};

export const Interactive = {
    render: (args) => {
        const [open, setOpen] = useState(false);
        return (
            <div>
                <Button text="Open Report Problem Modal" onClick={() => setOpen(true)} />
                <ReportProblemModal
                    {...args}
                    show={open}
                    onClose={() => setOpen(false)}
                    onSubmit={(data) => {
                        console.log('Problem submitted:', data);
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
