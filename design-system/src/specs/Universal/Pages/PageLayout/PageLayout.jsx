/**
 * PageLayout Component
 *
 * The app frame every spec page is laid out in: the Frame pattern
 * (32 topbar, 240 sidebar docking from 1024, the surface and its 12-column
 * content grid) filled with the PLUS TopBar and Sidebar. The frame's sizes and
 * the sidebar's dock, peek and float behavior live in Frame; this
 * component supplies the content and the page outline.
 * Figma: BS4 Foundation `Pattern/Page template` and `Pattern/Surface container`.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Button, CloseButton } from '@/components';
import { Frame } from '@/patterns';
import { TopBar, Sidebar } from '../../Sections';
import { usePageLayoutShell } from './PageLayoutShellContext';
import './PageLayout.scss';

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
    // The page heading's style, Heading/large 24, for whatever reads it.
    font: 'var(--heading-large)',
};

/**
 * `frame="focused"`: the page for one task, with no sidebar. Mirrors the Figma
 * `Pattern/Page template` frame=focused and its parts `_Focused topbar` and
 * `_Focused footer`.
 *
 * - The Frame with no sidebar and three rows, `--focused-page-stack-sm` 8
 *   apart inside `--focused-page-pad-y` · `--focused-page-pad-x` 8.
 * - Topbar (a `header`, the banner), 32 high: Back, a secondary text button
 *   with `arrow-left`; the title, the page's one visible `h1` at Heading/xsmall,
 *   on one line and truncated; Close, the `CloseButton`; `--focused-page-inline-md`
 *   12 apart.
 * - Surface (the `main`): the frame's surface at reading width, content capped
 *   at `--layout-max-width-reading` 864, centered, never under 720. It scrolls
 *   on its own.
 * - Footer (a `footer` named by `actionsLabel`): the actions, end-aligned,
 *   `--focused-page-inline-sm` 8 apart, in a column as wide as the content and
 *   lined up with it. It stays put while the surface scrolls.
 *
 * Focus order follows the DOM: Back, Close, the content, then the actions.
 */
const FocusedFrame = ({
    title,
    onBack,
    backHref,
    backLabel,
    onClose,
    closeLabel,
    actions,
    actionsLabel,
    mainClassName,
    contentDirect,
    children,
}) => {
    const hasBack = Boolean(onBack || backHref);
    const topbar = (
        <header className="plus-page-focused__topbar">
            {hasBack ? (
                <Button
                    className="plus-page-focused__back"
                    style="secondary"
                    fill="text"
                    size="medium"
                    leadingVisual="arrow-left"
                    text={backLabel}
                    href={backHref}
                    onClick={onBack}
                />
            ) : null}
            <h1 className="plus-page-focused__title">{title}</h1>
            {onClose ? (
                <CloseButton className="plus-page-focused__close" aria-label={closeLabel} onClick={onClose} />
            ) : null}
        </header>
    );
    const footer = actions ? (
        <footer className="plus-page-focused__footer" aria-label={actionsLabel}>
            <div className="plus-page-focused__actions">{actions}</div>
        </footer>
    ) : null;

    return (
        <Frame
            topbar={topbar}
            footer={footer}
            width="reading"
            contentAs="main"
            contentClassName={['plus-page-main', mainClassName].filter(Boolean).join(' ')}
            surfaceDirect={contentDirect}
            style={{ flex: '1 1 auto', minHeight: 0 }}
        >
            {children}
        </Frame>
    );
};

const PageLayout = ({
    children,
    /** `default`: the app frame with the TopBar and Sidebar. `focused`: one task, no sidebar — see FocusedFrame. */
    frame = 'default',
    /** Focused: called when Back is pressed. With this or `backHref`, the topbar shows Back. */
    onBack,
    /** Focused: where Back goes, as a link. */
    backHref,
    backLabel = 'Back',
    /** Focused: called when Close is pressed. Without it there is no Close. */
    onClose,
    closeLabel = 'Close',
    /** Focused: the footer actions, end-aligned, the primary last. Without them there is no footer. */
    actions,
    actionsLabel = 'Page actions',
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
     * breadcrumb, not in the content — see the note on PAGE_TITLE_STYLE. With
     * `frame="focused"` it is the visible title in the focused topbar instead. A page
     * that DOES render its own visible title heading marks that heading up as
     * the `<h1>` instead and leaves this unset.
     */
    title,
    /** When true, render children straight into the surface, with no `<main>` content grid (e.g. full-width chat). */
    contentDirect = false,
    /** When true, show the TopBar skeleton and hold the sidebar's entrance reveal. */
    shellLoading = false,
    /** When true, apply shell-reveal has-entered for entrance animation (TopBar + Sidebar). */
    shellEntered = false,
    /** When true, there is no sidebar and no sidebar toggle. */
    sidebarHidden = false,
    /** When true, dock the sidebar at every width (e.g. for Storybook/demos). Overrides the breakpoint default. */
    sidebarExpanded = false,
}) => {
    const pageShell = usePageLayoutShell();
    const focused = frame === 'focused';
    const forceExpanded = sidebarExpanded || Boolean(pageShell?.forceSidebarExpanded);
    const fullscreen = Boolean(pageShell?.fullscreen);

    /** Sidebar expects `activeTabId`; specs often pass `activeTab`. Strip both before spread. */
    const sidebarProps = { ...(sidebarConfig || {}) };
    if (pageShell?.enabled) {
        if (pageShell.user) sidebarProps.user = pageShell.user;
        if (pageShell.goHome) sidebarProps.onHomeClick = pageShell.goHome;
        if (pageShell.onTabClick) sidebarProps.onTabClick = pageShell.onTabClick;
        if (pageShell.onOpenTabSelect) sidebarProps.onOpenTabSelect = pageShell.onOpenTabSelect;
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
        // A flex column that fills the sidebar panel, so the pattern's body
        // scrolls inside it while the logo stays put.
        <div
            className={`plus-page-sidebar-wrapper${shellLoading ? '' : ` ${reveal}`}`}
            style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
        >
            <Sidebar
                {...sidebarProps}
                activeTabId={sidebarActiveCombined}
                visible={true}
            />
        </div>
    );

    return (
        <div
            id={id}
            className={`plus-page-layout${fullscreen ? ' plus-page-layout--fullscreen' : ''}${focused ? ' plus-page-layout--focused' : ''} ${className}`}
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
            {focused ? (
                <FocusedFrame
                    title={title}
                    onBack={onBack}
                    backHref={backHref}
                    backLabel={backLabel}
                    onClose={onClose}
                    closeLabel={closeLabel}
                    actions={actions}
                    actionsLabel={actionsLabel}
                    mainClassName={mainClassName}
                    contentDirect={contentDirect}
                >
                    {children}
                </FocusedFrame>
            ) : (
            <Frame
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
            </Frame>
            )}

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
    frame: PropTypes.oneOf(['default', 'focused']),
    onBack: PropTypes.func,
    backHref: PropTypes.string,
    backLabel: PropTypes.string,
    onClose: PropTypes.func,
    closeLabel: PropTypes.string,
    actions: PropTypes.node,
    actionsLabel: PropTypes.string,
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
