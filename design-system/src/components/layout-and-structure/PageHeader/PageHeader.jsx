import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Heading from '@/components/text-and-data-display/Heading';
import './PageHeader.scss';

/**
 * PageHeader: a page's title row, with an optional breadcrumb trail above it,
 * actions to its side, and a bottom bar below.
 */
export const PageHeader = ({
    title,
    children,
    breadcrumbs,
    actions,
    bottomBar,
    disableTitleStyles = false,
    className,
    ...props
}) => {
    const titleContent = title ?? children;

    return (
        <header className={classNames('plus-page-header', className)} {...props}>
            {breadcrumbs && <div className="plus-page-header-breadcrumbs">{breadcrumbs}</div>}
            <div className="plus-page-header-row">
                <div className="plus-page-header-title">
                    {disableTitleStyles ? titleContent : (
                        <Heading size="xlarge" as="h2">{titleContent}</Heading>
                    )}
                </div>
                {actions && <div className="plus-page-header-actions">{actions}</div>}
            </div>
            {bottomBar && <div className="plus-page-header-bottom-bar">{bottomBar}</div>}
        </header>
    );
};

PageHeader.propTypes = {
    title: PropTypes.node,
    /** `children` is the title when `title` is not given. */
    children: PropTypes.node,
    breadcrumbs: PropTypes.node,
    actions: PropTypes.node,
    bottomBar: PropTypes.node,
    /** Renders the title as a plain node instead of a `Heading`, for a caller that styles it itself. */
    disableTitleStyles: PropTypes.bool,
    className: PropTypes.string,
};

export default PageHeader;
