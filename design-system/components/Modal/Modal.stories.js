/**
 * Modal Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Modals are **Modal** components (dialog windows) used to overlay the main content for lightboxes, user notifications, or completely custom content.
 * 
 * ### Modal Structure
 * - **Header**: Contains title and close button
 * - **Divider**: Separates header from body
 * - **Body**: Main content area (can be scrollable)
 * - **Divider** (optional): Separates body from footer (only shown when buttons are present)
 * - **Footer** (optional): Contains action buttons
 * 
 * ### When to Use
 * - **Confirmation dialogs**: Ask users to confirm actions
 * - **Form inputs**: Collect user information in a focused context
 * - **Notifications**: Display important messages or alerts
 * - **Content previews**: Show detailed content without leaving the page
 * - **User feedback**: Collect feedback or ratings
 * 
 * ### Implementation Context
 * - **Component Type**: Modal (uses `modal-` tokens)
 * - **Modal Container Token Usage**: 
 *   - Padding: `--size-modal-pad-x-sm/md/lg`, `--size-modal-pad-y-sm/md/lg`
 *   - Gap: `--size-modal-gap-sm/md/lg` (for spacing between major sections)
 *   - Radius: `--size-modal-radius-sm/md/lg` (6px default)
 *   - Surface: `--color-surface-container-high` for background
 *   - Content: `--color-on-surface` for text
 * - **Typography Token Usage**:
 *   - **Modal Title**: Uses `.h5` class (typography tokens: `--font-size-h5` = 20px, `--font-family-title` = Lato, `--font-weight-title` = SemiBold, `--font-line-height-h5` = 1.4)
 *   - **Modal Body**: Uses `.body1-txt` class (typography tokens: `--font-size-body1` = 16px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = Light, `--font-line-height-body1` = 1.5)
 * - **Component Dependencies**:
 *   - **Buttons**: Uses the **Button component** (`createButton` from `button.js`)
 *     - Primary button: typically filled, primary style
 *     - Secondary button: typically tonal, secondary style
 *     - See `Molecules/Button` documentation for complete Button token usage
 * 
 * ### Type Variants
 * - **Default**: Fixed height body (64px), suitable for short content
 * - **Scrollable**: Flexible height body with scrollbar, suitable for long content
 * 
 * ### Button Variants
 * - **With Buttons**: Shows footer with primary and/or secondary buttons
 * - **Without Buttons**: No footer section
 * 
 * ### Best Practices
 * - Use default type for short, simple content
 * - Use scrollable type for long content that may overflow
 * - Always provide a close button in the header
 * - Use clear, action-oriented button labels
 * - Keep modal content focused and concise
 * - Ensure sufficient contrast for accessibility
 * 
 * See design-system/components/overview.md for Modal Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 * See Molecules/Button for Button component documentation
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Modal',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal components are dialog windows that overlay the main content for lightboxes, user notifications, or completely custom content. Modals support two types (default and scrollable) and can optionally include action buttons in the footer.',
      },
    },
  },
};

/**
 * Overview
 * Shows all modal variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Content Section
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentHeading = document.createElement('div');
    contentHeading.className = 'h5';
    contentHeading.textContent = 'Content';
    contentHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentHeading);
    
    const defaultModal = PlusInterface.createModal({
      title: 'Modal title',
      body: 'Modal body text goes here.',
      type: 'default',
      showBottomButtons: false,
    });
    contentSection.appendChild(defaultModal);
    container.appendChild(contentSection);
    
    return container;
  },
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 * Based on Figma Properties: Type and Bottom Button
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const modal = PlusInterface.createModal({
      id: 'interactive-modal',
      title: 'Modal title',
      body: 'Modal body text goes here.',
      type: args.type,
      showBottomButtons: args.showBottomButtons,
      primaryButton: args.showBottomButtons ? {
        text: 'Primary',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => console.log('Primary clicked')
      } : null,
      secondaryButton: args.showBottomButtons ? {
        text: 'Secondary',
        style: 'secondary',
        fill: 'tonal',
        size: 'default',
        onClick: () => console.log('Secondary clicked')
      } : null,
      onClose: () => console.log('Close clicked')
    });
    
    container.appendChild(modal);
    return container;
  },
  args: {
    type: 'default',
    showBottomButtons: true
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['default', 'scrollable'],
      description: 'The modal component has 2 types: default and scrollable'
    },
    showBottomButtons: {
      control: 'boolean',
      description: 'Toggle the bottom button switch to add/remove the buttons at the bottom of the modal'
    }
  }
};

