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
 * - **Primary**: Default brand color for general information
 * - **Secondary**: Secondary brand color for alternative information
 * - **Success**: Green for positive confirmations or successful actions
 * - **Danger**: Red for errors or failed actions
 * - **Warning**: Yellow/orange for cautionary information
 * - **Info**: Blue for informational messages
 * 
 * ### Content Variants
 * - **With Title**: Includes a title/header above the message text
 * - **Without Title**: Message-only toasts for simpler notifications
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
 * - Use titles for important or complex messages
 * - Ensure sufficient contrast for accessibility
 * - Don't overuse toasts - reserve for truly non-intrusive notifications
 * 
 * See docs/guidelines/terminology.md for Modal Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';
import { createStaticToast } from '../../local/universal/elements/toast.js';

export default {
  title: 'Molecules/Toast',
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
 * All Style Variants
 * Shows all toast style variants with title and dismissible
 */
export const AllStyles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-card-gap-md)';
    
    const stylesLabel = document.createElement('div');
    stylesLabel.className = 'h6';
    stylesLabel.textContent = 'All Styles';
    stylesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesLabel);
    
    // Show all style variants directly (matching Figma order)
    const styles = [
      { value: 'default', label: 'Default' },
      { value: 'danger', label: 'Danger' },
      { value: 'success', label: 'Success' },
      { value: 'info', label: 'Info' },
      { value: 'warning', label: 'Warning' }
    ];
    
    styles.forEach((style) => {
      const toast = createStaticToast({
        style: style.value,
        title: 'Title',
        text: 'Hello, world! This is a toast message.',
        dismissable: true,
      });
      stylesSection.appendChild(toast);
    });
    
    container.appendChild(stylesSection);
    
    return container;
  },
};

/**
 * Content Variants
 * Shows different content configurations
 */
export const ContentVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentLabel = document.createElement('div');
    contentLabel.className = 'h6';
    contentLabel.textContent = 'Content Variants';
    contentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentLabel);
    
    // With title and dismissible
    const withTitle = createStaticToast({
      style: 'success',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true,
    });
    contentSection.appendChild(withTitle);
    
    // Non-dismissible (no close button)
    const nonDismissible = createStaticToast({
      style: 'info',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: false,
    });
    contentSection.appendChild(nonDismissible);
    
    container.appendChild(contentSection);
    
    return container;
  },
};

/**
 * Position Variants
 * Shows toasts with position labels (static display)
 */
export const PositionVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    
    const positionSection = document.createElement('div');
    positionSection.style.display = 'flex';
    positionSection.style.flexDirection = 'column';
    positionSection.style.gap = 'var(--size-card-gap-md)';
    
    const positionLabel = document.createElement('div');
    positionLabel.className = 'h6';
    positionLabel.textContent = 'Position Variants';
    positionLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    positionSection.appendChild(positionLabel);
    
    // Show toasts with position labels
    const positions = [
      { label: 'Top Right', value: 'top-right' },
      { label: 'Top Left', value: 'top-left' },
      { label: 'Bottom Right', value: 'bottom-right' },
      { label: 'Bottom Left', value: 'bottom-left' },
    ];
    
    positions.forEach((pos) => {
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      label.textContent = `${pos.label}:`;
      positionSection.appendChild(label);
      
      const toast = createStaticToast({
        style: 'default',
        title: 'Title',
        text: 'Hello, world! This is a toast message.',
        dismissable: true,
      });
      positionSection.appendChild(toast);
    });
    
    container.appendChild(positionSection);
    
    return container;
  },
};

/**
 * Auto-dismiss Delay
 * Shows toasts with different auto-dismiss delay configurations
 */
export const AutoDismissDelay = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    
    const delaySection = document.createElement('div');
    delaySection.style.display = 'flex';
    delaySection.style.flexDirection = 'column';
    delaySection.style.gap = 'var(--size-card-gap-md)';
    
    const delayLabel = document.createElement('div');
    delayLabel.className = 'h6';
    delayLabel.textContent = 'Auto-dismiss Delay Options';
    delayLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    delaySection.appendChild(delayLabel);
    
    // Show toasts with different delay configurations
    const delays = [
      { label: '2 seconds', value: 2000 },
      { label: '5 seconds (default)', value: 5000 },
      { label: '10 seconds', value: 10000 },
      { label: 'No auto-dismiss', value: 0 },
    ];
    
    delays.forEach((delay) => {
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      label.textContent = `${delay.label}:`;
      delaySection.appendChild(label);
      
      const toast = createStaticToast({
        style: 'info',
        title: 'Title',
        text: `This toast would ${delay.value === 0 ? 'not auto-dismiss' : `auto-dismiss in ${delay.label}`}.`,
        dismissable: true,
      });
      delaySection.appendChild(toast);
    });
    
    container.appendChild(delaySection);
    
    return container;
  },
};

/**
 * Stacked Toasts
 * Shows multiple toasts stacked together
 */
export const StackedToasts = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    
    const stackSection = document.createElement('div');
    stackSection.style.display = 'flex';
    stackSection.style.flexDirection = 'column';
    stackSection.style.gap = 'var(--size-card-gap-md)';
    
    const stackLabel = document.createElement('div');
    stackLabel.className = 'h6';
    stackLabel.textContent = 'Stacked Toasts';
    stackLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stackSection.appendChild(stackLabel);
    
    // Show multiple toasts stacked
    const firstToast = createStaticToast({
      style: 'success',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true,
    });
    stackSection.appendChild(firstToast);
    
    const secondToast = createStaticToast({
      style: 'info',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true,
    });
    stackSection.appendChild(secondToast);
    
    const thirdToast = createStaticToast({
      style: 'warning',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true,
    });
    stackSection.appendChild(thirdToast);
    
    container.appendChild(stackSection);
    
    return container;
  },
};

/**
 * Interactive Toast
 * Interactive playground for testing toast variations
 */
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
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
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

