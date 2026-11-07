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
    /** The anchor `target` attribute, such as `_blank` to open a new tab. */
    target: PropTypes.string,
    /** The anchor `rel` attribute. Defaults to `noopener noreferrer` when `target` is `_blank`. */
    rel: PropTypes.string,
    /** The label as a string. Wins over `children`. */
    text: PropTypes.string,
    /** The label, used when `text` is not given. */
    children: PropTypes.node,
    /** The button's look, the same seven as Button. Use `primary` for the one main navigation on a view and `default` or `subtle` for the rest. */
    appearance: PropTypes.oneOf(BUTTON_APPEARANCES),
    /** `default` draws 32. `compact` draws 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** An icon before the label: a Font Awesome Free glyph name (`calendar`) or a node. */
    iconBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** An icon after the label: a Font Awesome Free glyph name (`arrow-right`) or a node. */
    iconAfter: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** Marks the link as the current page: sets `aria-current` and draws the selected look on `default` and `subtle`. */
    isSelected: PropTypes.bool,
    /** Stretches the link to the full width of its container. */
    shouldFitContainer: PropTypes.bool,
    /** Called with the click event when the link is activated. The link still navigates to `href` unless the handler prevents it. */
    onClick: PropTypes.func,
    /** Extra class names added to the anchor beside the component's own. */
    className: PropTypes.string,
};

export default LinkButton;
