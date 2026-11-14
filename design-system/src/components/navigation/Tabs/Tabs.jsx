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
import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { animate } from 'motion';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { useMotionReduced } from '@/lib/motionPreference';
import './Tabs.scss';

const alignmentClass = (alignment) =>
    alignment === 'center' ? 'plus-tabs-list--center' :
        alignment === 'right' ? 'plus-tabs-list--right' :
            alignment === 'justified' ? 'plus-tabs-list--justified' : '';

const Tab = ({
    eventKey,
    isDisabled = false,
    children,
    className = '',
    ...props
}) => (
    <BaseTabs.Tab
        value={eventKey}
        disabled={isDisabled}
        className={`plus-tab ${className}`}
        {...props}
    >
        {children}
    </BaseTabs.Tab>
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

/** A tab strip with its panels. Tabs go into the tablist and every other child, usually Panels, renders after it. */
const Tabs = ({
    children,
    alignment = 'left',
    appearance = 'default',
    spacing = 'default',
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
        if (React.isValidElement(child) && child.type === Tab) {
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

    const rootClasses = [
        'plus-tabs',
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
            defaultValue={defaultActiveKey}
            value={activeKey}
            onValueChange={(value, eventDetails) => onSelect?.(value, eventDetails)}
            className={rootClasses}
            {...props}
        >
            <span ref={indicatorRef} className="plus-tabs-indicator" aria-hidden="true" />
            {/* `activateOnFocus`: arrow keys move selection immediately;
                Base UI's own default waits for Enter/Space. */}
            <BaseTabs.List ref={listRef} className={listClasses} activateOnFocus>
                {tabs}
            </BaseTabs.List>
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
