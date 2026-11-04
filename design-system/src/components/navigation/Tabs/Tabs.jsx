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
import React from 'react';
import PropTypes from 'prop-types';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
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
    children: PropTypes.node,
    isDisabled: PropTypes.bool,
    className: PropTypes.string
};

/**
 * The panel one tab controls.
 *
 * A thin wrapper over Base UI's `Tabs.Panel`, which already does the work
 * `NavTabs.Panel` had to do by hand: mounting only the active panel's
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
    children: PropTypes.node,
    className: PropTypes.string
};

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

    const rootClasses = [
        'plus-tabs',
        `plus-tabs--${appearance}`,
        `plus-tabs--${spacing}`,
        className
    ].filter(Boolean).join(' ');

    const listClasses = ['plus-tabs-list', alignmentClass(alignment)].filter(Boolean).join(' ');

    return (
        <BaseTabs.Root
            id={id}
            defaultValue={defaultActiveKey}
            value={activeKey}
            onValueChange={(value, eventDetails) => onSelect?.(value, eventDetails)}
            className={rootClasses}
            {...props}
        >
            {/* `activateOnFocus`: arrow keys move selection immediately, matching the
                old hand-rolled strip; Base UI's own default waits for Enter/Space. */}
            <BaseTabs.List className={listClasses} activateOnFocus>
                {tabs}
            </BaseTabs.List>
            {rest}
        </BaseTabs.Root>
    );
};

Tabs.propTypes = {
    children: PropTypes.node,
    alignment: PropTypes.oneOf(['left', 'center', 'right', 'justified']),
    /** Underline indicator (default) or a pill-shaped selected background. */
    appearance: PropTypes.oneOf(['default', 'pill']),
    /** `default` is 32px tabs; `compact` is 24px. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    className: PropTypes.string,
    id: PropTypes.string,
    defaultActiveKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    activeKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Called with the newly selected `eventKey` whenever selection moves. */
    onSelect: PropTypes.func
};

Tabs.Tab = Tab;
Tabs.Panel = Panel;

export default Tabs;
