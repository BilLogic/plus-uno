/**
 * StudentModal Component
 * 
 * Modal for viewing/editing student information with tabs: Student Info, Sessions
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=317-126488
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Table, Form } from 'react-bootstrap';
import Button from '../../../../../components/Button/Button';
import Badge from '../../../../../components/Badge/Badge';
import Pagination from '../../../../../components/Pagination/Pagination';
import Switch from '@/forms/Switch';
import './StudentModal.scss';

const StudentModal = ({
    show = false,
    student = {},
    sessions = [],
    initialTab = 'info',
    onHide,
    onSave,
    onDelete,
    className = '',
    ...props
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showFutureSessions, setShowFutureSessions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        preferredName: student.preferredName || student.name || '',
        email: student.email || 'name@example.com',
        status: student.status || '',
        school: student.school || '',
        tutors: student.tutors || '',
    });

    // Sync activeTab with initialTab prop
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Default sessions data
    const defaultSessions = [
        { id: 1, date: 'Monday (01/31/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 2, date: 'Friday (01/28/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 3, date: 'Thursday (01/27/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 4, date: 'Wednesday (01/26/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 5, date: 'Tuesday (01/25/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
    ];

    const displaySessions = sessions.length > 0 ? sessions : defaultSessions;
    const totalSessions = 36;
    const sessionsPerPage = 5;
    const totalPages = Math.ceil(totalSessions / sessionsPerPage);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(formData);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(student);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            className={`student-modal ${className}`}
            {...props}
        >
            <div className="student-modal__container">
                {/* Header */}
                <div className="student-modal__header">
                    <h4 className="h4 student-modal__title">
                        {student.name || 'Student Name'}
                    </h4>
                    <button
                        className="student-modal__close-btn"
                        onClick={onHide}
                        aria-label="Close"
                    >
                        <i className="fas fa-xmark" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="student-modal__tabs">
                    <button
                        className={`student-modal__tab ${activeTab === 'info' ? 'student-modal__tab--active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        <span className="h6">Student Info</span>
                    </button>
                    <button
                        className={`student-modal__tab ${activeTab === 'sessions' ? 'student-modal__tab--active' : ''}`}
                        onClick={() => setActiveTab('sessions')}
                    >
                        <span className="h6">Sessions</span>
                        <Badge style="default" size="b3" className="student-modal__tab-badge">
                            {totalSessions}
                        </Badge>
                    </button>
                </div>

                {/* Body */}
                <div className="student-modal__body">
                    {activeTab === 'info' ? (
                        <div className="student-modal__info-content">
                            {/* Name and Email row */}
                            <div className="student-modal__form-row">
                                <div className="student-modal__form-field">
                                    <label className="body3-txt student-modal__label">Preferred name</label>
                                    <Form.Control
                                        type="text"
                                        value={formData.preferredName}
                                        onChange={(e) => handleFormChange('preferredName', e.target.value)}
                                        className="student-modal__input"
                                        placeholder="Name"
                                    />
                                </div>
                                <div className="student-modal__form-field">
                                    <label className="body3-txt student-modal__label">Email</label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleFormChange('email', e.target.value)}
                                        className="student-modal__input"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            {/* Student status */}
                            <div className="student-modal__form-field student-modal__form-field--full">
                                <label className="body3-txt student-modal__label">Student status</label>
                                <div className="student-modal__select-wrapper">
                                    <Form.Control
                                        type="text"
                                        value={formData.status}
                                        onChange={(e) => handleFormChange('status', e.target.value)}
                                        className="student-modal__input"
                                        placeholder="Placeholder"
                                        readOnly
                                    />
                                    <i className="fas fa-arrows-up-down student-modal__select-icon" />
                                </div>
                            </div>

                            {/* School */}
                            <div className="student-modal__form-field student-modal__form-field--full">
                                <label className="body3-txt student-modal__label">School this student attends</label>
                                <div className="student-modal__select-wrapper">
                                    <Form.Control
                                        type="text"
                                        value={formData.school}
                                        onChange={(e) => handleFormChange('school', e.target.value)}
                                        className="student-modal__input"
                                        placeholder="Placeholder"
                                        readOnly
                                    />
                                    <i className="fas fa-arrows-up-down student-modal__select-icon" />
                                </div>
                            </div>

                            {/* Tutors */}
                            <div className="student-modal__form-field student-modal__form-field--full">
                                <label className="body3-txt student-modal__label">Tutors this student has worked with</label>
                                <div className="student-modal__select-wrapper">
                                    <Form.Control
                                        type="text"
                                        value={formData.tutors}
                                        onChange={(e) => handleFormChange('tutors', e.target.value)}
                                        className="student-modal__input"
                                        placeholder="Placeholder"
                                        readOnly
                                    />
                                    <i className="fas fa-arrows-up-down student-modal__select-icon" />
                                </div>
                                <span className="body3-txt student-modal__caption">{'{#}'} tutors</span>
                            </div>
                        </div>
                    ) : (
                        <div className="student-modal__sessions-content">
                            {/* Show Future Sessions toggle */}
                            <div className="student-modal__sessions-toggle">
                                <Switch
                                    id="show-future-sessions"
                                    checked={showFutureSessions}
                                    onChange={(e) => setShowFutureSessions(e.target.checked)}
                                    label="Show Future Sessions"
                                    size="medium"
                                    className="student-modal__switch"
                                />
                            </div>

                            {/* Sessions Table */}
                            <Table className="student-modal__sessions-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <div className="student-modal__th-content">
                                                <span className="body3-txt" style={{ color: 'var(--color-secondary-text)' }}>Day (Date)</span>
                                                <i className="fas fa-arrow-up" style={{ fontSize: '10px', color: 'var(--color-secondary)' }} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="student-modal__th-content">
                                                <span className="body3-txt">Shift (ET)</span>
                                                <i className="fas fa-arrow-up" style={{ fontSize: '10px', color: 'var(--color-outline-variant)' }} />
                                            </div>
                                        </th>
                                        <th>
                                            <div className="student-modal__th-content">
                                                <span className="body3-txt">School</span>
                                                <i className="fas fa-arrow-up" style={{ fontSize: '10px', color: 'var(--color-outline-variant)' }} />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displaySessions.map((session) => (
                                        <tr key={session.id}>
                                            <td>
                                                <span className="body3-txt" style={{ fontWeight: 300 }}>{session.date}</span>
                                            </td>
                                            <td>
                                                <span className="body3-txt" style={{ fontWeight: 300 }}>{session.shift}</span>
                                            </td>
                                            <td>
                                                <Badge style="secondary" size="b3">
                                                    {session.school}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {/* Pagination */}
                            <div className="student-modal__sessions-pagination">
                                <span className="body2-txt" style={{ fontWeight: 300 }}>
                                    Showing 1 to {sessionsPerPage} of {totalSessions} entries
                                </span>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="student-modal__footer">
                    <Button
                        text="Delete This Student"
                        style="danger"
                        fill="text"
                        size="medium"
                        onClick={handleDelete}
                    />
                    <Button
                        text="Cancel"
                        style="secondary"
                        fill="tonal"
                        size="medium"
                        onClick={onHide}
                    />
                    <Button
                        text="Save"
                        style="primary"
                        fill="filled"
                        size="medium"
                        onClick={handleSave}
                    />
                </div>
            </div>
        </Modal>
    );
};

StudentModal.propTypes = {
    /** Whether the modal is visible */
    show: PropTypes.bool,
    /** Student data object */
    student: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        preferredName: PropTypes.string,
        email: PropTypes.string,
        status: PropTypes.string,
        school: PropTypes.string,
        tutors: PropTypes.string,
    }),
    /** Array of session objects */
    sessions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        date: PropTypes.string,
        shift: PropTypes.string,
        school: PropTypes.string,
    })),
    /** Initial active tab ('info' or 'sessions') */
    initialTab: PropTypes.oneOf(['info', 'sessions']),
    /** Callback when modal is closed */
    onHide: PropTypes.func,
    /** Callback when save is clicked */
    onSave: PropTypes.func,
    /** Callback when delete is clicked */
    onDelete: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default StudentModal;
