import React from 'react';
import PropTypes from 'prop-types';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import useFieldId from '../useFieldId';
import './Rating.scss';

/** The scale, in order. Five is the whole of it — there is no other length. */
const RATING_VALUES = [1, 2, 3, 4, 5];

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
    isRequired = false,
    value = 0,
    variant = 'comments', // 'comments' or 'numeric'
    showCommentsLabel = true,
    commentsLabel = 'Comments',
    isDisabled = false,
    onChange,
    className = '',
    style,
    icon = 'star',
    ...props
}) => {
    /**
     * The row of five is a Base UI `RadioGroup` and each item a Base UI radio,
     * which bring the radio-group contract: one tab stop (the checked item, or
     * the first while unanswered), the arrow keys move the value, and a hidden
     * input sends it with its form under `name`. The label is a `span` with an
     * id, since there is no single control for a `<label for>` to point at,
     * and `id` lands on the group.
     */
    const fieldId = useFieldId(id);
    const hasLabel = Boolean(label);
    const labelId = hasLabel ? `${fieldId}-label` : undefined;
    const checkedValue = RATING_VALUES.includes(value) ? value : null;

    const handleValueChange = (next) => {
        if (next === value) return;
        onChange?.(next);
    };

    const wrapperClasses = [
        'plus-rating-wrapper',
        isDisabled ? 'plus-rating-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style} {...props}>
            {hasLabel && (
                <span id={labelId} className="plus-rating-label">
                    {label}
                    {isRequired && (
                        <span className="plus-rating-required" aria-label="required">*</span>
                    )}
                </span>
            )}
            <BaseRadioGroup
                className="plus-rating-container"
                id={fieldId}
                name={name}
                value={checkedValue}
                onValueChange={handleValueChange}
                disabled={isDisabled}
                required={isRequired}
                aria-labelledby={labelId}
                aria-label={hasLabel ? undefined : 'Rating'}
            >
                {RATING_VALUES.map((starValue) => (
                    <div key={starValue} className="plus-rating-star-group">
                        <RatingItem
                            value={starValue}
                            selected={value >= starValue}
                            variant={variant}
                            icon={icon}
                            disabled={isDisabled}
                        />
                    </div>
                ))}
            </BaseRadioGroup>
            {variant === 'comments' && showCommentsLabel && (
                <div className="plus-rating-comments-label">
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
    isRequired: PropTypes.bool,
    value: PropTypes.number,
    variant: PropTypes.oneOf(['comments', 'numeric']),
    showCommentsLabel: PropTypes.bool,
    commentsLabel: PropTypes.node,
    isDisabled: PropTypes.bool,
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
                <div className="plus-rating-item-label">
                    {value}
                </div>
            )}
            {/*
              * A Base UI radio inside the group: it reports `aria-checked` for
              * the single chosen value and keeps its role and label when
              * disabled, so a disabled rating reads as unavailable rather than
              * vanishing. `selected` fills the icon cumulatively (three stars
              * for a 3); checked is the one value ARIA reports.
              */}
            <BaseRadio.Root
                value={value}
                disabled={disabled}
                className={itemClasses}
                aria-label={`Rate ${value}`}
                {...props}
            >
                <i
                    className={selected ? `fas fa-${icon}` : `far fa-${icon}`}
                    aria-hidden="true"
                />
            </BaseRadio.Root>
        </div>
    );
};

RatingItem.propTypes = {
    value: PropTypes.number.isRequired,
    /** Filled — true for every item up to the rating. */
    selected: PropTypes.bool,
    variant: PropTypes.oneOf(['comments', 'numeric']),
    icon: PropTypes.oneOf(['star', 'thumbs-up']),
    disabled: PropTypes.bool,
    className: PropTypes.string
};

// Attach subcomponent
Rating.Item = RatingItem;

export default Rating;

