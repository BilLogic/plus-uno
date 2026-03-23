import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import ButtonGroup from '@/components/ButtonGroup';
import Select from '@/forms/Select';
import Textarea from '@/forms/Textarea';
import Divider from '@/components/Divider';
import './UserFeedbackModal.scss';

/**
 * UserFeedbackModal component for Home page
 * Modal for users to report problems, ask questions, or provide feedback
 */
const UserFeedbackModal = ({
    id,
    type: initialType = 'problem',
    show = false,
    onClose,
    onSubmit,
    className = '',
    style
}) => {
    const [type, setType] = useState(initialType);
    const [severity, setSeverity] = useState(null);
    const [productArea, setProductArea] = useState('');
    const [description, setDescription] = useState('');

    const handleTypeChange = (newType) => {
        setType(newType);
        setSeverity(null); // Reset severity when type changes
    };

    const handleSeverityChange = (index) => {
        setSeverity(index);
    };

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit({
                type,
                severity,
                productArea,
                description
            });
        }
    };

    // Type configuration
    const typeConfig = {
        problem: {
            title: 'Report a problem',
            description: 'Encountered an issue? Describe it and share the steps to reproduce.',
            severityLabel: 'How much does this problem affect your experience?',
            placeholder: 'Describe the issue here...',
            buttonText: 'Send Message'
        },
        question: {
            title: 'Look for help',
            description: 'Need assistance? Share your question and any relevant details we may need to respond effectively.',
            severityLabel: 'How urgently do you need a response to your question?',
            placeholder: 'Ask your question here...',
            buttonText: 'Send Question'
        },
        feedback: {
            title: 'Share some ideas',
            description: 'Have a feature suggestion? We\'d love to learn how we can make PLUS better and why it\'s important to you.',
            severityLabel: 'How urgently do you need this feature?',
            placeholder: 'Share your suggestions and feature requests here ...',
            buttonText: 'Send Feedback'
        }
    };

    const config = typeConfig[type];

    // Type selection buttons
    const typeButtons = [
        {
            id: 'problem',
            text: 'Problem',
            leadingVisual: 'flag',
            active: type === 'problem',
            onClick: () => handleTypeChange('problem')
        },
        {
            id: 'question',
            text: 'Question',
            leadingVisual: 'circle-question',
            active: type === 'question',
            onClick: () => handleTypeChange('question')
        },
        {
            id: 'feedback',
            text: 'Feedback',
            leadingVisual: 'comment-dots',
            active: type === 'feedback',
            onClick: () => handleTypeChange('feedback')
        }
    ];

    // Severity buttons (5 levels with flag icons) - icon only
    const severityButtons = Array.from({ length: 5 }, (_, index) => {
        const icon = type === 'question' ? 'circle-question' : (type === 'feedback' ? 'comment-dots' : 'flag');
        return {
            id: `severity-${index}`,
            text: '',
            leadingVisual: icon,
            active: severity === index,
            onClick: () => handleSeverityChange(index),
            fill: severity === index ? 'tonal' : 'outline',
            className: 'plus-user-feedback-modal-severity-btn'
        };
    });

    // Product area options
    const productAreaOptions = [
        { value: '', text: 'Select product area' },
        { value: 'sessions', text: 'Sessions' },
        { value: 'training', text: 'Training' },
        { value: 'profile', text: 'Profile' },
        { value: 'admin', text: 'Admin' },
        { value: 'other', text: 'Other' }
    ];

    if (!show) return null;

    return (
        <div className="plus-user-feedback-modal-overlay" onClick={onClose}>
            <div 
                className={`plus-user-feedback-modal ${className}`}
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                <Modal
                    id={id}
                    title={config.title}
                    onClose={onClose}
                    showBottomButtons={false}
                    paddingSize="md"
                    gapSize="md"
                    width={672}
                >
                    <div className="plus-user-feedback-modal-content">
                        {/* Description */}
                        <div className="plus-user-feedback-modal-description body3-txt">
                            {config.description}
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Type Selection */}
                        <div className="plus-user-feedback-modal-type-selection">
                            <ButtonGroup
                                buttons={typeButtons}
                                size="medium"
                                style="primary"
                                fill="outline"
                            />
                        </div>

                        {/* Form Inputs */}
                        <div className="plus-user-feedback-modal-form">
                        {/* Severity Selection */}
                        <div className="plus-user-feedback-modal-severity">
                            <label className="plus-user-feedback-modal-label body3-txt">
                                {config.severityLabel}
                                <span className="plus-user-feedback-modal-required">*</span>
                            </label>
                            <div className="plus-user-feedback-modal-severity-buttons">
                                {severityButtons.map((btn, index) => (
                                    <Button
                                        key={btn.id}
                                        leadingVisual={btn.leadingVisual}
                                        active={btn.active}
                                        onClick={btn.onClick}
                                        fill={btn.fill}
                                        size="small"
                                        style="primary"
                                        className={btn.className}
                                        aria-label={`Severity level ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                            {/* Product Area and Textarea Row */}
                            <div className="plus-user-feedback-modal-form-row">
                                {/* Product Area Dropdown */}
                                <div className="plus-user-feedback-modal-product-area">
                                    <Select
                                        id={`${id}-product-area`}
                                        name="productArea"
                                        label="Product Area"
                                        value={productArea}
                                        onChange={(e) => setProductArea(e.target.value)}
                                        options={productAreaOptions}
                                        size="small"
                                        placeholder="Select product area"
                                    />
                                </div>

                                {/* Textarea */}
                                <div className="plus-user-feedback-modal-textarea">
                                    <Textarea
                                        id={`${id}-description`}
                                        name="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={config.placeholder}
                                        rows={6}
                                        size="medium"
                                    />
                                </div>
                            </div>

                            {/* Add Images Button */}
                            <div className="plus-user-feedback-modal-add-images">
                                <Button
                                    text="Add images (< 2 mb)"
                                    leadingVisual="paperclip"
                                    style="secondary"
                                    fill="ghost"
                                    size="small"
                                    className="plus-user-feedback-modal-add-images-btn"
                                />
                            </div>
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Footer */}
                        <div className="plus-user-feedback-modal-footer">
                            <div className="plus-user-feedback-modal-footer-text body3-txt">
                                {type === 'feedback' ? (
                                    <>
                                        You can also email us at{' '}
                                        <a href="mailto:help@tutors.plus" className="plus-user-feedback-modal-link">
                                            help@tutors.plus
                                        </a>
                                        . We read every piece of feedback, and try our best to respond.
                                    </>
                                ) : (
                                    <>
                                        You can also email us at{' '}
                                        <a href="mailto:help@tutors.plus" className="plus-user-feedback-modal-link">
                                            help@tutors.plus
                                        </a>
                                    </>
                                )}
                            </div>
                            <Button
                                text={config.buttonText}
                                style="primary"
                                fill="filled"
                                size="medium"
                                onClick={handleSubmit}
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

UserFeedbackModal.propTypes = {
    id: PropTypes.string,
    type: PropTypes.oneOf(['problem', 'question', 'feedback']),
    show: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default UserFeedbackModal;

