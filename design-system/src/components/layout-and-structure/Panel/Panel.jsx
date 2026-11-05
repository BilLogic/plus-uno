import React, { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import IconButton from '@/components/forms-and-inputs/IconButton';
import Heading from '@/components/text-and-data-display/Heading';
import './Panel.scss';

/**
 * PanelProvider / usePanelManager: the width a Panel opens at and the setter
 * that changes it, shared with whatever opens the panel. Composition follows
 * Atlassian's internal `@atlassian/panel-system`.
 */
const PanelContext = createContext(null);

/** The width a Panel opens at when nothing sets one: the Frame's Panel area default (`--panel-width-default`). */
const DEFAULT_WIDTH = '400px';

/**
 * Set by a host that owns the Panel's width, fill and edge (the Frame's Panel
 * area). Inside one, a PanelContainer fills the host and paints no fill or edge
 * of its own, so the host can paint them by state.
 */
export const PanelHostContext = createContext(false);

export const PanelProvider = ({ defaultWidth = DEFAULT_WIDTH, children }) => {
    const [width, setWidth] = useState(defaultWidth);
    const value = useMemo(() => ({ width, setWidth }), [width]);
    return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
};

PanelProvider.propTypes = {
    defaultWidth: PropTypes.string,
    children: PropTypes.node,
};

export const usePanelManager = () => {
    const context = useContext(PanelContext);
    if (!context) throw new Error('usePanelManager must be used within a PanelProvider');
    return context;
};

/** PanelContainer: the panel's own surface, at a fixed or the provider's width. */
export const PanelContainer = ({ width, className, children, ...props }) => {
    const panelContext = useContext(PanelContext);
    const hosted = useContext(PanelHostContext);
    const resolvedWidth = hosted ? '100%' : (width ?? panelContext?.width ?? DEFAULT_WIDTH);

    return (
        <section
            className={classNames('plus-panel', hosted && 'plus-panel--hosted', className)}
            style={{ width: resolvedWidth }}
            {...props}
        >
            {children}
        </section>
    );
};

PanelContainer.propTypes = {
    /** Falls back to the nearest PanelProvider's width, then 400px. Inside the Frame's Panel area it fills the area instead. */
    width: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};

/** PanelHeader: back action, optional title icon, title, and an action group. */
export const PanelHeader = ({ backAction, titleIcon, title, actions, className, ...props }) => (
    <header className={classNames('plus-panel-header', className)} {...props}>
        {backAction && <div className="plus-panel-header-back">{backAction}</div>}
        {titleIcon && <div className="plus-panel-header-icon">{titleIcon}</div>}
        <div className="plus-panel-header-title"><Heading size="xsmall">{title}</Heading></div>
        {actions && <PanelActionGroup className="plus-panel-header-actions">{actions}</PanelActionGroup>}
    </header>
);

PanelHeader.propTypes = {
    backAction: PropTypes.node,
    titleIcon: PropTypes.node,
    title: PropTypes.node,
    actions: PropTypes.node,
    className: PropTypes.string,
};

/** PanelActionGroup: the row an action-component family (Close, More, …) sits in. */
export const PanelActionGroup = ({ className, children, ...props }) => (
    <div className={classNames('plus-panel-action-group', className)} {...props}>{children}</div>
);

PanelActionGroup.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelSubheader: a row of secondary content under the header. */
export const PanelSubheader = ({ className, children, ...props }) => (
    <div className={classNames('plus-panel-subheader', className)} {...props}>{children}</div>
);

PanelSubheader.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelBody: the panel's scrollable main content. */
export const PanelBody = ({ className, children, ...props }) => (
    <div className={classNames('plus-panel-body', className)} {...props}>{children}</div>
);

PanelBody.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelFooter: actions and an optional disclaimer line. */
export const PanelFooter = ({ className, children, ...props }) => (
    <footer className={classNames('plus-panel-footer', className)} {...props}>{children}</footer>
);

PanelFooter.propTypes = { className: PropTypes.string, children: PropTypes.node };

/** PanelDisclaimer: the small-print line a PanelFooter carries beside its actions. */
export const PanelDisclaimer = ({ className, children, ...props }) => (
    <p className={classNames('plus-panel-disclaimer', className)} {...props}>{children}</p>
);

PanelDisclaimer.propTypes = { className: PropTypes.string, children: PropTypes.node };

const actionIconButton = (icon, label) => {
    const Action = ({ onClick, ...props }) => (
        <IconButton icon={icon} label={label} spacing="compact" onClick={onClick} {...props} />
    );
    Action.propTypes = { onClick: PropTypes.func };
    Action.displayName = `Panel${label.replace(/\s+/g, '')}Action`;
    return Action;
};

export const PanelBackAction = actionIconButton('arrow-left', 'Back');
export const PanelCloseAction = actionIconButton('xmark', 'Close');
export const PanelMoreAction = actionIconButton('ellipsis', 'More actions');
export const PanelUpAction = actionIconButton('chevron-up', 'Previous');
export const PanelDownAction = actionIconButton('chevron-down', 'Next');
export const PanelNewTabAction = actionIconButton('arrow-up-right-from-square', 'Open in new tab');
export const PanelViewSwitcher = actionIconButton('table-columns', 'Switch view');

export default PanelContainer;
