import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Collapsible } from '@base-ui/react/collapsible';
import { Button, Icon, Skeleton } from '@/components';
import { HeadingLevelContext, headingTag, useHeadingLevel } from '@/lib/headingLevel';
import { AnimatePresence, HeightSurface } from '@/lib/heightMotion';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import PatternCard from '../PatternCard/PatternCard';
import './PatternSection.scss';

/**
 * Section pattern for PLUS design system: a span of the page grid that
 * groups content under one heading. It has no fill and no pad: a padded box
 * with a fill is a Card, and the Page around the Section supplies the pad. It mirrors
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
 * SPACING. `spacing` sets the gap between the header, the body and the
 * footer: `compact`, `default` (the Figma value) or `spacious`.
 *
 * DETAIL. An inline expand built on Base UI's Collapsible: a disclosure row
 * opens in place inside the Section and pushes the content below it down. It
 * is a sunken Card, so it takes the Card's pad and radius.
 * Queue pages dock a Panel beside the list instead.
 *
 * FOOTER. Only for "View all" or paging, aligned to the end. Actions that
 * commit changes belong in a card footer, not on the section.
 */

export const SECTION_HEADER_TYPES = ['default', 'tabs', 'toolbar', 'custom', 'tabs-only'];
export const SECTION_LAYOUTS = ['single', 'split', 'subsections'];
export const SECTION_SPACINGS = ['default', 'compact', 'spacious'];

/** Section width from which the filter side sits beside the body. */
export const SECTION_DETAIL_FLOOR = FRAME_LAYOUT.splitFloor;

const inferType = ({ header, toolbar, tabs }) => {
    if (header) return 'custom';
    if (toolbar) return 'toolbar';
    if (tabs) return 'tabs';
    return 'default';
};

/** Title line height per rank, so the skeleton bar is as tall as the title it stands in for. */
const TITLE_LINE = {
    page: 'var(--type-line-height-175)',
    section: 'var(--type-line-height-150)',
    subsection: 'var(--type-line-height-125)',
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
                <Skeleton width="100%" height="var(--type-line-height-125)" radius="element-radius-sm" />
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
    detailOpen: detailOpenProp,
    defaultDetailOpen = false,
    onDetailOpenChange,
    level: rankProp,
    spacing = 'default',
    named = false,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-section',
        `plus-pattern-section-spacing-${spacing}`,
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

    const detailTitleId = useId();
    const detailTriggerRef = useRef(null);
    const [uncontrolledDetailOpen, setUncontrolledDetailOpen] = useState(defaultDetailOpen);
    const isDetailControlled = detailOpenProp !== undefined;
    const isDetailOpen = isDetailControlled ? Boolean(detailOpenProp) : uncontrolledDetailOpen;

    const handleDetailOpenChange = (nextOpen) => {
        const next = Boolean(nextOpen);
        if (!isDetailControlled) {
            setUncontrolledDetailOpen(next);
        }
        onDetailOpenChange?.(next);
    };

    const handleDetailPanelKeyDown = (event) => {
        if (event.key !== 'Escape' || event.defaultPrevented || !isDetailOpen) return;
        event.preventDefault();
        event.stopPropagation();
        handleDetailOpenChange(false);
        detailTriggerRef.current?.focus();
    };

    const hasDetailRegion = detail !== undefined && detail !== null;
    const hasBody = body !== undefined && body !== null && body !== false;
    const detailTitleLabel = detailTitle ?? 'Details';

    const withDetail = hasDetailRegion ? (
        <div className="plus-pattern-section-with-detail">
            {hasBody && <div className="plus-pattern-section-list">{body}</div>}
            <Collapsible.Root
                open={isDetailOpen}
                onOpenChange={handleDetailOpenChange}
                className="plus-pattern-section-detail"
                render={(rootProps) => <PatternCard surface="sunken" {...rootProps} />}
            >
                <Collapsible.Trigger
                    ref={detailTriggerRef}
                    className="plus-pattern-section-detail-trigger"
                >
                    <span className="plus-pattern-section-detail-heading">
                        <span id={detailTitleId} className="plus-pattern-section-detail-title">
                            {detailTitleLabel}
                        </span>
                        {detailDescription && (
                            <span className="plus-pattern-section-detail-description">
                                {detailDescription}
                            </span>
                        )}
                    </span>
                    <span className="plus-pattern-section-detail-chevron" aria-hidden="true">
                        <Icon name="chevron-down" size={12} />
                    </span>
                </Collapsible.Trigger>
                <Collapsible.Panel
                    keepMounted
                    render={(panelProps, state) => (
                        <div
                            {...panelProps}
                            hidden={undefined}
                            role="region"
                            aria-labelledby={detailTitle ? detailTitleId : undefined}
                            aria-label={detailTitle ? undefined : 'Details'}
                            aria-hidden={!state.open ? true : undefined}
                            inert={!state.open ? true : undefined}
                            className="plus-pattern-section-detail-region"
                            onKeyDown={handleDetailPanelKeyDown}
                        >
                            <AnimatePresence initial={false}>
                                {state.open && (
                                    <HeightSurface key="detail" className="plus-pattern-section-detail-panel">
                                        <div className="plus-pattern-section-detail-body">
                                            <div className="plus-pattern-section-detail-content">{detail}</div>
                                            {detailFooter && (
                                                <div className="plus-pattern-section-detail-footer">{detailFooter}</div>
                                            )}
                                        </div>
                                    </HeightSurface>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                />
            </Collapsible.Root>
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
    /** Section title: an h2 at Heading/medium 20, or an h3 at Heading/small 16 inside another section
     * @ds-context Used in: Section.title (ds guide section)
     */
    title: PropTypes.node,
    /** Optional description under the title, Body/default
     * @ds-context Used in: Section.description (ds guide section)
     */
    description: PropTypes.node,
    /** Actions slot, aligned to the end of the title row
     * @ds-context Used in: Section.actions (ds guide section)
     * @ds-context Governed by: Common actions (ds guide common-actions)
     */
    actions: PropTypes.node,
    /** Tabs row under the title row (header type `tabs`, or `tabs-only`)
     * @ds-context Used in: Section.tabs (ds guide section)
     */
    tabs: PropTypes.node,
    /** Toolbar row under the title row (header type `toolbar`), usually a `PatternSection.Toolbar`
     * @ds-context Used in: Section.toolbar (ds guide section)
     * @ds-context Governed by: Common actions (ds guide common-actions); Filtering (ds guide filtering); Search (ds guide search)
     */
    toolbar: PropTypes.node,
    /** Free-form header in place of title and description (header type `custom`)
     * @ds-context Used in: Section.header (ds guide section)
     * @ds-context Governed by: Forms (ds guide forms)
     */
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
    /** Side column of `layout="split"`
     * @ds-context Used in: Section.side (ds guide section)
     */
    side: PropTypes.node,
    /** Footer, for "View all" or paging only; aligned to the end
     * @ds-context Used in: Section.footer (ds guide section)
     */
    footer: PropTypes.node,
    /** Inline expand content that opens in place inside the Section and pushes the content below it down
     * @ds-context Used in: Section.detail (ds guide section)
     */
    detail: PropTypes.node,
    /** Title on the detail disclosure button; also names the detail region
     * @ds-context Used in: Section.detailTitle (ds guide section)
     */
    detailTitle: PropTypes.node,
    /** Optional description on the detail disclosure button
     * @ds-context Used in: Section.detailDescription (ds guide section)
     */
    detailDescription: PropTypes.node,
    /** Detail footer, such as "Open full review"
     * @ds-context Used in: Section.detailFooter (ds guide section)
     */
    detailFooter: PropTypes.node,
    /** Controlled open state of the inline detail expand */
    detailOpen: PropTypes.bool,
    /** Whether an uncontrolled inline detail expand starts open */
    defaultDetailOpen: PropTypes.bool,
    /** Called with the next open boolean when the inline detail expand toggles */
    onDetailOpenChange: PropTypes.func,
    /** `page` makes the title the page's h1 at Heading/large 24; by default it nests one level down */
    level: PropTypes.oneOf(['page']),
    /** Space between the header, the body and the footer (Section/stack tokens); `default` is the Figma value */
    spacing: PropTypes.oneOf(SECTION_SPACINGS),
    /** Makes the section a region named by its title, for a section that stands apart as a landmark */
    named: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot; with `layout="split"`, the main column
     * @ds-context Used in: Section.children (ds guide section)
     * @ds-context Governed by: Forms (ds guide forms)
     */
    children: PropTypes.node,
};

PatternSection.Toolbar = SectionToolbar;

export default PatternSection;
