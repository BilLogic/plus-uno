import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './MenuGroup.scss';

/**
 * Arrow-key navigation for a `MenuGroup`'s items: ArrowDown and ArrowUp move
 * focus between enabled items and wrap at the ends. Hand-rolled because
 * `MenuGroup` is an always-visible list, not a Base UI popup's menu. Every
 * enabled item is still a tab stop.
 */
const RovingContext = createContext(null);

function useRoving() {
    return useContext(RovingContext);
}

/**
 * MenuGroup: the scrollable list a menu's sections sit in.
 */
export const MenuGroup = ({ density = 'regular', maxHeight, maxWidth, minWidth, testId, className, children, ...props }) => {
    const itemsRef = useRef([]);

    const register = useCallback((node) => {
        if (node && !itemsRef.current.includes(node)) itemsRef.current.push(node);
        return () => {
            itemsRef.current = itemsRef.current.filter((n) => n !== node);
        };
    }, []);

    const moveFocus = useCallback((fromNode, delta) => {
        const items = itemsRef.current.filter((n) => n && !n.disabled);
        const index = items.indexOf(fromNode);
        if (index === -1 || items.length === 0) return;
        const next = items[(index + delta + items.length) % items.length];
        next.focus();
    }, []);

    const context = useMemo(() => ({ register, moveFocus }), [register, moveFocus]);

    return (
        <RovingContext.Provider value={context}>
            <div
                role="menu"
                data-testid={testId}
                className={classNames('plus-menu-group', `plus-menu-group--${density}`, className)}
                style={{ maxHeight, maxWidth, minWidth }}
                {...props}
            >
                {children}
            </div>
        </RovingContext.Provider>
    );
};

MenuGroup.propTypes = {
    /** `regular` (default) or `compact`, the row height. */
    density: PropTypes.oneOf(['regular', 'compact']),
    maxHeight: PropTypes.string,
    maxWidth: PropTypes.string,
    minWidth: PropTypes.string,
    testId: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};

/**
 * Section: a titled, optionally separated group of items inside a MenuGroup.
 */
export const Section = ({ title, hasSeparator = false, className, children, ...props }) => {
    const titleId = useMemo(() => (title ? `plus-menu-section-${Math.random().toString(36).slice(2)}` : undefined), [title]);

    return (
        <div
            role="group"
            aria-labelledby={titleId}
            className={classNames('plus-menu-section', { 'plus-menu-section--separated': hasSeparator }, className)}
            {...props}
        >
            {title && <div id={titleId} className="plus-menu-section-title">{title}</div>}
            {children}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.node,
    /** Draws a divider above the section. */
    hasSeparator: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node,
};

/** The row shared by ButtonItem, LinkItem and CustomItem. */
const ItemRow = ({ elemBefore, elemAfter, description, children }) => (
    <>
        {elemBefore && <span className="plus-menu-item-icon plus-menu-item-icon--before">{elemBefore}</span>}
        <span className="plus-menu-item-content">
            <span className="plus-menu-item-label">{children}</span>
            {description && <span className="plus-menu-item-description">{description}</span>}
        </span>
        {elemAfter && <span className="plus-menu-item-icon plus-menu-item-icon--after">{elemAfter}</span>}
    </>
);

ItemRow.propTypes = {
    elemBefore: PropTypes.node,
    elemAfter: PropTypes.node,
    description: PropTypes.node,
    children: PropTypes.node,
};

function useRovingHandlers(roving) {
    return useCallback((event) => {
        if (!roving) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            roving.moveFocus(event.currentTarget, 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            roving.moveFocus(event.currentTarget, -1);
        }
    }, [roving]);
}

/** ButtonItem: a menu row that performs an action. */
export const ButtonItem = ({
    onClick, elemBefore, elemAfter, description, isSelected, isDisabled, testId, className, children, ...props
}) => {
    const roving = useRoving();
    const ref = useRef(null);
    const onKeyDown = useRovingHandlers(roving);

    return (
        <button
            type="button"
            ref={(node) => { ref.current = node; return roving?.register(node); }}
            role="menuitem"
            disabled={isDisabled}
            aria-disabled={isDisabled || undefined}
            aria-current={isSelected || undefined}
            onClick={onClick}
            onKeyDown={onKeyDown}
            data-testid={testId}
            className={classNames('plus-menu-item', { 'plus-menu-item--selected': isSelected }, className)}
            {...props}
        >
            <ItemRow elemBefore={elemBefore} elemAfter={elemAfter} description={description}>{children}</ItemRow>
        </button>
    );
};

ButtonItem.propTypes = {
    onClick: PropTypes.func,
    elemBefore: PropTypes.node,
    elemAfter: PropTypes.node,
    description: PropTypes.node,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    testId: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};

/** LinkItem: a menu row that navigates. */
export const LinkItem = ({
    href, elemBefore, elemAfter, description, isSelected, isDisabled, testId, className, children, ...props
}) => {
    const roving = useRoving();
    const onKeyDown = useRovingHandlers(roving);

    return (
        <a
            href={isDisabled ? undefined : href}
            ref={(node) => roving?.register(node)}
            role="menuitem"
            aria-disabled={isDisabled || undefined}
            aria-current={isSelected || undefined}
            tabIndex={isDisabled ? -1 : undefined}
            onKeyDown={onKeyDown}
            data-testid={testId}
            className={classNames('plus-menu-item', { 'plus-menu-item--selected': isSelected, 'plus-menu-item--disabled': isDisabled }, className)}
            {...props}
        >
            <ItemRow elemBefore={elemBefore} elemAfter={elemAfter} description={description}>{children}</ItemRow>
        </a>
    );
};

LinkItem.propTypes = {
    href: PropTypes.string.isRequired,
    elemBefore: PropTypes.node,
    elemAfter: PropTypes.node,
    description: PropTypes.node,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    testId: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};

/** CustomItem: a menu row rendered through a caller's own component, for a row that isn't a button or a link. */
export const CustomItem = ({ component: Component = 'div', elemBefore, elemAfter, description, isSelected, isDisabled, testId, className, children, ...props }) => {
    const roving = useRoving();
    const onKeyDown = useRovingHandlers(roving);
    const row = (
        <ItemRow elemBefore={elemBefore} elemAfter={elemAfter} description={description}>{children}</ItemRow>
    );
    const rowClassName = classNames('plus-menu-item', { 'plus-menu-item--selected': isSelected, 'plus-menu-item--disabled': isDisabled }, className);

    // `menuitem` is only a valid role on elements HTML-AAM allows it on (e.g. `div`); a
    // caller-supplied `component` (a `label`, say) keeps its own native semantics instead,
    // wrapped in a plain, unstyled `menuitem` so the parent `menu` still sees an allowed
    // child — exposed once, on the wrapper, not duplicated onto `Component`. The row's own
    // look (background, padding, selected/disabled state) goes on `Component` itself: it is
    // the visible, clickable box, and a native control like `button` paints its own opaque
    // background over the wrapper's otherwise.
    if (Component !== 'div') {
        return (
            <div role="menuitem">
                <Component
                    ref={(node) => roving?.register(node)}
                    aria-disabled={isDisabled || undefined}
                    aria-current={isSelected || undefined}
                    onKeyDown={onKeyDown}
                    data-testid={testId}
                    className={rowClassName}
                    {...props}
                >
                    {row}
                </Component>
            </div>
        );
    }

    return (
        <Component
            ref={(node) => roving?.register(node)}
            role="menuitem"
            aria-disabled={isDisabled || undefined}
            aria-current={isSelected || undefined}
            onKeyDown={onKeyDown}
            data-testid={testId}
            className={rowClassName}
            {...props}
        >
            {row}
        </Component>
    );
};

CustomItem.propTypes = {
    /** The element or component the row renders as. */
    component: PropTypes.elementType,
    elemBefore: PropTypes.node,
    elemAfter: PropTypes.node,
    description: PropTypes.node,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    testId: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};

export default MenuGroup;
