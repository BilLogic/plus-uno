import React, { useState } from 'react';
import Button from '@/components/Button';
import Badge from '@/components/Badge';

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
        borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
        backgroundColor: 'transparent',
        color: activeTab === id ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
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
                zIndex: 1050,
                padding: '24px'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'var(--color-surface-container-high, #fff)',
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
                    borderBottom: '1px solid var(--color-outline-variant)'
                }}>
                    <div>
                        <h2 id="manage-assignment-title" className="h5" style={{ margin: 0, marginBottom: '4px' }}>Manage Assignment</h2>
                        <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                            Review and adjust how students are paired with tutors for optimal learning.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', color: 'var(--color-on-surface-variant)' }}
                    >
                        <i className="fas fa-xmark" />
                    </button>
                </div>

                {/* Tabs: Attendance (active, 20), Assignment */}
                <div style={{ display: 'flex', gap: 0, paddingLeft: '24px', borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <button type="button" style={tabStyle('attendance')} onClick={() => setActiveTab('attendance')}>
                        Attendance <Badge text="20" style="secondary" size="b3" className="ms-1" />
                    </button>
                    <button type="button" style={tabStyle('assignment')} onClick={() => setActiveTab('assignment')}>
                        Assignment
                    </button>
                </div>

                {/* Editing Mode banner per Figma 1687 */}
                <div style={{
                    margin: '16px 24px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-warning-state-08, rgba(159,130,5,0.08))',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--color-on-surface)'
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
                                        border: '1px solid var(--color-outline-variant)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        backgroundColor: 'var(--color-surface-container)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span className="body1-txt" style={{ fontWeight: 600 }}>{tutor.name}</span>
                                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                            <i className="fas fa-users" style={{ marginRight: '6px' }} aria-hidden />
                                            {tutor.count}
                                        </span>
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {tutor.students.map((name, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <i className="fas fa-grip-vertical" style={{ color: 'var(--color-on-surface-variant)', cursor: 'grab' }} aria-hidden />
                                                <span className="body2-txt">{name}</span>
                                                <Badge text="Joined" style="success" size="b3" />
                                            </li>
                                        ))}
                                        {tutor.students.length === 0 && (
                                            <li className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>No students assigned</li>
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
                    borderTop: '1px solid var(--color-outline-variant)'
                }}>
                    <Button text="Close" style="secondary" fill="outline" size="medium" onClick={onClose} />
                    <Button text="Update Assignments" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        </div>
    );
};

export default ManageAssignmentModal;
