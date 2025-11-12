/**
 * Typography Atom Stories
 * 
 * ## Usage and Implementation
 * 
 * Typography is the foundation of text presentation in the PLUS design system.
 * It provides consistent text styling across all components and content.
 * 
 * ### When to Use
 * - **Display**: For hero sections, landing pages, or prominent headings
 * - **Headlines (H1-H3)**: For main page headings and section titles
 * - **Titles (H4-H6)**: For subsection headings and card titles
 * - **Body Text**: For paragraphs, descriptions, and general content
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses typography tokens)
 * - **Token Usage**: 
 *   - Font families: `--font-family-header` (Lato) for headings, `--font-family-body` for body text
 *   - Font sizes: `--font-size-display1/2/3/4`, `--font-size-h1-h6`, `--font-size-body1/2/3`
 *   - Line heights: `--font-line-height-*` for each scale
 *   - Letter spacing: `--font-letter-spacing-*` for display scales
 *   - Font weights: `--font-weight-normal` (300), `--font-weight-semibold-2` (600), `--font-weight-bold` (700)
 * 
 * ### Typography Scales
 * - **Display (Display 1-4)**: Largest text for hero sections (Lato, 3.5rem - 5rem)
 * - **Headlines (H1-H3)**: Main headings (Lato, Bold, 1.75rem - 2.5rem)
 * - **Titles (H4-H6)**: Subheadings (Lato, Semibold, 1rem - 1.5rem)
 * - **Body (Body 1-3)**: Content text (Merriweather Sans/Open Sans, Normal, 0.75rem - 1rem)
 * 
 * ### Color Variants
 * Typography can use semantic color classes:
 * - Default (on-surface color)
 * - Primary, Secondary, Tertiary
 * - Success, Info, Warning, Error
 * 
 * ### Best Practices
 * - Use display scales sparingly for maximum impact
 * - Maintain clear hierarchy (display > headline > title > body)
 * - Match typography scale to content importance
 * - Use body2 as default for most content
 * - Ensure sufficient contrast for accessibility
 * - Use semantic colors to reinforce meaning
 * - Maintain consistent spacing around text elements
 * 
 * See docs/guidelines/token-reference.md for Token Reference
 * See docs/DESIGN_TOKENS.md for Design Tokens Documentation
 */

export default {
  title: 'Atoms/Typography',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Typography system providing consistent text styling. Includes display, headline, title, and body scales with multiple sizes and color variants.',
      },
    },
  },
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
