import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import Icon from '../../images-and-icons/Icon';
import ClippedTooltip from '@/lib/ClippedTooltip';
import { Button } from '../Button/Button';
import './FilterButton.scss';

export const FILTER_BUTTON_APPEARANCES = ['default', 'subtle'];

/**
 * Filter button: opens or toggles a filter. It shows the filter's name, an
 * optional count of what is applied, and a chevron when it opens a menu.
 */
export const FilterButton = ({
    label,
    text,
    trailingMetric,
    hasChevronDown = true,
    appearance = 'default',
    className,
    ...props
}) => {
    const hasMetric = trailingMetric !== undefined && trailingMetric !== null;
    // A value longer than the button ends in an ellipsis; the name and the count keep
    // their places, and the full text opens in a Tooltip on hover and focus.
    return (
        <ClippedTooltip text={label ? `${label}: ${text}` : text} placement="top">
            {({ measureRef }) => (
                <Button
                    appearance={appearance}
                    iconAfter={hasChevronDown ? <Icon name="chevron-down" size={12} /> : undefined}
                    className={clsx('plus-filter-btn', className)}
                    {...props}
                >
                    {label ? <span className="plus-filter-btn__label">{`${label}:`}</span> : null}
                    {/* The space stays for the accessible name; the flex row draws the gap. */}
                    {label ? ' ' : null}
                    <span ref={measureRef} className={label ? 'plus-filter-btn__value' : 'plus-filter-btn__text'}>{text}</span>
                    {hasMetric && <span className="plus-filter-btn__metric">{trailingMetric}</span>}
                </Button>
            )}
        </ClippedTooltip>
    );
};

FilterButton.propTypes = {
    /** The field the filter narrows, such as "Status". With it the button reads "Status: Upcoming": the label quiet, `text` the value in ink. */
    label: PropTypes.string,
    /** The filter's name, or its value when `label` is set. */
    text: PropTypes.string.isRequired,
    /** The count shown after the name. `0` shows; leave it out to hide it. */
    trailingMetric: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The chevron that says a menu opens. */
    hasChevronDown: PropTypes.bool,
    appearance: PropTypes.oneOf(FILTER_BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
};

export default FilterButton;
