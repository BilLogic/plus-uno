import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Select from '@/forms/Select';
import Textarea from '@/forms/Textarea';
import Divider from '@/components/Divider';
import './ShareIdeasModal.scss';

/**
 * ShareIdeasModal component for Home page
 * Modal for users to share feature suggestions and ideas
 */
const ShareIdeasModal = ({
    id = 'share-ideas-modal',
    show = false,
    onClose,
    onSubmit,
    className = '',
    style,
    noOverlay = false
}) => {
    const [type, setType] = useState('feedback');
    const [urgency, setUrgency] = useState(null);
    const [productArea, setProductArea] = useState('');
    const [suggestions, setSuggestions] = useState('');

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
                suggestions
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

    // Urgency buttons (5 levels with lightbulb icons) - icon only
    const urgencyButtons = Array.from({ length: 5 }, (_, index) => ({
        id: `urgency-${index}`,
        text: '',
        leadingVisual: 'lightbulb',
        active: urgency === index,
        onClick: () => handleUrgencyChange(index),
        fill: urgency === index ? 'tonal' : 'outline',
        className: 'plus-share-ideas-modal-urgency-btn'
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

    const overlayClass = noOverlay ? 'plus-share-ideas-modal-overlay-inline' : 'plus-share-ideas-modal-overlay';
    const modalClass = noOverlay ? 'plus-share-ideas-modal-inline' : 'plus-share-ideas-modal';

    return (
        <div className={overlayClass} onClick={!noOverlay ? onClose : undefined}>
            <div 
                className={`${modalClass} ${className}`}
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                <Modal
                    id={id}
                    title="Share some ideas"
                    onClose={onClose}
                    showBottomButtons={false}
                    paddingSize="md"
                    gapSize="md"
                    width={672}
                >
                    <div className="plus-share-ideas-modal-content">
                        {/* Description */}
                        <div className="plus-share-ideas-modal-description body3-txt">
                            Have a feature suggestion? We'd love to learn how we can make PLUS better and why it's important to you.
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Type Selection */}
                        <div className="plus-share-ideas-modal-type-selection">
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
                        <div className="plus-share-ideas-modal-form">
                            {/* Urgency and Product Area Row - Side by Side */}
                            <div className="plus-share-ideas-modal-urgency-product-row">
                                {/* Urgency Selection - Left Side */}
                                <div className="plus-share-ideas-modal-urgency">
                                    <label className="plus-share-ideas-modal-label body3-txt">
                                        How urgently do you need this feature?
                                        <span className="plus-share-ideas-modal-required">*</span>
                                    </label>
                                    <div className="plus-share-ideas-modal-urgency-buttons">
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
                                <div className="plus-share-ideas-modal-product-area">
                                    <label className="plus-share-ideas-modal-label body3-txt">
                                        Product Area
                                        <span className="plus-share-ideas-modal-required">*</span>
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
                            <div className="plus-share-ideas-modal-textarea">
                                <Textarea
                                    id={`${id}-suggestions`}
                                    name="suggestions"
                                    value={suggestions}
                                    onChange={(e) => setSuggestions(e.target.value)}
                                    placeholder="Share your suggestions and feature requests here..."
                                    rows={6}
                                    size="medium"
                                />
                            </div>

                            {/* Add Images Button */}
                            <div className="plus-share-ideas-modal-add-images">
                                <Button
                                    text="Add images (< 2 mb)"
                                    leadingVisual="paperclip"
                                    style="secondary"
                                    fill="ghost"
                                    size="small"
                                    className="plus-share-ideas-modal-add-images-btn"
                                />
                            </div>
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Footer */}
                        <div className="plus-share-ideas-modal-footer">
                            <div className="plus-share-ideas-modal-footer-text body3-txt">
                                You can also email us at{' '}
                                <a href="mailto:help@tutors.plus" className="plus-share-ideas-modal-link">
                                    help@tutors.plus
                                </a>
                                . We read every piece of feedback, and try our best to respond.
                            </div>
                            <Button
                                text="Send Feedback"
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

ShareIdeasModal.propTypes = {
    id: PropTypes.string,
    show: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    noOverlay: PropTypes.bool
};

export default ShareIdeasModal;
