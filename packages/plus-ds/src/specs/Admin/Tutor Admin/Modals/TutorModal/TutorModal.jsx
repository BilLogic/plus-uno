/**
 * TutorModal Component
 * 
 * Modal for viewing/editing tutor information or adding a new tutor.
 * Supports two modes: 'edit' (default) and 'add'.
 * Matches Figma: node-id=258-262330
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form } from 'react-bootstrap';
import TutorSessionsTable from '../../Tables/TutorSessionsTable/TutorSessionsTable';
import Button from '../../../../../components/Button/Button';
import Badge from '../../../../../components/Badge/Badge';
import Switch from '@/forms/Switch';
import Select from '@/forms/Select';
import Input from '@/forms/Input';
import Pagination from '../../../../../components/Pagination/Pagination';
import './TutorModal.scss';

const TutorModal = ({
    show = false,
    mode = 'edit', // 'edit' or 'add'
    tutor = {},
    sessions = [],
    initialTab,
    showFutureSessions = false,
    onHide,
    onSave,
    onDelete,
    onTabChange,
    className = '',
    ...props
}) => {
    // Determine initial tab based on mode if not provided
    const defaultTab = mode === 'add' ? 'individual' : 'info';
    const [activeTab, setActiveTab] = useState(initialTab || defaultTab);
    const [currentPage, setCurrentPage] = useState(1);

    // Form Data State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        preferredName: '',
        email: '',
        schools: [], // For Edit mode (Tags)
        students: [], // For Edit mode (Tags)
        group: '', // For Add mode (Select)
        student: '', // For Add mode (Select)
        isLead: false
    });

    // Initialize/Reset form data when modal opens or mode/tutor changes
    useEffect(() => {
        if (mode === 'edit' && tutor) {
            setFormData({
                firstName: tutor.firstName || '',
                lastName: tutor.lastName || '',
                preferredName: tutor.preferredName || '',
                email: tutor.email || '',
                schools: tutor.schools || [],
                students: tutor.students || [],
                group: '',
                student: '',
                isLead: tutor.isLead || false
            });
            setActiveTab(initialTab || 'info');
        } else if (mode === 'add') {
            setFormData({
                firstName: '',
                lastName: '',
                preferredName: '',
                email: '',
                schools: [],
                students: [],
                group: '',
                student: '',
                isLead: false
            });
            setActiveTab(initialTab || 'individual');
        }
    }, [mode, tutor, show, initialTab]); // Reset on show toggle too?

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    // Default sessions data (keep existing mock logic)
    const defaultSessions = [
        { id: 1, day: 'Monday (01/10/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 2, day: 'Friday (01/28/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 3, day: 'Thursday (01/27/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 4, day: 'Wednesday (01/26/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { id: 5, day: 'Tuesday (01/25/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
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
            className={`tutor-modal tutor-modal--${mode} ${className}`}
            {...props}
        >
            <div className="tutor-modal__container">
                {/* Header */}
                <div className="tutor-modal__header">
                    <h4 className="h4 tutor-modal__title">
                        {mode === 'add' ? 'Add a new tutor:' : (tutor.name || 'Amelia Blue')}
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
                    {mode === 'edit' ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <button
                                className={`tutor-modal__tab ${activeTab === 'individual' ? 'tutor-modal__tab--active' : ''}`}
                                onClick={() => handleTabClick('individual')}
                            >
                                <i className="fas fa-user" style={{ fontSize: '12px', marginRight: '6px' }} />
                                Individual Tutor
                            </button>
                            <button
                                className={`tutor-modal__tab ${activeTab === 'multiple' ? 'tutor-modal__tab--active' : ''}`}
                                onClick={() => handleTabClick('multiple')}
                            >
                                <i className="fas fa-users" style={{ fontSize: '12px', marginRight: '6px' }} />
                                Multiple Tutors
                            </button>
                        </>
                    )}
                </div>

                {/* Helper Link for Edit Mode - Moved below tabs */}
                {mode === 'edit' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                        <a href="#" className="tutor-modal__link" style={{ marginLeft: 0 }}>
                            View Training Progress
                            <i className="fas fa-arrow-up-right-from-square" />
                        </a>
                    </div>
                )}

                {/* Body */}
                <div className="tutor-modal__body">
                    {/* EDIT: INFO TAB */}
                    {mode === 'edit' && activeTab === 'info' && (
                        <div className="tutor-modal__info-tab">
                            <Form>
                                <div className="tutor-modal__form-group">
                                    <Input
                                        label="Preferred name"
                                        type="text"
                                        placeholder="Amy"
                                        value={formData.preferredName}
                                        onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                                        size="small"
                                    />
                                </div>

                                <div className="tutor-modal__form-group">
                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        size="small"
                                    />
                                </div>

                                <Form.Group className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Schools this tutor works with</Form.Label>
                                    <div className="tutor-modal__tag-container">
                                        {['Option #1', 'Option #2', 'Option #3'].map((option, index) => (
                                            <Button
                                                key={index}
                                                text={option}
                                                style="secondary"
                                                fill="filled" // Changing to filled based on screenshot appearance (darker gray on light gray)
                                                size="small"
                                            />
                                        ))}
                                    </div>
                                </Form.Group>

                                <Form.Group className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Students this tutor has worked with</Form.Label>
                                    <div className="tutor-modal__tag-container">
                                        {['Option #1', 'Option #2', 'Option #3'].map((option, index) => (
                                            <Button
                                                key={index}
                                                text={option}
                                                style="secondary"
                                                fill="filled"
                                                size="small"
                                            />
                                        ))}
                                    </div>
                                    <div className="tutor-modal__student-count body3-txt">
                                        (#) students
                                    </div>
                                </Form.Group>

                                <div className="tutor-modal__lead-toggle">
                                    <Switch
                                        id="tutor-lead-edit"
                                        label="This tutor is a lead"
                                        size="medium"
                                        checked={formData.isLead}
                                        onChange={(checked) => setFormData({ ...formData, isLead: checked })}
                                    />
                                </div>
                            </Form>
                        </div>
                    )}

                    {/* EDIT: SESSIONS TAB */}
                    {mode === 'edit' && activeTab === 'sessions' && (
                        <div className="tutor-modal__sessions-tab">
                            <div className="tutor-modal__sessions-toggle">
                                <Switch
                                    id="show-future-sessions"
                                    label="Show Future Sessions"
                                    size="medium"
                                    checked={showFutureSessions}
                                />
                            </div>

                            <TutorSessionsTable
                                sessions={paginatedSessions}
                                className="tutor-modal__sessions-table"
                                sortable={true}
                            />

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

                    {/* ADD: INDIVIDUAL TAB */}
                    {mode === 'add' && activeTab === 'individual' && (
                        <div className="tutor-modal__add-tab">
                            <Form>
                                <div className="tutor-modal__row">
                                    <div className="tutor-modal__form-group tutor-modal__half-width">
                                        <Input
                                            label="First Name"
                                            required
                                            type="text"
                                            placeholder="Ex. Jon"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            size="small"
                                        />
                                    </div>
                                    <div className="tutor-modal__form-group tutor-modal__half-width">
                                        <Input
                                            label="Last Name"
                                            required
                                            type="text"
                                            placeholder="Ex. Doe"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            size="small"
                                        />
                                    </div>
                                </div>

                                <div className="tutor-modal__form-group">
                                    <Input
                                        label="Preferred Name"
                                        type="text"
                                        placeholder="Preferred Name (optional)"
                                        value={formData.preferredName}
                                        onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                                        size="small"
                                    />
                                </div>

                                <div className="tutor-modal__form-group">
                                    <Input
                                        label="Tutor Email"
                                        type="email"
                                        placeholder="Tutor email (optional)"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        size="small"
                                    />
                                </div>

                                <div className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Groups this tutor is enrolled in</Form.Label>
                                    <Select
                                        placeholder="None selected"
                                        options={[
                                            { value: 'group1', label: 'Group 1' },
                                            { value: 'group2', label: 'Group 2' }
                                        ]}
                                        value={formData.group}
                                        onChange={(val) => setFormData({ ...formData, group: val })}
                                        size="small"
                                        style={{ width: '100%' }} // Ensure full width
                                    />
                                </div>

                                <div className="tutor-modal__form-group">
                                    <Form.Label className="body3-txt">Students this tutor has worked with</Form.Label>
                                    <Select
                                        placeholder="For Toolkit Admin only"
                                        options={[
                                            { value: 'student1', label: 'Student 1' }
                                        ]}
                                        value={formData.student}
                                        onChange={(val) => setFormData({ ...formData, student: val })}
                                        size="small"
                                        style={{ width: '100%' }} // Ensure full width
                                    />
                                </div>

                                <div className="tutor-modal__lead-toggle">
                                    <Switch
                                        id="tutor-lead-add"
                                        label="This tutor is a lead"
                                        size="medium"
                                        checked={formData.isLead}
                                        onChange={(checked) => setFormData({ ...formData, isLead: checked })}
                                    />
                                </div>
                            </Form>
                        </div>
                    )}

                    {/* ADD: MULTIPLE TAB */}
                    {mode === 'add' && activeTab === 'multiple' && (
                        <div className="tutor-modal__multiple-tab">
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', margin: '40px 0' }}>
                                Bulk upload functionality coming soon.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="tutor-modal__footer">
                    {mode === 'edit' && (
                        <Button
                            text="Delete This Tutor"
                            style="danger"
                            fill="text"
                            size="medium"
                            onClick={onDelete}
                        />
                    )}
                    {mode === 'add' && <div />} {/* Spacer if needed, or just align right */}

                    <div className="tutor-modal__actions" style={mode === 'add' ? { marginLeft: 'auto' } : {}}>
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
    show: PropTypes.bool,
    mode: PropTypes.oneOf(['edit', 'add']),
    tutor: PropTypes.object,
    sessions: PropTypes.array,
    initialTab: PropTypes.string,
    showFutureSessions: PropTypes.bool,
    onHide: PropTypes.func,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    onTabChange: PropTypes.func,
    className: PropTypes.string,
};

export default TutorModal;
