/**
 * PageLayout Component
 *
 * The app frame every spec page is laid out in: the SurfaceContainer pattern
 * (32 topbar, 240 sidebar docking from 1024, the surface and its 12-column
 * content grid) filled with the PLUS TopBar and Sidebar. The frame's sizes and
 * the sidebar's dock, peek and float behavior live in SurfaceContainer; this
 * component supplies the content and the page outline.
 * Figma: BS4 Foundation `Pattern/Page template` and `Pattern/Surface container`.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SurfaceContainer } from '@/patterns';
import { TopBar, Sidebar } from '../../Sections';
import { usePageLayoutShell } from './PageLayoutShellContext';

/**
 * The page's `<h1>` is off-screen, not `display: none` — a hidden-by-display
 * heading is out of the accessibility tree entirely and would give the page no
 * outline top at all, which is the defect this exists to fix (#243).
 *
 * It is an inline style rather than a utility class on purpose. Bootstrap's
 * `.visually-hidden` would do the same job, but a heading whose concealment
 * depends on a stylesheet arriving fails LOUDLY in the wrong direction: if that
 * sheet is missing or ordered late, an untitled-looking page suddenly grows a
 * 56px title. An inline style cannot be un-loaded.
 */
const PAGE_TITLE_STYLE = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
};

const PageLayout = ({
    children,
    sidebarConfig = {},
    topBarConfig = {},
    footerConfig = {},
    id,
    className = '',
    style,
    mainClassName = '',
    floatingContent,
    /**
     * The page's name — rendered as the `<h1>` that tops its heading outline.
     *
     * Every page laid out by this shell owns a document, and a document with no
     * `<h1>` has no top: `heading-order` cannot see it, because the first
     * heading on a page has no predecessor to skip from (#243). Supplying it
     * here rather than in each page means a new page gets one by passing a prop,
     * not by remembering a convention. `scripts/check-page-outline.mjs` and the
     * `.storybook/page-outline.js` assertion are what make forgetting it red.
     *
     * It is visually hidden because these pages put their name in the TopBar
     * breadcrumb, not in the content — see the note on PAGE_TITLE_STYLE. A page
     * that DOES render its own visible title heading marks that heading up as
     * the `<h1>` instead and leaves this unset.
     */
    title,
    /** When true, render children straight into the surface, with no `<main>` content grid (e.g. full-width chat). */
    contentDirect = false,
    /** When true, show TopBar skeleton + Sidebar loading (shimmer). */
    shellLoading = false,
    /** When true, apply shell-reveal has-entered for entrance animation (TopBar + Sidebar). */
    shellEntered = false,
    /** When true, there is no sidebar and no sidebar toggle. */
    sidebarHidden = false,
    /** When true, dock the sidebar at every width (e.g. for Storybook/demos). Overrides the breakpoint default. */
    sidebarExpanded = false,
}) => {
    const pageShell = usePageLayoutShell();
    const forceExpanded = sidebarExpanded || Boolean(pageShell?.forceSidebarExpanded);
    const fullscreen = Boolean(pageShell?.fullscreen);

    /** Sidebar expects `activeTabId`; specs often pass `activeTab`. Strip both before spread. */
    const sidebarProps = { ...(sidebarConfig || {}) };
    if (pageShell?.enabled) {
        if (pageShell.user) sidebarProps.user = pageShell.user;
        if (pageShell.goHome) sidebarProps.onHomeClick = pageShell.goHome;
        if (pageShell.onTabClick) sidebarProps.onTabClick = pageShell.onTabClick;
    }
    const sidebarActiveCombined =
        (pageShell?.enabled && pageShell.activeTab ? pageShell.activeTab : null)
        ?? sidebarProps.activeTabId
        ?? sidebarProps.activeTab;
    delete sidebarProps.activeTabId;
    delete sidebarProps.activeTab;

    /**
     * First element inside `<main>`, so the outline's top is also the top of the
     * page's main content. Omitted entirely when no title is given — a page that
     * marks its own visible heading up as the `<h1>` must not get a second one.
     */
    const pageTitle = title
        ? <h1 className="plus-page-title" style={PAGE_TITLE_STYLE}>{title}</h1>
        : null;

    const reveal = `shell-reveal${shellEntered ? ' has-entered' : ''}`;

    // The topbar row is the frame's; the TopBar draws the sidebar toggle from the
    // frame's state, so there is one toggle. Loading keeps it and shows skeletons.
    const topbar = (
        <div className={shellLoading ? undefined : reveal} style={{ display: 'flex', flex: '1 1 auto', minWidth: 0, height: '100%' }}>
            <TopBar
                breadcrumbs={topBarConfig.breadcrumbs}
                user={topBarConfig.user}
                onHelpClick={topBarConfig.onHelpClick}
                helpHref={topBarConfig.helpHref}
                loading={shellLoading}
            />
        </div>
    );

    const sidebar = sidebarHidden ? null : (
        <div className={`plus-page-sidebar-wrapper${shellLoading ? '' : ` ${reveal}`}`}>
            <Sidebar
                {...sidebarProps}
                activeTabId={sidebarActiveCombined}
                visible={true}
                loading={shellLoading}
            />
        </div>
    );

    return (
        <div
            id={id}
            className={`plus-page-layout${fullscreen ? ' plus-page-layout--fullscreen' : ''} ${className}`}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                minHeight: fullscreen ? 0 : undefined,
                flex: fullscreen ? '1 1 auto' : undefined,
                ...style,
            }}
        >
            <SurfaceContainer
                topbar={topbar}
                sidebar={sidebar}
                sidebarDocked={forceExpanded ? true : undefined}
                contentAs="main"
                contentClassName={['plus-page-main', mainClassName].filter(Boolean).join(' ')}
                surfaceDirect={contentDirect}
                style={{ flex: '1 1 auto', minHeight: 0 }}
            >
                {pageTitle}
                {children}
            </SurfaceContainer>

            {/* Floating content anchored to page frame (e.g. FAB) */}
            {floatingContent && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 'var(--space-200)',
                        right: 'var(--space-300)',
                        zIndex: 'var(--layout-z-index-navigation)',
                        pointerEvents: 'auto',
                    }}
                >
                    {floatingContent}
                </div>
            )}
        </div>
    );
};

PageLayout.propTypes = {
    children: PropTypes.node,
    sidebarConfig: PropTypes.object,
    topBarConfig: PropTypes.object,
    footerConfig: PropTypes.object,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    mainClassName: PropTypes.string,
    floatingContent: PropTypes.node,
    title: PropTypes.string,
    contentDirect: PropTypes.bool,
    shellLoading: PropTypes.bool,
    shellEntered: PropTypes.bool,
    sidebarHidden: PropTypes.bool,
    sidebarExpanded: PropTypes.bool,
};

export default PageLayout;
