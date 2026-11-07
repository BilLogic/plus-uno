import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { Button } from '../Button/Button';
import './FilterButton.scss';

export const FILTER_BUTTON_APPEARANCES = ['default', 'subtle'];

/**
 * Filter button: opens or toggles a filter. It shows the filter's name, an
 * optional count of what is applied, and a chevron when it opens a menu.
 */
export const FilterButton = ({
    text,
    trailingMetric,
    hasChevronDown = true,
    appearance = 'default',
    className,
    ...props
}) => {
    const hasMetric = trailingMetric !== undefined && trailingMetric !== null;
    return (
        <Button
            appearance={appearance}
            iconAfter={hasChevronDown ? 'chevron-down' : undefined}
            className={clsx('plus-filter-btn', className)}
            {...props}
        >
            {text}
            {hasMetric && <span className="plus-filter-btn__metric">{trailingMetric}</span>}
        </Button>
    );
};

FilterButton.propTypes = {
    /** The filter's name. */
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
