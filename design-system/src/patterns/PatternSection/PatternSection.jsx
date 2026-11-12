import React, { useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton, Skeleton } from '@/components';
import { HeadingLevelContext, headingTag, useHeadingLevel } from '@/lib/headingLevel';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { useSplitHolds } from '../Frame/SplitContext';
import { useOwnWidth } from '../Frame/useOwnWidth';
import './PatternSection.scss';

/**
 * Section pattern for PLUS design system: a span of the page grid that
 * groups content under one heading. It has no fill, no pad and no size
 * options unless `fill="subtle"` is set; the Page around it supplies the pad. It mirrors
 * `Pattern/Section` in the Figma design system file.
 *
 * Its parts stack Section/stack-md: the `_Section header`, the body, then an
 * optional footer.
 *
 * HEADER. Five types, as in Figma. `default` is the title row: title,
 * description and an actions slot. `tabs` adds a tabs row under it, and
 * `toolbar` a `SectionToolbar`, both Section/stack-sm below the title row.
 * `custom` swaps title and description for a free-form `header` slot.
 * `tabs-only` shows only the tabs row. The type is read from the slots you
 * fill (`header`, then `toolbar`, then `tabs`), so pass `type` only for
 * `tabs-only` or to override. In `custom` and `tabs-only` the title stays in
 * the markup as its heading, visually hidden, so assistive tech still has it.
 * `loading` swaps the header for skeleton bars while the section loads.
 *
 * LEVEL. The title is one heading level below what holds it, and one size
 * smaller: a section on a page is an h2 at Heading/medium 20, a section
 * inside a section is a subsection, an h3 at Heading/small 16. Deeper
 * sections keep the subsection size. `level="page"` makes it the page
 * header: an h1 at Heading/large 24, and the sections it holds are h2s.
 *
 * BODY. `layout="single"` is the content slot alone. `split` puts a main
 * column (span 8, min Section/min-width-main) beside a `side` column (span 4,
 * min Section/min-width-side); when a column would drop below its minimum,
 * they stack. `subsections` stacks nested sections Section/stack-lg apart.
 *
 * FILL. A section has none by default. `fill="subtle"` sets it on the sunken
 * surface with a pad and a radius, for a section that stands apart from the
 * content beside it, such as the `detail` region.
 *
 * DETAIL. An optional region on the right that shows one record of the
 * section's content, for a queue a person works through. The body is the
 * list and takes 7 columns of the Page's grid; the detail, a subtle Section,
 * takes 5. Next and previous sit in the detail's header, so a supervisor can
 * work down the queue without going back to it. The split holds from 960 of
 * the section's own width. Below that the detail replaces the list and a back
 * link returns to it. Inside a Frame with `sectionDetail` the Frame's resolver decides,
 * so the Sidebar collapses first to keep the 960. The caller owns the
 * selection: `hasSelection` says a record is open, `onBack` clears it. Heavy
 * work, such as the recording review, belongs on its own page: put "Open full
 * review" in `detailFooter`. A section with a `detail` keeps `layout="single"`: the
 * body is the list.
 *
 * FOOTER. Only for "View all" or paging, aligned to the end. Actions that
 * commit changes belong in a card footer, not on the section.
 */

export const SECTION_HEADER_TYPES = ['default', 'tabs', 'toolbar', 'custom', 'tabs-only'];
export const SECTION_LAYOUTS = ['single', 'split', 'subsections'];
export const SECTION_FILLS = ['none', 'subtle'];

/** Section width from which the detail region sits beside the body. One number, shared with the Frame's resolver. */
export const SECTION_DETAIL_FLOOR = FRAME_LAYOUT.splitFloor;

/**
 * Which of the two the section shows when it has a detail: both (`split`),
 * the body alone (`list`) or the detail alone (`detail`).
 * @param {{ splitHolds: boolean, hasSelection: boolean }} input whether the split holds (width reaches the floor) and whether a record is open
 * @returns {'split' | 'list' | 'detail'}
 */
export const sectionDetailView = ({ splitHolds, hasSelection }) => {
    if (splitHolds) return 'split';
    return hasSelection ? 'detail' : 'list';
};

const inferType = ({ header, toolbar, tabs }) => {
    if (header) return 'custom';
    if (toolbar) return 'toolbar';
    if (tabs) return 'tabs';
    return 'default';
};

/** Title line height per rank, so the skeleton bar is as tall as the title it stands in for. */
const TITLE_LINE = {
    page: 'var(--line-height-175)',
    section: 'var(--line-height-150)',
    subsection: 'var(--line-height-125)',
};

/**
 * The header while the section loads: a bar for the title row (half width,
 * the title's height), one for the description, and one for the tabs or
 * toolbar row when there is one. `tabs-only` draws only that last bar.
 */
const HeaderSkeleton = ({ rank, hasBottomRow, tabsOnly }) => (
    <div className="plus-pattern-section-skeleton">
        {!tabsOnly && (
            <>
                <Skeleton width="50%" height={TITLE_LINE[rank]} radius="element-radius-sm" />
                <Skeleton width="100%" height="var(--line-height-125)" radius="element-radius-sm" />
            </>
        )}
        {(hasBottomRow || tabsOnly) && (
            <Skeleton className="plus-pattern-section-skeleton__row" width="100%" height="var(--height-250)" radius="element-radius-sm" />
        )}
    </div>
);

HeaderSkeleton.propTypes = {
    rank: PropTypes.oneOf(['page', 'section', 'subsection']).isRequired,
    hasBottomRow: PropTypes.bool,
    tabsOnly: PropTypes.bool,
};

/**
 * `_Section toolbar`: the row a section header carries above a table or a
 * list. Search, filters and a count at the start, actions at the end; the
 * count truncates first. Selected rows never change it: a Dynamic table's
 * bulk bar is its own head row.
 */
export const SectionToolbar = ({
    search,
    filters,
    count,
    actions,
    className = '',
    ...props
}) => {
    const classes = ['plus-section-toolbar', className].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            <div className="plus-section-toolbar__start">
                {search && <div className="plus-section-toolbar__search">{search}</div>}
                {filters && <div className="plus-section-toolbar__slot">{filters}</div>}
                {/* A polite live region: the count changes as search and filters narrow the rows. */}
                {count && <span className="plus-section-toolbar__count" role="status">{count}</span>}
            </div>
            {actions && <div className="plus-section-toolbar__slot plus-section-toolbar__actions">{actions}</div>}
        </div>
    );
};

SectionToolbar.propTypes = {
    /** Search field slot, at the start */
    search: PropTypes.node,
    /** Filters slot: dropdown buttons */
    filters: PropTypes.node,
    /** Count in words, such as "12 of 48 students"; truncates first, and is announced politely when it changes */
    count: PropTypes.node,
    /** Actions slot, at the end */
    actions: PropTypes.node,
    className: PropTypes.string,
};

/** PatternSection: a span of the page grid under one heading, with its header, toolbar and tabs. */
const PatternSection = ({
    id,
    title,
    description,
    actions,
    tabs,
    toolbar,
    header,
    type: typeProp,
    onAddView,
    addViewLabel = 'Add view',
    loading = false,
    layout = 'single',
    side,
    footer,
    detail,
    detailTitle,
    detailDescription,
    detailFooter,
    hasSelection = Boolean(detail),
    onBack,
    backLabel = 'Back to list',
    onPrevious,
    onNext,
    previousDisabled = false,
    nextDisabled = false,
    previousLabel = 'Previous',
    nextLabel = 'Next',
    level: rankProp,
    gap = 'md',
    fill = 'none',
    named = false,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-section',
        `plus-pattern-section-gap-${gap}`,
        fill !== 'none' && `plus-pattern-section-fill-${fill}`,
        className,
    ].filter(Boolean).join(' ');

    const type = typeProp ?? inferType({ header, toolbar, tabs });
    const tabsOnly = type === 'tabs-only';
    const custom = type === 'custom';
    const bottomRow = type === 'toolbar' ? toolbar : (type === 'tabs' || tabsOnly) ? tabs : null;
    const hasHeader = loading || title || description || actions || bottomRow || (custom && header);

    const parentLevel = useHeadingLevel();
    const isPage = rankProp === 'page';
    const level = isPage ? 1 : parentLevel + 1;
    const Title = headingTag(level);
    const rank = isPage ? 'page' : level > 2 ? 'subsection' : 'section';
    // In `custom` and `tabs-only` the title names the section without showing.
    const titleHidden = custom || tabsOnly;

    const titleId = useId();
    const labelled = named && Boolean(title);
    const titleNode = title && (
        <Title id={labelled ? titleId : undefined} className={`plus-pattern-section-title plus-pattern-section-title--${rank}`}>{title}</Title>
    );

    const renderHeader = () => {
        if (loading) {
            return (
                <div className={`plus-pattern-section-header plus-pattern-section-header--${type}`}>
                    {titleNode && <div className="visually-hidden">{titleNode}</div>}
                    <HeaderSkeleton rank={rank} hasBottomRow={Boolean(bottomRow)} tabsOnly={tabsOnly} />
                </div>
            );
        }
        return (
            <div className={`plus-pattern-section-header plus-pattern-section-header--${type}`}>
                {titleHidden && titleNode && <div className="visually-hidden">{titleNode}</div>}
                {!tabsOnly && (
                    <div className="plus-pattern-section-title-row">
                        {custom ? (
                            <div className="plus-pattern-section-custom">{header}</div>
                        ) : (
                            <div className="plus-pattern-section-heading">
                                {titleNode}
                                {description && <p className="plus-pattern-section-description">{description}</p>}
                            </div>
                        )}
                        {actions && <div className="plus-pattern-section-actions">{actions}</div>}
                    </div>
                )}
                {bottomRow && (
                    <div className={type === 'toolbar' ? 'plus-pattern-section-toolbar' : 'plus-pattern-section-tabs'}>
                        {bottomRow}
                        {type !== 'toolbar' && onAddView && (
                            <Button text={addViewLabel} appearance="subtle" spacing="compact" iconBefore="plus" onClick={onAddView} />
                        )}
                    </div>
                )}
            </div>
        );
    };

    const body = layout === 'split' ? (
        <>
            <div className="plus-pattern-section-main">{children}</div>
            {side && <div className="plus-pattern-section-side">{side}</div>}
        </>
    ) : children;

    // The detail region: the body becomes the list beside it.
    const detailRef = useRef(null);
    const hasDetailRegion = detail !== undefined;
    const ownWidth = useOwnWidth(detailRef, SECTION_DETAIL_FLOOR);
    // Inside a Frame with `sectionDetail` the resolver decides, so the two never disagree.
    const resolved = useSplitHolds();
    const splitHolds = resolved ?? ownWidth >= SECTION_DETAIL_FLOOR;
    const detailOpen = Boolean(detail) && hasSelection;
    const view = sectionDetailView({ splitHolds, hasSelection: detailOpen });
    const stepper = (onPrevious || onNext) && (
        <>
            <IconButton icon="chevron-up" label={previousLabel} appearance="subtle" spacing="compact" isDisabled={previousDisabled} onClick={onPrevious} />
            <IconButton icon="chevron-down" label={nextLabel} appearance="subtle" spacing="compact" isDisabled={nextDisabled} onClick={onNext} />
        </>
    );
    const withDetail = hasDetailRegion ? (
        <div ref={detailRef} className={`plus-pattern-section-with-detail plus-pattern-section-with-detail--${view}`}>
            {view !== 'detail' && <div className="plus-pattern-section-list">{body}</div>}
            {detailOpen && view !== 'list' && (
                <div className="plus-pattern-section-detail">
                    {view === 'detail' && onBack && (
                        <Button
                            className="plus-pattern-section-detail-back"
                            text={backLabel}
                            appearance="subtle"
                            spacing="compact"
                            iconBefore="arrow-left"
                            onClick={onBack}
                        />
                    )}
                    <PatternSection
                        fill="subtle"
                        named
                        title={detailTitle}
                        description={detailDescription}
                        actions={stepper || undefined}
                        footer={detailFooter}
                    >
                        {detail}
                    </PatternSection>
                </div>
            )}
        </div>
    ) : null;

    return (
        <section
            id={id}
            className={classes}
            style={style}
            aria-busy={loading ? 'true' : undefined}
            aria-labelledby={labelled ? titleId : undefined}
            {...props}
        >
            {hasHeader && renderHeader()}
            {/* A section with no title is a wrapper: what it holds keeps the parent's level. */}
            <HeadingLevelContext.Provider value={title ? level : parentLevel}>
                <div className={`plus-pattern-section-content plus-pattern-section-content--${layout}`}>{withDetail ?? body}</div>
            </HeadingLevelContext.Provider>
            {footer && <div className="plus-pattern-section-footer">{footer}</div>}
        </section>
    );
};

PatternSection.propTypes = {
    id: PropTypes.string,
    /** Section title: an h2 at Heading/medium 20, or an h3 at Heading/small 16 inside another section */
    title: PropTypes.node,
    /** Optional description under the title, Body/default */
    description: PropTypes.node,
    /** Actions slot, aligned to the end of the title row */
    actions: PropTypes.node,
    /** Tabs row under the title row (header type `tabs`, or `tabs-only`) */
    tabs: PropTypes.node,
    /** Toolbar row under the title row (header type `toolbar`), usually a `PatternSection.Toolbar` */
    toolbar: PropTypes.node,
    /** Free-form header in place of title and description (header type `custom`) */
    header: PropTypes.node,
    /** Header type. Read from the slots when left off; pass `tabs-only` to show only the tabs row */
    type: PropTypes.oneOf(SECTION_HEADER_TYPES),
    /** Puts "Add view" at the end of the tabs row, and runs when it is pressed */
    onAddView: PropTypes.func,
    /** The "Add view" button's label */
    addViewLabel: PropTypes.string,
    /** Swaps the header for skeleton bars and marks the section busy */
    loading: PropTypes.bool,
    /** Body layout: the content alone, content beside `side`, or stacked subsections */
    layout: PropTypes.oneOf(SECTION_LAYOUTS),
    /** Side column of `layout="split"` */
    side: PropTypes.node,
    /** Footer, for "View all" or paging only; aligned to the end */
    footer: PropTypes.node,
    /** The optional detail region on the right: one record of the content. Pass `null` for the region with nothing open; leave it off for a plain Section */
    detail: PropTypes.node,
    /** The detail's title; also the region's accessible name */
    detailTitle: PropTypes.node,
    /** Optional description under the detail title */
    detailDescription: PropTypes.node,
    /** Detail footer, such as "Open full review" */
    detailFooter: PropTypes.node,
    /** Whether a record is open. Defaults to whether `detail` is given */
    hasSelection: PropTypes.bool,
    /** Runs the back link. The link shows only when this is set and the detail replaces the list */
    onBack: PropTypes.func,
    /** The back link's label */
    backLabel: PropTypes.string,
    /** Runs the previous button; the stepper shows when either handler is set */
    onPrevious: PropTypes.func,
    /** Runs the next button */
    onNext: PropTypes.func,
    /** Disables the previous button, at the start of the queue */
    previousDisabled: PropTypes.bool,
    /** Disables the next button, at the end of the queue */
    nextDisabled: PropTypes.bool,
    /** The previous button's label */
    previousLabel: PropTypes.string,
    /** The next button's label */
    nextLabel: PropTypes.string,
    /** `page` makes the title the page's h1 at Heading/large 24; by default it nests one level down */
    level: PropTypes.oneOf(['page']),
    /** Gap between the header, the body and the footer (Section/stack tokens); `md` is the Figma value */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** `subtle` sets the section on the sunken surface with a pad and a radius; `none` (default) draws nothing */
    fill: PropTypes.oneOf(SECTION_FILLS),
    /** Makes the section a region named by its title, for a section that stands apart as a landmark */
    named: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot; with `layout="split"`, the main column */
    children: PropTypes.node,
};

PatternSection.Toolbar = SectionToolbar;


export default PatternSection;
