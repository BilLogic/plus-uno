export default {
  title: 'Styles/Typography',
  tags: ['autodocs'],
};

/**
 * All Variants
 * Shows all typography scales organized by category
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    // Display scales
    const displayContainer = document.createElement('div');
    displayContainer.style.display = 'flex';
    displayContainer.style.flexDirection = 'column';
    displayContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const displayLabel = document.createElement('div');
    displayLabel.className = 'h6';
    displayLabel.textContent = 'Display';
    displayContainer.appendChild(displayLabel);
    
    ['display1-txt', 'display2-txt', 'display3-txt', 'display4-txt'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      element.textContent = className.replace('-txt', '').replace('display', 'Display ').toUpperCase();
      displayContainer.appendChild(element);
    });
    container.appendChild(displayContainer);
    
    // Headline scales
    const headlineContainer = document.createElement('div');
    headlineContainer.style.display = 'flex';
    headlineContainer.style.flexDirection = 'column';
    headlineContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const headlineLabel = document.createElement('div');
    headlineLabel.className = 'h6';
    headlineLabel.textContent = 'Headlines';
    headlineContainer.appendChild(headlineLabel);
    
    ['h1', 'h2', 'h3'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      element.textContent = `Headline ${className.charAt(1)}`;
      headlineContainer.appendChild(element);
    });
    container.appendChild(headlineContainer);
    
    // Title scales
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.flexDirection = 'column';
    titleContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const titleLabel = document.createElement('div');
    titleLabel.className = 'h6';
    titleLabel.textContent = 'Titles';
    titleContainer.appendChild(titleLabel);
    
    ['h4', 'h5', 'h6'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      element.textContent = `Title ${className.charAt(1)}`;
      titleContainer.appendChild(element);
    });
    container.appendChild(titleContainer);
    
    // Body scales
    const bodyContainer = document.createElement('div');
    bodyContainer.style.display = 'flex';
    bodyContainer.style.flexDirection = 'column';
    bodyContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const bodyLabel = document.createElement('div');
    bodyLabel.className = 'h6';
    bodyLabel.textContent = 'Body Text';
    bodyContainer.appendChild(bodyLabel);
    
    ['body1-txt', 'body2-txt', 'body3-txt'].forEach((className) => {
      const element = document.createElement('div');
      element.className = className;
      const label = className.replace('-txt', '').replace('body', 'Body ').toUpperCase();
      element.textContent = `${label} text - ${label === 'BODY 2' ? 'Default body text size' : label === 'BODY 1' ? 'Larger body text for important content' : 'Smaller body text for captions'}`;
      bodyContainer.appendChild(element);
    });
    container.appendChild(bodyContainer);
    
    return container;
  },
};

/**
 * Typography Scales
 * Detailed breakdown of each typography scale
 */
export const TypographyScales = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    const scales = [
      {
        category: 'Display',
        description: 'Largest text for hero sections, landing pages, or prominent headings',
        fontFamily: 'Lato',
        examples: [
          { class: 'display1-txt', label: 'Display 1', size: '5rem (80px)' },
          { class: 'display2-txt', label: 'Display 2', size: '4.5rem (72px)' },
          { class: 'display3-txt', label: 'Display 3', size: '4rem (64px)' },
          { class: 'display4-txt', label: 'Display 4', size: '3.5rem (56px)' },
        ],
      },
      {
        category: 'Headlines',
        description: 'Main headings for page sections and important content',
        fontFamily: 'Lato',
        examples: [
          { class: 'h1', label: 'H1', size: '2.5rem (40px)', weight: 'Bold (700)' },
          { class: 'h2', label: 'H2', size: '2rem (32px)', weight: 'Bold (700)' },
          { class: 'h3', label: 'H3', size: '1.75rem (28px)', weight: 'Bold (700)' },
        ],
      },
      {
        category: 'Titles',
        description: 'Subheadings for subsections and card titles',
        fontFamily: 'Lato',
        examples: [
          { class: 'h4', label: 'H4', size: '1.5rem (24px)', weight: 'Semibold (600)' },
          { class: 'h5', label: 'H5', size: '1.25rem (20px)', weight: 'Semibold (600)' },
          { class: 'h6', label: 'H6', size: '1rem (16px)', weight: 'Semibold (600)' },
        ],
      },
      {
        category: 'Body',
        description: 'Content text for paragraphs, descriptions, and general content',
        fontFamily: 'Merriweather Sans / Open Sans',
        examples: [
          { class: 'body1-txt', label: 'Body 1', size: '1rem (16px)', weight: 'Normal (300)' },
          { class: 'body2-txt', label: 'Body 2', size: '0.875rem (14px)', weight: 'Normal (300)' },
          { class: 'body3-txt', label: 'Body 3', size: '0.75rem (12px)', weight: 'Normal (300)' },
        ],
      },
    ];
    
    scales.forEach((scale) => {
      const scaleSection = document.createElement('div');
      scaleSection.style.display = 'flex';
      scaleSection.style.flexDirection = 'column';
      scaleSection.style.gap = 'var(--size-element-gap-md)';
      scaleSection.style.marginBottom = 'var(--size-section-pad-y-md)';
      scaleSection.style.padding = 'var(--size-section-pad-y-md)';
      scaleSection.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
      scaleSection.style.borderRadius = 'var(--size-element-radius-md)';
      
      const categoryTitle = document.createElement('h3');
      categoryTitle.className = 'h4';
      categoryTitle.textContent = scale.category;
      scaleSection.appendChild(categoryTitle);
      
      const categoryDesc = document.createElement('p');
      categoryDesc.className = 'body2-txt';
      categoryDesc.textContent = scale.description;
      categoryDesc.style.marginBottom = 'var(--size-element-gap-sm)';
      scaleSection.appendChild(categoryDesc);
      
      const fontInfo = document.createElement('div');
      fontInfo.className = 'body3-txt';
      fontInfo.style.color = 'var(--color-on-surface-variant)';
      fontInfo.textContent = `Font Family: ${scale.fontFamily}`;
      fontInfo.style.marginBottom = 'var(--size-element-gap-md)';
      scaleSection.appendChild(fontInfo);
      
      scale.examples.forEach((example) => {
        const exampleWrapper = document.createElement('div');
        exampleWrapper.style.display = 'flex';
        exampleWrapper.style.flexDirection = 'column';
        exampleWrapper.style.gap = 'var(--size-element-gap-xs)';
        exampleWrapper.style.marginBottom = 'var(--size-element-gap-md)';
        
        const exampleElement = document.createElement('div');
        exampleElement.className = example.class;
        exampleElement.textContent = `${example.label} - ${example.label === 'Display 1' ? 'The quick brown fox jumps over the lazy dog' : example.label.startsWith('H') ? 'Heading Example' : 'Body text example for content and descriptions'}`;
        exampleWrapper.appendChild(exampleElement);
        
        const exampleInfo = document.createElement('div');
        exampleInfo.className = 'body3-txt';
        exampleInfo.style.color = 'var(--color-on-surface-variant)';
        exampleInfo.style.fontFamily = 'monospace';
        exampleInfo.style.fontSize = '0.75rem';
        const infoParts = [`${example.class}`, `Size: ${example.size}`];
        if (example.weight) {
          infoParts.push(`Weight: ${example.weight}`);
        }
        exampleInfo.textContent = infoParts.join(' • ');
        exampleWrapper.appendChild(exampleInfo);
        
        scaleSection.appendChild(exampleWrapper);
      });
      
      container.appendChild(scaleSection);
    });
    
    return container;
  },
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

