/**
 * TrainingLessonStatusSelect Stories
 * 
 * Status filter dropdown component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=779-75384
 */

import React, { useState } from 'react';
import TrainingLessonStatusSelect from './TrainingLessonStatusSelect';
import './TrainingLessonStatusSelect.scss';

export default {
    title: 'Specs/Training/Lessons/Elements/TrainingLessonStatusSelect',
    component: TrainingLessonStatusSelect,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Status filter dropdown with colored icons and counters. Options: All, Assigned, In Progress, Completed, Not Started.',
            },
        },
    },
    argTypes: {
        selectedStatus: {
            control: { type: 'select' },
            options: ['All', 'Assigned', 'In Progress', 'Completed', 'Not Started'],
            description: 'Currently selected status'
        }
    }
};

/**
 * Default
 * Default status select
 */
export const Default = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <TrainingLessonStatusSelect />
        </div>
    )
};

/**
 * Interactive
 * Interactive status select with change handler
 */
export const Interactive = {
    render: (args) => {
        const [selectedStatus, setSelectedStatus] = useState(args.selectedStatus || 'All');

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
                <p className="body2-txt" style={{ marginBottom: '16px' }}>
                    Selected: {selectedStatus}
                </p>
                <TrainingLessonStatusSelect
                    selectedStatus={selectedStatus}
                    counts={args.counts}
                    onStatusChange={(status) => {
                        setSelectedStatus(status);
                        console.log('Status changed:', status);
                    }}
                />
            </div>
        );
    },
    args: {
        selectedStatus: 'All',
        counts: {
            all: 20,
            assigned: 0,
            inProgress: 0,
            completed: 5,
            notStarted: 15
        }
    }
};
