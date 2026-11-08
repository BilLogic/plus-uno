import React, { useState } from 'react';
import Button from '@/components/forms-and-inputs/Button';
import StatusTag from '@/components/labels/StatusTag';
import CountTag from '@/components/labels/CountTag';

/**
 * Replicates Design System - Web App Specs node 1687-163680: "Manage Assignment" popup.
 * Title, subtitle, close. Tabs: Attendance (active, count 20), Assignment.
 * Banner: "Editing Mode: Drag students between tutors to reassign them."
 * Tutor cards with student counts and assigned students (Joined badge). Close + Update Assignments.
 * @param {Object} props
 * @param {Function} props.onClose - Close callback
 * @returns {JSX.Element} Manage Assignment modal
 */
const ManageAssignmentModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('attendance');

    const tabStyle = (id) => ({
        padding: '10px 16px',
        border: 'none',
        borderBottom: activeTab === id ? '2px solid var(--ds-border-brand)' : '2px solid transparent',
        backgroundColor: 'transparent',
        color: activeTab === id ? 'var(--ds-text-brand)' : 'var(--ds-text-subtle)',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '14px'
    });

    /** Mock tutor roster per Figma 1687 */
    const tutorAssignments = [
        { id: 1, name: 'Savannah Nguyen', count: 4, students: ['Lila Chen', 'Marcus Lee', 'Ava Patel', 'Ethan Kim'] },
        { id: 2, name: 'Maya Thompson', count: 4, students: ['Sophie Zhang', 'Noah Kim', 'Isabella Roy', 'Liam Park'] },
        { id: 3, name: 'Emma Wang', count: 4, students: [] },
        { id: 4, name: 'Ella Martinez', count: 4, students: [] }
    ];

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-assignment-title"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 'var(--layer-blanket)',
                padding: '24px'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'var(--ds-surface-container)',
                    borderRadius: '16px',
                    width: 'min(900px, 95vw)',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }}
            >
                {/* Header per Figma 1687 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--ds-border)'
                }}>
                    <div>
                        <h2 id="manage-assignment-title" className="h5" style={{ margin: 0, marginBottom: '4px' }}>Manage Assignment</h2>
                        <p className="body2-txt" style={{ margin: 0, color: 'var(--ds-text-subtle)' }}>
                            Review and adjust how students are paired with tutors for optimal learning.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', color: 'var(--ds-text-subtle)' }}
                    >
                        <i className="fas fa-xmark" />
                    </button>
                </div>

                {/* Tabs: Attendance (active, 20), Assignment */}
                <div style={{ display: 'flex', gap: 0, paddingLeft: '24px', borderBottom: '1px solid var(--ds-border)' }}>
                    <button type="button" style={tabStyle('attendance')} onClick={() => setActiveTab('attendance')}>
                        Attendance <CountTag value={20} className="ms-1" />
                    </button>
                    <button type="button" style={tabStyle('assignment')} onClick={() => setActiveTab('assignment')}>
                        Assignment
                    </button>
                </div>

                {/* Editing Mode banner per Figma 1687 */}
                <div style={{
                    margin: '16px 24px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--ds-background-warning)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--ds-text)'
                }}>
                    Editing Mode: Drag students between tutors to reassign them.
                </div>

                {/* Tutor cards grid */}
                <div style={{ overflowY: 'auto', padding: '0 24px 24px', flex: 1 }}>
                    {activeTab === 'attendance' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {tutorAssignments.map((tutor) => (
                                <div
                                    key={tutor.id}
                                    style={{
                                        border: '1px solid var(--ds-border)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        backgroundColor: 'var(--ds-surface-container)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span className="body1-txt" style={{ fontWeight: 600 }}>{tutor.name}</span>
                                        <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                                            <i className="fas fa-users" style={{ marginRight: '6px' }} aria-hidden />
                                            {tutor.count}
                                        </span>
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {tutor.students.map((name, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <i className="fas fa-grip-vertical" style={{ color: 'var(--ds-icon-subtle)', cursor: 'grab' }} aria-hidden />
                                                <span className="body2-txt">{name}</span>
                                                <StatusTag appearance="success">Joined</StatusTag>
                                            </li>
                                        ))}
                                        {tutor.students.length === 0 && (
                                            <li className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>No students assigned</li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'assignment' && (
                        <div className="body2-txt" style={{ padding: '16px 0' }}>Assignment tab content.</div>
                    )}
                </div>

                {/* Footer: Close, Update Assignments */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    padding: '16px 24px',
                    borderTop: '1px solid var(--ds-border)'
                }}>
                    <Button text="Close" onClick={onClose} />
                    <Button text="Update Assignments" appearance="primary" onClick={() => {}} />
                </div>
            </div>
        </div>
    );
};

export default ManageAssignmentModal;
