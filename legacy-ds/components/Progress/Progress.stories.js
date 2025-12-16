/**
 * Progress Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Progress bars are **Element** components used to show the completion status of a task or process.
 * They provide visual feedback about the progress of an operation, such as file uploads, form completion, or data loading.
 * 
 * ### When to Use
 * - **Task completion**: Show progress of a task that takes time (e.g., file upload, data processing)
 * - **Form completion**: Display how much of a multi-step form has been completed
 * - **Loading states**: Show progress of data loading or content fetching
 * - **Achievement tracking**: Display progress toward a goal or milestone
 * - **Process indicators**: Show stages of a multi-step process
 * - **Resource usage**: Display usage of resources (e.g., storage, bandwidth)
 * 
 * ### When NOT to Use
 * - **Indeterminate loading**: Use a spinner or skeleton loader for unknown duration
 * - **Simple on/off states**: Use a switch or checkbox for binary states
 * - **Status indicators**: Use badges or status tags for status information
 * - **Percentage display only**: Use text or numbers if you only need to show a percentage without visual bar
 * 
 * ### Implementation Context
 * - **Component Type**: Element
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `progress` component pattern
 * - **Styling**: Customized with PLUS design tokens for colors, spacing, and typography
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/progress/
 * 
 * ### State Variants
 * - **Default**: Standard progress bar
 * - **Striped**: Progress bar with striped pattern
 * - **Animated**: Progress bar with animated stripes (requires striped)
 * - **With Label**: Progress bar displaying value or custom label
 * 
 * ### Style Variants
 * - **Primary**: Default blue progress bar
 * - **Secondary**: Secondary color progress bar
 * - **Tertiary**: Tertiary color progress bar
 * - **Success**: Green progress bar for successful operations
 * - **Danger**: Red progress bar for errors or warnings
 * - **Warning**: Yellow/orange progress bar for warnings
 * - **Info**: Info color progress bar
 * 
 * ### Size Variants
 * - **Small**: 4px height (compact UI)
 * - **Medium**: 6px height (default, standard UI)
 * - **Large**: 8px height (prominent UI)
 * 
 * ### Best Practices
 * - Always include ARIA attributes for accessibility (automatically set)
 * - Use appropriate colors for context (success for completion, danger for errors)
 * - Show labels when the value is meaningful to users
 * - Use striped/animated variants for long-running processes
 * - Update progress smoothly with transitions
 * - Provide text alternatives for screen readers
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { createProgress, updateProgress } from "../index.js";
import { AllSizes as ProgressAllSizes } from "./Progress.Sizes.stories.js";
import { AllColors as ProgressAllColors } from "./Progress.Colors.stories.js";
import { AllStates as ProgressAllStates } from "./Progress.States.stories.js";

export default {
  title: 'Components/Progress',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Progress bar component for displaying task completion status. Built on Bootstrap 4.6.2 progress component pattern with PLUS design token customizations.',
      },
    },
  },
};

/**
 * Overview
 * Shows all progress variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    const createSection = (title, contentRender) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const heading = document.createElement('div');
      heading.className = 'h5';
      heading.textContent = title;
      heading.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(heading);
      
      const content = contentRender();
      section.appendChild(content);
      return section;
    };
    
    // Sizes Section
    container.appendChild(createSection('Sizes', ProgressAllSizes.render));
    
    // Colors Section
    container.appendChild(createSection('Colors', ProgressAllColors.render));
    
    // States Section
    container.appendChild(createSection('States', ProgressAllStates.render));
    
    return container;
  },
};

/**
 * Interactive Progress
 * Interactive playground for testing progress variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    const progress = createProgress(args);
    container.appendChild(progress);
    
    // Add controls for interactive testing
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = 'var(--size-element-gap-sm)';
    controls.style.marginTop = 'var(--size-element-gap-md)';
    
    const updateButton = document.createElement('button');
    updateButton.className = 'btn btn-primary';
    updateButton.textContent = 'Update to 75%';
    updateButton.addEventListener('click', () => {
      updateProgress(progress, 75, 0, 100, args.showLabel);
    });
    controls.appendChild(updateButton);
    
    container.appendChild(controls);
    
    return container;
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value (0-100)',
    },
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'],
      description: 'Progress bar style',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Progress bar size',
    },
    striped: {
      control: 'boolean',
      description: 'Show striped pattern',
    },
    animated: {
      control: 'boolean',
      description: 'Animate stripes (requires striped)',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show percentage label',
    },
    label: {
      control: 'text',
      description: 'Custom label text',
    },
  },
  args: {
    value: 50,
    style: 'primary',
    size: 'medium',
    striped: false,
    animated: false,
    showLabel: false,
    label: null,
  },
};





