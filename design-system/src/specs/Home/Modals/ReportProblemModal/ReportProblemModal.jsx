import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Select from '@/forms/Select';
import Textarea from '@/forms/Textarea';
import Divider from '@/components/Divider';
import './ReportProblemModal.scss';

/**
 * ReportProblemModal component for Home page
 * Modal for users to report problems they've encountered
 */
const ReportProblemModal = ({
    id = 'report-problem-modal',
    show = false,
    onClose,
    onSubmit,
    className = '',
    style,
    noOverlay = false
}) => {
    const [type, setType] = useState('problem');
    const [impact, setImpact] = useState(null);
    const [productArea, setProductArea] = useState('');
    const [description, setDescription] = useState('');

    const handleTypeChange = (newType) => {
        setType(newType);
        setImpact(null); // Reset impact when type changes
    };

    const handleImpactChange = (index) => {
        setImpact(index);
    };

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit({
                type,
                impact,
                productArea,
                description
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

    // Impact buttons (5 levels with flag icons) - icon only
    const impactButtons = Array.from({ length: 5 }, (_, index) => ({
        id: `impact-${index}`,
        text: '',
        leadingVisual: 'flag',
        active: impact === index,
        onClick: () => handleImpactChange(index),
        fill: impact === index ? 'tonal' : 'outline',
        className: 'plus-report-problem-modal-impact-btn'
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

    const overlayClass = noOverlay ? 'plus-report-problem-modal-overlay-inline' : 'plus-report-problem-modal-overlay';
    const modalClass = noOverlay ? 'plus-report-problem-modal-inline' : 'plus-report-problem-modal';

    return (
        <div className={overlayClass} onClick={!noOverlay ? onClose : undefined}>
            <div 
                className={`${modalClass} ${className}`}
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                <Modal
                    id={id}
                    title="Report a problem"
                    onClose={onClose}
                    showBottomButtons={false}
                    paddingSize="md"
                    gapSize="md"
                    width={672}
                >
                    <div className="plus-report-problem-modal-content">
                        {/* Description */}
                        <div className="plus-report-problem-modal-description body3-txt">
                            Encountered an issue? Describe it and share the steps to reproduce.
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Type Selection */}
                        <div className="plus-report-problem-modal-type-selection">
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
                        <div className="plus-report-problem-modal-form">
                            {/* Impact and Product Area Row - Side by Side */}
                            <div className="plus-report-problem-modal-impact-product-row">
                                {/* Impact Selection - Left Side */}
                                <div className="plus-report-problem-modal-impact">
                                    <label className="plus-report-problem-modal-label body3-txt">
                                        How much does this problem affect your experience?
                                        <span className="plus-report-problem-modal-required">*</span>
                                    </label>
                                    <div className="plus-report-problem-modal-impact-buttons">
                                        {impactButtons.map((btn, index) => (
                                            <Button
                                                key={btn.id}
                                                leadingVisual={btn.leadingVisual}
                                                active={btn.active}
                                                onClick={btn.onClick}
                                                fill={btn.fill}
                                                size="small"
                                                style="primary"
                                                className={btn.className}
                                                aria-label={`Impact level ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Product Area Dropdown - Right Side */}
                                <div className="plus-report-problem-modal-product-area">
                                    <label className="plus-report-problem-modal-label body3-txt">
                                        Product Area
                                        <span className="plus-report-problem-modal-required">*</span>
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
                            <div className="plus-report-problem-modal-textarea">
                                <Textarea
                                    id={`${id}-description`}
                                    name="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the issue here..."
                                    rows={6}
                                    size="medium"
                                />
                            </div>

                            {/* Add Images Button */}
                            <div className="plus-report-problem-modal-add-images">
                                <Button
                                    text="Add images (< 2 mb)"
                                    leadingVisual="paperclip"
                                    style="secondary"
                                    fill="ghost"
                                    size="small"
                                    className="plus-report-problem-modal-add-images-btn"
                                />
                            </div>
                        </div>

                        <Divider size="1px" style="dark" opacity10={true} />

                        {/* Footer */}
                        <div className="plus-report-problem-modal-footer">
                            <div className="plus-report-problem-modal-footer-text body3-txt">
                                You can also email us at{' '}
                                <a href="mailto:help@tutors.plus" className="plus-report-problem-modal-link">
                                    help@tutors.plus
                                </a>
                            </div>
                            <Button
                                text="Send Message"
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

ReportProblemModal.propTypes = {
    id: PropTypes.string,
    show: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    noOverlay: PropTypes.bool
};

export default ReportProblemModal;
