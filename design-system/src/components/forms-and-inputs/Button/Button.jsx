import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Button.scss';
import RBButton from 'react-bootstrap/Button';
import { useDeprecatedLargeSize } from '../../../lib/useDeprecatedLargeSize';

/**
 * Button Component
 * Universal interactive element slightly favoring Figma spec over Bootstrap defaults.
 */
const ButtonContent = ({
    children,
    text,
    leadingVisual,
    trailingVisual,
    // Helps with styling context if needed, though mostly for layout
    vertical = false
}) => {
    const content = text || children;

    // Helper to render visuals
    const renderVisual = (visual, position) => {
        if (!visual) return null;
        let visualContent;
        if (typeof visual === 'string') {
            visualContent = <i className={`fa-solid fa-${visual}`} aria-hidden="true" />;
        } else {
            visualContent = visual;
        }
        return (
            <span className={`plus-btn-visual plus-btn-visual--${position}`}>
                {visualContent}
            </span>
        );
    };

    return (
        <>
            {renderVisual(leadingVisual, 'leading')}
            {content && <span className="plus-btn-text">{content}</span>}
            {renderVisual(trailingVisual, 'trailing')}
        </>
    );
};

ButtonContent.propTypes = {
    children: PropTypes.node,
    text: PropTypes.string,
    leadingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    trailingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    vertical: PropTypes.bool
};

/**
 * Button Component
 * Universal interactive element slightly favoring Figma spec over Bootstrap defaults.
 */
export const Button = ({
    // Content
    text,
    children,
    title,

    // Appearance
    style = 'primary',
    fill = 'filled',
    size = 'medium',
    className,
    block = false,

    // Behavior
    onClick,
    disabled = false,
    active = false,
    loading = false,
    href,
    target,
    type = 'button',
    as: Component,

    // Visuals
    leadingVisual,
    trailingVisual,
    vertical = false,

    // Dev
    id,
    ...props
}) => {
    useDeprecatedLargeSize('Button', size);

    // RBButton handles 'href' internally if passed (renders as anchor)
    // RBButton handles 'type' default to 'button'

    const btnClasses = classNames(
        'plus-btn',
        `plus-btn--${style}`,
        `plus-btn--${fill}`,
        `plus-btn--${size}`,
        {
            'plus-btn--vertical': vertical,
            'plus-btn--block': block,
            'plus-btn--loading': loading,
            'plus-btn--icon-only': !text && !children,
            // RB handles 'disabled' class but we enforce ours too
            'active': active
        },
        className
    );

    const content = (
        <ButtonContent
            text={text}
            leadingVisual={leadingVisual}
            trailingVisual={trailingVisual}
            vertical={vertical}
        >
            {children}
        </ButtonContent>
    );

    return (
        <RBButton
            id={id}
            as={Component} // Allow polymorphic 'as' prop
            variant="" // Disable default BS variants to usage only class-based styling
            href={href}
            target={target}
            type={type}
            className={btnClasses}
            onClick={!loading ? onClick : undefined}
            disabled={disabled || loading}
            aria-disabled={disabled || loading}
            title={title}
            active={active}
            {...props}
        >
            {content}
        </RBButton>
    );
};

Button.Content = ButtonContent;

Button.propTypes = {
    // Content
    text: PropTypes.string,
    children: PropTypes.node,
    title: PropTypes.string,

    // Appearance
    style: PropTypes.oneOf([
        'primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info', 'default',
        'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'
    ]),
    fill: PropTypes.oneOf(['filled', 'tonal', 'outline', 'ghost', 'text']),
    /**
     * `medium` draws 32 and is the default. `small` draws 24 compact, for table
     * rows and inline toolbars only. `large` is deprecated: it draws like
     * `medium` and warns in development.
     */
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    block: PropTypes.bool,
    className: PropTypes.string,

    // Behavior
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    active: PropTypes.bool,
    loading: PropTypes.bool,
    href: PropTypes.string,
    target: PropTypes.string,
    type: PropTypes.string,
    as: PropTypes.elementType,

    // Visuals
    leadingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    trailingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    vertical: PropTypes.bool,

    // Dev
    id: PropTypes.string,
};

export default Button;
