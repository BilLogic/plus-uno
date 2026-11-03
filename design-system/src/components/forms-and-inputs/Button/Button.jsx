import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Button.scss';
import RBButton from 'react-bootstrap/Button';

export const BUTTON_APPEARANCES = ['default', 'primary', 'subtle', 'warning', 'danger', 'discovery'];
export const BUTTON_SPACINGS = ['default', 'compact'];

/** The icon slots and the label, in order. */
const ButtonContent = ({ children, text, iconBefore, iconAfter }) => {
    const content = text || children;

    const renderIcon = (icon, position) => {
        if (!icon) return null;
        const glyph = typeof icon === 'string'
            ? <i className={`fa-solid fa-${icon}`} aria-hidden="true" />
            : icon;
        return <span className={`plus-btn-visual plus-btn-visual--${position}`}>{glyph}</span>;
    };

    return (
        <>
            {renderIcon(iconBefore, 'before')}
            {content && <span className="plus-btn-text">{content}</span>}
            {renderIcon(iconAfter, 'after')}
        </>
    );
};

ButtonContent.propTypes = {
    children: PropTypes.node,
    text: PropTypes.string,
    iconBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    iconAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

/**
 * Button: triggers an action. Props follow Atlassian's Button
 * (https://atlassian.design/components/button).
 */
export const Button = ({
    // Content
    text,
    children,
    title,

    // Appearance
    appearance = 'default',
    spacing = 'default',
    shouldFitContainer = false,
    className,

    // Behavior
    onClick,
    isDisabled = false,
    isSelected,
    isLoading = false,
    href,
    target,
    type = 'button',
    as: Component,

    // Icons
    iconBefore,
    iconAfter,
    vertical = false,

    id,
    ...props
}) => {
    const iconOnly = !text && !children;

    const btnClasses = classNames(
        'plus-btn',
        `plus-btn--${appearance}`,
        {
            'plus-btn--compact': spacing === 'compact',
            'plus-btn--vertical': vertical,
            'plus-btn--fit-container': shouldFitContainer,
            'plus-btn--loading': isLoading,
            'plus-btn--selected': isSelected,
            'plus-btn--icon-only': iconOnly,
        },
        className
    );

    return (
        <RBButton
            id={id}
            as={Component}
            variant=""
            href={href}
            target={target}
            type={type}
            className={btnClasses}
            onClick={!isLoading ? onClick : undefined}
            disabled={isDisabled || isLoading}
            aria-disabled={isDisabled || isLoading}
            aria-busy={isLoading || undefined}
            aria-pressed={isSelected}
            title={title}
            {...props}
        >
            <ButtonContent text={text} iconBefore={iconBefore} iconAfter={iconAfter}>
                {children}
            </ButtonContent>
        </RBButton>
    );
};

Button.propTypes = {
    // Content
    text: PropTypes.string,
    children: PropTypes.node,
    title: PropTypes.string,

    // Appearance
    appearance: PropTypes.oneOf(BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24, for tables and tight toolbars. */
    spacing: PropTypes.oneOf(BUTTON_SPACINGS),
    shouldFitContainer: PropTypes.bool,
    className: PropTypes.string,

    // Behavior
    onClick: PropTypes.func,
    isDisabled: PropTypes.bool,
    isSelected: PropTypes.bool,
    isLoading: PropTypes.bool,
    href: PropTypes.string,
    target: PropTypes.string,
    type: PropTypes.string,
    as: PropTypes.elementType,

    // Icons: a Font Awesome Free glyph name (`plus`) or a node.
    iconBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    iconAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    vertical: PropTypes.bool,

    id: PropTypes.string,
};

export default Button;
