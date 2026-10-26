import React from 'react';
import PropTypes from 'prop-types';
import { NavTabs, Skeleton } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { OVERLAY_HEIGHTS, OVERLAY_WIDTHS } from '../Overlay';
import './PatternModal.scss';

const REPLACEMENTS = {
    padding: 'the modal pads Modal/pad 16 on every side.',
    gap: 'the modal stacks Modal/stack-md 16.',
    maxHeight: 'use height="hug" (grows to the screen less 128) or height="fill".',
};

/** The deprecated props that have warned in this session, so each warns once. */
const warned = new Set();

/**
 * Says once per session, in development, that an old sizing prop is kept only
 * so no caller breaks.
 *
 * @param {Record<string, unknown>} passed - The deprecated props, by name, as the caller passed them.
 */
function useDeprecatedSizing(passed) {
    const names = Object.keys(passed).filter((name) => passed[name] != null).join(',');
    React.useEffect(() => {
        if (!names || process.env.NODE_ENV === 'production') return;
        for (const name of names.split(',')) {
            if (warned.has(name)) continue;
            warned.add(name);
            // eslint-disable-next-line no-console
            console.warn(`[PatternModal] ${name} is deprecated and kept only so no caller breaks; ${REPLACEMENTS[name]}`);
        }
    }, [names]);
}

/**
 * Modal pattern for PLUS design system.
 * Modal shell rendered inline (no portal, focus trap or Escape): header with
 * title and close button, body slot, footer slot. Width is a step of the
 * screen grid (sm · md · lg: 6 · 8 · 10 columns plus the modal pad), and
 * height hugs the content up to the screen less 128 or fills to it, the body
 * scrolling past it. Place it in `Overlay` for the scrim.
 * Baked-in tokens: the overlay pair (`--ds-surface-overlay` with
 * `--ds-shadow-overlay`), as the Modal component draws it, and Modal/pad,
 * Modal/stack-md and Modal/radius.
 * Mirrors "Pattern/Modal" in the Figma design system file.
 * For a real overlay dialog (backdrop, focus trap), use the core Modal component.
 *
 * A dialog is its own page: the title is its h1, at Heading/medium 20, and a
 * section inside it opens at h2.
 *
 * `tabs` puts a tab group under the title, as Figma's `_Modal header`
 * type=tabs: NavTabs in tabs mode, in the header, so it stays put while only
 * the body scrolls. The body becomes the tab panel, named by the selected tab,
 * and shows that tab's content in place of `children`.
 *
 * `header` is Figma's `_Modal header` type=custom: a slot that takes the place
 * of the title row (the title and the close button), so the caller owns both
 * and names the dialog with `aria-label` or `aria-labelledby`. `divider` draws
 * a rule under the header and above the footer, as Figma's `divider?`.
 * `loading` swaps the body for a Skeleton paragraph and marks it busy, as
 * Figma's `loading?`. The body never draws shorter than Modal/body-min-height 96.
 */
const PatternModal = ({
    id,
    title,
    onClose,
    footer,
    header,
    divider = false,
    loading = false,
    width = 'sm',
    height = 'hug',
    maxHeight,
    padding,
    gap,
    tabs,
    activeTab,
    defaultActiveTab,
    onTabChange,
    className = '',
    style,
    children,
    ...props
}) => {
    const reactId = React.useId();
    useDeprecatedSizing({ padding, gap, maxHeight });
    const tabState = useTabs(tabs, { activeTab, defaultActiveTab, onTabChange });

    const classes = [
        'plus-pattern-modal',
        `plus-pattern-modal-width-${width}`,
        `plus-pattern-modal-height-${height}`,
        padding ? `plus-pattern-modal-pad-${padding}` : '',
        gap ? `plus-pattern-modal-gap-${gap}` : '',
        className,
    ].filter(Boolean).join(' ');

    const modalStyle = {
        ...style,
        maxHeight: maxHeight ?? style?.maxHeight,
    };

    // A `role="dialog"` needs an accessible name. The header title is the name
    // whenever there is one, so point `aria-labelledby` at it; a caller that
    // renders a title-less modal has to pass its own `aria-label`, which flows
    // through `...props`.
    const titleId = `${reactId}-title`;
    const labelledBy = title && !header ? titleId : undefined;

    // The body scrolls once the modal reaches its cap, and a scrollable region
    // that holds no focusable content is unreachable by keyboard. A fill modal
    // is always at its cap, a hug one when its content outgrows the screen, an
    // old `maxHeight` one past that height: give the body a tab stop then.
    const bodyRef = React.useRef(null);
    const overflows = useOverflows(bodyRef);
    const bodyScrolls = height === 'fill' || (maxHeight ?? style?.maxHeight) != null || overflows;

    // A new tab is a new page of the body: start it at the top, not wherever
    // the last tab was scrolled to.
    React.useLayoutEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }, [tabState?.current]);

    // Ids come from the tab's place in the list, not its key, so a key with a
    // space in it cannot break the aria-labelledby and aria-controls links.
    const tabId = (key) => `${reactId}-tab-${tabs.findIndex((tab) => tab.key === key)}`;
    const panelId = `${reactId}-panel`;

    // A custom header takes the place of the title row; the tab group, when
    // there is one, still sits under it.
    const headerRow = header ? (
        <div className="plus-pattern-modal-header plus-pattern-modal-header-custom">{header}</div>
    ) : (
        <div className="plus-pattern-modal-header">
            {title && <h1 id={titleId} className="plus-pattern-modal-title">{title}</h1>}
            {onClose && (
                <button
                    type="button"
                    className="plus-pattern-modal-close"
                    aria-label="Close"
                    onClick={onClose}
                >
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            )}
        </div>
    );

    // The body is the panel of the selected tab: one panel, so only the
    // selected tab points at it, and it is always a tab stop, as a tab panel is.
    const panelProps = tabState
        ? { role: 'tabpanel', id: panelId, 'aria-labelledby': tabId(tabState.current), tabIndex: 0 }
        : { tabIndex: bodyScrolls ? 0 : undefined };

    return (
        <div
            id={id}
            className={classes}
            style={modalStyle}
            role="dialog"
            aria-modal="false"
            aria-labelledby={labelledBy}
            {...props}
        >
            {tabState ? (
                <div className="plus-pattern-modal-header-group">
                    {headerRow}
                    <NavTabs
                        mode="tabs"
                        className="plus-pattern-modal-tabs"
                        activeKey={tabState.current}
                        onSelect={tabState.select}
                        aria-labelledby={labelledBy}
                    >
                        {tabs.map((tab) => (
                            <NavTabs.Item
                                key={tab.key}
                                eventKey={tab.key}
                                disabled={tab.disabled}
                                id={tabId(tab.key)}
                                {...(tab.key === tabState.current ? { 'aria-controls': panelId } : {})}
                            >
                                {tab.label}
                            </NavTabs.Item>
                        ))}
                    </NavTabs>
                </div>
            ) : headerRow}
            {divider && <div className="plus-pattern-modal-divider" aria-hidden="true" />}
            <HeadingLevelContext.Provider value={1}>
                <div
                    ref={bodyRef}
                    className="plus-pattern-modal-body"
                    aria-busy={loading ? 'true' : undefined}
                    {...panelProps}
                >
                    {loading ? <Skeleton preset="paragraph" /> : (tabState ? tabState.content : children)}
                </div>
            </HeadingLevelContext.Provider>
            {footer && divider && <div className="plus-pattern-modal-divider" aria-hidden="true" />}
            {footer && <div className="plus-pattern-modal-footer">{footer}</div>}
        </div>
    );
};

/**
 * Which tab is selected, controlled by `activeTab` or held here from
 * `defaultActiveTab`. Null without tabs, so the modal draws as it always has.
 * A key that names no enabled tab, a controlled one included, shows the first
 * enabled tab, so the body always holds a panel the strip can reach; the
 * caller's key is left as it is. Selecting the tab already selected reports
 * nothing.
 */
function useTabs(tabs, { activeTab, defaultActiveTab, onTabChange }) {
    const [held, setHeld] = React.useState(defaultActiveTab);
    if (!tabs || tabs.length === 0) return null;
    const controlled = activeTab !== undefined;
    const wanted = controlled ? activeTab : held;
    const enabled = tabs.filter((tab) => !tab.disabled);
    const current = (enabled.find((tab) => tab.key === wanted) ?? enabled[0] ?? tabs[0]).key;
    return {
        current,
        content: tabs.find((tab) => tab.key === current)?.content,
        select: (key) => {
            if (key === current) return;
            if (!controlled) setHeld(key);
            onTabChange?.(key);
        },
    };
}

/** True while an element's content is taller than its box. */
function useOverflows(ref) {
    const [overflows, setOverflows] = React.useState(false);
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [ref]);
    return overflows;
}

PatternModal.propTypes = {
    id: PropTypes.string,
    /** Modal title in the header row: the dialog's h1, at Heading/medium 20, and its name */
    title: PropTypes.node,
    /**
     * Custom header slot, Figma's `_Modal header` type=custom. It replaces the title row
     * (the title and the close button), so name the dialog with `aria-label`.
     */
    header: PropTypes.node,
    /** A rule under the header and above the footer, as Figma's `divider?`. Off by default. */
    divider: PropTypes.bool,
    /** Swaps the body for a Skeleton paragraph and marks it busy, as Figma's `loading?`. Off by default. */
    loading: PropTypes.bool,
    /** Close handler — renders the close button when provided */
    onClose: PropTypes.func,
    /** Footer slot (typically action buttons) */
    footer: PropTypes.node,
    /**
     * `sm` · `md` · `lg`: 6 · 8 · 10 columns of the screen grid plus the modal pad
     * (384 · 507 · 629 at 768, 512 · 677 · 843 at 1024, 640 · 848 · 1056 at 1440).
     * Grows with the screen, never shrinks, ignores the sidebar.
     */
    width: PropTypes.oneOf(OVERLAY_WIDTHS),
    /** `hug` grows with the content to the screen less 128 and then scrolls its body; `fill` sits at that cap. */
    height: PropTypes.oneOf(OVERLAY_HEIGHTS),
    /** Deprecated: a fixed cap. Use `height`. */
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Deprecated: the old Modal/pad-* tokens. The modal pads Modal/pad 16. */
    padding: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Deprecated: the old Modal/gap-* tokens. The modal stacks Modal/stack-md 16. */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    /**
     * A tab group under the title: `{ key, label, content, disabled? }` per tab.
     * The tabs stay put in the header and the body, now the tab panel, shows the
     * selected tab's content in place of `children`. Arrow keys move between
     * tabs, Home and End jump to the ends.
     */
    tabs: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.node.isRequired,
        content: PropTypes.node,
        disabled: PropTypes.bool,
    })),
    /** The selected tab's key, when the caller holds it; move it from `onTabChange`. */
    activeTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** The tab to start on when the modal holds the selection; the first enabled tab by default. */
    defaultActiveTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Called with the key of the tab a person selects. */
    onTabChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Body content slot; with `tabs`, the selected tab's `content` takes its place */
    children: PropTypes.node,
};

export default PatternModal;
