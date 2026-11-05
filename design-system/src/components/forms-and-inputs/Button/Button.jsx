import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import AiIcon from '../../images-and-icons/AiIcon';
import './Button.scss';

/** A bare `#` or empty `href` names no real destination; Enter still needs one to fire a click on an anchor. */
const isTrivialHref = (href) => !href || href.trim() === '#';

export const BUTTON_APPEARANCES = ['default', 'primary', 'subtle', 'warning', 'danger', 'discovery', 'ai'];
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
 * Button: triggers an action.
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
    type = 'button',
    as: Component,

    // Icons
    iconBefore,
    iconAfter,

    id,
    testId,
    href,
    target,
    rel,
    role,
    ...props
}) => {
    const disabled = isDisabled || isLoading;
    const iconOnly = !text && !children;
    // The AI appearance always carries the sparkle and takes no other leading icon, so it reads as AI before its label does.
    if (appearance === 'ai' && iconOnly && process.env.NODE_ENV !== 'production') {
        console.warn('Button: the ai appearance needs a text label beside the sparkle.');
    }
    const leadingIcon = appearance === 'ai' ? <AiIcon name="generate" /> : iconBefore;

    const btnClasses = classNames(
        'plus-btn',
        `plus-btn--${appearance}`,
        {
            'plus-btn--compact': spacing === 'compact',
            'plus-btn--fit-container': shouldFitContainer,
            'plus-btn--loading': isLoading,
            'plus-btn--selected': isSelected,
            'plus-btn--icon-only': iconOnly,
        },
        className
    );

    const Tag = Component || (href != null || target != null || rel != null ? 'a' : 'button');

    /*
     * `Tag === 'button'` gets the real `disabled` attribute, which already
     * blocks clicks and keyboard activation on its own. An anchor has no such
     * attribute, so the click and the Enter/Space key are handled by hand —
     * the same behavior react-bootstrap's `useButtonProps` gave this
     * component before the swap, including a trivial (`#` or empty) `href`
     * still swallowing the click rather than letting it navigate nowhere.
     */
    const handleAnchorClick = (event) => {
        if (disabled || (Tag === 'a' && isTrivialHref(href))) event.preventDefault();
        if (disabled) {
            event.stopPropagation();
            return;
        }
        onClick?.(event);
    };

    const tagProps = Tag === 'button'
        ? { type, disabled, onClick: !isLoading ? onClick : undefined }
        : {
            role: role ?? 'button',
            tabIndex: disabled ? undefined : 0,
            href: disabled ? undefined : (href || '#'),
            target: Tag === 'a' ? target : undefined,
            rel: Tag === 'a' ? rel : undefined,
            onClick: handleAnchorClick,
            onKeyDown: (event) => {
                if (event.key === ' ') {
                    event.preventDefault();
                    handleAnchorClick(event);
                }
            },
        };

    return (
        <Tag
            id={id}
            className={btnClasses}
            title={title}
            data-testid={testId}
            {...props}
            {...tagProps}
            aria-disabled={disabled || undefined}
            aria-busy={isLoading || undefined}
            aria-pressed={isSelected}
        >
            <ButtonContent text={text} iconBefore={leadingIcon} iconAfter={iconAfter}>
                {children}
            </ButtonContent>
        </Tag>
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
    type: PropTypes.string,
    as: PropTypes.elementType,
    /** Renders as an anchor when set (and no `as` overrides it). */
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
    /** Overrides the default `"button"` ARIA role an anchor-rendered Button takes (e.g. `LinkButton`'s own `"link"`). */
    role: PropTypes.string,

    // Icons: a Font Awesome Free glyph name (`plus`) or a node.
    iconBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    iconAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    id: PropTypes.string,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default Button;
