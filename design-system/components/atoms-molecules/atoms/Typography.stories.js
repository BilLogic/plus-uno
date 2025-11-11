/**
 * Typography Atom Stories
 * Basic text elements: display, headlines, titles, body text
 */

export default {
  title: 'Atoms/Typography',
  tags: ['autodocs'],
};

/**
 * Display Text Stories
 */
export const Display1 = {
  render: () => {
    const element = document.createElement('div');
    element.className = 'display1-txt';
    element.textContent = 'Display 1 Text';
    return element;
  },
};

export const Display2 = {
  render: () => {
    const element = document.createElement('div');
    element.className = 'display2-txt';
    element.textContent = 'Display 2 Text';
    return element;
  },
};

export const Display3 = {
  render: () => {
    const element = document.createElement('div');
    element.className = 'display3-txt';
    element.textContent = 'Display 3 Text';
    return element;
  },
};

export const Display4 = {
  render: () => {
    const element = document.createElement('div');
    element.className = 'display4-txt';
    element.textContent = 'Display 4 Text';
    return element;
  },
};

/**
 * Headline Stories
 */
export const Headline1 = {
  render: () => {
    const element = document.createElement('h1');
    element.className = 'h1';
    element.textContent = 'Headline 1';
    return element;
  },
};

export const Headline2 = {
  render: () => {
    const element = document.createElement('h2');
    element.className = 'h2';
    element.textContent = 'Headline 2';
    return element;
  },
};

export const Headline3 = {
  render: () => {
    const element = document.createElement('h3');
    element.className = 'h3';
    element.textContent = 'Headline 3';
    return element;
  },
};

/**
 * Title Stories
 */
export const Title1 = {
  render: () => {
    const element = document.createElement('h4');
    element.className = 'h4';
    element.textContent = 'Title 1';
    return element;
  },
};

export const Title2 = {
  render: () => {
    const element = document.createElement('h5');
    element.className = 'h5';
    element.textContent = 'Title 2';
    return element;
  },
};

export const Title3 = {
  render: () => {
    const element = document.createElement('h6');
    element.className = 'h6';
    element.textContent = 'Title 3';
    return element;
  },
};

/**
 * Body Text Stories
 */
export const Body1 = {
  render: () => {
    const element = document.createElement('div');
    element.className = 'body1-txt';
    element.textContent = 'Body 1 text - Larger body text for important content';
    return element;
  },
};

export const Body2 = {
  render: () => {
    const element = document.createElement('div');
    element.className = 'body2-txt';
    element.textContent = 'Body 2 text - Default body text size';
    return element;
  },
};

export const Body3 = {
  render: () => {
    const element = document.createElement('div');
    element.className = 'body3-txt';
    element.textContent = 'Body 3 text - Smaller body text for captions';
    return element;
  },
};

/**
 * Color Variations
 */
export const ColorVariations = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const colors = [
      { class: '', label: 'Default' },
      { class: 'color-primary', label: 'Primary' },
      { class: 'color-secondary', label: 'Secondary' },
      { class: 'color-neutral', label: 'Neutral' },
      { class: 'color-success', label: 'Success' },
      { class: 'color-info', label: 'Info' },
      { class: 'color-warning', label: 'Warning' },
      { class: 'color-error', label: 'Error' },
    ];
    
    colors.forEach((color) => {
      const element = document.createElement('div');
      element.className = `body2-txt ${color.class}`;
      element.textContent = `${color.label} text color`;
      container.appendChild(element);
    });
    
    return container;
  }
};

/**
 * Interactive Typography
 */
export const Interactive = {
  render: (args) => {
    const element = document.createElement('div');
    const sizeClass = args.textSize || 'body2-txt';
    const colorClass = args.textColor !== 'default' ? args.textColor : '';
    element.className = `${sizeClass} ${colorClass}`.trim();
    element.textContent = args.text || 'Interactive text';
    return element;
  },
  argTypes: {
    textSize: {
      control: 'select',
      options: [
        'display1-txt',
        'display2-txt',
        'display3-txt',
        'display4-txt',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'body1-txt',
        'body2-txt',
        'body3-txt',
      ],
      description: 'Text size class (uses typography tokens: --font-size-display1/2/3/4, --font-size-h1-h6, --font-size-body1/2/3)',
    },
    textColor: {
      control: 'select',
      options: [
        'default',
        'color-primary',
        'color-secondary',
        'color-neutral',
        'color-success',
        'color-info',
        'color-warning',
        'color-error',
      ],
      description: 'Text color class (uses color tokens: --color-primary, --color-secondary, etc.)',
    },
    text: {
      control: 'text',
      description: 'Text content',
    },
  },
  args: {
    textSize: 'body2-txt',
    textColor: 'default',
    text: 'Interactive text',
  },
};

