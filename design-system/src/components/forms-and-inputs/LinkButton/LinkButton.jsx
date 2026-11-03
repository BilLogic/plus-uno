import React from 'react';
import PropTypes from 'prop-types';
import { Button, BUTTON_APPEARANCES } from '../Button/Button';

/**
 * Link button: navigates, and looks like a button. It renders an anchor, so it
 * has no disabled or loading state.
 */
export const LinkButton = ({ href, target, rel, children, text, ...props }) => (
    <Button
        href={href}
        role="link"
        target={target}
        rel={target === '_blank' ? rel ?? 'noopener noreferrer' : rel}
        text={text}
        {...props}
    >
        {children}
    </Button>
);

LinkButton.propTypes = {
    /** Where the link goes. */
    href: PropTypes.string.isRequired,
    target: PropTypes.string,
    rel: PropTypes.string,
    text: PropTypes.string,
    children: PropTypes.node,
    appearance: PropTypes.oneOf(BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    iconBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    iconAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isSelected: PropTypes.bool,
    shouldFitContainer: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
};

export default LinkButton;
