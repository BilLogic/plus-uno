import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/messaging/Modal';
import Button from '@/components/actions/Button';
import Textarea from '@/components/forms-and-inputs/Textarea';
import Divider from '@/components/layout-and-structure/Divider';
import { ProductAreaDropdown } from '@/specs/Home/Elements/ProductAreaDropdown/ProductAreaDropdown';
import './UserFeedbackModal.scss';

/** @typedef {'problem' | 'question' | 'feedback'} FeedbackType */

/**
 * Severity icon glyph for each feedback type (Figma User Feedback Modal).
 * @param {FeedbackType} type
 * @returns {string}
 */
const severityIconForType = (type) => {
    if (type === 'question') return 'circle-question';
    if (type === 'feedback') return 'comment-dots';
    return 'flag';
};

/**
 * Number of severity/urgency levels per type (Figma: problem = 5, others = 4).
 * @param {FeedbackType} type
 * @returns {number}
 */
const severityCountForType = (type) => (type === 'problem' ? 5 : 4);

/**
 * UserFeedbackModal — Home feedback dialog with problem / question / feedback modes.
 * Layout matches Figma node `83:126557`: type tabs, severity + Product Area on one row,
 * full-width textarea, attach images, email footer + primary send.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {FeedbackType} [props.type='problem']
 * @param {boolean} [props.show=false]
 * @param {() => void} props.onClose
 * @param {(payload: { type: FeedbackType, severity: number | null, productArea: string, description: string }) => void} [props.onSubmit]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 * @param {boolean} [props.noOverlay=false] Render the dialog inline without a scrim
 * @param {boolean} [props.containOverlay=false] Keep the scrim inside a positioned parent (docs stages)
 */
const UserFeedbackModal = ({
    id,
    type: initialType = 'problem',
    show = false,
    onClose,
    onSubmit,
    className = '',
    style,
    noOverlay = false,
    containOverlay = false
}) => {
    const [type, setType] = useState(initialType);
    const [severity, setSeverity] = useState(null);
    const [productArea, setProductArea] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        setType(initialType);
        setSeverity(null);
    }, [initialType]);

    /**
     * Switch feedback mode and clear the severity rating.
     * @param {FeedbackType} newType
     */
    const handleTypeChange = (newType) => {
        setType(newType);
        setSeverity(null);
    };

    /**
     * Set severity / urgency level (0-based index).
     * @param {number} index
     */
    const handleSeverityChange = (index) => {
        setSeverity(index);
    };

    /**
     * Emit the current form values to the consumer.
     */
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
    const severityIcon = severityIconForType(type);
    const severityCount = severityCountForType(type);

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

    if (!show) return null;

    const overlayClass = [
        noOverlay
            ? 'plus-user-feedback-modal-overlay-inline'
            : 'plus-user-feedback-modal-overlay',
        !noOverlay && containOverlay ? 'plus-user-feedback-modal-overlay--contained' : '',
    ].filter(Boolean).join(' ');
    const modalClass = noOverlay ? 'plus-user-feedback-modal-inline' : 'plus-user-feedback-modal';

    /**
     * Figma severity icons use Font Awesome Regular (outline), not Solid.
     * @param {string} iconName
     * @returns {React.ReactElement}
     */
    const severityLeadingVisual = (iconName) => (
        <i className={`fa-regular fa-${iconName}`} aria-hidden="true" />
    );

    return (
        <div className={overlayClass} onClick={!noOverlay ? onClose : undefined}>
            <div
                className={`${modalClass} ${className}`}
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                {/*
                  Figma order: title → subtitle → divider → body → divider → footer.
                  Modal's built-in title inserts a divider *before* the subtitle, so we
                  render body-only and own the header chrome here.
                */}
                <Modal
                    renderAs="inline"
                    id={id}
                    onClose={onClose}
                    showBottomButtons={false}
                    paddingSize="md"
                    gapSize="md"
                    width={672}
                    className="plus-user-feedback-modal-shell"
                >
                    <div className="plus-user-feedback-modal-content">
                        <div className="plus-user-feedback-modal-header">
                            <h4 className="plus-user-feedback-modal-title h4 font-weight-semibold">
                                {config.title}
                            </h4>
                            <button
                                type="button"
                                className="plus-user-feedback-modal-close"
                                aria-label="Close modal"
                                onClick={onClose}
                            >
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="plus-user-feedback-modal-description body3-txt">
                            {config.description}
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        <div className="plus-user-feedback-modal-body">
                            <div className="plus-user-feedback-modal-type-selection" role="group" aria-label="Feedback type">
                                {typeButtons.map((btn) => (
                                    <Button
                                        key={btn.id}
                                        text={btn.text}
                                        leadingVisual={btn.leadingVisual}
                                        active={btn.active}
                                        onClick={btn.onClick}
                                        fill={btn.active ? 'tonal' : 'outline'}
                                        size="medium"
                                        style="primary"
                                        className="plus-user-feedback-modal-type-btn"
                                    />
                                ))}
                            </div>

                            <div className="plus-user-feedback-modal-form">
                                {/* Severity + Product Area share one row (Figma Form Inputs) */}
                                <div className="plus-user-feedback-modal-form-row">
                                    <div className="plus-user-feedback-modal-severity">
                                        <label className="plus-user-feedback-modal-label body3-txt">
                                            <span>{config.severityLabel}</span>
                                            <span className="plus-user-feedback-modal-required" aria-hidden="true">*</span>
                                        </label>
                                        <div
                                            className="plus-user-feedback-modal-severity-buttons"
                                            role="group"
                                            aria-label={config.severityLabel}
                                        >
                                            {Array.from({ length: severityCount }, (_, index) => (
                                                <Button
                                                    key={`severity-${index}`}
                                                    leadingVisual={severityLeadingVisual(severityIcon)}
                                                    active={severity === index}
                                                    onClick={() => handleSeverityChange(index)}
                                                    fill={severity === index ? 'tonal' : 'outline'}
                                                    size="small"
                                                    style="primary"
                                                    className="plus-user-feedback-modal-severity-btn"
                                                    aria-label={`Level ${index + 1} of ${severityCount}`}
                                                    aria-pressed={severity === index}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="plus-user-feedback-modal-product-area">
                                        <ProductAreaDropdown
                                            id={`${id}-product-area`}
                                            label="Product Area"
                                            placeholder="Select product area"
                                            value={productArea || undefined}
                                            onChange={setProductArea}
                                        />
                                    </div>
                                </div>

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
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

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
    style: PropTypes.object,
    noOverlay: PropTypes.bool,
    containOverlay: PropTypes.bool
};

export default UserFeedbackModal;
