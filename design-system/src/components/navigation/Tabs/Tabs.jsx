/**
 * `Tabs` — a WAI-ARIA tab strip, built on Base UI's `Tabs`.
 *
 * There is one mode: every strip is a real `role="tablist"` (roving tabindex,
 * arrow-key navigation, a labelled panel).
 *
 * Selection lives on the root, so the vocabulary is `eventKey` /
 * `activeKey` / `defaultActiveKey` / `onSelect` rather than a per-tab
 * `isSelected` (a tab cannot select itself) or Base UI's `value` /
 * `defaultValue` / `onValueChange`; `Accordion` makes the same choice.
 * `isDisabled` is per tab.
 */
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { animate } from 'motion/react';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { useMotionReduced } from '@/lib/motionPreference';
import { ClippedTooltip } from '@/lib/ClippedTooltip';
import { ButtonItem } from '@/lib/menu';
import DropdownMenu from '../../forms-and-inputs/DropdownMenu';
import CountTag from '../../labels/CountTag';
import './Tabs.scss';

const alignmentClass = (alignment) =>
    alignment === 'center' ? 'plus-tabs-list--center' :
        alignment === 'right' ? 'plus-tabs-list--right' :
            alignment === 'justified' ? 'plus-tabs-list--justified' : '';

// The words of a tab's label, which can be clipped; a count or icon beside them never is.
const labelText = (children) => React.Children.toArray(children).filter((child) => typeof child === 'string').join('');

export const TAB_OVERFLOWS = ['wrap', 'collapse'];

/*
 * The measured members of a collapsing strip. The strip draws only the tabs
 * that fit, so each tab's width is read from a hidden copy of the whole row
 * (`TAB_GHOSTS`), and the widest "More" this strip can show from another.
 */
const TAB_GHOSTS = '[data-tab-ghost]';
const MORE_GHOST = '[data-tab-more-ghost]';

const isTab = (child) => React.isValidElement(child) && child.type === Tab;

/**
 * How many of `widths` fit in `available`, with `gap` between them and room
 * for More when any are left out. All of them, when they fit without More.
 */
const countThatFit = (widths, available, gap, moreWidth) => {
    // Sub-pixel widths round differently in layout and in measurement.
    const room = available + 0.5;
    const all = widths.reduce((sum, w, i) => sum + w + (i ? gap : 0), 0);
    if (all <= room) return widths.length;
    let used = 0;
    let count = 0;
    for (let i = 0; i < widths.length; i += 1) {
        const next = used + (i ? gap : 0) + widths[i];
        if (next + gap + moreWidth > room) break;
        used = next;
        count = i + 1;
    }
    return count;
};

const Tab = ({
    eventKey,
    isDisabled = false,
    children,
    className = '',
    ...props
}) => (
    // A label longer than the tab's cap ends in an ellipsis; its full text is a
    // Tooltip on hover and focus, only while it is clipped. The tab is already
    // a tab stop, so the Tooltip adds none.
    <ClippedTooltip text={labelText(children)}>
        {({ measureRef }) => (
            <BaseTabs.Tab
                value={eventKey}
                disabled={isDisabled}
                className={`plus-tab ${className}`}
                {...props}
            >
                {React.Children.map(children, (child) => (
                    typeof child === 'string'
                        ? <span ref={measureRef} className="plus-tab-label">{child}</span>
                        : child
                ))}
            </BaseTabs.Tab>
        )}
    </ClippedTooltip>
);

Tab.propTypes = {
    /** Identifies this tab; matched against the root's `activeKey`/`defaultActiveKey`. */
    eventKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    /** The tab's label. */
    children: PropTypes.node,
    /** Disables this tab: it cannot be selected. */
    isDisabled: PropTypes.bool,
    /** Extra class on the tab, beside `plus-tab`. */
    className: PropTypes.string
};

/**
 * The panel one tab controls.
 *
 * A thin wrapper over Base UI's `Tabs.Panel`, which does the work itself:
 * mounting only the active panel's
 * content (or hiding it, with `keepMounted`), and wiring `aria-labelledby`
 * to the matching tab.
 */
const Panel = ({
    eventKey,
    children,
    className = '',
    ...props
}) => (
    <BaseTabs.Panel
        value={eventKey}
        className={`plus-tabs-panel ${className}`}
        {...props}
    >
        {children}
    </BaseTabs.Panel>
);

Panel.propTypes = {
    /** Matches the `Tab` with the same `eventKey`. */
    eventKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    /** The content shown while the matching tab is selected. */
    children: PropTypes.node,
    /** Extra class on the panel, beside `plus-tabs-panel`. */
    className: PropTypes.string
};

/**
 * The tab a collapsing strip folds its extras into. It names how many tabs it
 * holds, marks itself selected while one of them is, and opens their menu.
 * It is a tab to the keyboard and a menu trigger to Base UI's Menu.
 */
const MoreTab = React.forwardRef(({ count, isSelected, className = '', ...props }, ref) => (
    <button
        ref={ref}
        type="button"
        role="tab"
        data-more=""
        data-active={isSelected ? '' : undefined}
        aria-selected={isSelected}
        aria-label={`More, ${count} more ${count === 1 ? 'tab' : 'tabs'}`}
        tabIndex={isSelected ? 0 : -1}
        className={`plus-tab plus-tab--more ${className}`}
        {...props}
    >
        <span className="plus-tab-label">More</span>
        <CountTag value={count} />
    </button>
));
MoreTab.displayName = 'MoreTab';
MoreTab.propTypes = {
    count: PropTypes.number.isRequired,
    isSelected: PropTypes.bool,
    className: PropTypes.string
};

/** A tab strip with its panels. Tabs go into the tablist and every other child, usually Panels, renders after it. */
const Tabs = ({
    children,
    alignment = 'left',
    appearance = 'default',
    spacing = 'default',
    overflow = 'wrap',
    className = '',
    defaultActiveKey,
    activeKey,
    onSelect,
    id,
    ...props
}) => {
    // Children split into the tabs the tablist owns and everything else
    // (panels, most often) rendered as root-level siblings after it — a
    // tablist's children must all be tabs, same reasoning `NavTabsAsTabs` had.
    const tabs = [];
    const rest = [];
    React.Children.forEach(children, (child) => {
        if (isTab(child)) {
            tabs.push(child);
        } else {
            rest.push(child);
        }
    });

    /*
     * Appearance and spacing both have a value called `default`, so each
     * modifier names its prop: a bare `plus-tabs--default` once meant either,
     * and a default-spacing pill picked up the underline strip's baseline.
     */
    const rootRef = useRef(null);
    const listRef = useRef(null);
    const indicatorRef = useRef(null);
    const mountedRef = useRef(false);
    const lastTabRef = useRef(null);
    const animRef = useRef(null);
    const reduced = useMotionReduced();

    useLayoutEffect(() => {
        const rootEl = rootRef.current;
        const listEl = listRef.current;
        const indicatorEl = indicatorRef.current;
        if (!rootEl || !listEl || !indicatorEl) return undefined;
        const activeEl = listEl.querySelector('[role="tab"][aria-selected="true"]');
        if (!activeEl) {
            lastTabRef.current = null;
            return undefined;
        }
        const readBox = (el) => ({
            el,
            x: listEl.offsetLeft + el.offsetLeft,
            y: listEl.offsetTop + el.offsetTop,
            width: el.offsetWidth,
            height: el.offsetHeight,
        });
        if (!mountedRef.current) {
            mountedRef.current = true;
            lastTabRef.current = readBox(activeEl);
            return undefined;
        }
        const prev = lastTabRef.current;
        const next = readBox(activeEl);
        if (!prev || prev.el === activeEl) {
            if (!rootEl.dataset.gliding) lastTabRef.current = next;
            return undefined;
        }
        if (reduced) {
            animRef.current?.stop?.();
            delete rootEl.dataset.gliding;
            lastTabRef.current = next;
            return undefined;
        }
        animRef.current?.stop?.();
        rootEl.dataset.gliding = 'true';
        const from = { ...prev };
        const apply = (p) => {
            const lerp = (a, b) => a + (b - a) * p;
            const x = lerp(from.x, next.x);
            const y = lerp(from.y, next.y);
            const w = Math.max(0, lerp(from.width, next.width));
            const h = Math.max(0, lerp(from.height, next.height));
            indicatorEl.style.transform = `translate(${x}px, ${y}px)`;
            indicatorEl.style.width = `${w}px`;
            indicatorEl.style.height = appearance === 'pill' ? `${h}px` : '';
            lastTabRef.current = { el: activeEl, x, y, width: w, height: h };
        };
        apply(0);
        const anim = animate(0, 1, {
            ...SPRINGS['spatial.fast'].productive,
            onUpdate: apply,
        });
        animRef.current = anim;
        Promise.resolve(anim.finished).then(() => {
            if (animRef.current !== anim) return;
            animRef.current = null;
            delete rootEl.dataset.gliding;
            lastTabRef.current = readBox(activeEl);
        });
        return undefined;
    });

    useLayoutEffect(() => () => { animRef.current?.stop?.(); }, []);

    const collapses = overflow === 'collapse';

    /*
     * Collapse keeps one row. The selection is held here so a hidden tab can be
     * selected from the More menu, which no Base UI tab is; the Root is
     * controlled by it in this mode only.
     */
    const firstKey = tabs.find((tab) => !tab.props.isDisabled)?.props.eventKey;
    const [ownKey, setOwnKey] = useState(defaultActiveKey ?? firstKey);
    const selectedKey = activeKey !== undefined ? activeKey : ownKey;
    const select = (key, details) => {
        if (activeKey === undefined) setOwnKey(key);
        onSelect?.(key, details);
    };

    const [shown, setShown] = useState(tabs.length);
    const tabKeys = tabs.map((tab) => tab.props.eventKey).join('|');
    const visibleCount = collapses ? Math.min(shown, tabs.length) : tabs.length;
    const hiddenTabs = tabs.slice(visibleCount);
    const holdsSelection = hiddenTabs.some((tab) => tab.props.eventKey === selectedKey);

    // The widest "More" for this strip: every digit an 8, so the count never
    // flips between two values as one more tab folds in.
    const moreDigits = String(Math.max(tabs.length - 1, 1)).length;

    const measure = useCallback(() => {
        const rootEl = rootRef.current;
        const listEl = listRef.current;
        if (!rootEl || !listEl || !collapses) return;
        const widths = Array.from(rootEl.querySelectorAll(TAB_GHOSTS)).map((el) => el.getBoundingClientRect().width);
        const more = rootEl.querySelector(MORE_GHOST);
        const gap = parseFloat(getComputedStyle(listEl).columnGap) || 0;
        const next = countThatFit(widths, rootEl.clientWidth, gap, more ? more.getBoundingClientRect().width : 0);
        setShown((prev) => (prev === next ? prev : next));
    }, [collapses]);

    useLayoutEffect(() => {
        measure();
    }, [measure, tabKeys, moreDigits]);

    useLayoutEffect(() => {
        const rootEl = rootRef.current;
        if (!rootEl || !collapses || typeof ResizeObserver === 'undefined') return undefined;
        let frame = 0;
        // Measured on the next frame, so a resize never writes layout from
        // inside the observer's own callback; `measure` sets state only when
        // the count changes, so a fold cannot loop back into another.
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        });
        observer.observe(rootEl);
        rootEl.querySelectorAll(`${TAB_GHOSTS}, ${MORE_GHOST}`).forEach((el) => observer.observe(el));
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [collapses, measure, tabKeys, moreDigits]);

    /*
     * More is a tab in the strip and a menu trigger. Arrow keys reach it from
     * the last visible tab (and Home/End wrap through it); Base UI's roving
     * only knows its own tabs, so the step onto and off More is made here.
     */
    const moreRef = useRef(null);
    const handleListKeyDown = (event) => {
        const more = moreRef.current;
        if (!more) return;
        const tabEls = Array.from(listRef.current.querySelectorAll('[role="tab"]:not([data-more])'));
        const focusTab = (el) => { event.preventDefault(); event.stopPropagation(); el?.focus(); };
        if (event.target === more) {
            if (event.key === 'ArrowLeft') focusTab(tabEls[tabEls.length - 1]);
            else if (event.key === 'ArrowRight' || event.key === 'Home') focusTab(tabEls[0]);
            return;
        }
        const last = tabEls[tabEls.length - 1];
        if ((event.key === 'ArrowRight' && event.target === last) || event.key === 'End') {
            event.preventDefault();
            event.stopPropagation();
            more.focus();
        }
    };

    const rootClasses = [
        'plus-tabs',
        collapses && 'plus-tabs--collapse',
        `plus-tabs--appearance-${appearance}`,
        `plus-tabs--spacing-${spacing}`,
        alignment === 'justified' && 'plus-tabs--justified',
        className
    ].filter(Boolean).join(' ');

    const listClasses = ['plus-tabs-list', alignmentClass(alignment)].filter(Boolean).join(' ');

    return (
        <BaseTabs.Root
            ref={rootRef}
            id={id}
            {...(collapses
                ? { value: selectedKey }
                : { defaultValue: defaultActiveKey, value: activeKey })}
            onValueChange={(value, eventDetails) => (collapses ? select(value, eventDetails) : onSelect?.(value, eventDetails))}
            className={rootClasses}
            {...props}
        >
            <span ref={indicatorRef} className="plus-tabs-indicator" aria-hidden="true" />
            {/* `activateOnFocus`: arrow keys move selection immediately;
                Base UI's own default waits for Enter/Space. */}
            <BaseTabs.List
                ref={listRef}
                className={listClasses}
                activateOnFocus
                onKeyDownCapture={collapses ? handleListKeyDown : undefined}
            >
                {collapses ? tabs.slice(0, visibleCount) : tabs}
                {collapses && hiddenTabs.length > 0 && (
                    <DropdownMenu
                        trigger={(
                            <MoreTab
                                ref={moreRef}
                                count={hiddenTabs.length}
                                isSelected={holdsSelection}
                            />
                        )}
                    >
                        {hiddenTabs.map((tab) => (
                            <ButtonItem
                                key={tab.props.eventKey}
                                role="menuitemradio"
                                aria-checked={tab.props.eventKey === selectedKey}
                                isSelected={tab.props.eventKey === selectedKey}
                                isDisabled={tab.props.isDisabled}
                                onClick={() => select(tab.props.eventKey)}
                            >
                                {labelText(tab.props.children) || String(tab.props.eventKey)}
                            </ButtonItem>
                        ))}
                    </DropdownMenu>
                )}
            </BaseTabs.List>
            {collapses && (
                // Hidden copies of the whole row, read for widths only: the
                // strip draws just the tabs that fit.
                <div className="plus-tabs-ghosts" aria-hidden="true">
                    {tabs.map((tab) => (
                        <span key={tab.props.eventKey} className="plus-tab" data-tab-ghost="">
                            {React.Children.map(tab.props.children, (child) => (
                                typeof child === 'string' ? <span className="plus-tab-label">{child}</span> : child
                            ))}
                        </span>
                    ))}
                    <span className="plus-tab" data-tab-more-ghost="">
                        <span className="plus-tab-label">More</span>
                        <CountTag value={Number('8'.repeat(moreDigits))} />
                    </span>
                </div>
            )}
            {rest}
        </BaseTabs.Root>
    );
};

Tabs.propTypes = {
    /** `Tabs.Tab` elements, which fill the tablist, and the `Tabs.Panel` elements that follow it. */
    children: PropTypes.node,
    /** How the tab strip sits in its row: `left` (default), `center` or `right`. Use `justified` to stretch the tabs across the full width. */
    alignment: PropTypes.oneOf(['left', 'center', 'right', 'justified']),
    /** Underline indicator (default) or a pill-shaped selected background. */
    appearance: PropTypes.oneOf(['default', 'pill']),
    /** `default` is 32px tabs; `compact` is 24px. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** `wrap` (default) lets tabs that do not fit flow onto more rows; `collapse` keeps one row, shows as many tabs as fit and folds the rest into a More tab whose menu lists them by name. */
    overflow: PropTypes.oneOf(TAB_OVERFLOWS),
    /** Extra class on the tabs root, beside `plus-tabs`. */
    className: PropTypes.string,
    /** Id set on the tabs root. */
    id: PropTypes.string,
    /** The `eventKey` of the tab selected at first, for uncontrolled use. */
    defaultActiveKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** The `eventKey` of the selected tab, for controlled use. Pair it with `onSelect`. */
    activeKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Called with the newly selected `eventKey` whenever selection moves. */
    onSelect: PropTypes.func
};

Tabs.Tab = Tab;
Tabs.Panel = Panel;

export default Tabs;
