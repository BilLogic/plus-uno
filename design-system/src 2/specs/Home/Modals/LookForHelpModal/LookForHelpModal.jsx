import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Select from '@/forms/Select';
import Textarea from '@/forms/Textarea';
import Divider from '@/components/Divider';
import './LookForHelpModal.scss';

/**
 * LookForHelpModal component for Home page
 * Modal for users to ask questions and seek help
 */
const LookForHelpModal = ({
    id = 'look-for-help-modal',
    show = false,
    onClose,
    onSubmit,
    className = '',
    style,
    noOverlay = false
}) => {
    const [type, setType] = useState('question');
    const [urgency, setUrgency] = useState(null);
    const [productArea, setProductArea] = useState('');
    const [question, setQuestion] = useState('');

    const handleTypeChange = (newType) => {
        setType(newType);
        setUrgency(null); // Reset urgency when type changes
    };

    const handleUrgencyChange = (index) => {
        setUrgency(index);
    };

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit({
                type,
                urgency,
                productArea,
                question
            });
        }
    };

    // Type selection buttons
    const typeButtons = [
        {
            id: 'problem',
            text: 'Problem',
            active: type === 'problem',
            onClick: () => handleTypeChange('problem')
        },
        {
            id: 'question',
            text: 'Question',
            active: type === 'question',
            onClick: () => handleTypeChange('question')
        },
        {
            id: 'feedback',
            text: 'Feedback',
            active: type === 'feedback',
            onClick: () => handleTypeChange('feedback')
        }
    ];

    // Urgency buttons (5 levels with clock icons) - icon only
    const urgencyButtons = Array.from({ length: 5 }, (_, index) => ({
        id: `urgency-${index}`,
        text: '',
        leadingVisual: 'clock',
        active: urgency === index,
        onClick: () => handleUrgencyChange(index),
        fill: urgency === index ? 'tonal' : 'outline',
        className: 'plus-look-for-help-modal-urgency-btn'
    }));

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

    const overlayClass = noOverlay ? 'plus-look-for-help-modal-overlay-inline' : 'plus-look-for-help-modal-overlay';
    const modalClass = noOverlay ? 'plus-look-for-help-modal-inline' : 'plus-look-for-help-modal';

    return (
        <div className={overlayClass} onClick={!noOverlay ? onClose : undefined}>
            <div 
                className={`${modalClass} ${className}`}
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                <Modal
                    id={id}
                    title="Look for help"
                    onClose={onClose}
                    showBottomButtons={false}
                    paddingSize="md"
                    gapSize="md"
                    width={672}
                >
                    <div className="plus-look-for-help-modal-content">
                        {/* Description */}
                        <div className="plus-look-for-help-modal-description body3-txt">
                            Need assistance? Share your question and any relevant details we may need to respond effectively.
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Type Selection */}
                        <div className="plus-look-for-help-modal-type-selection">
                            {typeButtons.map((btn) => (
                                <Button
                                    key={btn.id}
                                    text={btn.text}
                                    active={btn.active}
                                    onClick={btn.onClick}
                                    size="medium"
                                    style="primary"
                                    fill={btn.active ? 'tonal' : 'outline'}
                                />
                            ))}
                        </div>

                        {/* Form Inputs */}
                        <div className="plus-look-for-help-modal-form">
                            {/* Urgency and Product Area Row - Side by Side */}
                            <div className="plus-look-for-help-modal-urgency-product-row">
                                {/* Urgency Selection - Left Side */}
                                <div className="plus-look-for-help-modal-urgency">
                                    <label className="plus-look-for-help-modal-label body3-txt">
                                        How urgently do you need a response to your question?
                                        <span className="plus-look-for-help-modal-required">*</span>
                                    </label>
                                    <div className="plus-look-for-help-modal-urgency-buttons">
                                        {urgencyButtons.map((btn, index) => (
                                            <Button
                                                key={btn.id}
                                                leadingVisual={btn.leadingVisual}
                                                active={btn.active}
                                                onClick={btn.onClick}
                                                fill={btn.fill}
                                                size="small"
                                                style="primary"
                                                className={btn.className}
                                                aria-label={`Urgency level ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Product Area Dropdown - Right Side */}
                                <div className="plus-look-for-help-modal-product-area">
                                    <label className="plus-look-for-help-modal-label body3-txt">
                                        Product Area
                                        <span className="plus-look-for-help-modal-required">*</span>
                                    </label>
                                    <Select
                                        id={`${id}-product-area`}
                                        name="productArea"
                                        value={productArea}
                                        onChange={(value) => setProductArea(value)}
                                        options={productAreaOptions}
                                        size="small"
                                        placeholder="Select product area"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Textarea - Full Width Below */}
                            <div className="plus-look-for-help-modal-textarea">
                                <Textarea
                                    id={`${id}-question`}
                                    name="question"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Ask your question here..."
                                    rows={6}
                                    size="medium"
                                />
                            </div>

                            {/* Add Images Button */}
                            <div className="plus-look-for-help-modal-add-images">
                                <Button
                                    text="Add images (< 2 mb)"
                                    leadingVisual="paperclip"
                                    style="secondary"
                                    fill="ghost"
                                    size="small"
                                    className="plus-look-for-help-modal-add-images-btn"
                                />
                            </div>
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Footer */}
                        <div className="plus-look-for-help-modal-footer">
                            <div className="plus-look-for-help-modal-footer-text body3-txt">
                                You can also email us at{' '}
                                <a href="mailto:help@tutors.plus" className="plus-look-for-help-modal-link">
                                    help@tutors.plus
                                </a>
                            </div>
                            <Button
                                text="Send Question"
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

LookForHelpModal.propTypes = {
    id: PropTypes.string,
    show: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    noOverlay: PropTypes.bool
};

export default LookForHelpModal;
