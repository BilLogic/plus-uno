/**
 * SessionModal - Admin Session Admin Modal
 * 
 * Modal for viewing session breakdown with student-tutor pairings.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127605
 */

import React, { useState, useEffect } from 'react';
import SessionModal from './SessionModal';
import Button from '../../../../../components/Button/Button';
import './SessionModal.scss';

const defaultStudents = [
    { id: 1, studentName: 'Amanda Novak', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 11 },
    { id: 2, studentName: 'Ashley Brown', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 8 },
    { id: 3, studentName: 'Frank Bass', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 11 },
    { id: 4, studentName: 'Henry Hamm', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 15 },
    { id: 5, studentName: 'Jose Green', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 10 },
    { id: 6, studentName: 'Miles Hazel', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 14 },
    { id: 7, studentName: 'Olga Petra', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 3 },
    { id: 8, studentName: 'Pete Smith', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 4 },
    { id: 9, studentName: 'Sam Morales', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 11 },
];

export default {
    title: 'Specs/Admin/Session Admin/Modals/SessionModal',
    component: SessionModal,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Modal component for viewing session breakdown details. Shows a table with student-tutor pairings and time spent.

## Figma Reference
Node ID: 987-127605

## Features
- Session date in title
- Close button
- Session breakdown table with sortable columns
- Student Status and Tutor Type badges
`,
            },
        },
    },
    argTypes: {
        show: {
            control: 'boolean',
            description: 'Whether the modal is visible',
            table: { category: 'State' },
        },
        sessionDate: {
            control: 'text',
            description: 'Session date for the title',
            table: { category: 'Content' },
        },
    },
};

/**
 * Docs - Documentation for SessionModal component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>SessionModal</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Modal component for viewing session breakdown details. Contains a table showing 
                        student-tutor pairings with status badges and time spent.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>show</strong>: Whether the modal is visible</li>
                        <li><strong>sessionDate</strong>: Date string for the title</li>
                        <li><strong>students</strong>: Array of student breakdown objects</li>
                        <li><strong>onHide</strong>: Callback when modal is closed</li>
                        <li><strong>onSort</strong>: Callback when sort changes</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 987-127605
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview - Shows modal matching Figma design
 */
export const Overview = {
    render: () => {
        const [showModal, setShowModal] = useState(true);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Session Modal</h6>
                
                <Button
                    text={showModal ? "Hide Modal" : "Show Modal"}
                    style="primary"
                    fill="filled"
                    onClick={() => setShowModal(!showModal)}
                />

                <SessionModal
                    show={showModal}
                    sessionDate="11/02/12"
                    students={defaultStudents}
                    onHide={() => setShowModal(false)}
                    onSort={(column) => console.log('Sort by:', column)}
                />
            </div>
        );
    },
};

/**
 * Interactive - Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [showModal, setShowModal] = useState(args.show);
        const [sortColumn, setSortColumn] = useState('tutorName');

        useEffect(() => {
            setShowModal(args.show);
        }, [args.show]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Session Modal - Interactive
                </h6>
                <Button
                    text={showModal ? "Hide Modal" : "Show Modal"}
                    style="primary"
                    fill="filled"
                    onClick={() => setShowModal(!showModal)}
                />
                <SessionModal
                    show={showModal}
                    sessionDate={args.sessionDate}
                    students={defaultStudents}
                    sortColumn={sortColumn}
                    onHide={() => setShowModal(false)}
                    onSort={(column) => setSortColumn(column)}
                />
            </div>
        );
    },
    args: {
        show: true,
        sessionDate: '11/02/12',
    },
};
