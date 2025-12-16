/**
 * Toast Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Toasts are **Modal** components used to display brief, non-intrusive notifications to users.
 * They appear temporarily in a fixed position (typically top-right) and automatically dismiss after a delay.
 * 
 * ### When to Use
 * - **Success confirmations**: Brief confirmations of successful actions (e.g., "Item saved successfully")
 * - **Error notifications**: Non-critical error messages that don't require immediate action
 * - **Status updates**: Quick updates about system status or background processes
 * - **Information messages**: Helpful tips or contextual information
 * - **Non-blocking feedback**: Messages that don't require user interaction to continue
 * - **Temporary notifications**: Messages that should disappear automatically
 * 
 * ### When NOT to Use
 * - **Critical errors**: Use modals or alerts for errors that require immediate attention
 * - **Complex messages**: Use alerts or modals for messages with multiple actions or detailed information
 * - **Persistent information**: Use alerts for information that should remain visible
 * - **User input required**: Use modals for actions requiring user confirmation or input
 * - **Important warnings**: Use alerts for warnings that users must acknowledge
 * 
 * ### Implementation Context
 * - **Component Type**: Modal (uses `modal-*` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-modal-pad-x-md`, `--size-modal-pad-y-md`
 *   - Gap: `--size-modal-gap-sm`
 *   - Radius: `--size-modal-radius-md`
 *   - Border: `--size-modal-border-sm`
 *   - Colors: Style-specific color tokens (primary, success, danger, etc.)
 * - **Positioning**: Fixed position (top-right, top-left, bottom-right, bottom-left)
 * - **Auto-dismiss**: Default 5 seconds (configurable)
 * 
 * ### Visual Style Variants
 * - **Default**: Default brand color for general information
 * - **Success**: Green for positive confirmations or successful actions
 * - **Danger**: Red for errors or failed actions
 * - **Warning**: Yellow/orange for cautionary information
 * - **Info**: Blue for informational messages
 * 
 * ### Content Variants
 * - **With Title**: All toasts include a title/header above the message text (required)
 * - **Dismissible**: Includes a close button for manual dismissal
 * - **Non-dismissible**: Auto-dismiss only (no close button)
 * 
 * ### Position Variants
 * - **Top-right**: Default position (most common)
 * - **Top-left**: Alternative top position
 * - **Bottom-right**: Bottom position (common for mobile)
 * - **Bottom-left**: Alternative bottom position
 * 
 * ### Best Practices
 * - Keep messages concise (1-2 lines)
 * - Use appropriate style colors (success for positive, danger for errors)
 * - Set appropriate auto-dismiss delay (5 seconds default)
 * - Position toasts where they won't obstruct important UI
 * - Stack multiple toasts vertically
 * - Always include a title header for all toasts
 * - Ensure sufficient contrast for accessibility
 * - Don't overuse toasts - reserve for truly non-intrusive notifications
 * 
 * See design-system/components/overview.md for Modal Component Guidelines
 * See design-system/styles/ for Token Reference
 */

import { PlusInterface } from "../index.js";
import { createStaticToast } from './index.js';

export default {
  title: 'Components/Toast',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Toast component for displaying brief, non-intrusive notifications. Supports multiple styles, positions, and content variants. Uses modal-level tokens for spacing and layout. Auto-dismisses after a configurable delay.',
      },
    },
    layout: 'padded', // Padded layout for static toasts
  },
};

/**
 * Overview
 * Shows all toast variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Helper function to create a section
    const createSection = (heading, items) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const sectionHeading = document.createElement('div');
      sectionHeading.className = 'h5';
      sectionHeading.textContent = heading;
      sectionHeading.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(sectionHeading);
      
      const itemsContainer = document.createElement('div');
      itemsContainer.style.display = 'flex';
      itemsContainer.style.flexDirection = 'column';
      itemsContainer.style.gap = 'var(--size-element-gap-sm)';
      
      items.forEach((item) => {
        itemsContainer.appendChild(item);
      });
      
      section.appendChild(itemsContainer);
      return section;
    };
    
    // Colors Section
    const colors = ['default', 'success', 'danger', 'warning', 'info'];
    const colorToasts = colors.map((style) => {
      return createStaticToast({
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Toast`,
        text: `${style.charAt(0).toUpperCase() + style.slice(1)} toast message`,
        style: style,
        dismissable: true,
      });
    });
    container.appendChild(createSection('Colors', colorToasts));
    
    // Content Section - With Title
    const withTitleToast = createStaticToast({
      text: 'This is a toast with a title header',
      style: 'info',
      title: 'Toast Title',
      dismissable: true,
    });
    
    // Content Section - Non-dismissable
    const nonDismissableToast = createStaticToast({
      title: 'Non-dismissable Toast',
      text: 'This toast cannot be manually dismissed',
      style: 'info',
      dismissable: false,
    });
    
    container.appendChild(createSection('Content', [withTitleToast, nonDismissableToast]));
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    
    const interactiveSection = document.createElement('div');
    interactiveSection.style.display = 'flex';
    interactiveSection.style.flexDirection = 'column';
    interactiveSection.style.gap = 'var(--size-card-gap-md)';
    
    const interactiveLabel = document.createElement('div');
    interactiveLabel.className = 'h6';
    interactiveLabel.textContent = 'Interactive Toast';
    interactiveLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    interactiveSection.appendChild(interactiveLabel);
    
    // Show toast directly based on args
    const toast = createStaticToast({
      style: args.style || 'info',
      title: args.title || undefined,
      text: args.text || 'This is an interactive toast.',
      dismissable: args.dismissable !== false,
    });
    interactiveSection.appendChild(toast);
    
    container.appendChild(interactiveSection);
    
    const info = document.createElement('p');
    info.className = 'body2-txt';
    info.textContent = 'Use the controls below to customize the toast appearance.';
    container.appendChild(info);
    
    return container;
  },
  argTypes: {
    style: {
      control: 'select',
      options: ['default', 'success', 'danger', 'warning', 'info'],
      description: 'Toast style',
    },
    title: {
      control: 'text',
      description: 'Toast title',
    },
    text: {
      control: 'text',
      description: 'Toast text',
    },
    dismissable: {
      control: 'boolean',
      description: 'Dismissable state',
    },
    delay: {
      control: 'number',
      description: 'Auto-dismiss delay in milliseconds (0 to disable)',
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description: 'Toast position',
    },
  },
  args: {
    style: 'info',
    title: 'Interactive Toast',
    text: 'This is an interactive toast. Check the console for callbacks.',
    dismissable: true,
    delay: 5000,
    position: 'top-right',
  },
};

