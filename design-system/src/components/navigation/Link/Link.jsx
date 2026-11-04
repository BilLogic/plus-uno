import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import VisuallyHidden from '@/components/layout-and-structure/VisuallyHidden';
import './Link.scss';

export const LINK_APPEARANCES = ['default', 'subtle', 'inverse'];

/**
 * Link: an inline navigation anchor.
 */
export const Link = ({
    href,
    appearance = 'default',
    target,
    rel,
    isOpenInNewWindow = false,
    className,
    children,
    ...props
}) => {
    const resolvedTarget = target || (isOpenInNewWindow ? '_blank' : undefined);
    const resolvedRel = rel || (resolvedTarget === '_blank' ? 'noopener noreferrer' : undefined);

    return (
        <a
            href={href}
            target={resolvedTarget}
            rel={resolvedRel}
            className={classNames('plus-link', `plus-link--${appearance}`, className)}
            {...props}
        >
            {children}
            {isOpenInNewWindow && (
                <>
                    <i className="fa-solid fa-arrow-up-right-from-square plus-link-icon" aria-hidden="true" />
                    <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
                </>
            )}
        </a>
    );
};

Link.propTypes = {
    href: PropTypes.string.isRequired,
    appearance: PropTypes.oneOf(LINK_APPEARANCES),
    /** Pass-through to the anchor; `isOpenInNewWindow` sets `_blank` when neither is given. */
    target: PropTypes.string,
    rel: PropTypes.string,
    /** Draws the new-window glyph and appends it to the accessible name. Also defaults `target` to `_blank`. */
    isOpenInNewWindow: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export default Link;
