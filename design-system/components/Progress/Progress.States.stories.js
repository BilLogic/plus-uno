/**
 * Progress States Stories
 * State variants: default, with label, custom label, striped, animated
 */

import { createProgress } from "../index.js";

export default {
  title: 'Components/Progress/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Progress bar state variants: default, with percentage label, with custom label, striped pattern, and animated stripes.',
      },
    },
  },
};

/**
 * Default
 * Standard progress bar without label
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'primary' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * With Label
 * Progress bar displaying percentage value
 */
export const WithLabel = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 75, size: 'medium', style: 'primary', showLabel: true });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Custom Label
 * Progress bar with custom label text
 */
export const CustomLabel = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'success', label: 'Uploading files...' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Striped
 * Progress bar with striped pattern
 */
export const Striped = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 65, size: 'medium', style: 'primary', striped: true });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Animated
 * Progress bar with animated stripes (requires striped)
 */
export const Animated = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 80, size: 'medium', style: 'primary', striped: true, animated: true });
    container.appendChild(progress);
    return container;
  },
};

/**
 * All States
 * Shows all state variants together
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    // Default
    const defaultProgress = createProgress({ value: 50, size: 'medium', style: 'primary' });
    container.appendChild(defaultProgress);
    
    // With Label
    const withLabel = createProgress({ value: 75, size: 'medium', style: 'primary', showLabel: true });
    container.appendChild(withLabel);
    
    // Custom Label
    const customLabel = createProgress({ value: 50, size: 'medium', style: 'success', label: 'Uploading files...' });
    container.appendChild(customLabel);
    
    // Striped
    const striped = createProgress({ value: 65, size: 'medium', style: 'primary', striped: true });
    container.appendChild(striped);
    
    // Animated
    const animated = createProgress({ value: 80, size: 'medium', style: 'primary', striped: true, animated: true });
    container.appendChild(animated);
    
    return container;
  },
};


