/**
 * Button Vertical States Stories
 * 
 * Shows all interactive states for vertical outlined buttons.
 * States include: rest (default), hover, pressed, focus, disabled
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Vertical/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Vertical button states show how vertical outlined buttons respond to user interaction.',
      },
    },
  },
};

/**
 * All Vertical Button States
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
      const stateSection = document.createElement('div');
      stateSection.style.display = 'flex';
      stateSection.style.flexDirection = 'column';
      stateSection.style.gap = 'var(--size-card-gap-md)';
      
      const stateLabel = document.createElement('div');
      stateLabel.className = 'h6';
      stateLabel.textContent = state.name;
      stateLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      stateSection.appendChild(stateLabel);
      
      const sizesRow = document.createElement('div');
      sizesRow.style.display = 'flex';
      sizesRow.style.flexWrap = 'wrap';
      sizesRow.style.alignItems = 'flex-start';
      sizesRow.style.gap = 'var(--size-card-gap-md)';
      
      const sizes = ['small', 'default', 'large'];
      sizes.forEach((size) => {
        const buttonWrapper = document.createElement('div');
        buttonWrapper.style.display = 'inline-block';
        
        const button = PlusInterface.createButton({
          btnText: 'Button',
          btnStyle: 'primary',
          btnFill: 'outline',
          btnSize: size,
          verticalLayout: true,
          enabled: state.enabled,
          icon: 'icons',
          trailingIcon: 'square-plus',
        });
        
        if (state.stateClass) {
          button.classList.add(state.stateClass);
          button.style.pointerEvents = 'none';
        }
        
        buttonWrapper.appendChild(button);
        sizesRow.appendChild(buttonWrapper);
      });
      
      stateSection.appendChild(sizesRow);
      container.appendChild(stateSection);
    });
    
    return container;
  },
};

/**
 * Rest (Default) State
 * Shows vertical button in default/rest state
 */
export const Rest = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default',
      verticalLayout: true,
      enabled: true,
      icon: 'icons',
      trailingIcon: 'square-plus',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Hover State
 * Shows vertical button in hover state with elevation shadow
 */
export const Hover = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default',
      verticalLayout: true,
      enabled: true,
      icon: 'icons',
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
 * Shows vertical button in pressed state
 */
export const Pressed = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default',
      verticalLayout: true,
      enabled: true,
      icon: 'icons',
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
 * Shows vertical button in focus state with border
 */
export const Focus = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default',
      verticalLayout: true,
      enabled: true,
      icon: 'icons',
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
 * Shows vertical button in disabled state
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default',
      verticalLayout: true,
      enabled: false,
      icon: 'icons',
      trailingIcon: 'square-plus',
    });
    
    container.appendChild(button);
    return container;
  },
};

