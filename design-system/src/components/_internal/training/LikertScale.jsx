import React from 'react';
import PropTypes from 'prop-types';
import Rating from './Rating';

/**
 * LikertScale Component
 * Labeled rating scale for surveys.
 */
const LikertScale = ({
    leftLabel = "Not at all confident",
    rightLabel = "Extremely confident",
    rating = "rest",
    onRatingChange
}) => {
    const containerStyle = {
        display: 'flex',
        gap: 'var(--stack-lg)', // 12px
        alignItems: 'flex-start',
        padding: '0 var(--pad-x-lg)',
        width: '100%'
    };

    // The training form's lead label is 20/32, which no text style carries.
    const labelStyle = {
        fontFamily: 'var(--type-family-body)',
        fontSize: 'var(--font-size-125)',
        fontWeight: 'var(--type-weight-regular)',
        lineHeight: 'var(--line-height-200)',
        color: 'var(--ds-text-brand)',
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
