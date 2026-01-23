import React from 'react';
import PropTypes from 'prop-types';
import './LikertScale.scss';

/**
 * LikertScale Component
 * 
 * Likert scale component with end labels and numbered options (1-5).
 * Displays "Not at all confident" on left, numbers 1-5 in center, "Extremely confident" on right.
 * Each number has a radio button below it.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177681
 */
const LikertScale = ({
    value,
    onChange,
    leftLabel = 'Not at all confident',
    rightLabel = 'Extremely confident',
    minValue = 1,
    maxValue = 5,
    className = '',
    style
}) => {
    const handleOptionClick = (optionValue) => {
        if (onChange) {
            onChange(optionValue);
        }
    };

    const handleKeyDown = (e, optionValue) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOptionClick(optionValue);
        }
    };

    // Generate array of values from minValue to maxValue
    const values = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

    return (
        <div
            className={`likert-scale ${className}`}
            style={style}
            data-node-id="63:177681"
            role="radiogroup"
        >
            {/* Left label */}
            <div className="likert-scale__end-label likert-scale__end-label--left">
                {leftLabel}
            </div>

            {/* Numbered options with radio buttons */}
            <div className="likert-scale__options">
                {values.map((val) => {
                    const isSelected = value === val;
                    return (
                        <div
                            key={val}
                            className={`likert-scale__option ${isSelected ? 'likert-scale__option--selected' : ''}`}
                            onClick={() => handleOptionClick(val)}
                            onKeyDown={(e) => handleKeyDown(e, val)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            data-value={val}
                        >
                            {/* Number label */}
                            <div className="likert-scale__number">
                                {val}
                            </div>

                            {/* Radio button */}
                            <div className={`likert-scale__radio ${isSelected ? 'likert-scale__radio--checked' : ''}`}>
                                {isSelected && <div className="likert-scale__radio-inner" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Right label */}
            <div className="likert-scale__end-label likert-scale__end-label--right">
                {rightLabel}
            </div>
        </div>
    );
};

LikertScale.propTypes = {
    /** Current selected value */
    value: PropTypes.number,
    /** Change handler (receives value) */
    onChange: PropTypes.func,
    /** Left end label */
    leftLabel: PropTypes.string,
    /** Right end label */
    rightLabel: PropTypes.string,
    /** Minimum value (default 1) */
    minValue: PropTypes.number,
    /** Maximum value (default 5) */
    maxValue: PropTypes.number,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default LikertScale;


