/**
 * Typography Scales Stories
 * Typography scale variants organized under "Scales" subcategory
 */

export default {
  title: 'Atoms/Typography/Scales',
  tags: ['autodocs'],
};

/**
 * Display Scales
 */
export const Display = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    ['display1-txt', 'display2-txt', 'display3-txt', 'display4-txt'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      element.textContent = className.replace('-txt', '').replace('display', 'Display ').toUpperCase();
      container.appendChild(element);
    });
    
    return container;
  },
};

/**
 * Headline Scales
 */
export const Headlines = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    ['h1', 'h2', 'h3'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      element.textContent = `Headline ${className.charAt(1)}`;
      container.appendChild(element);
    });
    
    return container;
  },
};

/**
 * Title Scales
 */
export const Titles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    ['h4', 'h5', 'h6'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      element.textContent = `Title ${className.charAt(1)}`;
      container.appendChild(element);
    });
    
    return container;
  },
};

/**
 * Body Scales
 */
export const Body = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    ['body1-txt', 'body2-txt', 'body3-txt'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      const label = className.replace('-txt', '').replace('body', 'Body ').toUpperCase();
      element.textContent = `${label} text - ${label === 'BODY 2' ? 'Default body text size' : label === 'BODY 1' ? 'Larger body text for important content' : 'Smaller body text for captions'}`;
      container.appendChild(element);
    });
    
    return container;
  },
};

