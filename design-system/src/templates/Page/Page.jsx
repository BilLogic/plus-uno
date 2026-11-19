import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useMotionReduced } from '@/lib/motionPreference';
import { findScrollContainer, scrollToSpot } from '@/lib/navigationMotion';
import './Page.scss';

/**
 * Page template for PLUS design system.
 * The Page surface: paints `--ds-surface` edge to edge with `--page-pad` (24)
 * on every side and no radius, border, or shadow; children fill the content
 * slot.
 *
 * A Page can carry its `title`: the page's one h1, at Heading/large 24,
 * above the content. Sections inside it open at h2.
 */
const Page = ({
    id,
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
        'plus-template-page',
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
            {header ? <div className="plus-template-page-header">{header}</div> : title && <h1 className="plus-template-page-title">{title}</h1>}
            {banner && <div className="plus-template-page-banner">{banner}</div>}
            {hasSlots && children != null && children !== false ? <div className="plus-template-page-content">{children}</div> : children}
        </Component>
    );
};

Page.propTypes = {
    id: PropTypes.string,
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
