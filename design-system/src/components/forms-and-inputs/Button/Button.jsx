import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import AiIcon from '../../images-and-icons/AiIcon';
import './Button.scss';
import { iconClass } from '../../../lib/icon';

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
            ? <i className={iconClass(icon)} aria-hidden="true" />
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
        ? { type, disabled, role, onClick: !isLoading ? onClick : undefined }
        : {
            role: role ?? 'button',
            tabIndex: disabled ? undefined : (props.tabIndex ?? 0),
            href: disabled ? undefined : (href || '#'),
            target: Tag === 'a' ? target : undefined,
            rel: Tag === 'a' ? rel : undefined,
            onClick: handleAnchorClick,
            onKeyDown: (event) => {
                // A host that composes behavior in (a menu item's roving focus) keeps its own handler.
                props.onKeyDown?.(event);
                if (event.defaultPrevented) return;
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
            aria-pressed={role === 'link' ? undefined : isSelected}
            aria-current={role === 'link' && isSelected ? 'true' : undefined}
        >
            <ButtonContent text={text} iconBefore={leadingIcon} iconAfter={iconAfter}>
                {children}
            </ButtonContent>
        </Tag>
    );
};

Button.propTypes = {
    // Content
    /** The label. `children` works too; `text` wins when both are given. */
    text: PropTypes.string,
    /** The label, used when `text` is not given. Omit both for an icon-only button. */
    children: PropTypes.node,
    /** The `title` attribute, a native tooltip on hover. */
    title: PropTypes.string,

    // Appearance
    /** The visual style. `primary` is for the main action on a page, `default` for secondary actions and `subtle` for low-emphasis ones. `warning` and `danger` mark risky or destructive actions, `discovery` points out something new, and `ai` is for AI actions and needs a text label. */
    appearance: PropTypes.oneOf(BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24, for tables and tight toolbars. */
    spacing: PropTypes.oneOf(BUTTON_SPACINGS),
    /** Stretches the button to the full width of its container. */
    shouldFitContainer: PropTypes.bool,
    /** Extra class names added to the button element beside the component's own. */
    className: PropTypes.string,

    // Behavior
    /** Called with the click event when the button is activated by mouse or keyboard. It does not fire while `isDisabled` or `isLoading` is set. */
    onClick: PropTypes.func,
    /** Prevents interaction and sets `aria-disabled`. Avoid it where you can; say why the action is unavailable instead. */
    isDisabled: PropTypes.bool,
    /** Marks the button selected and sets `aria-pressed`. For a link role it sets `aria-current` instead. */
    isSelected: PropTypes.bool,
    /** Shows a spinner in place of the label, blocks interaction and sets `aria-busy`. */
    isLoading: PropTypes.bool,
    /** The native button `type`: `button` (default), `submit` or `reset`. Used only when the button renders as a `button` element. */
    type: PropTypes.string,
    /** Renders the button as this element or component instead, such as a router link. Without it the button is an anchor when `href`, `target` or `rel` is set, otherwise a `button`. */
    as: PropTypes.elementType,
    /** Renders as an anchor when set (and no `as` overrides it). */
    href: PropTypes.string,
    /** The anchor `target` attribute, such as `_blank`. Used only when the button renders as an anchor. */
    target: PropTypes.string,
    /** The anchor `rel` attribute. Used only when the button renders as an anchor. */
    rel: PropTypes.string,
    /** Overrides the default `"button"` ARIA role an anchor-rendered Button takes (e.g. `LinkButton`'s own `"link"`). */
    role: PropTypes.string,

    // Icons: a Font Awesome Free glyph name (`plus`) or a node.
    /** A Font Awesome Free glyph name (`plus`) or a node, placed before the label. Ignored when `appearance` is `ai`, which always shows its own sparkle. */
    iconBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** A Font Awesome Free glyph name (`arrow-right`) or a node, placed after the label. */
    iconAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /** The `id` attribute of the rendered element. */
    id: PropTypes.string,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default Button;
