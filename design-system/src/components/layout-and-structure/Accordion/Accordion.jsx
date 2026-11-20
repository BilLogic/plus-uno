import { AnimatePresence, HeightSurface } from '@/lib/heightMotion';
import React from 'react';
import PropTypes from 'prop-types';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './Accordion.scss';

// Base UI's `value` is always an array of open item keys; the public API
// here keeps the old single-key-or-array shape, so this is the only place
// that converts between the two.
const toValueArray = (key) => {
    if (key === undefined || key === null) return undefined;
    return Array.isArray(key) ? key : [key];
};

/** Accordion: stacked headings that each open to show their content. */
const Accordion = ({
    // Content
    items = [],
    children,
    defaultActiveKey,
    activeKey,

    // Design
    appearance = 'separated',
    flush = false,

    // Behavior
    alwaysOpen = false,
    onSelect,

    // Development
    className = '',
    id,
    ...props
}) => {
    const accordionClasses = [
        'plus-accordion',
        // `flush` is the grouped look with the outer box dropped.
        flush ? 'plus-accordion--flush' : `plus-accordion--${appearance}`,
        className
    ].filter(Boolean).join(' ');

    // Render items from array prop or children
    const renderItems = () => {
        if (children) return children;

        return items.map((item, index) => (
            <AccordionItem
                key={item.eventKey || index}
                eventKey={item.eventKey || String(index)}
                header={item.header}
                summary={item.summary}
                elemBefore={item.elemBefore}
                disabled={item.disabled}
            >
                {item.body}
            </AccordionItem>
        ));
    };

    const handleValueChange = (value) => {
        if (!onSelect) return;
        onSelect(alwaysOpen ? value : (value[0] ?? null));
    };

    return (
        <BaseAccordion.Root
            id={id}
            defaultValue={toValueArray(defaultActiveKey)}
            value={toValueArray(activeKey)}
            onValueChange={handleValueChange}
            multiple={alwaysOpen}
            className={accordionClasses}
            {...props}
        >
            {renderItems()}
        </BaseAccordion.Root>
    );
};

/**
 * AccordionItem Component
 * Individual collapsible section within an Accordion.
 */
const AccordionItem = ({
    eventKey,
    header,
    summary,
    elemBefore,
    children,
    disabled = false,
    className = '',
    ...props
}) => {
    // The header's heading is one level below the section the accordion sits in.
    const Heading = headingTag(useHeadingLevel() + 1);
    const itemClasses = [
        'plus-accordion-item',
        disabled ? 'plus-accordion-item--disabled' : '',
        elemBefore ? 'plus-accordion-item--has-elem' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <BaseAccordion.Item
            value={eventKey}
            disabled={disabled}
            className={itemClasses}
            {...props}
        >
            <BaseAccordion.Header
                render={<Heading className="plus-accordion-header" />}
            >
                <BaseAccordion.Trigger
                    className="plus-accordion-trigger"
                >
                    {elemBefore && <span className="plus-accordion-elem">{elemBefore}</span>}
                    <span className="plus-accordion-text">
                        <span className="plus-accordion-title">{header}</span>
                        {summary && <span className="plus-accordion-summary">{summary}</span>}
                    </span>
                </BaseAccordion.Trigger>
            </BaseAccordion.Header>
            <BaseAccordion.Panel keepMounted render={(panelProps, state) => (
                <div {...panelProps} hidden={undefined} className="plus-accordion-region" aria-hidden={!state.open ? true : undefined} inert={!state.open ? true : undefined}>
                    <AnimatePresence initial={false}>
                        {state.open && (
                            <HeightSurface key="body" className="plus-accordion-panel">
                                <div className="plus-accordion-body">{children}</div>
                            </HeightSurface>
                        )}
                    </AnimatePresence>
                </div>
            )} />
        </BaseAccordion.Item>
    );
};

AccordionItem.propTypes = {
    /** Unique key for this accordion item */
    eventKey: PropTypes.string.isRequired,
    /** Header content (title text or node) */
    header: PropTypes.node.isRequired,
    /** One line of subtle text under the title, such as a status or a count. A longer line is cut with an ellipsis. */
    summary: PropTypes.node,
    /** An avatar or an icon before the title. In the separated appearance the open body indents to the title's start. */
    elemBefore: PropTypes.node,
    /** Body content when expanded */
    children: PropTypes.node,
    /** Disable this item */
    disabled: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string
};

// Attach subcomponent
Accordion.Item = AccordionItem;

Accordion.propTypes = {
    // Content
    /** Array of accordion item configurations */
    items: PropTypes.arrayOf(PropTypes.shape({
        eventKey: PropTypes.string,
        header: PropTypes.node.isRequired,
        summary: PropTypes.node,
        elemBefore: PropTypes.node,
        body: PropTypes.node.isRequired,
        disabled: PropTypes.bool
    })),
    /** Child AccordionItem components (alternative to items array) */
    children: PropTypes.node,
    /** Initially expanded item(s) - single key or array for alwaysOpen */
    defaultActiveKey: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    /** Controlled active key(s) */
    activeKey: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),

    // Design
    /** `separated` (default) gives each item its own container with a gap between; `grouped` is one bordered box with dividers, for an accordion inside a card or panel. */
    appearance: PropTypes.oneOf(['separated', 'grouped']),
    /** The grouped look with the outer border and corners dropped; takes the place of `appearance`. */
    flush: PropTypes.bool,

    // Behavior
    /** Allow multiple items to be open simultaneously */
    alwaysOpen: PropTypes.bool,
    /** Callback when active item changes */
    onSelect: PropTypes.func,

    // Development
    /** Additional CSS classes */
    className: PropTypes.string,
    /** HTML ID attribute */
    id: PropTypes.string
};

export default Accordion;
