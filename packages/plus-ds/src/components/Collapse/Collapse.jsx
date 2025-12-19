import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Collapse = ({
    id,
    trigger, // Content for the trigger button
    children, // Content to be expanded/collapsed
    isOpen: controlledIsOpen, // Controlled state
    defaultOpen = false, // Uncontrolled initial state
    onToggle, // Callback when toggled
    triggerTag: TriggerTag = 'button',
    triggerClass = '',
    contentClass = '',
    icon,
    iconPosition = 'left',
    className = '',
    ...props
}) => {
    const isControlled = controlledIsOpen !== undefined;
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const handleToggle = (e) => {
        if (e) {
            e.preventDefault();
        }

        const newState = !isOpen;
        if (!isControlled) {
            setInternalIsOpen(newState);
        }

        if (onToggle) {
            onToggle(newState);
        }
    };

    const triggerId = id ? `${id}-trigger` : undefined;
    const contentId = id ? `${id}-content` : undefined;

    const triggerClasses = [
        'plus-collapse-trigger',
        !isOpen ? 'collapsed' : '',
        triggerClass
    ].filter(Boolean).join(' ');

    const contentClasses = [
        'collapse',
        'plus-collapse-content',
        isOpen ? 'show' : '',
        contentClass
    ].filter(Boolean).join(' ');

    const renderTriggerContent = () => {
        if (!icon) return <span className="plus-collapse-trigger-content">{trigger}</span>;

        const iconEl = <i className={`fas fa-${icon} plus-collapse-icon`} />;

        return (
            <span className="plus-collapse-trigger-content">
                {iconPosition === 'left' && iconEl}
                {typeof trigger === 'string' ? (iconPosition === 'left' ? ` ${trigger}` : `${trigger} `) : trigger}
                {iconPosition === 'right' && iconEl}
            </span>
        );
    };

    return (
        <div className={`plus-collapse-wrapper ${className}`} {...props}>
            <TriggerTag
                id={triggerId}
                className={triggerClasses}
                onClick={handleToggle}
                aria-expanded={isOpen}
                aria-controls={contentId}
                type={TriggerTag === 'button' ? 'button' : undefined}
                href={TriggerTag === 'a' ? '#' : undefined}
            >
                {renderTriggerContent()}
            </TriggerTag>

            <div
                id={contentId}
                className={contentClasses}
                aria-labelledby={triggerId}
            >
                {children}
            </div>
        </div>
    );
};

Collapse.propTypes = {
    id: PropTypes.string,
    trigger: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    defaultOpen: PropTypes.bool,
    onToggle: PropTypes.func,
    triggerTag: PropTypes.elementType,
    triggerClass: PropTypes.string,
    contentClass: PropTypes.string,
    icon: PropTypes.string,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    className: PropTypes.string
};

export default Collapse;
