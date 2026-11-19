import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { STAGGER } from '@/lib/listMotion';
import { useMotionReduced } from '@/lib/motionPreference';
import useFieldId from '../useFieldId';
import { LabelMarker } from '../_internal/FieldFrame';
import Icon from '../../images-and-icons/Icon';
import './Rating.scss';

/** The scale, in order. Five is the whole of it — there is no other length. */
const RATING_VALUES = [1, 2, 3, 4, 5];

/**
 * How long the select stagger stays on the items after a pick: the last step's
 * delay plus the appearance transition. Past it the delay is gone, so a hover
 * or press that leaves an item returns without waiting.
 */
const STAGGER_WINDOW_MS = RATING_VALUES.length * STAGGER.gap + 400;

/**
 * Rating Component
 * Rating component with 5 stars, supporting two types:
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
    labelMarker,
    isRequired = false,
    value = 0,
    type = 'comments', // 'comments' or 'numeric'
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
    const numericValue = Number.isFinite(value) ? value : 0;
    const checkedValue = RATING_VALUES.includes(numericValue) ? numericValue : null;
    const reduced = useMotionReduced();

    const prevValueRef = useRef(numericValue);
    const [staggerFrom, setStaggerFrom] = useState(numericValue);
    const [staggering, setStaggering] = useState(false);
    if (prevValueRef.current !== numericValue) {
        setStaggerFrom(prevValueRef.current);
        setStaggering(true);
        prevValueRef.current = numericValue;
    }
    useEffect(() => {
        if (!staggering) return undefined;
        const timer = setTimeout(() => setStaggering(false), STAGGER_WINDOW_MS);
        return () => clearTimeout(timer);
    }, [staggering, numericValue]);

    const handleValueChange = (next) => {
        if (next === numericValue) return;
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
                    {label}<LabelMarker marker={labelMarker} isRequired={isRequired} />
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
                {RATING_VALUES.map((starValue) => {
                    const selected = numericValue >= starValue;
                    const staggerStep = Math.max(0, starValue - staggerFrom - 1);
                    const itemStyle = selected && staggering && !reduced
                        ? { '--plus-rating-stagger': `${staggerStep * STAGGER.gap}ms` }
                        : undefined;
                    return (
                        <div key={starValue} className="plus-rating-star-group">
                            <RatingItem
                                value={starValue}
                                selected={selected}
                                type={type}
                                icon={icon}
                                disabled={isDisabled}
                                style={itemStyle}
                            />
                        </div>
                    );
                })}
            </BaseRadioGroup>
            {type === 'comments' && showCommentsLabel && (
                <div className="plus-rating-comments-label">
                    {commentsLabel}
                </div>
            )}
        </div>
    );
};

Rating.propTypes = {
    /** Id of the star group, which the label names. A generated id is used when omitted. */
    id: PropTypes.string,
    /** Form key under which the chosen rating is sent with its form. */
    name: PropTypes.string,
    /** Visible label above the stars. It names the group; without one the group is named "Rating". */
    label: PropTypes.node,
    /** Marks the form's minority case in plain text after the label: `required` or `optional`. */
    labelMarker: PropTypes.oneOf(['required', 'optional']),
    /** Marks the radiogroup required (`aria-required`). Pair with `labelMarker="required"` only when required fields are the minority in the form. */
    isRequired: PropTypes.bool,
    /** Current rating, 0 for none up to 5. Every star up to it is filled. Update it from `onChange`. */
    value: PropTypes.number,
    /** `comments` (default) shows the icons alone, with an optional comments label under them; `numeric` prints each number above its icon. */
    type: PropTypes.oneOf(['comments', 'numeric']),
    /** Shows `commentsLabel` under the stars. Applies to the `comments` type only. */
    showCommentsLabel: PropTypes.bool,
    /** Text under the stars in the `comments` type. Defaults to "Comments". */
    commentsLabel: PropTypes.node,
    /** Disables every icon so no rating can be picked. */
    isDisabled: PropTypes.bool,
    /** Called with the new rating (1 to 5) when the user picks a different star. */
    onChange: PropTypes.func,
    /** Extra class on the wrapper around the label and stars. */
    className: PropTypes.string,
    /** Inline style on the wrapper around the label and stars. */
    style: PropTypes.object,
    /** The glyph used for every choice: `star` (default) or `thumbs-up`. */
    icon: PropTypes.oneOf(['star', 'thumbs-up'])
};

/**
 * Sub-component: RatingItem
 * Individual rating item with circular background and an icon.
 */
const RatingItem = ({
    value,
    selected = false,
    type = 'comments',
    icon = 'star',
    disabled = false,
    className = '',
    style,
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
            {type === 'numeric' && (
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
                style={style}
                aria-label={`Rate ${value}`}
                {...props}
            >
                <Icon name={icon} iconStyle={selected ? 'solid' : undefined} />
            </BaseRadio.Root>
        </div>
    );
};

RatingItem.propTypes = {
    /** The rating this item stands for, 1 to 5. It is the value `onChange` reports when the item is picked. */
    value: PropTypes.number.isRequired,
    /** Filled — true for every item up to the rating. */
    selected: PropTypes.bool,
    /** `numeric` prints the value above the icon; `comments` shows the icon alone. */
    type: PropTypes.oneOf(['comments', 'numeric']),
    /** The glyph for the item: `star` (default) or `thumbs-up`. */
    icon: PropTypes.oneOf(['star', 'thumbs-up']),
    /** Disables the item. Rating passes its `isDisabled` here. */
    disabled: PropTypes.bool,
    /** Extra class on the item circle, beside `plus-rating-item`. */
    className: PropTypes.string
};

// Attach subcomponent
Rating.Item = RatingItem;

export default Rating;

