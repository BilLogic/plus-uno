import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './MenuGroup.scss';

/**
 * Roving tabindex for a `MenuGroup`'s items: only the current item is
 * `tabIndex={0}`, the rest `-1`, and the arrow keys move it — the keyboard
 * behavior ADS's Menu documents, hand-rolled because `MenuGroup` is an
 * always-visible list, not a Base UI popup's menu.
 */
const RovingContext = createContext(null);

function useRoving() {
    return useContext(RovingContext);
}

/**
 * MenuGroup: the scrollable list a menu's sections sit in. Props follow
 * Atlassian's Menu (https://atlassian.design/components/menu).
 */
export const MenuGroup = ({ density = 'regular', maxHeight, maxWidth, minWidth, className, children, ...props }) => {
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
const ItemRow = ({ iconBefore, iconAfter, description, children }) => (
    <>
        {iconBefore && <span className="plus-menu-item-icon plus-menu-item-icon--before">{iconBefore}</span>}
        <span className="plus-menu-item-content">
            <span className="plus-menu-item-label">{children}</span>
            {description && <span className="plus-menu-item-description">{description}</span>}
        </span>
        {iconAfter && <span className="plus-menu-item-icon plus-menu-item-icon--after">{iconAfter}</span>}
    </>
);

ItemRow.propTypes = {
    iconBefore: PropTypes.node,
    iconAfter: PropTypes.node,
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
    onClick, iconBefore, iconAfter, description, isSelected, isDisabled, className, children, ...props
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
            className={classNames('plus-menu-item', { 'plus-menu-item--selected': isSelected }, className)}
            {...props}
        >
            <ItemRow iconBefore={iconBefore} iconAfter={iconAfter} description={description}>{children}</ItemRow>
        </button>
    );
};

ButtonItem.propTypes = {
    onClick: PropTypes.func,
    iconBefore: PropTypes.node,
    iconAfter: PropTypes.node,
    description: PropTypes.node,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node,
};

/** LinkItem: a menu row that navigates. */
export const LinkItem = ({
    href, iconBefore, iconAfter, description, isSelected, isDisabled, className, children, ...props
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
            className={classNames('plus-menu-item', { 'plus-menu-item--selected': isSelected, 'plus-menu-item--disabled': isDisabled }, className)}
            {...props}
        >
            <ItemRow iconBefore={iconBefore} iconAfter={iconAfter} description={description}>{children}</ItemRow>
        </a>
    );
};

LinkItem.propTypes = {
    href: PropTypes.string.isRequired,
    iconBefore: PropTypes.node,
    iconAfter: PropTypes.node,
    description: PropTypes.node,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node,
};

/** CustomItem: a menu row rendered through a caller's own component, for a row that isn't a button or a link. */
export const CustomItem = ({ component: Component = 'div', iconBefore, iconAfter, description, isSelected, isDisabled, className, children, ...props }) => {
    const roving = useRoving();
    const onKeyDown = useRovingHandlers(roving);
    const row = (
        <ItemRow iconBefore={iconBefore} iconAfter={iconAfter} description={description}>{children}</ItemRow>
    );
    const rowClassName = classNames('plus-menu-item', { 'plus-menu-item--selected': isSelected, 'plus-menu-item--disabled': isDisabled }, className);

    // `menuitem` is only a valid role on elements HTML-AAM allows it on (e.g. `div`); a
    // caller-supplied `component` (a `label`, say) keeps its own native semantics instead,
    // wrapped in a plain `menuitem` so the parent `menu` still sees an allowed child.
    if (Component !== 'div') {
        return (
            <div
                ref={(node) => roving?.register(node)}
                role="menuitem"
                aria-disabled={isDisabled || undefined}
                aria-current={isSelected || undefined}
                onKeyDown={onKeyDown}
                className={rowClassName}
            >
                <Component {...props}>{row}</Component>
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
    iconBefore: PropTypes.node,
    iconAfter: PropTypes.node,
    description: PropTypes.node,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node,
};

export default MenuGroup;
