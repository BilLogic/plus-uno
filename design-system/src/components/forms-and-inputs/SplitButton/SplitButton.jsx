import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import './SplitButton.scss';

export const SPLIT_BUTTON_APPEARANCES = ['default', 'primary'];

/**
 * Split button: a button that does one action, joined to a chevron that opens
 * a menu of related actions. The menu itself belongs to the caller, which
 * anchors it to the chevron through `onMenuClick` and `isMenuExpanded`.
 */
export const SplitButton = ({
    text,
    onClick,
    menuLabel,
    onMenuClick,
    isMenuExpanded = false,
    appearance = 'default',
    spacing = 'default',
    isDisabled = false,
    isLoading = false,
    className,
    ...props
}) => (
    <div
        role="group"
        className={classNames('plus-split-btn', `plus-split-btn--${appearance}`, className)}
    >
        <Button
            text={text}
            appearance={appearance}
            spacing={spacing}
            isDisabled={isDisabled}
            isLoading={isLoading}
            onClick={onClick}
            {...props}
        />
        <IconButton
            icon="chevron-down"
            label={menuLabel}
            appearance={appearance}
            spacing={spacing}
            isDisabled={isDisabled}
            onClick={onMenuClick}
            aria-haspopup="menu"
            aria-expanded={isMenuExpanded}
        />
    </div>
);

SplitButton.propTypes = {
    /** The primary action's label. */
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    /** The chevron's accessible name, such as "More save options". */
    menuLabel: PropTypes.string.isRequired,
    onMenuClick: PropTypes.func,
    /** Whether the caller's menu is open; published as `aria-expanded`. */
    isMenuExpanded: PropTypes.bool,
    appearance: PropTypes.oneOf(SPLIT_BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    className: PropTypes.string,
};

export default SplitButton;
