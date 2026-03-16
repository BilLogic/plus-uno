/**
 * StrategyContentPromptModal Component
 * 
 * Modal showing reflection question form with instructions, question, textarea, and submit button.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121977
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Textarea from '@/forms/Textarea';
import './StrategyContentPromptModal.scss';

const StrategyContentPromptModal = ({
    instructionsTitle = 'Instructions',
    instructionsText = "Take a moment to reflect on what you learned in this module. Your response helps us understand your perspective and ensures you're ready to apply this in your sessions. Please answer the question below to complete the module.",
    questionLabel = 'Question 1',
    questionText = "What's one specific action you plan to take in your next session based on what you learned in this module?",
    placeholder = 'Type in your response here ...',
    buttonText = 'Submit',
    required = true,
    show = true,
    value = '',
    onChange,
    onSubmit,
    className = '',
    ...props
}) => {
    const [localValue, setLocalValue] = useState(value);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit(localValue);
        }
    };

    if (!show) return null;

    return (
        <div className={`strategy-content-prompt-modal ${className}`} {...props}>
            {/* Instructions section */}
            <div className="strategy-content-prompt-modal__intro">
                <h5 className="strategy-content-prompt-modal__instructions-title h5">
                    {instructionsTitle}
                </h5>
                <p className="strategy-content-prompt-modal__instructions-text body1-txt">
                    {instructionsText}
                </p>
            </div>

            {/* Question section */}
            <div className="strategy-content-prompt-modal__question">
                {/* Label */}
                <div className="strategy-content-prompt-modal__label">
                    <div className="strategy-content-prompt-modal__label-title">
                        <span className="strategy-content-prompt-modal__question-label">
                            {questionLabel}
                        </span>
                        {required && (
                            <span className="strategy-content-prompt-modal__required">*</span>
                        )}
                    </div>
                    <p className="strategy-content-prompt-modal__question-text body1-txt">
                        {questionText}
                    </p>
                </div>

                {/* Textarea */}
                <div className="strategy-content-prompt-modal__textarea-wrapper">
                    <Textarea
                        value={localValue}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="strategy-content-prompt-modal__textarea"
                        rows={3}
                    />
                </div>
            </div>

            {/* Button section */}
            <div className="strategy-content-prompt-modal__footer">
                <Button
                    text={buttonText}
                    style="primary"
                    fill="filled"
                    size="medium"
                    leadingVisual="paper-plane"
                    onClick={handleSubmit}
                />
            </div>
        </div>
    );
};

StrategyContentPromptModal.propTypes = {
    /** Instructions title */
    instructionsTitle: PropTypes.string,
    /** Instructions text */
    instructionsText: PropTypes.string,
    /** Question label */
    questionLabel: PropTypes.string,
    /** Question text */
    questionText: PropTypes.string,
    /** Textarea placeholder */
    placeholder: PropTypes.string,
    /** Submit button text */
    buttonText: PropTypes.string,
    /** Whether the question is required */
    required: PropTypes.bool,
    /** Whether modal is visible */
    show: PropTypes.bool,
    /** Current textarea value */
    value: PropTypes.string,
    /** Callback when textarea value changes */
    onChange: PropTypes.func,
    /** Callback when submit button is clicked */
    onSubmit: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default StrategyContentPromptModal;
