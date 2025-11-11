/**
 * Typography Atom Stories
 * Basic text elements: display, headlines, titles, body text
 */

export default {
  title: 'Atoms/Typography',
  tags: ['autodocs'],
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
      description: 'Text size class',
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
      description: 'Text color class',
    },
    text: {
      control: 'text',
      description: 'Text content',
    },
  },
};

/**
 * Display Text Stories
 */
export const Display1 = {
  render: (args) => {
    const element = document.createElement('div');
    element.className = `display1-txt ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Display 1 Text';
    return element;
  },
  args: {
    textSize: 'display1-txt',
    textColor: 'default',
    text: 'Display 1 Text',
  },
};

export const Display2 = {
  render: (args) => {
    const element = document.createElement('div');
    element.className = `display2-txt ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Display 2 Text';
    return element;
  },
  args: {
    textSize: 'display2-txt',
    textColor: 'default',
    text: 'Display 2 Text',
  },
};

export const Display3 = {
  render: (args) => {
    const element = document.createElement('div');
    element.className = `display3-txt ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Display 3 Text';
    return element;
  },
  args: {
    textSize: 'display3-txt',
    textColor: 'default',
    text: 'Display 3 Text',
  },
};

export const Display4 = {
  render: (args) => {
    const element = document.createElement('div');
    element.className = `display4-txt ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Display 4 Text';
    return element;
  },
  args: {
    textSize: 'display4-txt',
    textColor: 'default',
    text: 'Display 4 Text',
  },
};

/**
 * Headline Stories
 */
export const Headline1 = {
  render: (args) => {
    const element = document.createElement('h1');
    element.className = `h1 ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Headline 1';
    return element;
  },
  args: {
    textSize: 'h1',
    textColor: 'default',
    text: 'Headline 1',
  },
};

export const Headline2 = {
  render: (args) => {
    const element = document.createElement('h2');
    element.className = `h2 ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Headline 2';
    return element;
  },
  args: {
    textSize: 'h2',
    textColor: 'default',
    text: 'Headline 2',
  },
};

export const Headline3 = {
  render: (args) => {
    const element = document.createElement('h3');
    element.className = `h3 ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Headline 3';
    return element;
  },
  args: {
    textSize: 'h3',
    textColor: 'default',
    text: 'Headline 3',
  },
};

/**
 * Title Stories
 */
export const Title1 = {
  render: (args) => {
    const element = document.createElement('h4');
    element.className = `h4 ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Title 1';
    return element;
  },
  args: {
    textSize: 'h4',
    textColor: 'default',
    text: 'Title 1',
  },
};

export const Title2 = {
  render: (args) => {
    const element = document.createElement('h5');
    element.className = `h5 ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Title 2';
    return element;
  },
  args: {
    textSize: 'h5',
    textColor: 'default',
    text: 'Title 2',
  },
};

export const Title3 = {
  render: (args) => {
    const element = document.createElement('h6');
    element.className = `h6 ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Title 3';
    return element;
  },
  args: {
    textSize: 'h6',
    textColor: 'default',
    text: 'Title 3',
  },
};

/**
 * Body Text Stories
 */
export const Body1 = {
  render: (args) => {
    const element = document.createElement('div');
    element.className = `body1-txt ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Body 1 text - Larger body text for important content';
    return element;
  },
  args: {
    textSize: 'body1-txt',
    textColor: 'default',
    text: 'Body 1 text - Larger body text for important content',
  },
};

export const Body2 = {
  render: (args) => {
    const element = document.createElement('div');
    element.className = `body2-txt ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Body 2 text - Default body text size';
    return element;
  },
  args: {
    textSize: 'body2-txt',
    textColor: 'default',
    text: 'Body 2 text - Default body text size',
  },
};

export const Body3 = {
  render: (args) => {
    const element = document.createElement('div');
    element.className = `body3-txt ${args.textColor !== 'default' ? args.textColor : ''}`;
    element.textContent = args.text || 'Body 3 text - Smaller body text for captions';
    return element;
  },
  args: {
    textSize: 'body3-txt',
    textColor: 'default',
    text: 'Body 3 text - Smaller body text for captions',
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
    container.style.gap = '1rem';
    
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
  },
};

