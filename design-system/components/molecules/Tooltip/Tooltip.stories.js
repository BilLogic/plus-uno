/**
 * Tooltip Molecule Stories
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=42-6020&m=dev
 * Matches Figma design system specifications exactly
 * 
 * ## Usage and Implementation
 * 
 * Tooltips are **Element** components that display brief information when triggered.
 * They appear as small overlays positioned relative to a trigger element (button, link, icon, etc.).
 * 
 * ### When to Use
 * - **Brief Information**: Display short, single-line text hints or explanations
 * - **Contextual Help**: Provide quick help text for form fields, buttons, or icons
 * - **Additional Details**: Show supplementary information without cluttering the interface
 * - **Accessibility**: Provide accessible descriptions for icon-only buttons or controls
 * - **Hover Hints**: Display helpful hints on hover for interactive elements
 * 
 * ### When NOT to Use
 * - **Complex Content**: Use popovers for content with titles or formatted text
 * - **Critical Information**: Use alerts or modals for important information that must be seen
 * - **Multi-line Text**: Use popovers for longer, multi-line content
 * - **Interactive Content**: Use popovers or modals for interactive content
 * - **Navigation**: Use dropdowns or menus for navigation options
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage** (from Figma design):
 *   - Tooltip Container: Uses `element-` tokens (tooltips are Element components)
 *   - Padding: `--size-element-pad-x-sm` (8px) horizontal, `--size-element-pad-y-lg` (8px) vertical
 *   - Radius: `--size-element-radius-md` (4px)
 *   - Colors: `--color-inverse-surface` (#2e3133) for background, `--color-inverse-on-surface` (#f0f1f3) for text
 *   - Typography: Body/B2/Regular - Merriweather Sans Light, 14px, weight 300, line-height 1.571
 *   - Arrow: 10px wide, 5px tall
 *   - Shadow: None (no box-shadow in Figma design)
 * - **Bootstrap Integration**: Uses Bootstrap 4.6.2 tooltip component (requires Popper.js)
 * 
 * ### Placement Options
 * - **top**: Tooltip appears above the trigger
 * - **bottom**: Tooltip appears below the trigger (default)
 * - **left**: Tooltip appears to the left of the trigger
 * - **right**: Tooltip appears to the right of the trigger
 * 
 * ### Trigger Types
 * - **hover**: Tooltip appears on hover (default)
 * - **focus**: Tooltip appears on focus (useful for form fields and keyboard navigation)
 * - **click**: Tooltip appears on click
 * - **manual**: Tooltip is controlled programmatically
 * 
 * ### Size Variants
 * - **Small**: Compact size for brief information. Padding: 4px top/bottom, 8px left/right. Typography: body3-txt. Max width: 150px
 * - **Default**: Standard size for most use cases. Padding: 6px top/bottom, 10px left/right. Typography: body2-txt. Max width: 200px
 * - **Large**: Spacious size for more detailed information. Padding: 8px top/bottom, 16px left/right. Typography: body1-txt. Max width: 300px
 * 
 * ### Best Practices
 * - Keep tooltip text concise (typically 1-2 lines)
 * - Use hover for quick reference, focus for accessibility
 * - Position tooltips to avoid covering important content
 * - Test tooltip positioning on different screen sizes
 * - Ensure tooltip content is accessible (keyboard navigation, screen readers)
 * - Use tooltips for brief hints, popovers for detailed information
 * - Consider using focus trigger for form fields to improve accessibility
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { createTooltip, createTooltipButton, destroyAllTooltips } from '@/js/components/index.js';

export default {
  title: 'Molecules/Tooltip',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tooltip component for displaying brief information. Supports multiple placements, trigger types, and sizes. Uses element-level tokens.',
      },
    },
  },
  decorators: [
    (story) => {
      // Destroy all tooltips before rendering Tooltip stories
      destroyAllTooltips();
      
      // Return the story
      return story();
    },
  ],
};

/**
 * All Variants
 * Shows all tooltip combinations: placements, sizes, and trigger types
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
      button.textContent = `Tooltip ${placement.charAt(0).toUpperCase() + placement.slice(1)}`;
      
      createTooltip({
        trigger: button,
        text: `This is a tooltip positioned ${placement} of the trigger element.`,
        placement: placement,
        triggerType: 'hover',
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
      button.textContent = `${size.charAt(0).toUpperCase() + size.slice(1)} Tooltip`;
      
      createTooltip({
        trigger: button,
        text: `This is a ${size} tooltip with different padding and typography.`,
        placement: 'top',
        triggerType: 'hover',
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
      { type: 'hover', label: 'Hover Trigger' },
      { type: 'focus', label: 'Focus Trigger' },
      { type: 'click', label: 'Click Trigger' }
    ];
    
    triggerTypes.forEach(({ type, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = label;
      
      createTooltip({
        trigger: button,
        text: `This tooltip is triggered by ${type}.`,
        placement: 'top',
        triggerType: type,
        size: 'default'
      });
      
      triggersContainer.appendChild(button);
    });
    
    triggersSection.appendChild(triggersContainer);
    container.appendChild(triggersSection);
    
    return container;
  },
};

/**
 * Interactive Tooltip
 * Interactive playground for testing tooltip variations
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
    button.textContent = args.buttonText || 'Tooltip Trigger';
    
    createTooltip({
      trigger: button,
      text: args.text || 'This is an interactive tooltip. Adjust the controls to see different variations.',
      placement: args.placement || 'top',
      triggerType: args.triggerType || 'hover',
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
    text: {
      control: 'text',
      description: 'Tooltip text content',
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Tooltip placement relative to trigger',
    },
    triggerType: {
      control: 'select',
      options: ['hover', 'focus', 'click', 'manual'],
      description: 'Trigger type for showing tooltip',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Tooltip size. Uses element padding tokens for spacing.',
    },
  },
  args: {
    buttonText: 'Tooltip Trigger',
    text: 'This is an interactive tooltip. Adjust the controls to see different variations.',
    placement: 'top',
    triggerType: 'hover',
    size: 'default',
  },
};

/**
 * Contextual Help Example
 * Shows tooltip used for form field help text and icon buttons
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
    
    // Form field with help tooltip
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
    helpIcon.style.cursor = 'help';
    helpIcon.style.color = 'var(--color-primary)';
    helpIcon.setAttribute('aria-label', 'Help');
    
    createTooltip({
      trigger: helpIcon,
      text: 'Enter your email address. We will use this to send you important updates.',
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
    
    // Icon button with tooltip
    const iconButtonGroup = document.createElement('div');
    iconButtonGroup.style.display = 'flex';
    iconButtonGroup.style.gap = 'var(--size-element-gap-sm)';
    iconButtonGroup.style.alignItems = 'center';
    
    const iconButton = document.createElement('button');
    iconButton.type = 'button';
    iconButton.className = 'btn btn-link';
    iconButton.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    iconButton.innerHTML = '<i class="fas fa-info-circle"></i>';
    iconButton.setAttribute('aria-label', 'More information');
    
    createTooltip({
      trigger: iconButton,
      text: 'Click for more information about this feature.',
      placement: 'top',
      triggerType: 'hover',
      size: 'default'
    });
    
    iconButtonGroup.appendChild(iconButton);
    form.appendChild(iconButtonGroup);
    
    container.appendChild(form);
    
    return container;
  },
};

/**
 * Icon Buttons Example
 * Shows tooltips used for icon-only buttons to provide accessible descriptions
 */
export const IconButtons = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = 'var(--size-element-gap-sm)';
    buttonGroup.style.flexWrap = 'wrap';
    
    const icons = [
      { icon: 'fa-edit', text: 'Edit this item', ariaLabel: 'Edit' },
      { icon: 'fa-trash', text: 'Delete this item', ariaLabel: 'Delete' },
      { icon: 'fa-save', text: 'Save changes', ariaLabel: 'Save' },
      { icon: 'fa-share', text: 'Share this item', ariaLabel: 'Share' },
      { icon: 'fa-download', text: 'Download file', ariaLabel: 'Download' }
    ];
    
    icons.forEach(({ icon, text, ariaLabel }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-outline-primary';
      button.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
      button.innerHTML = `<i class="fas ${icon}"></i>`;
      button.setAttribute('aria-label', ariaLabel);
      
      createTooltip({
        trigger: button,
        text: text,
        placement: 'top',
        triggerType: 'hover',
        size: 'default'
      });
      
      buttonGroup.appendChild(button);
    });
    
    container.appendChild(buttonGroup);
    
    return container;
  },
};

/**
 * Form Field Focus Example
 * Shows tooltips triggered on focus for form fields
 */
export const FormFieldFocus = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '500px';
    
    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--size-card-gap-md)';
    
    // Password field with focus tooltip
    const fieldGroup = document.createElement('div');
    fieldGroup.style.display = 'flex';
    fieldGroup.style.flexDirection = 'column';
    fieldGroup.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Password';
    fieldGroup.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'password';
    input.className = 'form-control plus-text-field body2-txt';
    input.placeholder = 'Enter password';
    
    createTooltip({
      trigger: input,
      text: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.',
      placement: 'right',
      triggerType: 'focus',
      size: 'large'
    });
    
    fieldGroup.appendChild(input);
    form.appendChild(fieldGroup);
    
    // Username field with focus tooltip
    const fieldGroup2 = document.createElement('div');
    fieldGroup2.style.display = 'flex';
    fieldGroup2.style.flexDirection = 'column';
    fieldGroup2.style.gap = 'var(--size-element-gap-xs)';
    
    const label2 = document.createElement('label');
    label2.className = 'form-label';
    label2.textContent = 'Username';
    fieldGroup2.appendChild(label2);
    
    const input2 = document.createElement('input');
    input2.type = 'text';
    input2.className = 'form-control plus-text-field body2-txt';
    input2.placeholder = 'Enter username';
    
    createTooltip({
      trigger: input2,
      text: 'Username must be 3-20 characters and can contain letters, numbers, and underscores.',
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

