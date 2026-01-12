/**
 * GroupTrainingProgressPage - Admin Group Admin Page
 * 
 * Full page layout for Group Training Progress with overview cards and training progress table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=531-62962
 */

import React, { useState, useMemo } from 'react';
import GroupTrainingProgressPage from './GroupTrainingProgressPage';
import './GroupTrainingProgressPage.scss';

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
    title: 'Specs/Admin/Group Admin/Pages/GroupTrainingProgressPage',
    component: GroupTrainingProgressPage,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `Full page layout for the Group Training Progress section of Group Admin. Includes tab navigation, title with group filter dropdown, overview cards (Student Need, Completion Rate, Avg Accuracy, Avg Time Spent), and hierarchical training progress table (default 9 rows).

## Figma Reference
Node ID: 531-62962

## Features
- Tab navigation between Group Info and Training Progress
- Group filter dropdown
- Overview cards with SMART visualization
- Hierarchical training progress table with expand/collapse
- Default 9 table rows
`,
            },
        },
    },
    argTypes: {
        selectedGroup: {
            control: 'select',
            options: ['All Groups', 'Math Masters', 'Science Explorers', 'Reading Champions'],
            description: 'Selected group for filtering',
            table: { category: 'Filters' },
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
 * Documentation for GroupTrainingProgressPage component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>GroupTrainingProgressPage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for the Group Training Progress section of Group Admin. 
                        Uses the PageLayout shell with TopBar and Sidebar. Contains tab navigation, 
                        title section with group filter, overview cards showing key metrics, and a 
                        hierarchical training progress table organized by SMART competency areas.
                        Default displays 9 table rows.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>trainingData</strong>: Array of hierarchical training progress data</li>
                        <li><strong>selectedGroup</strong>: Currently selected group filter (default: "All Groups")</li>
                        <li><strong>onTabChange</strong>: Callback when tab changes</li>
                        <li><strong>onGroupFilterChange</strong>: Callback when group filter changes</li>
                        <li><strong>onAssignClick</strong>: Callback when Assign button is clicked</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Overview Cards</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Student Need</strong>: Shows SMART bar visualization with highest need area</li>
                        <li><strong>Completion Rate</strong>: Shows percentage of completed lessons</li>
                        <li><strong>Avg Accuracy Rate</strong>: Shows average accuracy on completed lessons</li>
                        <li><strong>Avg Time Spent</strong>: Shows average time spent on training</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 531-62962
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows full page with 9 rows matching Figma design
 */
export const Overview = {
    render: () => (
        <GroupTrainingProgressPage
            trainingData={defaultNineRows}
            selectedGroup="All Groups"
            onTabChange={(tab) => console.log('Tab changed:', tab)}
            onGroupFilterChange={() => console.log('Group filter clicked')}
            onAssignClick={(item) => console.log('Assign clicked:', item)}
        />
    ),
};

/**
 * Interactive
 * Interactive playground with controls including row count
 */
export const Interactive = {
    render: (args) => {
        const [selectedGroup, setSelectedGroup] = useState(args.selectedGroup);
        
        const tableData = useMemo(() => {
            return generateTableData(args.rowCount);
        }, [args.rowCount]);

        return (
            <GroupTrainingProgressPage
                trainingData={tableData}
                selectedGroup={selectedGroup}
                onTabChange={(tab) => console.log('Tab changed:', tab)}
                onGroupFilterChange={() => {
                    const groups = ['All Groups', 'Math Masters', 'Science Explorers'];
                    const currentIndex = groups.indexOf(selectedGroup);
                    const nextIndex = (currentIndex + 1) % groups.length;
                    setSelectedGroup(groups[nextIndex]);
                }}
                onAssignClick={(item) => console.log('Assign clicked:', item)}
            />
        );
    },
    args: {
        selectedGroup: 'All Groups',
        rowCount: 9,
    },
};
