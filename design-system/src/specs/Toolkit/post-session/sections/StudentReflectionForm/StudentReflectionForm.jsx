import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from '../../../../../components/Card';
import Button from '../../../../../components/Button';
import Divider from '../../../../../components/Divider';

/**
 * StudentReflectionForm
 * 
 * Form for providing feedback on a specific student.
 * Includes attendance check, engagement ratings, and qualitative feedback.
 */
const StudentReflectionForm = ({
    studentName,
    initialData,
    onSave,
    className
}) => {
    const [formData, setFormData] = useState({
        attendance: initialData?.attendance || 'present',
        engagement: initialData?.engagement || '',
        understanding: initialData?.understanding || '',
        comments: initialData?.comments || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave?.(formData);
    };

    return (
        <div className={`student-reflection-form ${className}`}>
            <div className="d-flex flex-column gap-4">
                <div>
                    <h2 className="h4-txt mb-2">Student Reflection: {studentName}</h2>
                    <p className="body2-txt text-muted">
                        Rate {studentName}'s performance and engagement during this session.
                    </p>
                </div>

                <Card>
                    <div>
                        <Form onSubmit={handleSubmit}>
                            <div className="d-flex flex-column gap-4">

                                {/* Attendance */}
                                <Form.Group>
                                    <Form.Label className="label-sm-txt text-muted text-uppercase mb-2">
                                        Attendance
                                    </Form.Label>
                                    <div className="d-flex gap-3">
                                        <Form.Check
                                            type="radio"
                                            id="attendance-present"
                                            label="Present"
                                            name="attendance"
                                            value="present"
                                            checked={formData.attendance === 'present'}
                                            onChange={handleChange}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="attendance-absent"
                                            label="Absent"
                                            name="attendance"
                                            value="absent"
                                            checked={formData.attendance === 'absent'}
                                            onChange={handleChange}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="attendance-late"
                                            label="Late"
                                            name="attendance"
                                            value="late"
                                            checked={formData.attendance === 'late'}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </Form.Group>

                                <Divider />

                                {/* Ratings */}
                                <Row className="g-4">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="label-sm-txt text-muted text-uppercase mb-2">
                                                Engagement Level
                                            </Form.Label>
                                            <Form.Select
                                                name="engagement"
                                                value={formData.engagement}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select rating...</option>
                                                <option value="5">5 - Highly Engaged</option>
                                                <option value="4">4 - Engaged</option>
                                                <option value="3">3 - Neutral</option>
                                                <option value="2">2 - Distracted</option>
                                                <option value="1">1 - Disengaged</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="label-sm-txt text-muted text-uppercase mb-2">
                                                Understanding of Material
                                            </Form.Label>
                                            <Form.Select
                                                name="understanding"
                                                value={formData.understanding}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select rating...</option>
                                                <option value="5">5 - Mastered</option>
                                                <option value="4">4 - Understood well</option>
                                                <option value="3">3 - Partial understanding</option>
                                                <option value="2">2 - Struggled</option>
                                                <option value="1">1 - Did not understand</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Comments */}
                                <Form.Group controlId="comments">
                                    <Form.Label className="label-sm-txt text-muted text-uppercase mb-1">
                                        Qualitative Feedback
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="comments"
                                        value={formData.comments}
                                        onChange={handleChange}
                                        placeholder={`Describe ${studentName}'s progress, challenges, and any specific areas for improvement...`}
                                        className="body2-txt"
                                    />
                                </Form.Group>

                                <div className="d-flex justify-content-end">
                                    <Button
                                        text="Save Reflection"
                                        style="primary"
                                        type="submit"
                                        leadingVisual="save"
                                    />
                                </div>

                            </div>
                        </Form>
                    </div>
                </Card>
            </div>
        </div>
    );
};

StudentReflectionForm.propTypes = {
    studentName: PropTypes.string.isRequired,
    initialData: PropTypes.shape({
        attendance: PropTypes.string,
        engagement: PropTypes.string,
        understanding: PropTypes.string,
        comments: PropTypes.string,
    }),
    onSave: PropTypes.func,
    className: PropTypes.string,
};

StudentReflectionForm.defaultProps = {
    initialData: {},
    onSave: () => { },
    className: '',
};

export default StudentReflectionForm;
