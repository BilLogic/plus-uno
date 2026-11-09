import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import VisuallyHidden from '@/components/text-and-data-display/VisuallyHidden';
import Icon from '../../images-and-icons/Icon';
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
            className={clsx('plus-link', `plus-link--${appearance}`, className)}
            {...props}
        >
            {children}
            {isOpenInNewWindow && (
                <>
                    <Icon name="arrow-up-right-from-square" className="plus-link-icon" />
                    <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
                </>
            )}
        </a>
    );
};

Link.propTypes = {
    /** The destination URL of the anchor. Required. */
    href: PropTypes.string.isRequired,
    /** `default` for links in body text; `subtle` for links inside secondary or quiet text; `inverse` for links on dark or colored grounds. */
    appearance: PropTypes.oneOf(LINK_APPEARANCES),
    /** Pass-through to the anchor; `isOpenInNewWindow` sets `_blank` when neither is given. */
    target: PropTypes.string,
    /** The anchor `rel` attribute. Defaults to `noopener noreferrer` when the link opens in a new tab. */
    rel: PropTypes.string,
    /** Draws the new-window glyph and appends it to the accessible name. Also defaults `target` to `_blank`. */
    isOpenInNewWindow: PropTypes.bool,
    /** Extra class names added to the anchor beside the component's own. */
    className: PropTypes.string,
    /** The link text. Required, since it names the link. */
    children: PropTypes.node.isRequired,
};

export default Link;
