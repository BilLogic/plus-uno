import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Dropdown.scss';

const Dropdown = ({
    id,
    buttonText = "Dropdown",
    items = [],
    size = "default",
    style = "default",
    fill = "outline",
    split = false,
    direction = "dropdown",
    className = "",
    ariaLabel, // The toggle's accessible name, for a toggle whose `buttonText` is an icon
    isOpen: controlledIsOpen, // Optional controlled state
    onToggle, // Called with the next open state, controlled or not
    toggle // Optional custom toggle component
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);
    // Where Escape sends focus back to: the built-in toggle, the control in a
    // custom one, or whatever had focus when the menu opened.
    const toggleRef = useRef(null);
    const customToggleRef = useRef(null);
    const openerRef = useRef(null);
    // Where Escape asked focus to go, held until the menu has really closed.
    const escapeFocusRef = useRef(null);
    // Viewport-aware placement: the menu flips up when there isn't room below, and right-aligns
    // when a left-aligned menu would spill off the right edge. Only the default vertical dropdown
    // is auto-placed; an explicit `direction` of dropup/dropleft/dropright is honored as authored.
    const [placement, setPlacement] = useState({ vertical: 'down', horizontal: 'start' });

    // Determine if controlled or uncontrolled
    const isControlled = controlledIsOpen !== undefined;
    const show = isControlled ? controlledIsOpen : internalIsOpen;

    /**
     * Every open/close goes through here (#207). Before it existed, a caller
     * who passed `isOpen` owned the state and had no way to hear about a
     * toggle click, an item click, or a click outside — so a controlled
     * dropdown opened and then stayed open forever. The internal state is
     * still only touched when uncontrolled; `onToggle` fires either way, which
     * is what makes the controlled half usable.
     */
    const setOpen = (next) => {
        // Any open or close supersedes an Escape still waiting to land.
        escapeFocusRef.current = null;
        if (!isControlled) {
            setInternalIsOpen(next);
        }
        if (onToggle) {
            onToggle(next);
        }
    };

    const toggleDropdown = () => setOpen(!show);

    const closeDropdown = () => {
        if (show) setOpen(false);
    };

    /*
     * Escape closes an open menu and puts focus back on the toggle, so a
     * keyboard user who tabbed into the items is not left inside a menu that
     * has gone. The toggle is the built-in toggle button (the caret half of a
     * split button, whichever side it sits on), or the control a custom
     * `toggle` renders. A custom toggle with nothing focusable in it (a plain
     * `span`) sends focus back to whatever had it when the menu opened, if
     * that is still on the page; otherwise focus is left alone. It is never
     * moved to the page itself.
     *
     * Focus moves once the menu has actually closed, not when Escape asks: a
     * caller that controls `isOpen` may keep it open, and then focus stays on
     * the item rather than jumping to the toggle of a menu that is still open.
     */
    const handleKeyDown = (event) => {
        if (event.key !== 'Escape') {
            // Any other key after a refused Escape is the person moving on.
            escapeFocusRef.current = null;
            return;
        }
        if (!show) return;
        event.stopPropagation();
        const custom = customToggleRef.current;
        const opener = openerRef.current;
        const target = toggleRef.current
            || custom?.querySelector('button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            || (opener && opener.isConnected && opener !== document.body ? opener : null);
        closeDropdown();
        escapeFocusRef.current = target;
    };

    // Opening records what had focus, however it was opened (the toggle, or a
    // caller that controls `isOpen`). Closing after an Escape moves focus.
    useLayoutEffect(() => {
        if (show) {
            openerRef.current = document.activeElement;
            escapeFocusRef.current = null;
            return;
        }
        const target = escapeFocusRef.current;
        escapeFocusRef.current = null;
        target?.focus();
    }, [show]);

    /*
     * An Escape the caller refused is forgotten, so a close much later (the
     * caller changing `isOpen` itself) never pulls focus back to the toggle:
     * on any render where the menu is still open after it, on the next key,
     * and when focus moves to another element.
     */
    useLayoutEffect(() => {
        if (show) escapeFocusRef.current = null;
    });

    const handleBlur = (event) => {
        // A focused item that is hidden has no next element; that is the
        // menu closing, not the person moving on.
        if (event.relatedTarget) escapeFocusRef.current = null;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
        // `show` and `onToggle` are read inside the listener, so it has to be
        // re-bound when either changes — otherwise the close fires against a
        // stale open state and a stale callback. The old deps were
        // `[dropdownRef]`, a ref that never changes, which is why this only
        // started mattering once the listener had a callback to call.
    }, [show, onToggle]);

    // Measure available space and choose a placement so the menu stays on-screen.
    const measurePlacement = useCallback(() => {
        const toggleEl = dropdownRef.current;
        const menuEl = menuRef.current;
        if (!toggleEl || !menuEl) return;
        const t = toggleEl.getBoundingClientRect();
        const m = menuEl.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const vw = window.innerWidth || document.documentElement.clientWidth;
        const MARGIN = 8;

        // Vertical: only the neutral 'dropdown' auto-flips; 'dropup' stays up, side directions stay put.
        let vertical = direction === 'dropup' ? 'up' : 'down';
        if (direction === 'dropdown') {
            const below = vh - t.bottom;
            const above = t.top;
            if (below < m.height + MARGIN && above > below) vertical = 'up';
        }

        // Horizontal alignment for vertical menus: right-align if a left-aligned menu would overflow.
        let horizontal = 'start';
        if (direction === 'dropdown' || direction === 'dropup') {
            if (t.left + m.width > vw - MARGIN && t.right - m.width > MARGIN) horizontal = 'end';
        }

        setPlacement((prev) =>
            prev.vertical === vertical && prev.horizontal === horizontal ? prev : { vertical, horizontal }
        );
    }, [direction]);

    useLayoutEffect(() => {
        if (!show) {
            setPlacement((prev) => (prev.vertical === 'down' && prev.horizontal === 'start' ? prev : { vertical: 'down', horizontal: 'start' }));
            return;
        }
        measurePlacement();
        const onReflow = () => measurePlacement();
        window.addEventListener('resize', onReflow);
        window.addEventListener('scroll', onReflow, true);
        return () => {
            window.removeEventListener('resize', onReflow);
            window.removeEventListener('scroll', onReflow, true);
        };
    }, [show, measurePlacement]);

    const wrapperClasses = [
        'pdropdown',
        'dropdown',
        direction !== 'dropdown' ? direction : '',
        size !== 'default' ? size : '',
        style !== 'default' ? `pdropdown-${style}` : 'pdropdown-default',
        fill === 'ghost' ? 'pdropdown-ghost' : 'pdropdown-outline',
        split ? 'pdropdown-split-dropdown' : '',
        show ? 'show' : '',
        className
    ].filter(Boolean).join(' ');

    const menuClasses = [
        'dropdown-menu',
        show ? 'show' : ''
    ].filter(Boolean).join(' ');

    const renderToggle = () => {
        const caretClass =
            direction === 'dropup' ? 'pdropdown-caret-up' :
            direction === 'dropleft' ? 'pdropdown-caret-left' :
            direction === 'dropright' ? 'pdropdown-caret-right' :
            // For standard dropdown direction, use up caret when menu is open
            show ? 'pdropdown-caret-up' : '';

        const toggleClasses = [
            split ? 'pdropdown-split-toggle-btn' : 'pdropdown-default-toggle',
            'dropdown-toggle',
            caretClass
        ].filter(Boolean).join(' ');

        return (
            /*
             * The name. `buttonText` is a node, not a string, and four call
             * sites pass an icon: `buttonText={<i className="fa-solid fa-gear" />}`.
             * That renders a button a screen reader announces as "button" and
             * nothing else — four of the 23 `button-name` violations axe found
             * across the story suite. `ariaLabel` is how a caller names an
             * icon-only toggle; the split case keeps its derived name, which
             * only reads as anything when `buttonText` is a string.
             */
            <button
                ref={toggleRef}
                type="button"
                className={toggleClasses}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={show}
                aria-label={ariaLabel || (split ? `${typeof buttonText === 'string' ? buttonText : 'Toggle'} options` : undefined)}
            >
                {!split && <span>{buttonText}</span>}
            </button>
        );
    };

    const renderSplitButton = () => (
        <button type="button" className="pdropdown-split-text-btn">
            <span>{buttonText}</span>
        </button>
    );

    return (
        <div id={id} className={wrapperClasses} ref={dropdownRef} onKeyDown={handleKeyDown} onBlur={handleBlur}>
            {split ? (
                direction === 'dropleft' ? (
                    <>
                        {renderToggle()}
                        {renderSplitButton()}
                    </>
                ) : (
                    <>
                        {renderSplitButton()}
                        {renderToggle()}
                    </>
                )
            ) : (
                toggle ? (
                    <div ref={customToggleRef} onClick={toggleDropdown} className="d-inline-block" style={{ cursor: 'pointer' }}>
                        {toggle}
                    </div>
                ) : (
                    renderToggle()
                )
            )}

            <div
                className={menuClasses}
                ref={menuRef}
                style={{
                    ...(placement.vertical === 'up' ? { top: 'auto', bottom: '100%' } : null),
                    ...(placement.horizontal === 'end' ? { left: 'auto', right: 0 } : null),
                }}
            >
                {items.map((item, index) => {
                    const itemClasses = `dropdown-item ${item.selected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''} ${item.header ? 'dropdown-section-header' : ''}`;
                    const choose = (e) => {
                        if (item.onClick) item.onClick(e);
                        if (!item.keepOpen) closeDropdown(); // Allow optional keepOpen for things like multi-select
                    };
                    const inner = (
                        <div className="dropdown-item-inner">
                            {item.multiSelectCheckbox ? (
                                <i
                                    className={
                                        item.multiSelectChecked
                                            ? 'fa-solid fa-square-check'
                                            : 'fa-regular fa-square'
                                    }
                                    style={{
                                        color: item.multiSelectChecked
                                            ? 'var(--color-primary)'
                                            : 'var(--color-on-surface-variant)',
                                        flexShrink: 0,
                                    }}
                                    aria-hidden="true"
                                />
                            ) : (
                                <i
                                    className="fas fa-check selected-icon"
                                    style={{ opacity: item.selected ? 1 : 0 }}
                                    aria-hidden="true"
                                />
                            )}

                            {item.leadingIcon && <i className={`fas fa-${item.leadingIcon}`} aria-hidden="true" />}

                            <span className="pdropdown-item-text" style={{ flexGrow: 1, minWidth: 0 }}>
                                {item.text || item.label}
                            </span>

                            {/* Decorative, like the leading icon: the text names the item. */}
                            {item.trailingIcon && <i className={`fas fa-${item.trailingIcon}`} aria-hidden="true"></i>}

                            {item.counter !== undefined && (
                                <span className="pdropdown-counter">
                                    {item.counter}
                                </span>
                            )}

                            {item.dropright && <i className="fas fa-caret-right"></i>}
                        </div>
                    );
                    /*
                     * An item with `href` goes somewhere, so it is a link, not
                     * a button that navigates: it opens in the same tab, as
                     * Tag's link does, can be opened in a new one, and is
                     * announced as a link. `linkComponent` is a
                     * router's link, as Tag takes one.
                     */
                    const Link = item.linkComponent || 'a';
                    // An `isStatic` item only says its words: a row, not a
                    // control, so nothing to press or focus, and a press on it
                    // leaves the menu open.
                    let control;
                    if (item.isStatic) {
                        control = <div className={`${itemClasses} pdropdown-item-static`}>{inner}</div>;
                    }
                    return (
                        <React.Fragment key={index}>
                            {control || (item.href && !item.disabled ? (
                                <Link className={itemClasses} href={item.href} onClick={choose}>
                                    {inner}
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    className={itemClasses}
                                    disabled={item.disabled}
                                    // An `isToggle` item switches on and off in
                                    // place, so it says whether it is on.
                                    aria-pressed={item.isToggle ? Boolean(item.selected) : undefined}
                                    // `isBusy`: still working, so it says so.
                                    aria-busy={item.isBusy ? 'true' : undefined}
                                    onClick={choose}
                                >
                                    {inner}
                                </button>
                            ))}
                            {item.divider && index < items.length - 1 && (
                                <div className="pdropdown-divider"></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

Dropdown.propTypes = {
    id: PropTypes.string,
    /* A node, not just a string: four call sites pass an icon. That is what
       makes `ariaLabel` necessary rather than decorative. */
    buttonText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** The toggle's accessible name. Needed whenever `buttonText` is an icon. */
    ariaLabel: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        label: PropTypes.string,
        selected: PropTypes.bool,
        disabled: PropTypes.bool,
        header: PropTypes.bool,
        multiSelectCheckbox: PropTypes.bool,
        multiSelectChecked: PropTypes.bool,
        leadingIcon: PropTypes.string,
        trailingIcon: PropTypes.string,
        counter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        dropright: PropTypes.bool,
        divider: PropTypes.bool,
        onClick: PropTypes.func,
        /** Keeps the menu open after the item is chosen. */
        keepOpen: PropTypes.bool,
        /** Makes the item a link to this address rather than a button. */
        href: PropTypes.string,
        /** Router link to render instead of `<a>` for an item with `href`. */
        linkComponent: PropTypes.elementType,
        /** A row that only says its words: not a control, not focusable, never closes the menu. */
        isStatic: PropTypes.bool,
        /** Still working: published as `aria-busy`. Pair it with `disabled`. */
        isBusy: PropTypes.bool,
        /** An on/off item: it publishes `selected` as `aria-pressed`. */
        isToggle: PropTypes.bool
    })),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    style: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default']),
    fill: PropTypes.oneOf(['outline', 'ghost']),
    split: PropTypes.bool,
    direction: PropTypes.oneOf(['dropdown', 'dropup', 'dropleft', 'dropright']),
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    onToggle: PropTypes.func,
    toggle: PropTypes.node
};

export default Dropdown;
