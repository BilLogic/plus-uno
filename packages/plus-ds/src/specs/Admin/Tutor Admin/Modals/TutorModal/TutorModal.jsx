/**
 * TutorModal Component
 * 
 * Modal for viewing and editing tutor information with tabs (Tutor Info / Sessions).
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262330
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Table } from 'react-bootstrap';
import Button from '../../../../../components/Button/Button';
import Badge from '../../../../../components/Badge/Badge';
import Switch from '../../../../../forms/Switch';
import Pagination from '../../../../../components/Pagination/Pagination';
import './TutorModal.scss';

const TutorModal = ({
    show = false,
    tutor = {},
    sessions = [],
    initialTab = 'info',
    showFutureSessions = false,
    onHide,
    onSave,
    onDelete,
    onTabChange,
    className = '',
    ...props
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        preferredName: tutor.preferredName || '',
        email: tutor.email || '',
        schools: tutor.schools || [],
        students: tutor.students || [],
    });

    // Sync tab with props
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    // Default sessions data
    const defaultSessions = [
        { id: 1, date: 'Monday (01/10/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 2, date: 'Friday (01/28/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 3, date: 'Thursday (01/27/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 4, date: 'Wednesday (01/26/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 5, date: 'Tuesday (01/25/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
    ];

    const displaySessions = sessions.length > 0 ? sessions : defaultSessions;
    const entriesPerPage = 5;
    const totalEntries = displaySessions.length;
    const paginatedSessions = displaySessions.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="lg"
            className={`tutor-modal ${className}`}
            {...props}
        >
            <div className="tutor-modal__container">
                {/* Header */}
                <div className="tutor-modal__header">
                    <h4 className="h4 tutor-modal__title">
                        {tutor.name || 'Amelia Blue'}
                    </h4>
                    <button
                        type="button"
                        className="tutor-modal__close"
                        onClick={onHide}
                        aria-label="Close"
                    >
                        <i className="fas fa-xmark" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="tutor-modal__tabs">
                    <button
                        className={`tutor-modal__tab ${activeTab === 'info' ? 'tutor-modal__tab--active' : ''}`}
                        onClick={() => handleTabClick('info')}
                    >
                        Tutor Info
                    </button>
                    <button
                        className={`tutor-modal__tab ${activeTab === 'sessions' ? 'tutor-modal__tab--active' : ''}`}
                        onClick={() => handleTabClick('sessions')}
                    >
                        Sessions
                        <Badge style="info" size="b3" className="tutor-modal__tab-badge">
                            {totalEntries}
                        </Badge>
                    </button>
                    <a href="#" className="tutor-modal__link">
                        View Training Progress
                        <i className="fas fa-arrow-up-right-from-square" />
                    </a>
                </div>

                {/* Body */}
                <div className="tutor-modal__body">
                    {activeTab === 'info' && (
                        <div className="tutor-modal__info-tab">
                            <Form>
                                <Form.Group className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Preferred name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Amy"
                                        value={formData.preferredName}
                                        onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                                    />
                                </Form.Group>

                                <Form.Group className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </Form.Group>

                                <Form.Group className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Schools this tutor works with</Form.Label>
                                    <div className="tutor-modal__button-group">
                                        {['Option #1', 'Option #2', 'Option #3'].map((option, index) => (
                                            <Button
                                                key={index}
                                                text={option}
                                                style="secondary"
                                                fill="outlined"
                                                size="small"
                                            />
                                        ))}
                                    </div>
                                </Form.Group>

                                <Form.Group className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Students this tutor has worked with</Form.Label>
                                    <div className="tutor-modal__button-group">
                                        {['Option #1', 'Option #2', 'Option #3'].map((option, index) => (
                                            <Button
                                                key={index}
                                                text={option}
                                                style="secondary"
                                                fill="outlined"
                                                size="small"
                                            />
                                        ))}
                                    </div>
                                </Form.Group>

                                <div className="tutor-modal__student-count body3-txt">
                                    (#) students
                                </div>

                                <div className="tutor-modal__lead-toggle">
                                    <Switch
                                        id="tutor-lead"
                                        label="This tutor is a lead"
                                        size="medium"
                                    />
                                </div>
                            </Form>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="tutor-modal__sessions-tab">
                            <div className="tutor-modal__sessions-toggle">
                                <Switch
                                    id="show-future-sessions"
                                    label="Show Future Sessions"
                                    size="medium"
                                    checked={showFutureSessions}
                                />
                            </div>

                            <Table className="tutor-modal__sessions-table">
                                <thead>
                                    <tr>
                                        <th className="body3-txt">
                                            Day (Date)
                                            <i className="fas fa-sort tutor-modal__sort-icon" />
                                        </th>
                                        <th className="body3-txt">Shift (ET)</th>
                                        <th className="body3-txt">
                                            School
                                            <i className="fas fa-sort tutor-modal__sort-icon" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSessions.map((session) => (
                                        <tr key={session.id}>
                                            <td className="body3-txt">{session.date}</td>
                                            <td className="body3-txt">{session.shift}</td>
                                            <td>
                                                <Badge style="secondary" size="b3">
                                                    {session.school}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <div className="tutor-modal__sessions-pagination">
                                <div className="body3-txt">
                                    Showing 1 to {Math.min(entriesPerPage, totalEntries)} of {totalEntries} entries
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(totalEntries / entriesPerPage)}
                                    onPageChange={setCurrentPage}
                                    type="icon"
                                    size="small"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="tutor-modal__footer">
                    <Button
                        text="Delete This Tutor"
                        style="danger"
                        fill="text"
                        size="medium"
                        onClick={onDelete}
                    />
                    <div className="tutor-modal__actions">
                        <Button
                            text="Cancel"
                            style="secondary"
                            fill="text"
                            size="medium"
                            onClick={onHide}
                        />
                        <Button
                            text="Save"
                            style="primary"
                            fill="filled"
                            size="medium"
                            onClick={onSave}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

TutorModal.propTypes = {
    /** Whether the modal is visible */
    show: PropTypes.bool,
    /** Tutor object */
    tutor: PropTypes.shape({
        name: PropTypes.string,
        preferredName: PropTypes.string,
        email: PropTypes.string,
        schools: PropTypes.array,
        students: PropTypes.array,
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
    /** Show future sessions toggle state */
    showFutureSessions: PropTypes.bool,
    /** Callback when modal is closed */
    onHide: PropTypes.func,
    /** Callback when Save is clicked */
    onSave: PropTypes.func,
    /** Callback when Delete is clicked */
    onDelete: PropTypes.func,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorModal;
