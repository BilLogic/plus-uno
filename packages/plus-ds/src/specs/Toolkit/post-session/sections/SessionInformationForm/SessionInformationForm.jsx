import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from '../../../../../components/Card';
import Button from '../../../../../components/Button';
import Dropdown from '../../../../../components/Dropdown';

/**
 * SessionInformationForm
 *
 * Form to capture or edit session details.
 * Includes fields for Date, Time, Duration, and Topic/Notes.
 */
const SessionInformationForm = ({
    initialData,
    availableStudents = [],
    selectedStudentIds = [],
    onStudentSelectionChange,
    onSave
}) => {
    const [formData, setFormData] = useState({
        date: initialData?.date || '',
        sessionOption: initialData?.sessionOption || '',
        didNotHappen: initialData?.didNotHappen || false,
        cancellationReasons: initialData?.cancellationReasons || [],
        otherReason: initialData?.otherReason || '',
        reason: initialData?.reason || '',
        files: initialData?.files || [
            { name: 'math_worksheet_completed.pdf', size: '2.4 MB' }
        ],
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRemoveFile = (fileName) => {
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter(f => f.name !== fileName)
        }));
    };

    const handleStudentToggle = (studentId) => {
        if (!onStudentSelectionChange) return;

        const newSelection = selectedStudentIds.includes(studentId)
            ? selectedStudentIds.filter(id => id !== studentId)
            : [...selectedStudentIds, studentId];

        onStudentSelectionChange(newSelection);
    };

    const handleReasonCheckboxChange = (reason) => {
        setFormData(prev => {
            const currentReasons = prev.cancellationReasons || [];
            const newReasons = currentReasons.includes(reason)
                ? currentReasons.filter(r => r !== reason)
                : [...currentReasons, reason];
            return { ...prev, cancellationReasons: newReasons };
        });
    };

    const handleSessionSelect = (value) => {
        setFormData(prev => ({ ...prev, sessionOption: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave?.({
            ...formData,
            selectedStudentIds
        });
    };

    const cancellationOptions = [
        "Unforeseen circumstances",
        "Technical difficulties",
        "Participant absence",
        "Schedule conflict",
        "Communication error",
        "Other"
    ];

    // Prepare dropdown items for students
    const studentDropdownItems = availableStudents.map(student => ({
        text: student.name,
        multiSelectCheckbox: true,
        multiSelectChecked: selectedStudentIds.includes(student.id || student.name),
        keepOpen: true,
        onClick: () => handleStudentToggle(student.id || student.name)
    }));

    // Prepare dropdown items for sessions
    const sessionItems = [
        { text: 'Lincoln High - 10:00 AM', value: 'session-1', onClick: () => handleSessionSelect('session-1'), selected: formData.sessionOption === 'session-1' },
        { text: 'Lincoln High - 11:00 AM', value: 'session-2', onClick: () => handleSessionSelect('session-2'), selected: formData.sessionOption === 'session-2' },
        { text: 'Math Tutoring - 2:00 PM', value: 'math_tutoring', onClick: () => handleSessionSelect('math_tutoring'), selected: formData.sessionOption === 'math_tutoring' }
    ];

    const getSessionLabel = () => {
        const selected = sessionItems.find(i => i.value === formData.sessionOption);
        return selected ? selected.text : 'Select a session';
    };

    return (
        <Card className="border-0 shadow-none" style={{ backgroundColor: 'transparent' }}>
            <div className="mb-4">
                <h2 className="h4-txt mb-2">Session Information</h2>
                <p className="body2-txt text-muted">Please verify the details of this session.</p>
            </div>

            <Form onSubmit={handleSubmit}>
                <div className="d-flex flex-column gap-4">
                    {/* Session Details Group */}
                    <div className="d-flex flex-column gap-3">
                        {/* Session Date */}
                        <Form.Group controlId="date">
                            <Form.Label className="body2-txt font-weight-bold">
                                Session Date <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-1 border-end-0">
                                    <i className="fa-regular fa-calendar" style={{ color: 'var(--color-on-surface-variant)' }}></i>
                                </span>
                                <Form.Control
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="body2-txt border-start-0 ps-0"
                                    required
                                />
                            </div>
                        </Form.Group>

                        {/* Select Session */}
                        <Form.Group controlId="sessionOption">
                            <Form.Label className="body2-txt font-weight-bold">
                                Select Session <span className="text-danger">*</span>
                            </Form.Label>
                            <Dropdown
                                id="session-select-dropdown"
                                buttonText={getSessionLabel()}
                                items={sessionItems}
                                style="default"
                                fill="outline"
                                className="w-100"
                            />
                            {/* Hidden input for HTML5 validation if needed, or rely on state check */}
                            <input
                                type="hidden"
                                name="sessionOption"
                                value={formData.sessionOption}
                                required
                            />
                        </Form.Group>

                        {/* Session did not happen toggle */}
                        <Form.Check
                            type="switch"
                            id="didNotHappen"
                            label="Session did not happen"
                            name="didNotHappen"
                            checked={formData.didNotHappen}
                            onChange={handleChange}
                            className="body2-txt text-muted custom-switch-primary"
                            style={{ '--bs-form-switch-bg': 'var(--color-primary)' }} // Inline override for switch color if class doesn't exist
                        />
                    </div>

                    <hr className="m-0" style={{ borderTop: '1px solid var(--color-border)' }} />


                    {/* LOGIC: 
                        If Session/Date NOT selected: Show nothing.
                        If Session/Date SELECTED:
                            If DidNotHappen is TRUE: Show Reason field.
                            If DidNotHappen is FALSE: Show Uploads and Students.
                    */}

                    {formData.date && formData.sessionOption && (
                        <>
                            {formData.didNotHappen ? (
                                /* Did Not Happen Logic - Show Reason */
                                <div className="d-flex flex-column gap-4">
                                    {/* Reason Checkboxes */}
                                    <Form.Group>
                                        <Form.Label className="body2-txt font-weight-bold mb-2">
                                            Select one or more reasons why the session did not happen <span className="text-danger">*</span>
                                        </Form.Label>
                                        <div className="d-flex flex-column gap-2">
                                            {cancellationOptions.map((option) => (
                                                <div key={option} className="d-flex align-items-center gap-2">
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`reason-${option}`}
                                                        label={option}
                                                        checked={(formData.cancellationReasons || []).includes(option)}
                                                        onChange={() => handleReasonCheckboxChange(option)}
                                                        className="body2-txt"
                                                    />
                                                    {option === "Other" && (formData.cancellationReasons || []).includes("Other") && (
                                                        <Form.Control
                                                            type="text"
                                                            name="otherReason"
                                                            value={formData.otherReason}
                                                            onChange={handleChange}
                                                            placeholder="Please specify"
                                                            size="sm"
                                                            className="body2-txt ms-2"
                                                            style={{ maxWidth: '200px' }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </Form.Group>

                                    {/* Additional Notes */}
                                    <div className="d-flex flex-column gap-1">
                                        <h3 className="h6-txt mb-1">Reason for Cancellation</h3>
                                        <p className="body2-txt text-muted mb-0">
                                            Please briefly describe the situation.
                                        </p>
                                        <Form.Group controlId="reason">
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="reason"
                                                value={formData.reason}
                                                onChange={handleChange}
                                                placeholder="e.g., Student absent, technical issues, etc."
                                                className="body2-txt"
                                            />
                                        </Form.Group>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Flow - Show Uploads and Students */
                                <>
                                    {/* Upload files */}
                                    <div className="d-flex flex-column gap-3">
                                        <div>
                                            <h3 className="h6-txt mb-1">Upload files</h3>
                                            <p className="body2-txt text-muted mb-0">
                                                Upload any materials used or completed during the session.
                                            </p>
                                        </div>

                                        <div className="d-flex flex-column gap-2">
                                            {/* Upload Button */}
                                            <div>
                                                <Button
                                                    text="Choose a file"
                                                    style="default"
                                                    fill="outline"
                                                    leadingVisual="upload"
                                                    size="small"
                                                    onClick={() => { }}
                                                />
                                            </div>

                                            {/* File List */}
                                            <div className="d-flex flex-column gap-2">
                                                {formData.files.map((file, index) => (
                                                    <div key={index} className="d-flex align-items-center justify-content-between p-2 border rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className="fa-regular fa-file-pdf text-danger"></i>
                                                            <span className="body2-txt">{file.name}</span>
                                                            <span className="caption-txt text-muted">({file.size})</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFile(file.name)}
                                                            className="btn btn-link p-0 text-muted"
                                                            title="Remove file"
                                                        >
                                                            <i className="fa-solid fa-xmark"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="m-0" style={{ borderTop: '1px solid var(--color-border)' }} />

                                    {/* Students */}
                                    <div className="d-flex flex-column gap-3">
                                        <div>
                                            <h3 className="h6-txt mb-1">Students</h3>
                                            <p className="body2-txt text-muted mb-0">
                                                Select the students who attended this session.
                                            </p>
                                        </div>

                                        <div className="d-flex flex-column gap-2">
                                            <Dropdown
                                                id="student-select-dropdown"
                                                buttonText={`${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''} Selected`}
                                                items={studentDropdownItems}
                                                style="default"
                                                fill="outline"
                                                className="w-100"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-start mt-2">
                                <Button
                                    text={formData.didNotHappen ? "Submit" : "Next"}
                                    style="primary"
                                    fill="filled"
                                    type="submit"
                                    disabled={
                                        formData.didNotHappen
                                            ? !((formData.cancellationReasons || []).length > 0 && formData.reason && formData.reason.trim().length > 0 && (!formData.cancellationReasons.includes("Other") || (formData.otherReason && formData.otherReason.trim().length > 0)))
                                            : selectedStudentIds.length === 0
                                    }
                                />
                            </div>
                        </>
                    )}
                </div>
            </Form>
        </Card>
    );
};

SessionInformationForm.propTypes = {
    initialData: PropTypes.object,
    availableStudents: PropTypes.array,
    selectedStudentIds: PropTypes.array,
    onStudentSelectionChange: PropTypes.func,
    onSave: PropTypes.func,
    className: PropTypes.string,
};

SessionInformationForm.defaultProps = {
    initialData: {},
    availableStudents: [],
    selectedStudentIds: [],
    onStudentSelectionChange: () => { },
    onSave: () => { },
    className: '',
};

export default SessionInformationForm;
