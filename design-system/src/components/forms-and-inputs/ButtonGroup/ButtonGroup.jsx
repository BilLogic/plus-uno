import React from 'react';
import PropTypes from 'prop-types';
import './ButtonGroup.scss';

/**
 * Button group: a visually connected row of related actions. A
 * plain container for `Button` children, each keeping its own `appearance`
 * and `spacing`. `label` names the group for assistive technology.
 */
const ButtonGroup = ({
    children,
    label,
    testId,
    className,
    id,
    ...props
}) => (
    <div
        id={id}
        className={['plus-button-group', className].filter(Boolean).join(' ')}
        role="group"
        aria-label={label}
        data-testid={testId}
        {...props}
    >
        {children}
    </div>
);

ButtonGroup.propTypes = {
    /** The buttons to render inside the group. */
    children: PropTypes.node,
    /** The group's accessible name. Strongly recommended. */
    label: PropTypes.string,
    /** A `data-testid` hook for automated tests. */
    testId: PropTypes.string,
    /** Additional CSS classes. */
    className: PropTypes.string,
    /** HTML ID attribute. */
    id: PropTypes.string,
};

export default ButtonGroup;
