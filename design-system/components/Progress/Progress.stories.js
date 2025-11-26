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
 * All Variants
 * Shows all progress bar combinations: sizes, styles, and states
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Size Variants
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-element-gap-md)';
    
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h6';
    sizesLabel.textContent = 'Size Variants';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesLabel);
    
    const small = createProgress({ value: 50, size: 'small', style: 'primary' });
    sizesSection.appendChild(small);
    
    const medium = createProgress({ value: 50, size: 'medium', style: 'primary' });
    sizesSection.appendChild(medium);
    
    const large = createProgress({ value: 50, size: 'large', style: 'primary' });
    sizesSection.appendChild(large);
    
    container.appendChild(sizesSection);
    
    // Style Variants
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-element-gap-md)';
    
    const stylesLabel = document.createElement('div');
    stylesLabel.className = 'h6';
    stylesLabel.textContent = 'Style Variants';
    stylesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesLabel);
    
    const primary = createProgress({ value: 60, style: 'primary' });
    stylesSection.appendChild(primary);
    
    const secondary = createProgress({ value: 60, style: 'secondary' });
    stylesSection.appendChild(secondary);
    
    const success = createProgress({ value: 60, style: 'success' });
    stylesSection.appendChild(success);
    
    const danger = createProgress({ value: 60, style: 'danger' });
    stylesSection.appendChild(danger);
    
    const warning = createProgress({ value: 60, style: 'warning' });
    stylesSection.appendChild(warning);
    
    const info = createProgress({ value: 60, style: 'info' });
    stylesSection.appendChild(info);
    
    container.appendChild(stylesSection);
    
    // State Variants
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-element-gap-md)';
    
    const statesLabel = document.createElement('div');
    statesLabel.className = 'h6';
    statesLabel.textContent = 'State Variants';
    statesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesLabel);
    
    const withLabel = createProgress({ value: 75, style: 'primary', showLabel: true });
    statesSection.appendChild(withLabel);
    
    const customLabel = createProgress({ value: 50, style: 'success', label: 'Uploading...' });
    statesSection.appendChild(customLabel);
    
    const striped = createProgress({ value: 65, style: 'primary', striped: true });
    statesSection.appendChild(striped);
    
    const animated = createProgress({ value: 80, style: 'primary', striped: true, animated: true });
    statesSection.appendChild(animated);
    
    container.appendChild(statesSection);
    
    // Value Examples
    const valuesSection = document.createElement('div');
    valuesSection.style.display = 'flex';
    valuesSection.style.flexDirection = 'column';
    valuesSection.style.gap = 'var(--size-element-gap-md)';
    
    const valuesLabel = document.createElement('div');
    valuesLabel.className = 'h6';
    valuesLabel.textContent = 'Value Examples';
    valuesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    valuesSection.appendChild(valuesLabel);
    
    const zero = createProgress({ value: 0, style: 'primary' });
    valuesSection.appendChild(zero);
    
    const quarter = createProgress({ value: 25, style: 'primary' });
    valuesSection.appendChild(quarter);
    
    const half = createProgress({ value: 50, style: 'primary' });
    valuesSection.appendChild(half);
    
    const threeQuarter = createProgress({ value: 75, style: 'primary' });
    valuesSection.appendChild(threeQuarter);
    
    const full = createProgress({ value: 100, style: 'success' });
    valuesSection.appendChild(full);
    
    container.appendChild(valuesSection);
    
    return container;
  },
};

/**
 * Size Variants
 * Shows different size options
 */
export const SizeVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    
    const small = createProgress({ value: 50, size: 'small', style: 'primary' });
    const smallLabel = document.createElement('div');
    smallLabel.className = 'body2-txt';
    smallLabel.textContent = 'Small (4px)';
    smallLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    
    const medium = createProgress({ value: 50, size: 'medium', style: 'primary' });
    const mediumLabel = document.createElement('div');
    mediumLabel.className = 'body2-txt';
    mediumLabel.textContent = 'Medium (6px)';
    mediumLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    
    const large = createProgress({ value: 50, size: 'large', style: 'primary' });
    const largeLabel = document.createElement('div');
    largeLabel.className = 'body2-txt';
    largeLabel.textContent = 'Large (8px)';
    largeLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    
    container.appendChild(smallLabel);
    container.appendChild(small);
    container.appendChild(mediumLabel);
    container.appendChild(medium);
    container.appendChild(largeLabel);
    container.appendChild(large);
    
    return container;
  },
};

/**
 * Style Variants
 * Shows different color/style options
 */
export const StyleVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'];
    
    styles.forEach(style => {
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      container.appendChild(label);
      
      const progress = createProgress({ value: 60, style: style });
      container.appendChild(progress);
    });
    
    return container;
  },
};

/**
 * States
 * Shows different state variants
 */
export const States = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    
    const withLabel = createProgress({ value: 75, style: 'primary', showLabel: true });
    const withLabelText = document.createElement('div');
    withLabelText.className = 'body2-txt';
    withLabelText.textContent = 'With percentage label';
    withLabelText.style.marginBottom = 'var(--size-element-gap-xs)';
    
    const customLabel = createProgress({ value: 50, style: 'success', label: 'Uploading files...' });
    const customLabelText = document.createElement('div');
    customLabelText.className = 'body2-txt';
    customLabelText.textContent = 'With custom label';
    customLabelText.style.marginBottom = 'var(--size-element-gap-xs)';
    
    const striped = createProgress({ value: 65, style: 'primary', striped: true });
    const stripedText = document.createElement('div');
    stripedText.className = 'body2-txt';
    stripedText.textContent = 'Striped';
    stripedText.style.marginBottom = 'var(--size-element-gap-xs)';
    
    const animated = createProgress({ value: 80, style: 'primary', striped: true, animated: true });
    const animatedText = document.createElement('div');
    animatedText.className = 'body2-txt';
    animatedText.textContent = 'Animated (striped)';
    animatedText.style.marginBottom = 'var(--size-element-gap-xs)';
    
    container.appendChild(withLabelText);
    container.appendChild(withLabel);
    container.appendChild(customLabelText);
    container.appendChild(customLabel);
    container.appendChild(stripedText);
    container.appendChild(striped);
    container.appendChild(animatedText);
    container.appendChild(animated);
    
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





