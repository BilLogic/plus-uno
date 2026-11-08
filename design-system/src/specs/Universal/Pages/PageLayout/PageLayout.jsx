/**
 * PageLayout Component
 *
 * The app frame every spec page is laid out in: the Frame pattern
 * (the 240 sidebar docking from 1024, the Page and its 12-column content
 * grid) filled with the PLUS Sidebar, and the breadcrumb in the Page's header
 * row. The signed-in person and Help Center sit in the Sidebar's account row.
 * The frame's sizes and
 * the sidebar's dock, peek and float behavior live in Frame; this
 * component supplies the content and the page outline.
 * Figma: BS4 Foundation `Pattern/Page template` and the Frame pattern.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Breadcrumb, Skeleton } from '@/components';
import { Frame, PatternDrawer } from '@/patterns';
import { Sidebar } from '../../Sections';
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
 * `Pattern/Page template` frame=focused and its part `_Focused footer`, here the actions at the foot of the Page.
 *
 * - The Frame with no sidebar and the Frame's own edges: no seams on any side,
 *   and no footer row.
 * - No top bar. The Page's header row (32 high, `Frame`'s `header` row) leads with
 *   Back, an icon button with `arrow-left`; the title, the page's one visible `h1`
 *   at Heading/xsmall, on one line and truncated; and ends with Close, an icon
 *   button with `xmark`. Both are named "Back" and "Close" and drawn only with a handler.
 * - Surface (the `main`): the frame's surface at reading width, content capped
 *   at `--content-max-width-reading` 864, centered, never under 720. It scrolls
 *   on its own.
 * - Actions (a group named by `actionsLabel`, inside the Page): end-aligned,
 *   `--focused-page-inline-sm` 8 apart, in the content column, held at the foot
 *   of the Page while it scrolls.
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
    // The title sits in the Page's header row between Back and Close; the spacer keeps Close at the end without one.
    const header = title
        ? <h1 className="plus-page-focused__title">{title}</h1>
        : <span className="plus-page-focused__title" aria-hidden="true" />;
    // The Frame has no footer row, so the actions sit at the foot of the Page,
    // held there while it scrolls, in the content column.
    const actionsBar = actions ? (
        <div className="plus-page-focused__actions-bar" role="group" aria-label={actionsLabel}>
            <div className="plus-page-focused__actions">{actions}</div>
        </div>
    ) : null;

    return (
        <Frame
            header={header}
            onBack={onBack}
            backHref={backHref}
            backLabel={backLabel}
            onClose={onClose}
            closeLabel={closeLabel}
            width="reading"
            className={actions ? 'plus-frame--focused-actions' : undefined}
            contentClassName={['plus-page-main', mainClassName].filter(Boolean).join(' ')}
            surfaceDirect={contentDirect}
            style={{ flex: '1 1 auto', minHeight: 0 }}
        >
            {children}
            {actionsBar}
        </Frame>
    );
};

/** The one-word role the account row shows, from a Specs user's `type` or `role`. */
const ROLE_OF = { 'regular tutor': 'Tutor', tutor: 'Tutor', 'lead tutor': 'Lead', lead: 'Lead', admin: 'Admin' };

/**
 * The account row's person: the page's `topBarConfig.user` when it names one,
 * else a demo person for the sidebar's role.
 */
const accountOf = (user, sidebarUser) => {
    const name = user?.name || 'John Doe';
    const role = ROLE_OF[String(user?.type ?? user?.role ?? '').toLowerCase()]
        ?? (sidebarUser === 'supervisor' ? 'Lead' : 'Tutor');
    return { id: user?.id ?? name.toLowerCase().replace(/\s+/g, '-'), name, role };
};

/** PageLayout: the template for a full page, wrapping its content in the Frame with the Sidebar and the breadcrumb row. */
const PageLayout = ({
    children,
    /** `default`: the app frame with the Sidebar and the breadcrumb. `focused`: one task, no sidebar — see FocusedFrame. */
    frame = 'default',
    /** Focused: called when Back is pressed. With this or `backHref`, the Page header row leads with Back. */
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
     * A drawer over the page: the props of PatternDrawer (`open`, `title`,
     * `description`, `width`, `placement`, `footer`, `onClose`, `children`, ...).
     * Without it there is no drawer. The page holds its open state and passes
     * it as `open`. Mirrors the Figma `drawer?` toggle on Pattern/Page template.
     */
    drawer,
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
     * It is visually hidden because these pages put their name in the
     * breadcrumb, not in the content — see the note on PAGE_TITLE_STYLE. With
     * `frame="focused"` it is the visible title in the focused topbar instead. A page
     * that DOES render its own visible title heading marks that heading up as
     * the `<h1>` instead and leaves this unset.
     */
    title,
    /** When true, render children straight into the surface, with no `<main>` content grid (e.g. full-width chat). */
    contentDirect = false,
    /** When true, show the breadcrumb skeleton and hold the sidebar's entrance reveal. */
    shellLoading = false,
    /** When true, apply shell-reveal has-entered for entrance animation (the header and the Sidebar). */
    shellEntered = false,
    /** When true, there is no sidebar and no sidebar toggle. */
    sidebarHidden = false,
    /** When true, the sidebar's default request is open (e.g. for Storybook/demos). Under 1024 it still never docks. */
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
        if (pageShell.onProfile) sidebarProps.onProfile = pageShell.onProfile;
        if (pageShell.onSignOut) sidebarProps.onSignOut = pageShell.onSignOut;
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

    // The Page's header row: the breadcrumb, a skeleton while loading. The
    // Frame leads it with the sidebar toggle while the Sidebar is closed.
    const header = (
        <div className={shellLoading ? undefined : reveal} style={{ display: 'flex', flex: '1 1 auto', minWidth: 0 }}>
            {shellLoading ? (
                <Skeleton shape="text" width="var(--label-max-width)" />
            ) : (
                <Breadcrumb items={topBarConfig.breadcrumbs ?? []} />
            )}
        </div>
    );

    // The signed-in person, for the Sidebar's account row.
    const account = accountOf(topBarConfig.user, sidebarProps.user);

    const sidebar = sidebarHidden ? null : (
        // A flex column that fills the sidebar panel, so the pattern's body
        // scrolls inside it while the logo stays put.
        <div
            className={`plus-page-sidebar-wrapper${shellLoading ? '' : ` ${reveal}`}`}
            style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
        >
            <Sidebar
                account={account}
                helpHref={topBarConfig.helpHref}
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
                header={header}
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

            {/* The Drawer pattern, over the frame; it places itself at the edge in its own Overlay. */}
            {drawer ? <PatternDrawer {...drawer} /> : null}

            {/* Floating content anchored to page frame (e.g. FAB) */}
            {floatingContent && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 'var(--space-200)',
                        right: 'var(--space-300)',
                        zIndex: 'var(--layer-navigation)',
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
    /** The page's breadcrumbs, the signed-in user (`{ name, type }`) and `helpHref`: the header row and the Sidebar's account row */
    topBarConfig: PropTypes.object,
    footerConfig: PropTypes.object,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    mainClassName: PropTypes.string,
    floatingContent: PropTypes.node,
    /** The props of PatternDrawer, to draw a drawer over the page. Without it there is no drawer. */
    drawer: PropTypes.shape({
        open: PropTypes.bool,
        title: PropTypes.string,
        description: PropTypes.string,
        onClose: PropTypes.func,
        footer: PropTypes.node,
        width: PropTypes.oneOf(['sm', 'md', 'lg']),
        placement: PropTypes.oneOf(['end', 'start']),
        children: PropTypes.node,
    }),
    title: PropTypes.string,
    contentDirect: PropTypes.bool,
    /** While true, the header row shows a breadcrumb skeleton in place of the breadcrumb, and the header and Sidebar drop the shell-reveal class, holding their entrance. */
    shellLoading: PropTypes.bool,
    /** Adds `has-entered` to the shell-reveal class on the header and the Sidebar, running their entrance. Read only while `shellLoading` is false. */
    shellEntered: PropTypes.bool,
    sidebarHidden: PropTypes.bool,
    sidebarExpanded: PropTypes.bool,
};

export default PageLayout;
