import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Rating.scss';

/**
 * Rating Component
 * Rating component with 5 stars, supporting two variants:
 * 1. With "Comments" label below
 * 2. With numeric labels (1-5) above each star
 */
const Rating = ({
    id,
    name,
    label,
    required = false,
    value = 0,
    variant = 'comments', // 'comments' or 'numeric'
    showCommentsLabel = true,
    commentsLabel = 'Comments',
    disabled = false,
    onChange,
    className = '',
    style,
    ...props
}) => {
    const handleStarClick = (starValue) => {
        if (disabled) return;
        if (onChange) {
            onChange(starValue);
        }
    };

    const wrapperClasses = [
        'plus-rating-wrapper',
        disabled ? 'plus-rating-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style} {...props}>
            {label && (
                <Form.Label htmlFor={id || name} className="plus-rating-label">
                    {label}
                    {required && (
                        <span className="plus-rating-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <div className="plus-rating-container">
                {[1, 2, 3, 4, 5].map((starValue) => {
                    const isSelected = value >= starValue;
                    return (
                        <div key={starValue} className="plus-rating-star-group">
                            <RatingItem
                                value={starValue}
                                selected={isSelected}
                                variant={variant}
                                disabled={disabled}
                                onClick={() => handleStarClick(starValue)}
                            />
                        </div>
                    );
                })}
            </div>
            {variant === 'comments' && showCommentsLabel && (
                <div className="plus-rating-comments-label body2-txt">
                    {commentsLabel}
                </div>
            )}
        </div>
    );
};

Rating.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    value: PropTypes.number,
    variant: PropTypes.oneOf(['comments', 'numeric']),
    showCommentsLabel: PropTypes.bool,
    commentsLabel: PropTypes.node,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

/**
 * Sub-component: RatingItem
 * Individual star item with circular background and star icon
 */
const RatingItem = ({
    value,
    selected = false,
    variant = 'comments',
    disabled = false,
    onClick,
    className = '',
    ...props
}) => {
    const itemClasses = [
        'plus-rating-item',
        selected ? 'plus-rating-item-selected' : 'plus-rating-item-unselected',
        disabled ? 'plus-rating-item-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className="plus-rating-item-wrapper">
            {variant === 'numeric' && (
                <div className="plus-rating-item-label body2-txt">
                    {value}
                </div>
            )}
            <div
                className={itemClasses}
                onClick={!disabled ? onClick : undefined}
                role={!disabled ? 'button' : undefined}
                tabIndex={!disabled ? 0 : undefined}
                onKeyDown={!disabled && onClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                } : undefined}
                {...props}
            >
                <i 
                    className={selected ? 'fas fa-star' : 'far fa-star'} 
                    aria-hidden="true"
                />
            </div>
        </div>
    );
};

RatingItem.propTypes = {
    value: PropTypes.number.isRequired,
    selected: PropTypes.bool,
    variant: PropTypes.oneOf(['comments', 'numeric']),
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string
};

// Attach subcomponent
Rating.Item = RatingItem;

export default Rating;

