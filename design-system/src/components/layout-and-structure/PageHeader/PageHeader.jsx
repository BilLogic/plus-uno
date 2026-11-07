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
    /** The page title. Drawn as an `xlarge` `Heading` unless `disableTitleStyles` is set. `children` is used when it is omitted. */
    title: PropTypes.node,
    /** `children` is the title when `title` is not given. */
    children: PropTypes.node,
    /** A breadcrumb trail shown above the title row. Pass a `Breadcrumb`. */
    breadcrumbs: PropTypes.node,
    /** Controls shown at the end of the title row, such as a primary button or a menu. */
    actions: PropTypes.node,
    /** Content in a bar below the title row, such as tabs or filters. */
    bottomBar: PropTypes.node,
    /** Renders the title as a plain node instead of a `Heading`, for a caller that styles it itself. */
    disableTitleStyles: PropTypes.bool,
    /** Extra class names added to the header element beside the component's own. */
    className: PropTypes.string,
};

export default PageHeader;
