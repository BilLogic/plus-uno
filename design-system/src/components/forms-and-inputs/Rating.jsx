import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
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
     * Rating renders no form control at all — five `role="radio"` items (#206,
     * #319). There is nothing for a `<label for>` to point at, and `id` was
     * accepted and then dropped on the floor. So the label is a `span` with an
     * id, the row of items is the named `radiogroup`, and `id` finally lands on
     * that group.
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

    /**
     * The one item in the group that takes a tab stop (#319): the checked one,
     * or the first when nothing is checked yet. A group where every item is
     * tabbable is five stops for one value; a group where none is, is
     * unreachable.
     */
    const tabbableValue = RATING_VALUES.includes(value) ? value : RATING_VALUES[0];

    /**
     * Arrow keys move the value, Home and End jump to the ends — the radiogroup
     * keyboard contract. Moving the selection IS the interaction here: the group
     * has no "focused but unselected" state to track, so a move is a change.
     *
     * @param {React.KeyboardEvent} event
     */
    const handleKeyDown = (event) => {
        if (disabled) return;

        const current = RATING_VALUES.includes(value) ? value : 0;
        let next = null;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            next = Math.min(current + 1, RATING_VALUES[RATING_VALUES.length - 1]);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            next = Math.max(current - 1, RATING_VALUES[0]);
        } else if (event.key === 'Home') {
            next = RATING_VALUES[0];
        } else if (event.key === 'End') {
            next = RATING_VALUES[RATING_VALUES.length - 1];
        }

        if (next === null) return;
        event.preventDefault();
        if (next !== value) handleStarClick(next);
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
            {/*
              * #319. The row is a `radiogroup` and each item is a `radio`, not a
              * button. A rating is one value out of five, and `role="button"`
              * could not say which one was chosen — selection was a fill colour
              * and nothing in the accessibility tree. `aria-checked` says it.
              *
              * The role brings the keyboard behaviour with it: a radio group is
              * ONE tab stop, and the arrow keys move within it. That is the
              * roving-tabindex below — the checked item is tabbable, and if
              * nothing is checked the first item is, so the group is always
              * reachable.
              */}
            <div
                className="plus-rating-container"
                id={fieldId}
                role="radiogroup"
                aria-labelledby={labelId}
                aria-label={hasLabel ? undefined : 'Rating'}
                aria-disabled={disabled || undefined}
                onKeyDown={handleKeyDown}
            >
                {RATING_VALUES.map((starValue) => {
                    const isSelected = value >= starValue;
                    return (
                        <div key={starValue} className="plus-rating-star-group">
                            <RatingItem
                                value={starValue}
                                selected={isSelected}
                                checked={value === starValue}
                                tabbable={starValue === tabbableValue}
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
    checked = false,
    tabbable = false,
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
            {/*
              * #319. `role="radio"` and `aria-checked`, kept on the item even
              * when disabled: a disabled rating used to drop the role, the
              * tabindex and the label together, which made it five unlabelled
              * `div`s — invisible rather than unavailable. `aria-disabled` is
              * how a control says "not now" and stays a control.
              *
              * `selected` fills the icon cumulatively (three stars for a 3);
              * `checked` is the single value, and is the one ARIA reports.
              */}
            <div
                className={itemClasses}
                onClick={!disabled ? onClick : undefined}
                role="radio"
                aria-checked={checked}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : (tabbable ? 0 : -1)}
                aria-label={`Rate ${value}`}
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
    /** Filled — true for every item up to the rating. */
    selected: PropTypes.bool,
    /** The chosen value — true for exactly one item. This is what ARIA reports. */
    checked: PropTypes.bool,
    /** Holds the group's single tab stop (#319). */
    tabbable: PropTypes.bool,
    variant: PropTypes.oneOf(['comments', 'numeric']),
    icon: PropTypes.oneOf(['star', 'thumbs-up']),
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string
};

// Attach subcomponent
Rating.Item = RatingItem;

export default Rating;

