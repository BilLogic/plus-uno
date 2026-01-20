import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import ListGroup, { ListGroupItem } from '@/components/ListGroup';
import Badge from '@/components/Badge';

const EditSessionModal = ({ session, onClose }) => {
    const [activeTab, setActiveTab] = useState('attendees');

    // Mock data for rosters
    const tutorRoster = [
        { id: 1, name: 'Dr. Sarah Johnson' },
        { id: 2, name: 'Prof. Michael Chen' }
    ];

    const studentRoster = [
        { id: 1, name: 'Alex Martinez' },
        { id: 2, name: 'Jordan Smith' },
        { id: 3, name: 'Taylor Brown' },
        { id: 4, name: 'Casey Davis' },
        { id: 5, name: 'Morgan Wilson' },
        { id: 6, name: 'Riley Anderson' },
        { id: 7, name: 'Quinn Taylor' },
        { id: 8, name: 'Sage Moore' },
        { id: 9, name: 'River Lee' },
        { id: 10, name: 'Phoenix White' },
        { id: 11, name: 'Blake Johnson' },
        { id: 12, name: 'Cameron Garcia' },
        { id: 13, name: 'Dakota Martinez' },
        { id: 14, name: 'Emery Rodriguez' },
        { id: 15, name: 'Finley Lopez' },
        { id: 16, name: 'Gray Harris' },
        { id: 17, name: 'Hayden Clark' },
        { id: 18, name: 'Indigo Lewis' },
        { id: 19, name: 'Jasper Walker' },
        { id: 20, name: 'Kai Hall' }
    ];

    const handleRemoveTutor = (tutorId) => {
        console.log('Remove tutor:', tutorId);
        // In a real app, this would update state/API
    };

    const tabButtonStyle = (tabName) => {
        const isActive = activeTab === tabName;
        return {
            flex: 1,
            padding: 'var(--size-element-pad-y-md, 12px) var(--size-element-pad-x-md, 16px)',
            border: 'none',
            backgroundColor: isActive 
                ? 'var(--color-primary-state-08, rgba(25, 118, 210, 0.08))' 
                : 'var(--color-secondary-state-08, rgba(121, 116, 126, 0.08))',
            color: isActive 
                ? 'var(--color-primary-text, #1976d2)' 
                : 'var(--color-secondary-text, #79707e)',
            fontWeight: isActive ? '600' : '600',
            cursor: 'pointer',
            borderRadius: activeTab === 'info' 
                ? 'var(--size-element-radius-md, 8px) 0 0 var(--size-element-radius-md, 8px)'
                : '0 var(--size-element-radius-md, 8px) var(--size-element-radius-md, 8px) 0',
            transition: 'all 0.2s ease'
        };
    };

    const renderModalBody = () => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-modal-gap-md, 24px)',
            width: '100%'
        }}>
            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: 0,
                borderRadius: 'var(--size-element-radius-md, 8px)',
                overflow: 'hidden',
                marginBottom: 'var(--size-modal-gap-md, 24px)'
            }}>
                <button
                    type="button"
                    style={tabButtonStyle('info')}
                    onClick={() => setActiveTab('info')}
                >
                    Session Info
                </button>
                <button
                    type="button"
                    style={tabButtonStyle('attendees')}
                    onClick={() => setActiveTab('attendees')}
                >
                    Attendees
                    <Badge
                        text="20"
                        style="primary"
                        size="b2"
                        className="ms-2"
                    />
                </button>
            </div>

            {/* TEST ELEMENT - Should always be visible */}
            <div style={{ 
                padding: '20px', 
                backgroundColor: '#ffeb3b', 
                border: '3px solid #ff9800',
                marginBottom: '20px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#000000'
            }}>
                🧪 TEST ELEMENT - If you see this, modal content is rendering!
                <br />
                Active Tab: <strong>{activeTab}</strong>
                <br />
                Tutor Count: <strong>{tutorRoster.length}</strong>
                <br />
                Student Count: <strong>{studentRoster.length}</strong>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div style={{ width: '100%' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-section-gap-md, 24px)'
                    }}>
                        <div>
                            <label className="body2-txt" style={{ 
                                display: 'block',
                                marginBottom: 'var(--size-element-gap-sm, 8px)',
                                fontWeight: '600'
                            }}>
                                Session Name
                            </label>
                            <input 
                                type="text" 
                                className="form-control"
                                defaultValue={session?.title || ''}
                                style={{
                                    padding: 'var(--size-element-pad-y-md, 12px) var(--size-element-pad-x-md, 16px)',
                                    borderRadius: 'var(--size-element-radius-md, 8px)',
                                    border: '1px solid var(--color-outline-variant, #cac4d0)'
                                }}
                            />
                        </div>
                        <div>
                            <label className="body2-txt" style={{ 
                                display: 'block',
                                marginBottom: 'var(--size-element-gap-sm, 8px)',
                                fontWeight: '600'
                            }}>
                                Date & Time
                            </label>
                            <input 
                                type="text" 
                                className="form-control"
                                defaultValue={session?.subtitle || ''}
                                style={{
                                    padding: 'var(--size-element-pad-y-md, 12px) var(--size-element-pad-x-md, 16px)',
                                    borderRadius: 'var(--size-element-radius-md, 8px)',
                                    border: '1px solid var(--color-outline-variant, #cac4d0)'
                                }}
                            />
                        </div>
                        <div>
                            <label className="body2-txt" style={{ 
                                display: 'block',
                                marginBottom: 'var(--size-element-gap-sm, 8px)',
                                fontWeight: '600'
                            }}>
                                Description
                            </label>
                            <textarea 
                                className="form-control"
                                rows={4}
                                defaultValue={session?.body || ''}
                                style={{
                                    padding: 'var(--size-element-pad-y-md, 12px) var(--size-element-pad-x-md, 16px)',
                                    borderRadius: 'var(--size-element-radius-md, 8px)',
                                    border: '1px solid var(--color-outline-variant, #cac4d0)',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendees' ? (
                <div style={{ width: '100%', minHeight: '400px', padding: '16px 0', backgroundColor: '#f9f9f9' }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '24px',
                        width: '100%',
                        visibility: 'visible',
                        opacity: 1
                    }}>
                        {/* Tutor Roster */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            visibility: 'visible',
                            opacity: 1
                        }}>
                            <h3 style={{ 
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#000000',
                                visibility: 'visible'
                            }}>
                                Tutor Roster
                            </h3>
                            <div style={{
                                border: '1px solid #cac4d0',
                                borderRadius: '12px',
                                padding: '16px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                backgroundColor: '#ffffff'
                            }}>
                                {tutorRoster.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {tutorRoster.map((tutor) => (
                                            <div 
                                                key={tutor.id}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid #e0e0e0',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <span style={{ fontSize: '16px', color: '#000000' }}>{tutor.name}</span>
                                                <Button
                                                    text="Remove"
                                                    style="secondary"
                                                    fill="outline"
                                                    size="small"
                                                    onClick={() => handleRemoveTutor(tutor.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '12px', color: '#666' }}>No tutors assigned</div>
                                )}
                            </div>
                        </div>

                        {/* Student Roster */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <h3 style={{ 
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#000000'
                            }}>
                                Student Roster
                            </h3>
                            <div style={{
                                border: '1px solid #cac4d0',
                                borderRadius: '12px',
                                padding: '16px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                backgroundColor: '#ffffff'
                            }}>
                                {studentRoster.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {studentRoster.map((student) => (
                                            <div 
                                                key={student.id}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid #e0e0e0',
                                                    fontSize: '16px',
                                                    color: '#000000'
                                                }}
                                            >
                                                {student.name}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '12px', color: '#666' }}>No students assigned                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '20px', color: '#666' }}>Attendees tab content not rendering. Active tab: {activeTab}</div>
            )}
        </div>
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: 'var(--size-section-pad-md, 24px)'
        }}
        onClick={(e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}
        >
            <div onClick={(e) => e.stopPropagation()} style={{ width: '900px', maxWidth: '90vw' }}>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-high, #ffffff)',
                    borderRadius: 'var(--size-modal-radius-md, 16px)',
                    padding: 'var(--size-modal-pad-md, 24px)',
                    width: '900px',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* Modal Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid var(--color-outline-variant, #e0e0e0)'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Edit Session</h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                color: '#666'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    
                    {/* Modal Body - Direct rendering */}
                    {renderModalBody()}
                </div>
            </div>
        </div>
    );
};

export default EditSessionModal;

