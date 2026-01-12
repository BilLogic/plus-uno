/**
 * StudentModal - Admin Student Admin Modal
 * 
 * Modal for viewing/editing student information with tabs: Student Info, Sessions.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=317-126488
 */

import React, { useState, useEffect } from 'react';
import StudentModal from './StudentModal';
import Button from '../../../../../components/Button/Button';
import './StudentModal.scss';

export default {
    title: 'Specs/Admin/Student Admin/Modals/StudentModal',
    component: StudentModal,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Modal component for viewing and editing student information. Features two tabs: Student Info (form fields) and Sessions (table with pagination).

## Figma Reference
Node ID: 317-126488

## Features
- Tab navigation (Student Info / Sessions)
- Form fields: Preferred name, Email, Student status, School, Tutors
- Sessions table with sortable columns
- Pagination for sessions
- Show Future Sessions toggle
- Delete, Cancel, Save actions

## Variants
- **Info**: Shows student information form
- **Sessions**: Shows session history table with pagination
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
        initialTab: {
            control: 'radio',
            options: ['info', 'sessions'],
            description: 'Initial active tab (variant)',
            table: { category: 'Variant' },
        },
    },
};

/**
 * Docs
 * Documentation for StudentModal component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>StudentModal</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Modal component for viewing and editing student information. Features two tabs:
                        Student Info with form fields, and Sessions with a paginated table of session history.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>show</strong>: Whether the modal is visible</li>
                        <li><strong>student</strong>: Student data object</li>
                        <li><strong>sessions</strong>: Array of session objects</li>
                        <li><strong>initialTab</strong>: Initial active tab ('info' or 'sessions')</li>
                        <li><strong>onHide</strong>: Callback when modal is closed</li>
                        <li><strong>onSave</strong>: Callback when save is clicked</li>
                        <li><strong>onDelete</strong>: Callback when delete is clicked</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Variants (Tabs)</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Info (info)</strong>: Form fields for name, email, status, school, tutors</li>
                        <li><strong>Sessions (sessions)</strong>: Table showing Day, Shift, School with pagination</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 317-126488
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows modal matching Figma design
 */
export const Overview = {
    render: () => {
        const [showModal, setShowModal] = useState(true);
        const [variant, setVariant] = useState('info');

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Student Modal</h6>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <Button
                        text={showModal ? "Hide Modal" : "Show Modal"}
                        style="primary"
                        fill="filled"
                        onClick={() => setShowModal(!showModal)}
                    />
                    <Button
                        text="Info Variant"
                        style={variant === 'info' ? 'primary' : 'secondary'}
                        fill={variant === 'info' ? 'filled' : 'outlined'}
                        onClick={() => setVariant('info')}
                    />
                    <Button
                        text="Sessions Variant"
                        style={variant === 'sessions' ? 'primary' : 'secondary'}
                        fill={variant === 'sessions' ? 'filled' : 'outlined'}
                        onClick={() => setVariant('sessions')}
                    />
                </div>

                <StudentModal
                    show={showModal}
                    initialTab={variant}
                    student={{
                        id: 1,
                        name: 'Student Name',
                        preferredName: 'Name',
                        email: 'name@example.com',
                        status: '',
                        school: '',
                        tutors: '',
                    }}
                    sessions={[
                        { id: 1, date: 'Monday (01/31/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 2, date: 'Friday (01/28/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 3, date: 'Thursday (01/27/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 4, date: 'Wednesday (01/26/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 5, date: 'Tuesday (01/25/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                    ]}
                    onHide={() => setShowModal(false)}
                    onSave={(data) => console.log('Save clicked:', data)}
                    onDelete={(student) => console.log('Delete clicked:', student)}
                />
            </div>
        );
    },
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [showModal, setShowModal] = useState(args.show);

        // Sync with args.show control
        useEffect(() => {
            setShowModal(args.show);
        }, [args.show]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Student Modal - Interactive ({args.initialTab === 'info' ? 'Info' : 'Sessions'} Variant)
                </h6>
                <Button
                    text={showModal ? "Hide Modal" : "Show Modal"}
                    style="primary"
                    fill="filled"
                    onClick={() => setShowModal(!showModal)}
                />
                <StudentModal
                    show={showModal}
                    initialTab={args.initialTab}
                    student={{
                        id: 1,
                        name: 'Jose Dolus',
                        preferredName: 'Jose',
                        email: 'jose.dolus@example.com',
                        status: 'Active',
                        school: 'Langley',
                        tutors: 'Ruth Perez, Jose Mura',
                    }}
                    onHide={() => setShowModal(false)}
                    onSave={(data) => {
                        console.log('Save clicked:', data);
                    }}
                    onDelete={(student) => {
                        console.log('Delete clicked:', student);
                    }}
                />
            </div>
        );
    },
    args: {
        show: true,
        initialTab: 'info',
    },
};

/**
 * Info Variant
 * Shows the Student Info tab
 */
export const InfoVariant = {
    render: () => {
        const [showModal, setShowModal] = useState(true);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Info Variant</h6>
                <Button
                    text={showModal ? "Hide Modal" : "Show Modal"}
                    style="primary"
                    fill="filled"
                    onClick={() => setShowModal(!showModal)}
                />
                <StudentModal
                    show={showModal}
                    initialTab="info"
                    student={{
                        id: 1,
                        name: 'Student Name',
                        preferredName: 'Name',
                        email: 'name@example.com',
                    }}
                    onHide={() => setShowModal(false)}
                />
            </div>
        );
    },
};

/**
 * Sessions Variant
 * Shows the Sessions tab
 */
export const SessionsVariant = {
    render: () => {
        const [showModal, setShowModal] = useState(true);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Sessions Variant</h6>
                <Button
                    text={showModal ? "Hide Modal" : "Show Modal"}
                    style="primary"
                    fill="filled"
                    onClick={() => setShowModal(!showModal)}
                />
                <StudentModal
                    show={showModal}
                    initialTab="sessions"
                    student={{
                        id: 1,
                        name: 'Student Name',
                    }}
                    sessions={[
                        { id: 1, date: 'Monday (01/31/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 2, date: 'Friday (01/28/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 3, date: 'Thursday (01/27/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 4, date: 'Wednesday (01/26/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                        { id: 5, date: 'Tuesday (01/25/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
                    ]}
                    onHide={() => setShowModal(false)}
                />
            </div>
        );
    },
};
