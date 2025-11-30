/**
 * Button Style Variants Stories
 * 
 * Shows all style (color) variants for filled buttons.
 * Style variants are the color tokens applied to buttons.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Style Variants',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Style variants are color tokens applied to buttons. Shows all available color styles for filled buttons.',
      },
    },
  },
};

/**
 * All Filled Button Styles
 * Shows all available color styles for filled buttons: primary, secondary, tertiary, default
 */
export const AllFilledButtonStyles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'default'];
    
    styles.forEach((style) => {
      const buttonWrapper = document.createElement('div');
      buttonWrapper.style.display = 'inline-block';
      
      const button = PlusInterface.createButton({
        btnText: style,
        btnStyle: style,
        btnFill: 'filled',
        btnSize: 'default',
      });
      
      buttonWrapper.appendChild(button);
      container.appendChild(buttonWrapper);
    });
    
    return container;
  },
};

/**
 * Primary Style
 * Shows primary filled button
 */
export const Primary = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Secondary Style
 * Shows secondary filled button
 */
export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'secondary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Tertiary Style
 * Shows tertiary filled button
 */
export const Tertiary = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'tertiary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Default Style
 * Shows default filled button
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'default',
      btnFill: 'filled',
      btnSize: 'default',
    });
    
    container.appendChild(button);
    return container;
  },
};

