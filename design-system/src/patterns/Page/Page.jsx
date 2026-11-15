import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useMotionReduced } from '@/lib/motionPreference';
import { findScrollContainer, scrollToSpot } from '@/lib/navigationMotion';
import './Page.scss';

/**
 * The elevation levels, lowest to highest. A level is a pair: its fill and the
 * shadow that goes with it, so a page never wears one without the other.
 */
export const PAGE_LEVELS = ['sunken', 'default', 'raised', 'overlay'];

/**
 * The default page's edge, as the `surface-edge` mixin in
 * `styles/_surface-edge.scss` draws it. For the stories that measure it.
 */
export const PAGE_EDGE = '0 0 0 var(--page-border-width) var(--ds-border-surface)';

/**
 * Page pattern for PLUS design system.
 * Bare tokenized content box: pick an elevation level, padding scale, radius
 * scale and border — children fill the content slot. The level sets the fill
 * and its shadow together: sunken (the frame's blanket), default (the page,
 * edged by the surface border), raised (a card) and overlay (anything over
 * the UI).
 *
 * A Page can carry its `title`: the page's one h1, at Heading/large 24,
 * above the content. Sections inside it open at h2.
 */
const Page = ({
    id,
    level = 'default',
    padding = 'md',
    radius = 'none',
    border = false,
    as: Component = 'div',
    title,
    header,
    banner,
    className = '',
    style,
    onClick,
    children,
    ...props
}) => {
    const pageRef = useRef(null);
    const reduced = useMotionReduced();
    const hasSlots = Boolean(header || banner);

    const classes = [
        'plus-pattern-page',
        `plus-pattern-page-level-${level}`,
        `plus-pattern-page-pad-${padding}`,
        `plus-pattern-page-radius-${radius}`,
        border ? 'plus-pattern-page-bordered' : '',
        className,
    ].filter(Boolean).join(' ');

    const handleClick = (event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
        if (!link) return;
        const raw = link.getAttribute('href').slice(1);
        if (!raw) return;
        const targetId = decodeURIComponent(raw);
        const root = pageRef.current;
        const target = root && targetId ? root.querySelector(`#${CSS.escape(targetId)}`) : null;
        if (!target) return;
        event.preventDefault();
        scrollToSpot(findScrollContainer(root), target, { reduced });
    };

    return (
        <Component ref={pageRef} id={id} className={classes} style={style} onClick={handleClick} {...props}>
            {header ? <div className="plus-pattern-page-header">{header}</div> : title && <h1 className="plus-pattern-page-title">{title}</h1>}
            {banner && <div className="plus-pattern-page-banner">{banner}</div>}
            {hasSlots && children != null && children !== false ? <div className="plus-pattern-page-content">{children}</div> : children}
        </Component>
    );
};

Page.propTypes = {
    id: PropTypes.string,
    /** Elevation level: its fill and its shadow, as a pair */
    level: PropTypes.oneOf(PAGE_LEVELS),
    /** Padding scale (md is the frame's own pad) */
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** Radius scale */
    radius: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** A bold border on/off */
    border: PropTypes.bool,
    /** Render element / component */
    as: PropTypes.elementType,
    /** The page's title: its one h1, at Heading/large 24. Leave it unset on a Page that is not a whole page.
     * @ds-context Used in: Page.title (ds guide page)
     */
    title: PropTypes.node,
    /** One PageHeader with the page's h1, actions and tabs. Replaces title.
     * @ds-context Used in: Page.header (ds guide page)
     * @ds-context Governed by: Common actions (ds guide common-actions)
     */
    header: PropTypes.node,
    /** One page Banner below the header. Governed by Notifications (ds guide notifications).
     * @ds-context Used in: Page.banner (ds guide page)
     */
    banner: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot
     * @ds-context Used in: Page.children (ds guide page)
     */
    children: PropTypes.node,
};

export default Page;
