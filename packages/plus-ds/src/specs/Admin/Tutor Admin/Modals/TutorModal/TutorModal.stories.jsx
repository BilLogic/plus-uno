/**
 * TutorModal - Tutor Admin Modal
 * 
 * Modal for viewing and editing tutor information.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262330
 */

import React, { useState, useEffect } from 'react';
import TutorModal from './TutorModal';
import Button from '../../../../../components/Button/Button';
import './TutorModal.scss';

const defaultTutor = {
    name: 'Amelia Blue',
    preferredName: 'Amy',
    email: 'name@example.com',
    schools: ['Option #1', 'Option #2', 'Option #3'],
    students: ['Option #1', 'Option #2', 'Option #3'],
};

export default {
    title: 'Specs/Admin/Tutor Admin/Modals/TutorModal',
    component: TutorModal,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Modal component for viewing and editing tutor information with tabs.

## Figma Reference
Node ID: 258-262330

## Features
- Two tabs: Tutor Info and Sessions
- Tutor Info tab: form fields for name, email, schools, students
- Sessions tab: table with pagination
- Show Future Sessions toggle
- View Training Progress link
- Delete/Cancel/Save actions
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
            description: 'Initial active tab',
            table: { category: 'Variant' },
        },
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorModal</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Modal component for viewing and editing tutor information. Features two tabs for
                        Tutor Info and Sessions.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Tabs</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Tutor Info</strong>: Edit tutor details, schools, and students</li>
                        <li><strong>Sessions</strong>: View tutor's assigned sessions</li>
                    </ul>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 */
export const Overview = {
    render: () => {
        const [showModal, setShowModal] = useState(true);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Tutor Modal</h6>
                <Button
                    text={showModal ? "Hide Modal" : "Show Modal"}
                    style="primary"
                    fill="filled"
                    onClick={() => setShowModal(!showModal)}
                />
                <TutorModal
                    show={showModal}
                    tutor={defaultTutor}
                    onHide={() => setShowModal(false)}
                    onSave={() => console.log('Save clicked')}
                    onDelete={() => console.log('Delete clicked')}
                />
            </div>
        );
    },
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => {
        const [showModal, setShowModal] = useState(args.show);
        const [activeTab, setActiveTab] = useState(args.initialTab);

        useEffect(() => {
            setShowModal(args.show);
        }, [args.show]);

        useEffect(() => {
            setActiveTab(args.initialTab);
        }, [args.initialTab]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Tutor Modal - Interactive
                </h6>
                <Button
                    text={showModal ? "Hide Modal" : "Show Modal"}
                    style="primary"
                    fill="filled"
                    onClick={() => setShowModal(!showModal)}
                />
                <TutorModal
                    show={showModal}
                    tutor={defaultTutor}
                    initialTab={activeTab}
                    onHide={() => setShowModal(false)}
                    onSave={() => console.log('Save clicked')}
                    onDelete={() => console.log('Delete clicked')}
                    onTabChange={(tab) => {
                        setActiveTab(tab);
                        console.log('Tab changed:', tab);
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
 * InfoTab - Shows modal with Info tab active
 */
export const InfoTab = {
    render: () => {
        const [showModal, setShowModal] = useState(true);

        return (
            <TutorModal
                show={showModal}
                tutor={defaultTutor}
                initialTab="info"
                onHide={() => setShowModal(false)}
                onSave={() => console.log('Save clicked')}
                onDelete={() => console.log('Delete clicked')}
            />
        );
    },
};

/**
 * SessionsTab - Shows modal with Sessions tab active
 */
export const SessionsTab = {
    render: () => {
        const [showModal, setShowModal] = useState(true);

        return (
            <TutorModal
                show={showModal}
                tutor={defaultTutor}
                initialTab="sessions"
                onHide={() => setShowModal(false)}
                onSave={() => console.log('Save clicked')}
                onDelete={() => console.log('Delete clicked')}
            />
        );
    },
};
