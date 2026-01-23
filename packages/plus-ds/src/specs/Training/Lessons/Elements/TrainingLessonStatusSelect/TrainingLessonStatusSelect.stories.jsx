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
 * Overview
 * Shows all possible states selected
 */
export const Overview = {
    render: () => (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Status: All</h4>
                <TrainingLessonStatusSelect selectedStatus="All" />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Status: Assigned</h4>
                <TrainingLessonStatusSelect selectedStatus="Assigned" />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Status: In Progress</h4>
                <TrainingLessonStatusSelect selectedStatus="In Progress" />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Status: Completed</h4>
                <TrainingLessonStatusSelect selectedStatus="Completed" />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Status: Not Started</h4>
                <TrainingLessonStatusSelect selectedStatus="Not Started" />
            </div>
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
            <div style={{ padding: '32px' }}>
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
