/**
 * Button States Stories
 * 
 * Shows all 5 interactive states for filled buttons.
 * States include: rest (default), hover, pressed, focus, disabled
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button states show how buttons respond to user interaction. Hover, focus, and pressed states are CSS-driven and appear on user interaction.',
      },
    },
  },
};

/**
 * All Button States
 * Shows all 5 states: rest (default), hover, pressed, focus, disabled
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const states = [
      { name: 'Rest (Default)', stateClass: '', enabled: true },
      { name: 'Hover', stateClass: 'pbtn-state-hover', enabled: true },
      { name: 'Pressed', stateClass: 'pbtn-state-pressed', enabled: true },
      { name: 'Focus', stateClass: 'pbtn-state-focus', enabled: true },
      { name: 'Disabled', stateClass: '', enabled: false },
    ];
    
    states.forEach((state) => {
      const stateRow = document.createElement('div');
      stateRow.style.display = 'flex';
      stateRow.style.flexDirection = 'column';
      stateRow.style.gap = 'var(--size-element-gap-xs)';
      
      const stateLabel = document.createElement('div');
      stateLabel.className = 'h6';
      stateLabel.textContent = state.name;
      stateRow.appendChild(stateLabel);
      
      const buttonWrapper = document.createElement('div');
      buttonWrapper.style.display = 'inline-block';
      
      const button = PlusInterface.createButton({
        btnText: 'Button',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        enabled: state.enabled,
        icon: 'square-plus',
        trailingIcon: 'square-plus',
      });
      
      if (state.stateClass) {
        button.classList.add(state.stateClass);
        // Disable pointer events so the static state is always visible
        button.style.pointerEvents = 'none';
      }
      
      buttonWrapper.appendChild(button);
      stateRow.appendChild(buttonWrapper);
      container.appendChild(stateRow);
    });
    
    return container;
  },
};

/**
 * Rest (Default) State
 * Shows button in default/rest state
 */
export const Rest = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true,
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Hover State
 * Shows button in hover state with elevation shadow
 */
export const Hover = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true,
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    
    button.classList.add('pbtn-state-hover');
    button.style.pointerEvents = 'none';
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Pressed State
 * Shows button in pressed state
 */
export const Pressed = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true,
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    
    button.classList.add('pbtn-state-pressed');
    button.style.pointerEvents = 'none';
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Focus State
 * Shows button in focus state with border
 */
export const Focus = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true,
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    
    button.classList.add('pbtn-state-focus');
    button.style.pointerEvents = 'none';
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Disabled State
 * Shows button in disabled state
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false,
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    
    container.appendChild(button);
    return container;
  },
};

