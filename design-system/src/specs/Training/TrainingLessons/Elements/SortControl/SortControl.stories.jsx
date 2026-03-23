/**
 * SortControl Stories
 * 
 * Sort control dropdown component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=747-54853
 */

import React, { useState } from 'react';
import SortControl from './SortControl';
import './SortControl.scss';

export default {
    title: 'Specs/Training/TrainingLessons/Elements/SortControl',
    component: SortControl,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Dropdown sort control with Sort by (Name, Status, Competency Areas) and Order (A-Z, Z-A) sections.',
            },
        },
    },
    argTypes: {
        sortBy: {
            control: { type: 'select' },
            options: ['Name', 'SMART Competency', 'Status', 'Competency Areas'],
            description: 'Current sort by value'
        },
        sortOrder: {
            control: { type: 'text' },
            description: 'Current sort order'
        }
    }
};

/**
 * Default
 * Default sort control
 */
export const Default = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <SortControl />
        </div>
    )
};

/**
 * Interactive
 * Interactive sort control with change handler
 */
export const Interactive = {
    render: (args) => {
        const [sortState, setSortState] = useState({
            sortBy: args.sortBy || 'Name',
            sortOrder: args.sortOrder || 'A-Z'
        });

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
                <p className="body2-txt" style={{ marginBottom: '16px' }}>
                    Sort by: {sortState.sortBy} | Order: {sortState.sortOrder}
                </p>
                <SortControl
                    sortBy={sortState.sortBy}
                    sortOrder={sortState.sortOrder}
                    onChange={(newState) => {
                        setSortState(newState);
                        console.log('Sort changed:', newState);
                    }}
                />
            </div>
        );
    },
    args: {
        sortBy: 'Name',
        sortOrder: 'A-Z'
    }
};
