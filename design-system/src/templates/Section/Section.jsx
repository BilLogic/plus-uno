import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Collapsible } from '@base-ui/react/collapsible';
import { Button, FilterButton, Icon, IconButton, Skeleton } from '@/components';
import { HeadingLevelContext, headingTag, useHeadingLevel } from '@/lib/headingLevel';
import { AnimatePresence, HeightSurface } from '@/lib/heightMotion';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { usePageNarrow } from '@/lib/pageWidth';
import Card from '../Card/Card';
import './Section.scss';

/**
 * Section template for PLUS design system: a span of the page grid that
 * groups content under one heading. It has no fill and no pad: a padded box
 * with a fill is a Card, and the Page around the Section supplies the pad. It mirrors
 * `Templates/Section` in the Figma design system file.
 *
 * Its parts stack Section/stack-md: the `_Section header`, the body, then an
 * optional footer.
 *
 * HEADER. `default` is the title row: title, description and an actions slot.
 * The title row shows when the page (or the active page tab) holds several
 * Sections, or when the Section has actions, which live only in the title row;
 * then the title names the collection. A lone Section with no actions sets
 * `isTitleHidden` and keeps only the rows it needs.
 * `custom` swaps title and description for a free-form `header` slot, and the
 * title stays in the markup as its heading, visually hidden, so assistive tech
 * still has it. `isTitleHidden` does the same for a default header: a page with
 * one Section already has its page title, so the Section shows no title and
 * starts at its header rows. `isLoading` draws a skeleton shape in place of each
 * title, description, pill, action, field and switch, at its real size and
 * position, so nothing shifts when the data arrives.
 *
 * ROWS. Under the title row a header can carry two more, all on one 32 line.
 * Row 2 holds the `views` at the start, two or more of them, and the `format`
 * switch at the end. Under page tabs there is no views row: a switch such as
 * Status is a quick filter after Search. Row 3 holds `search`, then one to
 * three `filters` as "Field: value" triggers; applied filters take the selected
 * state and the row ends with the `count` and Reset filters. Four or more
 * categories go in one Filter menu (`filterMenu`), never three triggers and a
 * "More filters". Under 768 Search takes the row and the triggers fold into
 * one Filter button with the applied count, and the count and Reset filters
 * stay at the end of the Search row. A trigger can open a menu of its own
 * (`menu`). When the triggers no longer fit beside Search they wrap to their
 * own row, end-aligned. A Section with no views drops row 2 and the format
 * switch moves to the end of row 3; nothing to search or filter drops row 3.
 *
 * NARROW. Narrow follows the page width, not the Section's own box: the
 * Frame's `PageWidthContext` (`usePageNarrow`), under 768. Outside a Frame the
 * page counts as wide. On a narrow page the Primary in `actions` (a primary
 * Button with an `iconBefore`) draws as an icon-only primary IconButton named
 * by its text, so the title row stays one row, and the filter triggers fold.
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
 * Queue pages open a floating Panel over the list instead.
 *
 * FOOTER. Only for "View all" or paging, aligned to the end. Actions that
 * commit changes belong in a card footer, not on the section.
 */

export const SECTION_HEADER_TYPES = ['default', 'custom'];
export const SECTION_LAYOUTS = ['single', 'split', 'subsections'];
export const SECTION_SPACINGS = ['default', 'compact', 'spacious'];

/** Section width from which the filter side sits beside the body. */
export const SECTION_DETAIL_FLOOR = FRAME_LAYOUT.splitFloor;

const inferType = ({ header }) => (header ? 'custom' : 'default');

/** The most "Field: value" triggers a header shows. Four or more categories go in one Filter menu. */
export const SECTION_VISIBLE_FILTERS = 3;

/**
 * Under 768, the Primary in the actions slot becomes an icon-only primary
 * IconButton named by its text, keeping every other prop (`href`, `type`,
 * `aria-*`, `data-*`, `tooltip`, handlers). The Primary must be a `Button`
 * placed directly in `actions`, or inside a Fragment there; a component that
 * renders a Button is not looked into. Only a primary Button with an
 * `iconBefore` folds: without an icon there is nothing to draw, so it keeps its
 * label.
 */
const foldPrimary = (node) => {
    if (!React.isValidElement(node)) return node;
    if (node.type === React.Fragment) {
        return <React.Fragment key={node.key}>{React.Children.map(node.props.children, foldPrimary)}</React.Fragment>;
    }
    if (node.type !== Button) return node;
    const { appearance, iconBefore, iconAfter: _iconAfter, text, children: _children, ...rest } = node.props;
    if (appearance !== 'primary' || !iconBefore || !text) return node;
    return <IconButton key={node.key} {...rest} icon={iconBefore} label={text} appearance="primary" />;
};

/**
 * Rows 2 and 3 of the header: the views and the format switch, then Search and
 * the filter triggers. Every control sits on the one 32 line, so Search is the
 * compact field and the buttons keep their default spacing.
 */
const SectionHeaderRows = ({ views, format, search, filters = [], filterMenu, count, onClearAll, hasNoMatches, onOpenFilters, narrow }) => {
    const hasMenu = Boolean(filterMenu);
    const hasFilters = !hasMenu && filters.length > 0;
    const hasRow3 = Boolean(search) || hasMenu || hasFilters || (!views && Boolean(format));
    const applied = hasFilters ? filters.filter((filter) => filter.isSelected).length : 0;
    const hasCount = count != null && count !== false;
    // The Section cannot see what a Filter menu applies, so with one a `count` marks the filtered state.
    const isFiltered = hasMenu ? hasCount : applied > 0;
    const formatInRow3 = !views && Boolean(format);
    // Four or more categories are one control; under 768 so are two or three. One trigger is already one button.
    const folded = hasFilters && (filters.length > SECTION_VISIBLE_FILTERS || (narrow && filters.length > 1));

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
                    {hasMenu && <div className="plus-section-row__filters">{filterMenu}</div>}
                    {folded && (
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
                            {filters.map(renderTrigger)}
                        </div>
                    )}
                    {isFiltered && (
                        <div className="plus-section-row__applied">
                            {count && <span className="plus-section-row__count" role="status">{count}</span>}
                            {onClearAll && !hasNoMatches && <Button text="Reset filters" appearance="subtle" onClick={onClearAll} />}
                        </div>
                    )}
                    {Boolean(search) && !hasFilters && !hasMenu && hasCount && (
                        <div className="plus-section-row__applied">
                            <span className="plus-section-row__count" role="status">{count}</span>
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
    filterMenu: PropTypes.node,
    count: PropTypes.node,
    onClearAll: PropTypes.func,
    hasNoMatches: PropTypes.bool,
    onOpenFilters: PropTypes.func,
    narrow: PropTypes.bool,
};

/** The Skeleton radius tokens a measured corner can map to, with the CSS each stands for. */
const RADIUS_TOKENS = [
    ['element-radius-md', 'var(--radius-md)'],
    ['element-radius-lg', 'var(--radius-lg)'],
    ['card-radius-md', 'var(--card-radius)'],
    ['element-radius-full', 'var(--radius-full)'],
];

/** A radius token's resolved pixels, read off a probe so the var() chain resolves. */
const radiusPx = (root, value) => {
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;border-radius:${value}`;
    root.appendChild(probe);
    const r = parseFloat(getComputedStyle(probe).borderTopLeftRadius) || 0;
    probe.remove();
    return r;
};

/** Pixel rounding for measured shapes, so a sub-pixel layout does not re-render forever. */
const px = (n) => Math.round(n * 10) / 10;

/**
 * The header while the section loads. The real header renders hidden (no
 * paint, inert, out of the accessibility tree) so every control takes the
 * place it will have; a skeleton shape then covers the title, the description
 * and each pill, button, field and switch at its measured size. Nothing shifts
 * when the data arrives, and no label shows.
 */
const LoadingHeader = ({ children }) => {
    const rootRef = useRef(null);
    const [shapes, setShapes] = useState([]);

    const measure = () => {
        const root = rootRef.current;
        if (!root) return;
        const origin = root.getBoundingClientRect();
        // A scaled ancestor (a TypeCard preview) scales every screen rect; divide it out so shapes get local sizes.
        const scale = root.offsetWidth ? origin.width / root.offsetWidth : 1;
        const local = (n) => px(n / (scale || 1));
        const tokens = RADIUS_TOKENS.map(([name, value]) => [name, radiusPx(root, value)]);
        const radiusToken = (el) => {
            const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
            if (!r) return undefined;
            if (r >= 999) return 'element-radius-full';
            return tokens.reduce((best, t) => (Math.abs(t[1] - r) < Math.abs(best[1] - r) ? t : best))[0];
        };
        const found = [];
        const add = (el, rect = el.getBoundingClientRect()) => {
            if (!rect.width || !rect.height) return;
            found.push({
                left: local(rect.left - origin.left),
                top: local(rect.top - origin.top),
                width: local(rect.width),
                height: local(rect.height),
                radius: radiusToken(el),
            });
        };
        const title = root.querySelector('.plus-template-section-title');
        if (title) {
            // The placeholder is the title text's own size, not the heading block's.
            const range = document.createRange();
            range.selectNodeContents(title);
            const text = range.getBoundingClientRect?.();
            add(title, text?.width ? text : title.getBoundingClientRect());
        }
        const description = root.querySelector('.plus-template-section-description');
        if (description) add(description);
        const whole = new Set(root.querySelectorAll('.plus-section-row__end > *, .plus-section-row__search > *'));
        const controls = new Set(root.querySelectorAll('button, [role="tab"]'));
        whole.forEach((el) => add(el));
        controls.forEach((el) => {
            if (el.closest('.plus-section-row__end, .plus-section-row__search, .plus-tabs-ghosts')) return;
            add(el);
        });
        setShapes((prev) => (JSON.stringify(prev) === JSON.stringify(found) ? prev : found));
    };
    const measureRef = useRef(measure);
    measureRef.current = measure;
    useLayoutEffect(measure);
    useEffect(() => {
        const root = rootRef.current;
        if (!root || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => measureRef.current());
        observer.observe(root);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={rootRef} className="plus-template-section-loading">
            <div className="plus-template-section-loading__shell" aria-hidden="true" inert>{children}</div>
            <div className="plus-template-section-loading__layer" aria-hidden="true">
                {shapes.map((shape, i) => (
                    <span
                        key={i}
                        className="plus-template-section-loading__shape"
                        style={{ insetInlineStart: shape.left, insetBlockStart: shape.top }}
                    >
                        <Skeleton width={shape.width} height={shape.height} radius={shape.radius} />
                    </span>
                ))}
            </div>
        </div>
    );
};

LoadingHeader.propTypes = { children: PropTypes.node };

/** Section: a span of the page grid under one heading, with its title row, views, search and filters. */
const Section = ({
    id,
    title,
    description,
    actions,
    header,
    type: typeProp,
    views,
    format,
    search,
    filters,
    filterMenu,
    count,
    onClearAll,
    hasNoMatches = false,
    onOpenFilters,
    isLoading = false,
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
    isTitleHidden = false,
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

    const rootRef = useRef(null);
    // Narrow follows the page, not the Section's own box: under 768 inside a Frame. Outside a Frame the page counts as wide.
    const narrow = usePageNarrow();
    const hasRows = Boolean(views || format || search || filterMenu || (filters && filters.length));

    const type = typeProp ?? inferType({ header });
    const custom = type === 'custom';
    const hasHeader = isLoading || title || description || actions || hasRows || (custom && header);

    const parentLevel = useHeadingLevel();
    const isPage = rankProp === 'page';
    const level = isPage ? 1 : parentLevel + 1;
    const Title = headingTag(level);
    const rank = isPage ? 'page' : level > 2 ? 'subsection' : 'section';
    // In `custom`, or with `isTitleHidden`, the title names the section without showing.
    const titleHidden = custom || isTitleHidden;

    const titleId = useId();
    const labelled = named && Boolean(title);
    const titleEl = (withId) => title && (
        <Title id={withId && labelled ? titleId : undefined} className={`plus-template-section-title plus-template-section-title--${rank}`}>{title}</Title>
    );
    const titleNode = titleEl(true);
    const hasTitleRow = custom || Boolean(actions) || (!titleHidden && Boolean(title || description)) || (isTitleHidden && Boolean(description));

    const headerBody = (loading) => (
        <>
            {hasTitleRow && (
                <div className="plus-template-section-title-row">
                    {custom ? (
                        <div className="plus-template-section-custom">{header}</div>
                    ) : (title && !titleHidden) || description ? (
                        <div className="plus-template-section-heading">
                            {!titleHidden && titleEl(!loading)}
                            {description && <p className="plus-template-section-description">{description}</p>}
                        </div>
                    ) : null}
                    {actions && <div className="plus-template-section-actions">{narrow ? foldPrimary(actions) : actions}</div>}
                </div>
            )}
            {hasRows && (
                <SectionHeaderRows
                    views={views}
                    format={format}
                    search={search}
                    filters={filters}
                    filterMenu={filterMenu}
                    count={count}
                    onClearAll={onClearAll}
                    hasNoMatches={hasNoMatches}
                    onOpenFilters={onOpenFilters}
                    narrow={narrow}
                />
            )}
        </>
    );

    const hasVisibleHeader = hasTitleRow || hasRows;

    const renderHeader = () => {
        // Nothing visible to draw: the title alone, visually hidden, so it adds no gap.
        if (!hasVisibleHeader) return titleNode && <div className="visually-hidden">{titleNode}</div>;
        return (
            <div className={`plus-template-section-header plus-template-section-header--${type}`}>
                {(titleHidden || isLoading) && titleNode && <div className="visually-hidden">{titleNode}</div>}
                {isLoading ? <LoadingHeader>{headerBody(true)}</LoadingHeader> : headerBody(false)}
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
            aria-busy={isLoading ? 'true' : undefined}
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
    /** Actions slot, aligned to the end of the title row: More (an IconButton at `appearance="default"`), then the labeled Primary, last. Actions live only here, so a Section with actions shows its title row. Under 768 a primary Button with an `iconBefore` draws as an icon-only primary IconButton named by its text, keeping its other props, so the title row stays one row. The Primary must be a `Button` placed directly here, or inside a Fragment; a component that renders one is not folded.
     * @ds-context Used in: Section.actions (ds guide section)
     * @ds-context Governed by: Common actions (ds guide common-actions)
     */
    actions: PropTypes.node,
    /** Free-form header in place of title and description (header type `custom`)
     * @ds-context Used in: Section.header (ds guide section)
     */
    header: PropTypes.node,
    /** Header type: `default` (title and description) or `custom` (your own `header`). Read from the slots when left off. */
    type: PropTypes.oneOf(SECTION_HEADER_TYPES),
    /** Row 2, at the start: the views, Tabs in the pill appearance, two or more of them; with one view leave the slot empty. Under page tabs there is no views row: a switch such as Status is a quick filter after Search. It scrolls sideways when it does not fit.
     * @ds-context Used in: Section.views (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    views: PropTypes.node,
    /** Row 2, at the end: the format switch (Table / Cards), a `SegmentedControl`. With no `views` it moves to the end of row 3.
     * @ds-context Used in: Section.format (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    format: PropTypes.node,
    /** Row 3, at the start: the Search field at compact spacing, which draws 32.
     * @ds-context Used in: Section.search (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    search: PropTypes.node,
    /** Row 3, after Search: one to three `{ key, label, text, isSelected, onClick, menu }` triggers, each drawn as a FilterButton that reads "label: text". `menu` is `(trigger) => node`: hand the trigger to a Popup select, so the same button opens the list and keeps its selected state. Four or more categories belong in `filterMenu`; given four or more here, they fold into one Filter button that calls `onOpenFilters`, never three and a "More filters". Under 768 two or more fold the same way. When they do not fit beside Search they wrap to their own row, end-aligned. */
    filters: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        text: PropTypes.string.isRequired,
        isSelected: PropTypes.bool,
        onClick: PropTypes.func,
        menu: PropTypes.func,
    })),
    /** Row 3, after Search, in place of `filters`: one `FilterMenu`, for four or more filter categories. Its Filter icon button is the one trigger at every width. The Section cannot see what the menu applies, so pass `count` once a value is applied: the row then ends with the count and Reset filters.
     * @ds-context Used in: Section.filterMenu (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    filterMenu: PropTypes.node,
    /** Row 3, at the end once a filter is applied: how many rows match, such as "3 of 12".
     * @ds-context Used in: Section.count (ds guide section)
     * @ds-context Governed by: Filtering (ds guide filtering); Forms (ds guide forms); Search (ds guide search)
     */
    count: PropTypes.node,
    /** Runs when "Reset filters" is pressed. The button shows once a filter is applied. */
    onClearAll: PropTypes.func,
    /** True while the content is a No matches empty state, which offers its own "Reset filters": the header hides its button so one control remains. */
    hasNoMatches: PropTypes.bool,
    /** Runs when the one Filter button is pressed: a narrow Section's, or the fold of four or more `filters`. */
    onOpenFilters: PropTypes.func,
    /** Draws a skeleton shape at each header control's real size and position, with no text, and marks the section busy */
    isLoading: PropTypes.bool,
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
    /** Hides the title visually and keeps it as the Section's heading and accessible name. Set it when the page (or the active page tab) has one Section with no actions: the page title is enough, so the Section starts at the rows it needs. Several Sections, or a Section with actions, show the title row.
     * @ds-context Used in: Section.isTitleHidden (ds guide section)
     */
    isTitleHidden: PropTypes.bool,
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

export default Section;
