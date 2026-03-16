import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';
import Card from '../../../../../components/Card';
import Button from '../../../../../components/Button';

/**
 * SessionReflectionForm
 * 
 * Form for providing general feedback on the session itself.
 * Focuses on what went well, challenges, and next steps.
 */
const SessionReflectionForm = ({
    initialData,
    onSave,
    className
}) => {
    const [formData, setFormData] = useState({
        successes: initialData?.successes || '',
        challenges: initialData?.challenges || '',
        nextSteps: initialData?.nextSteps || '',
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
        <div className={`session-reflection-form ${className}`}>
            <div className="d-flex flex-column gap-4">
                <div>
                    <h2 className="h4-txt mb-2">Session Reflection</h2>
                    <p className="body2-txt text-muted">
                        Reflect on the session as a whole. What strategies were effective?
                    </p>
                </div>

                <Card>
                    <div>
                        <Form onSubmit={handleSubmit} className="d-flex flex-column gap-4">

                            {/* Successes */}
                            <Form.Group controlId="successes">
                                <Form.Label className="label-sm-txt text-muted text-uppercase mb-1">
                                    What went well?
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="successes"
                                    value={formData.successes}
                                    onChange={handleChange}
                                    placeholder="Describe effective strategies or positive moments..."
                                    className="body2-txt"
                                />
                            </Form.Group>

                            {/* Challenges */}
                            <Form.Group controlId="challenges">
                                <Form.Label className="label-sm-txt text-muted text-uppercase mb-1">
                                    Challenges encountered
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="challenges"
                                    value={formData.challenges}
                                    onChange={handleChange}
                                    placeholder="Describe any difficulties or areas for improvement..."
                                    className="body2-txt"
                                />
                            </Form.Group>

                            {/* Next Steps */}
                            <Form.Group controlId="nextSteps">
                                <Form.Label className="label-sm-txt text-muted text-uppercase mb-1">
                                    Plan for next session
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="nextSteps"
                                    value={formData.nextSteps}
                                    onChange={handleChange}
                                    placeholder="What will you focus on next time?"
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

                        </Form>
                    </div>
                </Card>
            </div>
        </div>
    );
};

SessionReflectionForm.propTypes = {
    initialData: PropTypes.shape({
        successes: PropTypes.string,
        challenges: PropTypes.string,
        nextSteps: PropTypes.string,
    }),
    onSave: PropTypes.func,
    className: PropTypes.string,
};

SessionReflectionForm.defaultProps = {
    initialData: {},
    onSave: () => { },
    className: '',
};

export default SessionReflectionForm;
