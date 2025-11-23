/**
 * Popover Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Popovers are **Element** components that display additional information when triggered.
 * They appear as small overlays positioned relative to a trigger element (button, link, icon, etc.).
 * 
 * ### When to Use
 * - **Additional Information**: Display supplementary details without cluttering the interface
 * - **Contextual Help**: Provide help text or explanations for form fields or actions
 * - **Tooltips with Content**: When you need more than a simple tooltip (titles, formatted content)
 * - **Interactive Hints**: Show tips or guidance for complex interactions
 * - **Data Details**: Display additional data or metadata on hover/click
 * 
 * ### When NOT to Use
 * - **Simple Tooltips**: Use tooltips for brief, single-line text
 * - **Critical Information**: Use alerts or modals for important information that must be seen
 * - **Complex Forms**: Use modals for multi-step forms or complex interactions
 * - **Navigation**: Use dropdowns or menus for navigation options
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens for trigger, `modal-` tokens for popover container)
 * - **Token Usage**: 
 *   - Popover Container: Uses `modal-` tokens (overlays content like modals)
 *     - Padding: `--size-modal-pad-x-sm/md/lg`, `--size-modal-pad-y-sm/md/lg`
 *     - Gap: `--size-modal-gap-sm/md/lg` (for spacing between header and body)
 *     - Radius: `--size-element-radius-sm` (4px)
 *   - Colors: `--color-surface-container-high` for background, `--color-on-surface` for text
 *   - Typography: `--font-size-h5` for title, `--font-size-body1` for content
 * - **Bootstrap Integration**: Uses Bootstrap 4.6.2 popover component (requires Popper.js)
 * 
 * ### Placement Options
 * - **top**: Popover appears above the trigger
 * - **bottom**: Popover appears below the trigger (default)
 * - **left**: Popover appears to the left of the trigger
 * - **right**: Popover appears to the right of the trigger
 * 
 * ### Trigger Types
 * - **click**: Popover appears on click (default)
 * - **hover**: Popover appears on hover
 * - **focus**: Popover appears on focus (useful for form fields)
 * - **manual**: Popover is controlled programmatically
 * 
 * ### Size Variants
 * - **Small**: Compact size for brief information
 *   - Padding: 8px top/bottom, 10px left/right
 *   - Typography: body2-txt for content, h6 for title
 * - **Default**: Standard size for most use cases
 *   - Padding: 12px top/bottom, 16px left/right
 *   - Typography: body1-txt for content, h5 for title
 * - **Large**: Spacious size for detailed information
 *   - Padding: 24px top/bottom, 40px left/right
 *   - Typography: body1-txt for content, h5 for title
 *   - Max width: 400px
 * 
 * ### Best Practices
 * - Keep popover content concise and scannable
 * - Use titles to provide context for the information
 * - Choose appropriate trigger type based on interaction pattern
 * - Position popovers to avoid covering important content
 * - Test popover positioning on different screen sizes
 * - Ensure popover content is accessible (keyboard navigation, screen readers)
 * - Use hover for quick reference, click for more persistent information
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { createPopover, createPopoverButton } from '@/js/components/index.js';

export default {
  title: 'Molecules/Popover',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Popover component for displaying additional information. Supports multiple placements, trigger types, and sizes. Uses element-level tokens for trigger and modal-level tokens for popover container.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all popover combinations: placements, sizes, and with/without titles
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    // Placements section
    const placementsSection = document.createElement('div');
    placementsSection.style.display = 'flex';
    placementsSection.style.flexDirection = 'column';
    placementsSection.style.gap = 'var(--size-card-gap-md)';
    
    const placementsLabel = document.createElement('div');
    placementsLabel.className = 'h4';
    placementsLabel.textContent = 'Placements';
    placementsLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    placementsSection.appendChild(placementsLabel);
    
    const placementsContainer = document.createElement('div');
    placementsContainer.style.display = 'flex';
    placementsContainer.style.flexWrap = 'wrap';
    placementsContainer.style.gap = 'var(--size-card-gap-md)';
    placementsContainer.style.alignItems = 'center';
    
    const placements = ['top', 'bottom', 'left', 'right'];
    placements.forEach((placement) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = `Popover ${placement.charAt(0).toUpperCase() + placement.slice(1)}`;
      
      createPopover({
        trigger: button,
        content: `This is a popover positioned ${placement} of the trigger element.`,
        title: `Popover ${placement.charAt(0).toUpperCase() + placement.slice(1)}`,
        placement: placement,
        triggerType: 'click',
        size: 'default'
      });
      
      placementsContainer.appendChild(button);
    });
    
    placementsSection.appendChild(placementsContainer);
    container.appendChild(placementsSection);
    
    // Sizes section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-card-gap-md)';
    
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h4';
    sizesLabel.textContent = 'Sizes';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesLabel);
    
    const sizesContainer = document.createElement('div');
    sizesContainer.style.display = 'flex';
    sizesContainer.style.flexWrap = 'wrap';
    sizesContainer.style.gap = 'var(--size-card-gap-md)';
    sizesContainer.style.alignItems = 'center';
    
    const sizes = ['small', 'default', 'large'];
    sizes.forEach((size) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = `${size.charAt(0).toUpperCase() + size.slice(1)} Popover`;
      
      createPopover({
        trigger: button,
        content: `This is a ${size} popover with different padding and typography.`,
        title: `${size.charAt(0).toUpperCase() + size.slice(1)} Size`,
        placement: 'top',
        triggerType: 'click',
        size: size
      });
      
      sizesContainer.appendChild(button);
    });
    
    sizesSection.appendChild(sizesContainer);
    container.appendChild(sizesSection);
    
    // Trigger types section
    const triggersSection = document.createElement('div');
    triggersSection.style.display = 'flex';
    triggersSection.style.flexDirection = 'column';
    triggersSection.style.gap = 'var(--size-card-gap-md)';
    
    const triggersLabel = document.createElement('div');
    triggersLabel.className = 'h4';
    triggersLabel.textContent = 'Trigger Types';
    triggersLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    triggersSection.appendChild(triggersLabel);
    
    const triggersContainer = document.createElement('div');
    triggersContainer.style.display = 'flex';
    triggersContainer.style.flexWrap = 'wrap';
    triggersContainer.style.gap = 'var(--size-card-gap-md)';
    triggersContainer.style.alignItems = 'center';
    
    const triggerTypes = [
      { type: 'click', label: 'Click Trigger' },
      { type: 'hover', label: 'Hover Trigger' },
      { type: 'focus', label: 'Focus Trigger' }
    ];
    
    triggerTypes.forEach(({ type, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = label;
      
      createPopover({
        trigger: button,
        content: `This popover is triggered by ${type}.`,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Trigger`,
        placement: 'top',
        triggerType: type,
        size: 'default'
      });
      
      triggersContainer.appendChild(button);
    });
    
    triggersSection.appendChild(triggersContainer);
    container.appendChild(triggersSection);
    
    // With/Without Title section
    const titleSection = document.createElement('div');
    titleSection.style.display = 'flex';
    titleSection.style.flexDirection = 'column';
    titleSection.style.gap = 'var(--size-card-gap-md)';
    
    const titleLabel = document.createElement('div');
    titleLabel.className = 'h4';
    titleLabel.textContent = 'With/Without Title';
    titleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    titleSection.appendChild(titleLabel);
    
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.flexWrap = 'wrap';
    titleContainer.style.gap = 'var(--size-card-gap-md)';
    titleContainer.style.alignItems = 'center';
    
    // With title
    const buttonWithTitle = document.createElement('button');
    buttonWithTitle.type = 'button';
    buttonWithTitle.className = 'btn btn-primary';
    buttonWithTitle.textContent = 'Popover with Title';
    
    createPopover({
      trigger: buttonWithTitle,
      content: 'This popover includes a title header for better context.',
      title: 'Popover Title',
      placement: 'top',
      triggerType: 'click',
      size: 'default'
    });
    
    titleContainer.appendChild(buttonWithTitle);
    
    // Without title
    const buttonWithoutTitle = document.createElement('button');
    buttonWithoutTitle.type = 'button';
    buttonWithoutTitle.className = 'btn btn-primary';
    buttonWithoutTitle.textContent = 'Popover without Title';
    
    createPopover({
      trigger: buttonWithoutTitle,
      content: 'This popover does not include a title header.',
      placement: 'top',
      triggerType: 'click',
      size: 'default'
    });
    
    titleContainer.appendChild(buttonWithoutTitle);
    
    titleSection.appendChild(titleContainer);
    container.appendChild(titleSection);
    
    return container;
  },
};

/**
 * Interactive Popover
 * Interactive playground for testing popover variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = args.buttonText || 'Popover Trigger';
    
    createPopover({
      trigger: button,
      content: args.content || 'This is an interactive popover. Adjust the controls to see different variations.',
      title: args.title,
      placement: args.placement || 'top',
      triggerType: args.triggerType || 'click',
      size: args.size || 'default'
    });
    
    container.appendChild(button);
    
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Button text',
    },
    content: {
      control: 'text',
      description: 'Popover content text',
    },
    title: {
      control: 'text',
      description: 'Popover title (optional)',
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Popover placement relative to trigger',
    },
    triggerType: {
      control: 'select',
      options: ['click', 'hover', 'focus', 'manual'],
      description: 'Trigger type for showing popover',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Popover size (uses modal padding tokens: --size-modal-pad-x-sm/md/lg, --size-modal-pad-y-sm/md/lg)',
    },
  },
  args: {
    buttonText: 'Popover Trigger',
    content: 'This is an interactive popover. Adjust the controls to see different variations.',
    title: 'Popover Title',
    placement: 'top',
    triggerType: 'click',
    size: 'default',
  },
};

/**
 * Contextual Help Example
 * Shows popover used for form field help text
 */
export const ContextualHelp = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '500px';
    
    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--size-card-gap-md)';
    
    // Form field with help popover
    const fieldGroup = document.createElement('div');
    fieldGroup.style.display = 'flex';
    fieldGroup.style.flexDirection = 'column';
    fieldGroup.style.gap = 'var(--size-element-gap-xs)';
    
    const labelContainer = document.createElement('div');
    labelContainer.style.display = 'flex';
    labelContainer.style.alignItems = 'center';
    labelContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Email Address';
    labelContainer.appendChild(label);
    
    const helpIcon = document.createElement('i');
    helpIcon.className = 'fas fa-question-circle';
    helpIcon.style.cursor = 'pointer';
    helpIcon.style.color = 'var(--color-primary)';
    helpIcon.setAttribute('aria-label', 'Help');
    
    createPopover({
      trigger: helpIcon,
      content: 'Enter your email address. We will use this to send you important updates and notifications.',
      title: 'Email Address Help',
      placement: 'right',
      triggerType: 'hover',
      size: 'default'
    });
    
    labelContainer.appendChild(helpIcon);
    fieldGroup.appendChild(labelContainer);
    
    const input = document.createElement('input');
    input.type = 'email';
    input.className = 'form-control plus-text-field body2-txt';
    input.placeholder = 'example@email.com';
    fieldGroup.appendChild(input);
    
    form.appendChild(fieldGroup);
    
    // Another field with focus trigger
    const fieldGroup2 = document.createElement('div');
    fieldGroup2.style.display = 'flex';
    fieldGroup2.style.flexDirection = 'column';
    fieldGroup2.style.gap = 'var(--size-element-gap-xs)';
    
    const label2 = document.createElement('label');
    label2.className = 'form-label';
    label2.textContent = 'Password';
    fieldGroup2.appendChild(label2);
    
    const input2 = document.createElement('input');
    input2.type = 'password';
    input2.className = 'form-control plus-text-field body2-txt';
    input2.placeholder = 'Enter password';
    
    createPopover({
      trigger: input2,
      content: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.',
      title: 'Password Requirements',
      placement: 'right',
      triggerType: 'focus',
      size: 'default'
    });
    
    fieldGroup2.appendChild(input2);
    form.appendChild(fieldGroup2);
    
    container.appendChild(form);
    
    return container;
  },
};

/**
 * Data Details Example
 * Shows popover used to display additional data details
 */
export const DataDetails = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const card = document.createElement('div');
    card.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    card.style.border = '1px solid var(--color-outline-variant)';
    card.style.borderRadius = 'var(--size-card-radius-sm)';
    card.style.backgroundColor = 'var(--color-surface-container)';
    
    const title = document.createElement('div');
    title.className = 'h5';
    title.textContent = 'User Statistics';
    title.style.marginBottom = 'var(--size-card-gap-md)';
    card.appendChild(title);
    
    const statRow = document.createElement('div');
    statRow.style.display = 'flex';
    statRow.style.justifyContent = 'space-between';
    statRow.style.alignItems = 'center';
    statRow.style.padding = 'var(--size-element-pad-y-md) 0';
    
    const statLabel = document.createElement('span');
    statLabel.className = 'body1-txt';
    statLabel.textContent = 'Total Users: ';
    
    const statValue = document.createElement('span');
    statValue.className = 'body1-txt';
    statValue.style.fontWeight = 'var(--font-weight-semibold-2)';
    statValue.textContent = '1,234';
    
    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-info-circle';
    infoIcon.style.cursor = 'pointer';
    infoIcon.style.color = 'var(--color-primary)';
    infoIcon.style.marginLeft = 'var(--size-element-gap-sm)';
    infoIcon.setAttribute('aria-label', 'More information');
    
    createPopover({
      trigger: infoIcon,
      content: 'Total number of registered users as of today. This includes active and inactive accounts.',
      title: 'Total Users',
      placement: 'right',
      triggerType: 'hover',
      size: 'default'
    });
    
    statLabel.appendChild(statValue);
    statRow.appendChild(statLabel);
    statRow.appendChild(infoIcon);
    card.appendChild(statRow);
    
    container.appendChild(card);
    
    return container;
  },
};



