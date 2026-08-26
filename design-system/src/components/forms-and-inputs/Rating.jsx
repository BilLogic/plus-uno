import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import './Rating.scss';

/**
 * Rating Component
 * Rating component with 5 stars, supporting two variants:
 * 1. With "Comments" label below
 * 2. With numeric labels (1-5) above each star
 *
 * @param {object} props
 * @param {'star'|'thumbs-up'} [props.icon='star'] Icon used for each rating choice.
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
    icon = 'star',
    ...props
}) => {
    /**
     * Rating renders no form control at all — five `role="button"` items (#206).
     * There is nothing for a `<label for>` to point at, and `id` was accepted
     * and then dropped on the floor. So the label is a `span` with an id, the
     * row of items is the named `group`, and `id` finally lands on that group.
     */
    const fieldId = useFieldId(id);
    const hasLabel = Boolean(label);
    const labelId = hasLabel ? `${fieldId}-label` : undefined;

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
            {hasLabel && (
                <Form.Label as="span" id={labelId} className="plus-rating-label">
                    {label}
                    {required && (
                        <span className="plus-rating-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <div
                className="plus-rating-container"
                id={fieldId}
                role={hasLabel ? 'group' : undefined}
                aria-labelledby={labelId}
            >
                {[1, 2, 3, 4, 5].map((starValue) => {
                    const isSelected = value >= starValue;
                    return (
                        <div key={starValue} className="plus-rating-star-group">
                            <RatingItem
                                value={starValue}
                                selected={isSelected}
                                variant={variant}
                                icon={icon}
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
    style: PropTypes.object,
    icon: PropTypes.oneOf(['star', 'thumbs-up'])
};

/**
 * Sub-component: RatingItem
 * Individual rating item with circular background and an icon.
 */
const RatingItem = ({
    value,
    selected = false,
    variant = 'comments',
    icon = 'star',
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
                aria-label={!disabled ? `Rate ${value}` : undefined}
                onKeyDown={!disabled && onClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                } : undefined}
                {...props}
            >
                <i 
                    className={selected ? `fas fa-${icon}` : `far fa-${icon}`}
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
    icon: PropTypes.oneOf(['star', 'thumbs-up']),
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string
};

// Attach subcomponent
Rating.Item = RatingItem;

export default Rating;

