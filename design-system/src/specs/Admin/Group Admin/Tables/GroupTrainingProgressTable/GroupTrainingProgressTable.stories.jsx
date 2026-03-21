/**
 * GroupTrainingProgressTable - Admin Group Admin Table
 * 
 * Table showing group training progress by competency area with hierarchical structure.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1107-269190
 */

import React, { useState, useMemo } from 'react';
import GroupTrainingProgressTable from './GroupTrainingProgressTable';
import './GroupTrainingProgressTable.scss';

// Sample data pool for generating rows
const competencyTypes = ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'];

const generateTableData = (rowCount) => {
    const data = [];
    for (let i = 0; i < rowCount; i++) {
        const competencyArea = competencyTypes[i % competencyTypes.length];
        const completion = `${Math.floor(Math.random() * 12) + 4}/16`;
        const accuracy = `${Math.floor(Math.random() * 40) + 50}%`;
        const rating = `${(Math.random() * 1.5 + 3.5).toFixed(1)}/5`;
        const timeSpent = `${Math.floor(Math.random() * 300) + 200} mins`;
        
        data.push({
            id: i + 1,
            competencyArea,
            completion,
            accuracy,
            rating,
            timeSpent,
            level: 1,
            // Add children to first row for demo
            ...(i === 0 ? {
                children: [
                    {
                        id: 11,
                        lessonName: 'Motivation to Learn',
                        completion: '4/4',
                        accuracy: '80%',
                        rating: '4.5/5',
                        timeSpent: '120 mins',
                        level: 2,
                        children: [
                            { id: 111, lessonName: 'Reacting to Errors', completion: '4/4', accuracy: '85%', rating: '5.0/5', timeSpent: '60 mins', level: 3 },
                        ]
                    }
                ]
            } : {})
        });
    }
    return data;
};

// Default 9 rows data
const defaultNineRows = [
    {
        id: 1,
        competencyArea: 'socio-emotional',
        completion: '12/16',
        accuracy: '75%',
        rating: '4.5/5',
        timeSpent: '420 mins',
        level: 1,
        children: [
            {
                id: 11,
                lessonName: 'Motivation to Learn',
                completion: '4/4',
                accuracy: '80%',
                rating: '4.5/5',
                timeSpent: '120 mins',
                level: 2,
                children: [
                    { id: 111, lessonName: 'Reacting to Errors', completion: '4/4', accuracy: '85%', rating: '5.0/5', timeSpent: '60 mins', level: 3 },
                ]
            }
        ]
    },
    { id: 2, competencyArea: 'mastering-content', completion: '10/16', accuracy: '65%', rating: '4.0/5', timeSpent: '380 mins', level: 1 },
    { id: 3, competencyArea: 'advocacy', completion: '6/16', accuracy: '55%', rating: '3.5/5', timeSpent: '250 mins', level: 1 },
    { id: 4, competencyArea: 'relationships', completion: '8/16', accuracy: '70%', rating: '4.2/5', timeSpent: '300 mins', level: 1 },
    { id: 5, competencyArea: 'technology-tools', completion: '14/16', accuracy: '85%', rating: '4.8/5', timeSpent: '450 mins', level: 1 },
    { id: 6, competencyArea: 'socio-emotional', completion: '9/16', accuracy: '60%', rating: '3.8/5', timeSpent: '280 mins', level: 1 },
    { id: 7, competencyArea: 'mastering-content', completion: '11/16', accuracy: '72%', rating: '4.1/5', timeSpent: '340 mins', level: 1 },
    { id: 8, competencyArea: 'advocacy', completion: '7/16', accuracy: '58%', rating: '3.6/5', timeSpent: '220 mins', level: 1 },
    { id: 9, competencyArea: 'relationships', completion: '13/16', accuracy: '82%', rating: '4.6/5', timeSpent: '400 mins', level: 1 },
];

export default {
    title: 'Specs/Admin/Group Admin/Tables/GroupTrainingProgressTable',
    component: GroupTrainingProgressTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for displaying group training progress by competency area. Shows hierarchical data with competency areas (Level 1), lessons (Level 2), and sub-lessons (Level 3). Each row includes circular progress indicators for Completion, Accuracy, and Rating.

## Figma Reference
Node ID: 1107-269190

## Features
- Hierarchical/expandable rows (3 levels)
- SMART competency badges
- Circular progress indicators with color coding
- Sortable columns
- Assign action buttons
- Default 9 rows
`,
            },
        },
    },
    argTypes: {
        sortable: {
            control: 'boolean',
            description: 'Enable sortable columns',
            table: { category: 'Behavior' },
        },
        hover: {
            control: 'boolean',
            description: 'Enable row hover effects',
            table: { category: 'Behavior' },
        },
        rowCount: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Number of table rows to display',
            table: { category: 'Data' },
        },
    },
};

/**
 * Docs
 * Documentation for GroupTrainingProgressTable component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>GroupTrainingProgressTable</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Table component for displaying group training progress organized by SMART competency areas.
                        Uses a hierarchical structure with three levels: competency area (Level 1), lessons (Level 2),
                        and sub-lessons (Level 3). Each row shows circular progress indicators for completion,
                        accuracy, and rating metrics. Default displays 9 rows.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>data</strong>: Array of hierarchical training progress objects</li>
                        <li><strong>sortable</strong>: Enable sortable columns (default: true)</li>
                        <li><strong>hover</strong>: Enable row hover effects (default: true)</li>
                        <li><strong>onAssignClick</strong>: Callback when Assign button is clicked</li>
                        <li><strong>onExpandClick</strong>: Callback when expand/collapse is clicked</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Data Structure</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Level 1</strong>: Competency areas (socio-emotional, mastering-content, etc.)</li>
                        <li><strong>Level 2</strong>: Lessons within competency areas</li>
                        <li><strong>Level 3</strong>: Sub-lessons within lessons</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 1107-269190
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows table with 9 rows matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 24px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Group Training Progress Table (9 rows)</h6>
                <GroupTrainingProgressTable
                    data={defaultNineRows}
                    onAssignClick={(item) => console.log('Assign clicked:', item)}
                />
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls including row count
 */
export const Interactive = {
    render: (args) => {
        const tableData = useMemo(() => {
            return generateTableData(args.rowCount);
        }, [args.rowCount]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Group Training Progress Table - Interactive ({args.rowCount} rows)
                </h6>
                <GroupTrainingProgressTable
                    data={tableData}
                    sortable={args.sortable}
                    hover={args.hover}
                    onAssignClick={(item) => console.log('Assign clicked:', item)}
                    onExpandClick={(itemId) => console.log('Expand clicked:', itemId)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        hover: true,
        rowCount: 9,
    },
};
