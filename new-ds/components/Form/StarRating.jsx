import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './StarRating.scss';

/**
 * StarRating Component
 * Star rating component with 5 stars, supporting two variants:
 * 1. With "Comments" label below
 * 2. With numeric labels (1-5) above each star
 */
const StarRating = ({
    id,
    name,
    label,
    required = false,
    value = 0,
    variant = 'comments', // 'comments' or 'numeric'
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
        'plus-star-rating-wrapper',
        disabled ? 'plus-star-rating-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style} {...props}>
            {label && (
                <Form.Label htmlFor={id || name} className="plus-star-rating-label">
                    {label}
                    {required && (
                        <span className="plus-star-rating-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <div className="plus-star-rating-container">
                {[1, 2, 3, 4, 5].map((starValue) => {
                    const isSelected = value >= starValue;
                    return (
                        <div key={starValue} className="plus-star-rating-star-group">
                            <StarRatingItem
                                value={starValue}
                                selected={isSelected}
                                variant={variant}
                                disabled={disabled}
                                onClick={() => handleStarClick(starValue)}
                            />
                            {variant === 'comments' && starValue === 1 && (
                                <div className="plus-star-rating-comments-label body2-txt">
                                    Comments
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

StarRating.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    value: PropTypes.number,
    variant: PropTypes.oneOf(['comments', 'numeric']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

/**
 * Sub-component: StarRatingItem
 * Individual star item with circular background and star icon
 */
const StarRatingItem = ({
    value,
    selected = false,
    variant = 'comments',
    disabled = false,
    onClick,
    className = '',
    ...props
}) => {
    const itemClasses = [
        'plus-star-rating-item',
        selected ? 'plus-star-rating-item-selected' : 'plus-star-rating-item-unselected',
        disabled ? 'plus-star-rating-item-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className="plus-star-rating-item-wrapper">
            {variant === 'numeric' && (
                <div className="plus-star-rating-item-label body2-txt">
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

StarRatingItem.propTypes = {
    value: PropTypes.number.isRequired,
    selected: PropTypes.bool,
    variant: PropTypes.oneOf(['comments', 'numeric']),
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string
};

// Attach subcomponent
StarRating.Item = StarRatingItem;

export default StarRating;
