import React from 'react';
import PropTypes from 'prop-types';
import { Accordion as RBAccordion } from 'react-bootstrap';
import './Accordion.scss';

/**
 * Accordion Component
 * Collapsible content sections built on React Bootstrap Accordion.
 * Supports flush mode, always open, and multiple item expansion.
 */
const Accordion = ({
    // Content
    items = [],
    children,
    defaultActiveKey,
    activeKey,

    // Design
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
        flush ? 'plus-accordion--flush' : '',
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
                disabled={item.disabled}
            >
                {item.body}
            </AccordionItem>
        ));
    };

    return (
        <RBAccordion
            id={id}
            defaultActiveKey={defaultActiveKey}
            activeKey={activeKey}
            flush={flush}
            alwaysOpen={alwaysOpen}
            onSelect={onSelect}
            className={accordionClasses}
            {...props}
        >
            {renderItems()}
        </RBAccordion>
    );
};

/**
 * AccordionItem Component
 * Individual collapsible section within an Accordion.
 */
const AccordionItem = ({
    eventKey,
    header,
    children,
    disabled = false,
    className = '',
    ...props
}) => {
    const itemClasses = [
        'plus-accordion-item',
        disabled ? 'plus-accordion-item--disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <RBAccordion.Item
            eventKey={eventKey}
            className={itemClasses}
            {...props}
        >
            <RBAccordion.Header className="plus-accordion-header">
                {header}
            </RBAccordion.Header>
            <RBAccordion.Body className="plus-accordion-body">
                {children}
            </RBAccordion.Body>
        </RBAccordion.Item>
    );
};

AccordionItem.propTypes = {
    /** Unique key for this accordion item */
    eventKey: PropTypes.string.isRequired,
    /** Header content (title text or node) */
    header: PropTypes.node.isRequired,
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
    /** Remove borders for flush/seamless appearance */
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
