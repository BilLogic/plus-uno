import React from 'react';
import PropTypes from 'prop-types';
import Rating from './Rating';

/**
 * LikertScale Component
 * Labeled rating scale for surveys.
 * Matches legacy design-system/specs/Training/Lessons/Elements/LikertScale.js
 */
const LikertScale = ({
    leftLabel = "Not at all confident",
    rightLabel = "Extremely confident",
    rating = "rest",
    onRatingChange
}) => {
    // Styles matching legacy createLikertScale
    const containerStyle = {
        display: 'flex',
        gap: 'var(--size-element-gap-lg)', // 12px
        alignItems: 'flex-start',
        padding: '0 var(--size-element-pad-x-lg)',
        width: '100%'
    };

    const labelStyle = {
        fontFamily: 'var(--font-family-body)',
        fontSize: 'var(--font-size-lead)',
        fontWeight: 'var(--font-weight-normal)',
        lineHeight: '1.6',
        color: 'var(--color-primary-text)',
        minWidth: '198px',
        maxWidth: '198px',
        width: '100%',
        flexShrink: 0,
        minHeight: '52px',
        display: 'flex',
        alignItems: 'flex-start' // label text top aligned to match circles
    };

    const leftLabelContainer = {
        ...labelStyle,
        justifyContent: 'flex-end',
        textAlign: 'right'
    };

    const rightLabelContainer = {
        ...labelStyle,
        justifyContent: 'flex-start',
        textAlign: 'left'
    };

    // Inner p tags style (optional, if needed to match exact DOM structure or just put text in div)
    // Legacy put text in a <p> inside the div. We can simplify unless strict DOM match needed.
    // We'll put text directly in div with flex styles for simplicity unless layout breaks.

    return (
        <div className="plus-likert-scale" style={containerStyle}>
            <div style={leftLabelContainer}>
                {leftLabel}
            </div>

            <div style={{ flexShrink: 0 }}>
                <Rating rating={rating} onRatingChange={onRatingChange} />
            </div>

            <div style={rightLabelContainer}>
                {rightLabel}
            </div>
        </div>
    );
};

LikertScale.propTypes = {
    leftLabel: PropTypes.string,
    rightLabel: PropTypes.string,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onRatingChange: PropTypes.func
};

export default LikertScale;
