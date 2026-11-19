import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Collapsible } from '@base-ui/react/collapsible';
import { Button, FilterButton, Icon, Skeleton } from '@/components';
import { HeadingLevelContext, headingTag, useHeadingLevel } from '@/lib/headingLevel';
import { AnimatePresence, HeightSurface } from '@/lib/heightMotion';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { useOwnWidth } from '../Frame/useOwnWidth';
import Card from '../Card/Card';
import './Section.scss';

/**
 * Section pattern for PLUS design system: a span of the page grid that
 * groups content under one heading. It has no fill and no pad: a padded box
 * with a fill is a Card, and the Page around the Section supplies the pad. It mirrors
 * `Pattern/Section` in the Figma design system file.
 *
 * Its parts stack Section/stack-md: the `_Section header`, the body, then an
 * optional footer.
 *
 * HEADER. `default` is the title row: title, description and an actions slot.
 * `custom` swaps title and description for a free-form `header` slot, and the
 * title stays in the markup as its heading, visually hidden, so assistive tech
 * still has it. `loading` swaps the header for skeleton bars while the section
 * loads. The older `tabs` and `toolbar` props (and the `tabs-only` and
 * `toolbar` types) are deprecated: use the rows below.
 *
 * ROWS. Under the title row a header can carry two more, all on one 32 line.
 * Row 2 holds the `views` at the start and the `format` switch at the end.
 * Row 3 holds `search`, then the `filters` as "Field: value" triggers; applied
 * filters take the selected state and the row ends with the `count` and Clear
 * all. Three triggers show and the rest go in "More filters" with a count;
 * under 768 Search takes the row and the triggers fold into one Filter button
 * with the applied count, and the count and Clear all stay at the end of the
 * Search row. A trigger can open a menu of its own (`menu`). When the triggers
 * no longer fit beside Search they wrap to their own row, end-aligned. A
 * Section with no views drops row 2 and the format switch moves to the end of
 * row 3; nothing to search or filter drops row 3.
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

export const SECTION_HEADER_TYPES = ['default', 'custom'];
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

/** How many filter triggers show before the rest go in "More filters". */
export const SECTION_VISIBLE_FILTERS = 3;

/**
 * Rows 2 and 3 of the header: the views and the format switch, then Search and
 * the filter triggers. Every control sits on the one 32 line, so Search is the
 * compact field and the buttons keep their default spacing.
 */
const SectionHeaderRows = ({ views, format, search, filters = [], count, onClearAll, onMoreFilters, onOpenFilters, narrow }) => {
    const hasFilters = filters.length > 0;
    const hasRow3 = Boolean(search) || hasFilters || (!views && Boolean(format));
    const applied = filters.filter((filter) => filter.isSelected).length;
    const shown = filters.slice(0, SECTION_VISIBLE_FILTERS);
    const hidden = filters.length - shown.length;
    const hiddenApplied = filters.slice(SECTION_VISIBLE_FILTERS).some((filter) => filter.isSelected);
    const formatInRow3 = !views && Boolean(format);
    // One trigger is already one button, so a narrow Section keeps it rather than fold it.
    const folded = narrow && filters.length > 1;

    const searchRef = useRef(null);
    const filtersRef = useRef(null);

    // The triggers wrap to their own end-aligned row once they no longer fit beside Search. CSS cannot see a flex item wrap, so each layout clears the mark, reads where the triggers fall against Search, and sets it again before paint.
    const markWrap = () => {
        const triggers = filtersRef.current;
        const field = searchRef.current;
        if (!triggers) return;
        triggers.removeAttribute('data-wrapped');
        if (field && triggers.getBoundingClientRect().top >= field.getBoundingClientRect().bottom) {
            triggers.setAttribute('data-wrapped', '');
        }
    };
    const markWrapRef = useRef(markWrap);
    markWrapRef.current = markWrap;
    useLayoutEffect(markWrap);
    useEffect(() => {
        const triggers = filtersRef.current;
        if (!triggers || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => markWrapRef.current());
        observer.observe(triggers.parentElement);
        return () => observer.disconnect();
    }, [hasFilters, folded]);

    const renderTrigger = ({ key, menu, ...filter }) => {
        const trigger = <FilterButton key={key ?? filter.label ?? filter.text} {...filter} />;
        return menu ? <React.Fragment key={key ?? filter.label ?? filter.text}>{menu(trigger)}</React.Fragment> : trigger;
    };

    return (
        <div className="plus-section-rows">
            {views && (
                <div className="plus-section-row plus-section-row--views">
                    <div className="plus-section-row__views">{views}</div>
                    {format && <div className="plus-section-row__end">{format}</div>}
                </div>
            )}
            {hasRow3 && (
                <div className="plus-section-row plus-section-row--filters">
                    {search && <div ref={searchRef} className={`plus-section-row__search${narrow ? ' plus-section-row__search--fill' : ''}`}>{search}</div>}
                    {hasFilters && folded && (
                        <FilterButton
                            text="Filter"
                            iconBefore="filter"
                            hasChevronDown={false}
                            trailingMetric={applied > 0 ? applied : undefined}
                            isSelected={applied > 0}
                            onClick={onOpenFilters}
                        />
                    )}
                    {hasFilters && !folded && (
                        <div ref={filtersRef} className="plus-section-row__filters">
                            {shown.map(renderTrigger)}
                            {hidden > 0 && (
                                <FilterButton
                                    text="More filters"
                                    iconBefore="filter"
                                    trailingMetric={hidden}
                                    isSelected={hiddenApplied}
                                    onClick={onMoreFilters}
                                />
                            )}
                        </div>
                    )}
                    {hasFilters && applied > 0 && (
                        <div className="plus-section-row__applied">
                            {count && <span className="plus-section-row__count" role="status">{count}</span>}
                            {onClearAll && <Button text="Clear all" appearance="subtle" onClick={onClearAll} />}
                        </div>
                    )}
                    {formatInRow3 && <div className="plus-section-row__end">{format}</div>}
                </div>
            )}
        </div>
    );
};

SectionHeaderRows.propTypes = {
    views: PropTypes.node,
    format: PropTypes.node,
    search: PropTypes.node,
    filters: PropTypes.arrayOf(PropTypes.object),
    count: PropTypes.node,
    onClearAll: PropTypes.func,
    onMoreFilters: PropTypes.func,
    onOpenFilters: PropTypes.func,
    narrow: PropTypes.bool,
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
    <div className="plus-template-section-skeleton">
        {!tabsOnly && (
            <>
                <Skeleton width="50%" height={TITLE_LINE[rank]} radius="element-radius-sm" />
                <Skeleton width="100%" height="var(--type-line-height-125)" radius="element-radius-sm" />
            </>
        )}
        {(hasBottomRow || tabsOnly) && (
            <Skeleton className="plus-template-section-skeleton__row" width="100%" height="var(--row-height-md)" radius="element-radius-sm" />
        )}
    </div>
);

HeaderSkeleton.propTypes = {
    rank: PropTypes.oneOf(['page', 'section', 'subsection']).isRequired,
    hasBottomRow: PropTypes.bool,
    tabsOnly: PropTypes.bool,
};

/** @deprecated use the `search`, `filters` and `count` props of the three-row header.
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

/** Dev-only notice, once per prop, that the old header props are on their way out. */
const warned = new Set();
const warnDeprecatedHeaderProps = ({ tabs, toolbar }) => {
    if (process.env.NODE_ENV === 'production') return;
    const notes = [[tabs, 'tabs', '`views` and `format`'], [toolbar, 'toolbar', '`search` and `filters`']];
    notes.forEach(([value, name, instead]) => {
        if (!value || warned.has(name)) return;
        warned.add(name);
        // eslint-disable-next-line no-console
        console.warn(`Section: the \`${name}\` prop is deprecated. Use ${instead} in the three-row header.`);
    });
};

/** Section: a span of the page grid under one heading, with its header, toolbar and tabs. */
const Section = ({
    id,
    title,
    description,
    actions,
    tabs,
    toolbar,
    header,
    type: typeProp,
    views,
    format,
    search,
    filters,
    count,
    onClearAll,
    onMoreFilters,
    onOpenFilters,
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
        'plus-template-section',
        `plus-template-section-spacing-${spacing}`,
        className,
    ].filter(Boolean).join(' ');

    warnDeprecatedHeaderProps({ tabs, toolbar });

    const rootRef = useRef(null);
    const ownWidth = useOwnWidth(rootRef);
    const narrow = ownWidth < FRAME_LAYOUT.fullWidthBelow;
    const hasRows = Boolean(views || format || search || (filters && filters.length));

    const type = typeProp ?? inferType({ header, toolbar, tabs });
    const tabsOnly = type === 'tabs-only';
    const custom = type === 'custom';
    const bottomRow = type === 'toolbar' ? toolbar : (type === 'tabs' || tabsOnly) ? tabs : null;
    const hasHeader = loading || title || description || actions || bottomRow || hasRows || (custom && header);

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
        <Title id={labelled ? titleId : undefined} className={`plus-template-section-title plus-template-section-title--${rank}`}>{title}</Title>
    );

    const renderHeader = () => {
        if (loading) {
            return (
                <div className={`plus-template-section-header plus-template-section-header--${type}`}>
                    {titleNode && <div className="visually-hidden">{titleNode}</div>}
                    <HeaderSkeleton rank={rank} hasBottomRow={Boolean(bottomRow) || hasRows} tabsOnly={tabsOnly} />
                </div>
            );
        }
        return (
            <div className={`plus-template-section-header plus-template-section-header--${type}`}>
                {titleHidden && titleNode && <div className="visually-hidden">{titleNode}</div>}
                {!tabsOnly && (
                    <div className="plus-template-section-title-row">
                        {custom ? (
                            <div className="plus-template-section-custom">{header}</div>
                        ) : (
                            <div className="plus-template-section-heading">
                                {titleNode}
                                {description && <p className="plus-template-section-description">{description}</p>}
                            </div>
                        )}
                        {actions && <div className="plus-template-section-actions">{actions}</div>}
                    </div>
                )}
                {hasRows && (
                    <SectionHeaderRows
                        views={views}
                        format={format}
                        search={search}
                        filters={filters}
                        count={count}
                        onClearAll={onClearAll}
                        onMoreFilters={onMoreFilters}
                        onOpenFilters={onOpenFilters}
                        narrow={narrow}
                    />
                )}
                {bottomRow && (
                    <div className={type === 'toolbar' ? 'plus-template-section-toolbar' : 'plus-template-section-tabs'}>
                        {bottomRow}
                        {type !== 'toolbar' && onAddView && (
                            <Button text={addViewLabel} appearance="subtle" iconBefore="plus" onClick={onAddView} />
                        )}
                    </div>
                )}
            </div>
        );
    };

    const body = layout === 'split' ? (
        <>
            <div className="plus-template-section-main">{children}</div>
            {side && <div className="plus-template-section-side">{side}</div>}
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
        <div className="plus-template-section-with-detail">
            {hasBody && <div className="plus-template-section-list">{body}</div>}
            <Collapsible.Root
                open={isDetailOpen}
                onOpenChange={handleDetailOpenChange}
                className="plus-template-section-detail"
                render={(rootProps) => <Card surface="sunken" {...rootProps} />}
            >
                <Collapsible.Trigger
                    ref={detailTriggerRef}
                    className="plus-template-section-detail-trigger"
                >
                    <span className="plus-template-section-detail-heading">
                        <span id={detailTitleId} className="plus-template-section-detail-title">
                            {detailTitleLabel}
                        </span>
                        {detailDescription && (
                            <span className="plus-template-section-detail-description">
                                {detailDescription}
                            </span>
                        )}
                    </span>
                    <span className="plus-template-section-detail-chevron" aria-hidden="true">
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
                            className="plus-template-section-detail-region"
                            onKeyDown={handleDetailPanelKeyDown}
                        >
                            <AnimatePresence initial={false}>
                                {state.open && (
                                    <HeightSurface key="detail" className="plus-template-section-detail-panel">
                                        <div className="plus-template-section-detail-body">
                                            <div className="plus-template-section-detail-content">{detail}</div>
                                            {detailFooter && (
                                                <div className="plus-template-section-detail-footer">{detailFooter}</div>
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
            ref={rootRef}
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
                <div className={`plus-template-section-content plus-template-section-content--${layout}`}>{withDetail ?? body}</div>
            </HeadingLevelContext.Provider>
            {footer && <div className="plus-template-section-footer">{footer}</div>}
        </section>
    );
};

Section.propTypes = {
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
    /** @deprecated use `views` (and `format`) in the three-row header. Tabs row under the title row (header type `tabs`, or `tabs-only`).
     * @ds-context Used in: Section.tabs (ds guide section)
     * @ds-context Governed by: Forms (ds guide forms)
     */
    tabs: PropTypes.node,
    /** @deprecated use `search` and `filters` in the three-row header. Toolbar row under the title row (header type `toolbar`), usually a `Section.Toolbar`.
     * @ds-context Used in: Section.toolbar (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Search (ds guide search)
     */
    toolbar: PropTypes.node,
    /** Free-form header in place of title and description (header type `custom`)
     * @ds-context Used in: Section.header (ds guide section)
     * @ds-context Governed by: Forms (ds guide forms)
     */
    header: PropTypes.node,
    /** Header type: `default` (title and description) or `custom` (your own `header`). Read from the slots when left off. */
    type: PropTypes.oneOf(SECTION_HEADER_TYPES),
    /** Row 2, at the start: the views, usually Tabs in the pill appearance. It scrolls sideways when it does not fit.
     * @ds-context Used in: Section.views (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    views: PropTypes.node,
    /** Row 2, at the end: the format switch (Table / Cards). With no `views` it moves to the end of row 3.
     * @ds-context Used in: Section.format (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    format: PropTypes.node,
    /** Row 3, at the start: the Search field at compact spacing, which draws 32.
     * @ds-context Used in: Section.search (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    search: PropTypes.node,
    /** Row 3, after Search: one `{ key, label, text, isSelected, onClick, menu }` per trigger, drawn as a FilterButton that reads "label: text". `menu` is `(trigger) => node`: hand the trigger to a Popup select or a Filter menu, so the same button opens the list and keeps its selected state. Three show; the rest go in "More filters" with a count. Under 768 they fold into one Filter button. When they do not fit beside Search they wrap to their own row, end-aligned. */
    filters: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        text: PropTypes.string.isRequired,
        isSelected: PropTypes.bool,
        onClick: PropTypes.func,
        menu: PropTypes.func,
    })),
    /** Row 3, at the end once a filter is applied: how many rows match, such as "3 of 12".
     * @ds-context Used in: Section.count (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    count: PropTypes.node,
    /** Runs when "Clear all" is pressed. The button shows once a filter is applied. */
    onClearAll: PropTypes.func,
    /** Runs when "More filters" is pressed. */
    onMoreFilters: PropTypes.func,
    /** Runs when the Filter button of a narrow Section is pressed. */
    onOpenFilters: PropTypes.func,
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

Section.Toolbar = SectionToolbar;

export default Section;
