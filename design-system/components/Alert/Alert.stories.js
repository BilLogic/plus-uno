/**
 * Alert Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Alerts are **Card** components used to display important messages, notifications, or feedback to users.
 * They provide contextual information, warnings, or confirmations that require user attention.
 * 
 * ### When to Use
 * - **Notifications**: Inform users about system status, updates, or changes
 * - **Warnings**: Alert users to potential issues or important information
 * - **Success messages**: Confirm successful actions or completed operations
 * - **Error messages**: Display error information or validation feedback
 * - **Information**: Provide helpful context or tips
 * - **Dismissible alerts**: For temporary messages that users can dismiss
 * 
 * ### Implementation Context
 * - **Component Type**: Card (uses `card-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-card-pad-x-sm/md/lg`, `--size-card-pad-y-sm/md/lg`
 *   - Gap: `--size-card-gap-sm/md/lg` (between title, text, and actions)
 *   - Radius: `--size-card-radius-sm/md`
 *   - Colors: `--color-primary`, `--color-secondary`, `--color-success`, `--color-danger`, `--color-warning`
 *   - Background: Uses container colors with appropriate contrast
 * 
 * ### Visual Style Variants
 * - **Primary**: Default brand color for general information
 * - **Secondary**: Secondary brand color for alternative information
 * - **Success**: Green for positive confirmations or successful actions
 * - **Danger**: Red for errors, critical warnings, or destructive actions
 * - **Warning**: Yellow/orange for cautionary information or warnings
 * 
 * ### Content Variants
 * - **With Title**: Includes a title above the message text
 * - **Without Title**: Message-only alerts for simpler notifications
 * - **Dismissible**: Includes a close button for user dismissal
 * - **Non-dismissible**: Persistent alerts that cannot be dismissed
 * 
 * ### Best Practices
 * - Use semantic color styles (success for positive, danger for errors)
 * - Keep messages concise and actionable
 * - Use titles for important or complex messages
 * - Make critical alerts non-dismissible
 * - Provide clear actions when appropriate
 * - Ensure sufficient contrast for accessibility
 * - Position alerts prominently but not intrusively
 * 
 * See design-system/components/overview.md for Card Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Alert',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Alert component for displaying important messages, notifications, or feedback. Supports multiple styles and content variants. Uses card-level tokens for spacing and layout.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all alert variants: styles and content configurations for comprehensive reference
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // All Styles (with title, dismissible)
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-card-gap-md)';
    
    const stylesLabel = document.createElement('div');
    stylesLabel.className = 'h6';
    stylesLabel.textContent = 'All Styles (With Title, Dismissible)';
    stylesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesLabel);
    
    const styles = ['primary', 'secondary', 'success', 'danger', 'warning'];
    styles.forEach((style) => {
      const alert = PlusInterface.createAlert({
        style: style,
        title: 'Title',
        text: 'You have a message here — come check it out!',
        dismissable: true,
      });
      stylesSection.appendChild(alert);
    });
    container.appendChild(stylesSection);
    
    // Content Variants (primary style)
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentLabel = document.createElement('div');
    contentLabel.className = 'h6';
    contentLabel.textContent = 'Content Variants (Primary Style)';
    contentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentLabel);
    
    // With title
    const withTitle = PlusInterface.createAlert({
      style: 'primary',
      title: 'Title',
      text: 'Alert with title and message text.',
      dismissable: true,
    });
    contentSection.appendChild(withTitle);
    
    // Without title
    const withoutTitle = PlusInterface.createAlert({
      style: 'primary',
      text: 'Alert without title — message only.',
      dismissable: true,
    });
    contentSection.appendChild(withoutTitle);
    
    // Non-dismissible
    const nonDismissible = PlusInterface.createAlert({
      style: 'primary',
      title: 'Non-dismissible Alert',
      text: 'This alert cannot be dismissed.',
      dismissable: false,
    });
    contentSection.appendChild(nonDismissible);
    
    container.appendChild(contentSection);
    
    return container;
  },
};

/**
 * Interactive Alert
 * Interactive playground for testing alert variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      onDismiss: () => {
        console.log('Alert dismissed!');
      },
    });
    container.appendChild(alert);
    return container;
  },
  argTypes: {
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Alert style',
    },
    title: {
      control: 'text',
      description: 'Alert title',
    },
    text: {
      control: 'text',
      description: 'Alert text',
    },
    dismissable: {
      control: 'boolean',
      description: 'Dismissable state',
    },
  },
  args: {
    style: 'info',
    title: 'Interactive Alert',
    text: 'This is an interactive alert. Check the console when dismissing.',
    dismissable: true,
  },
};
