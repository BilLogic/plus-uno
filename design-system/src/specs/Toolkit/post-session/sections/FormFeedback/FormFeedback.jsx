import React from 'react';
import PropTypes from 'prop-types';
import Card from '../../../../../components/Card';
import Button from '../../../../../components/Button';

/**
 * FormFeedback
 * 
 * Success or confirmation screen displayed after a form submission.
 * Typically shows a success message and next actions.
 */
const FormFeedback = ({
    title,
    message,
    primaryAction,
    secondaryAction,
    className
}) => {
    return (
        <div className={`form-feedback ${className}`} style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                <div className="d-flex flex-column align-items-center gap-4 py-5">
                    {/* Success Icon */}
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-state-08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="fa-solid fa-check fa-2x" style={{ color: 'var(--color-primary)' }}></i>
                    </div>

                    {/* Message */}
                    <div>
                        <h2 className="h4-txt mb-2">{title}</h2>
                        <p className="body2-txt text-muted mb-0">{message}</p>
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2">
                        {secondaryAction && (
                            <Button
                                text={secondaryAction.label}
                                variant="outline-primary"
                                onClick={secondaryAction.onClick}
                            />
                        )}
                        {primaryAction && (
                            <Button
                                text={primaryAction.label}
                                style="primary"
                                onClick={primaryAction.onClick}
                            />
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

FormFeedback.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    primaryAction: PropTypes.shape({
        label: PropTypes.string,
        onClick: PropTypes.func,
    }),
    secondaryAction: PropTypes.shape({
        label: PropTypes.string,
        onClick: PropTypes.func,
    }),
    className: PropTypes.string,
};

FormFeedback.defaultProps = {
    title: 'Reflection Submitted',
    message: 'Your reflection has been successfully saved.',
    primaryAction: null,
    secondaryAction: null,
    className: '',
};

export default FormFeedback;
