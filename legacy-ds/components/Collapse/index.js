/**
 * @fileoverview Collapse component for PLUS design system.
 * Universal element component for creating collapsible content areas.
 * Based on Bootstrap 4.6.2 collapse functionality.
 */

/**
 * Creates a collapse component with trigger and collapsible content
 * @param {Object} options - Collapse configuration
 * @param {string} options.id - Unique ID for the collapse component
 * @param {string|HTMLElement} options.trigger - Trigger button text or HTMLElement
 * @param {string|HTMLElement} options.content - Collapsible content (text or HTMLElement)
 * @param {boolean} [options.show=false] - Whether collapse is initially shown
 * @param {string} [options.triggerTag='button'] - HTML tag for trigger ('button' or 'a')
 * @param {string} [options.triggerId] - ID for trigger element (auto-generated if not provided)
 * @param {string} [options.triggerClass] - Additional CSS classes for trigger
 * @param {string} [options.contentClass] - Additional CSS classes for content
 * @param {string} [options.icon] - Icon name for trigger (Font Awesome, without 'fa-' prefix)
 * @param {string} [options.iconPosition='left'] - Icon position ('left' or 'right')
 * @param {Function} [options.onShow] - Callback when collapse is shown
 * @param {Function} [options.onHide] - Callback when collapse is hidden
 * @param {Array} [options.classes=[]] - Additional CSS classes for wrapper
 * @returns {HTMLElement} Collapse component wrapper element
 */
export function createCollapse({
    id,
    trigger,
    content,
    show = false,
    triggerTag = 'button',
    triggerId = null,
    triggerClass = '',
    contentClass = '',
    icon = null,
    iconPosition = 'left',
    onShow = null,
    onHide = null,
    classes = []
} = {}) {
    if (!id) {
        throw new Error('Collapse component requires an id');
    }
    
    if (!trigger) {
        throw new Error('Collapse component requires a trigger');
    }
    
    if (!content) {
        throw new Error('Collapse component requires content');
    }

    // Generate trigger ID if not provided
    const finalTriggerId = triggerId || `${id}-trigger`;
    const collapseId = `${id}-collapse`;
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('plus-collapse-wrapper');
    if (classes && classes.length > 0) {
        wrapper.classList.add(...classes);
    }

    // Create trigger element
    const triggerEl = document.createElement(triggerTag);
    triggerEl.id = finalTriggerId;
    triggerEl.classList.add('plus-collapse-trigger');
    if (triggerClass) {
        triggerEl.classList.add(...triggerClass.split(' '));
    }
    
    // Set Bootstrap collapse attributes
    if (triggerTag === 'a') {
        triggerEl.href = `#${collapseId}`;
    } else {
        triggerEl.setAttribute('data-target', `#${collapseId}`);
    }
    triggerEl.setAttribute('data-toggle', 'collapse');
    triggerEl.setAttribute('aria-expanded', show ? 'true' : 'false');
    triggerEl.setAttribute('aria-controls', collapseId);
    
    // Add collapsed class if not shown
    if (!show) {
        triggerEl.classList.add('collapsed');
    }

    // Create trigger content
    const triggerContent = document.createElement('span');
    triggerContent.classList.add('plus-collapse-trigger-content');
    
    // Add icon if provided
    if (icon) {
        const iconEl = document.createElement('i');
        iconEl.classList.add('fas', `fa-${icon}`);
        iconEl.classList.add('plus-collapse-icon');
        
        if (iconPosition === 'left') {
            triggerContent.appendChild(iconEl);
            if (typeof trigger === 'string') {
                const textNode = document.createTextNode(` ${trigger}`);
                triggerContent.appendChild(textNode);
            } else {
                triggerContent.appendChild(trigger);
            }
        } else {
            if (typeof trigger === 'string') {
                triggerContent.appendChild(document.createTextNode(`${trigger} `));
            } else {
                triggerContent.appendChild(trigger);
            }
            triggerContent.appendChild(iconEl);
        }
    } else {
        if (typeof trigger === 'string') {
            triggerContent.textContent = trigger;
        } else {
            triggerContent.appendChild(trigger);
        }
    }
    
    triggerEl.appendChild(triggerContent);

    // Create collapsible content
    const contentEl = document.createElement('div');
    contentEl.id = collapseId;
    contentEl.classList.add('collapse');
    if (show) {
        contentEl.classList.add('show');
    }
    contentEl.classList.add('plus-collapse-content');
    if (contentClass) {
        contentEl.classList.add(...contentClass.split(' '));
    }
    contentEl.setAttribute('aria-labelledby', finalTriggerId);
    
    // Add content
    if (typeof content === 'string') {
        contentEl.textContent = content;
    } else {
        contentEl.appendChild(content);
    }

    // Append elements to wrapper
    wrapper.appendChild(triggerEl);
    wrapper.appendChild(contentEl);

    // Add event listeners for Bootstrap collapse events
    if (onShow || onHide) {
        $(contentEl).on('shown.bs.collapse', () => {
            triggerEl.classList.remove('collapsed');
            triggerEl.setAttribute('aria-expanded', 'true');
            if (onShow) {
                onShow();
            }
        });

        $(contentEl).on('hidden.bs.collapse', () => {
            triggerEl.classList.add('collapsed');
            triggerEl.setAttribute('aria-expanded', 'false');
            if (onHide) {
                onHide();
            }
        });
    }

    return wrapper;
}

/**
 * Creates a simple collapse trigger button
 * @param {Object} options - Trigger configuration
 * @param {string} options.targetId - ID of the collapse element to target
 * @param {string} options.text - Button text
 * @param {string} [options.id] - Button ID
 * @param {boolean} [options.show=false] - Whether target is initially shown
 * @param {string} [options.tag='button'] - HTML tag ('button' or 'a')
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Trigger element
 */
export function createCollapseTrigger({
    targetId,
    text,
    id = null,
    show = false,
    tag = 'button',
    classes = []
} = {}) {
    if (!targetId) {
        throw new Error('Collapse trigger requires a targetId');
    }
    
    if (!text) {
        throw new Error('Collapse trigger requires text');
    }

    const trigger = document.createElement(tag);
    if (id) {
        trigger.id = id;
    }
    trigger.classList.add('plus-collapse-trigger');
    if (classes && classes.length > 0) {
        trigger.classList.add(...classes);
    }
    
    if (tag === 'a') {
        trigger.href = `#${targetId}`;
    } else {
        trigger.setAttribute('data-target', `#${targetId}`);
    }
    trigger.setAttribute('data-toggle', 'collapse');
    trigger.setAttribute('aria-expanded', show ? 'true' : 'false');
    trigger.setAttribute('aria-controls', targetId);
    
    if (!show) {
        trigger.classList.add('collapsed');
    }
    
    trigger.textContent = text;
    
    return trigger;
}





