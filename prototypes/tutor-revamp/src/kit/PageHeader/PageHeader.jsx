import React from 'react';
import PropTypes from 'prop-types';
import './PageHeader.css';

/**
 * PageHeader: the top of a screen.
 *
 * - **Eyebrow** above the title (a date, a count: "Monday, January 22").
 * - **Title**, the page's one h1, with a `status` slot beside it.
 * - **Meta** line under it, subtle.
 * - **Actions** at the end of the row; at most one primary button per screen.
 * - **Aside** at the end instead of actions: the illustration slot on Home.
 * - `children` sit under the header (Phases on a session).
 * - `detail` steps the title down from XXL to XL, for a record's tab.
 */
const PageHeader = ({ eyebrow, title, status, meta, actions, aside, detail = false, titleId, children, className = '' }) => (
    <header className={['tr-page-header', detail ? 'tr-page-header--detail' : '', className].filter(Boolean).join(' ')}>
        <div className="tr-page-header__row">
            <div className="tr-page-header__text">
                {eyebrow ? <span className="tr-page-header__eyebrow">{eyebrow}</span> : null}
                <div className="tr-page-header__title-row">
                    <h1 id={titleId} className="tr-page-header__title">{title}</h1>
                    {status}
                </div>
                {meta ? <p className="tr-page-header__meta">{meta}</p> : null}
            </div>
            {actions ? <div className="tr-page-header__actions">{actions}</div> : null}
            {aside ? <div className="tr-page-header__aside">{aside}</div> : null}
        </div>
        {children}
    </header>
);

PageHeader.propTypes = {
    /** Small text above the title */
    eyebrow: PropTypes.node,
    title: PropTypes.node.isRequired,
    /** A Status beside the title */
    status: PropTypes.node,
    /** One subtle line under the title */
    meta: PropTypes.node,
    /** Buttons at the end of the row */
    actions: PropTypes.node,
    /** An illustration or other decoration at the end of the row */
    aside: PropTypes.node,
    /** XL title, for a record's own tab */
    detail: PropTypes.bool,
    titleId: PropTypes.string,
    /** Content under the header row, such as Phases */
    children: PropTypes.node,
    className: PropTypes.string,
};

export default PageHeader;
