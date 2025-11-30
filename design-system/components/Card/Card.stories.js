/**
 * Card Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Cards are **Card** components (self-contained containers) used to display a related set of information and actions.
 * They help users quickly scan, compare, and interact with content. Cards are modular - each part can be added or removed.
 * 
 * ### Card Parts (Modular Components)
 * Each part can be added or removed independently:
 * - **Image/Media**: Optional image or media area at the top
 * - **Card Title**: Main title text (uses `.h5` typography class - Lato SemiBold, 20px)
 * - **Card Subtitle**: Secondary title text below main title (uses `.body3-txt` typography class - Merriweather Sans Light, 12px)
 * - **Body**: Main content text or HTML (uses `.body1-txt` typography class - Merriweather Sans Light, 16px)
 * - **Header**: Section header within the card (uses `.body1-txt` typography class - Merriweather Sans Light, 16px)
 * - **Items**: List of items with dividers (uses `.body1-txt` typography class - Merriweather Sans Light, 16px)
 * - **Footer**: Footer section text (uses `.body1-txt` typography class - Merriweather Sans Light, 16px)
 * - **Links**: One or more clickable links (uses `.body1-txt` typography class - Merriweather Sans Light, 16px)
 * - **Action Button**: Primary action button (uses the **Button component** - see Component Dependencies below)
 * 
 * ### When to Use
 * - **Product cards**: Display product information with images and actions
 * - **Profile cards**: Show user or profile information
 * - **Dashboard cards**: Display metrics, statistics, or key information
 * - **Content cards**: Present articles, posts, or content previews
 * - **Metric cards**: Show numerical data or KPIs
 * - **SMART cards**: Display SMART framework-related information with competency area styling
 * 
 * ### Implementation Context
 * - **Component Type**: Card (uses `card-` tokens)
 * - **Card Container Token Usage**: 
 *   - Padding: `--size-card-pad-x-sm/md/lg`, `--size-card-pad-y-sm/md/lg`
 *   - Gap: `--size-card-gap-sm/md/lg` (for spacing between major sections)
 *   - Radius: `--size-card-radius-sm/md` (12px default)
 *   - Border: `--size-card-border-sm/md/lg`
 *   - Surface: `--color-surface-container` for background
 *   - Content: `--color-on-surface` for text
 * - **Spacing Rules** (from Figma specs):
 *   - Card container: Top/Bottom 24px (`--size-card-pad-y-lg`), Left/Right 0px (elements handle their own horizontal padding)
 *   - Card content gap: 24px (`--size-card-pad-y-lg`) between major sections
 *   - Title padding: Top 12px (`--size-element-gap-lg`), Bottom 4px (`--size-element-gap-xs`), Left/Right 20px (`--size-card-pad-x-md`)
 *   - Subtitle padding: 4px (`--size-element-gap-xs`) top/bottom, 20px (`--size-card-pad-x-md`) left/right
 *   - Body padding: 12px (`--size-element-gap-lg`) top/bottom, 20px (`--size-card-pad-x-md`) left/right
 *   - Header padding: 16px (`--size-card-gap-md`) top/bottom, 20px (`--size-card-pad-x-md`) left/right
 *   - Items padding: 12px (`--size-element-gap-lg`) top/bottom, 20px (`--size-card-pad-x-md`) left/right
 *   - Footer padding: 16px (`--size-card-gap-md`) top/bottom, 20px (`--size-card-pad-x-md`) left/right
 *   - Links padding: 16px (`--size-card-gap-md`) top/bottom, 20px (`--size-card-pad-x-md`) left/right
 *   - Action Button padding: 12px (`--size-element-gap-lg`) top/bottom, 20px (`--size-card-pad-x-md`) left/right
 * - **Typography Token Usage**:
 *   - **Card Title**: Uses `.h5` class (typography tokens: `--font-size-h5` = 20px, `--font-family-title` = Lato, `--font-weight-title` = SemiBold, `--font-line-height-h5` = 1.4)
 *   - **Card Subtitle**: Uses `.body3-txt` class (typography tokens: `--font-size-body3` = 12px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = Light, `--font-line-height-body3` = 1.667)
 *   - **Card Body**: Uses `.body1-txt` class (typography tokens: `--font-size-body1` = 16px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = Light, `--font-line-height-body1` = 1.5)
 *   - **Card Header**: Uses `.body1-txt` class (typography tokens: `--font-size-body1` = 16px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = Light, `--font-line-height-body1` = 1.5)
 *   - **Card Items**: Uses `.body1-txt` class (typography tokens: `--font-size-body1` = 16px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = Light, `--font-line-height-body1` = 1.5)
 *   - **Card Footer Text**: Uses `.body1-txt` class (typography tokens: `--font-size-body1` = 16px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = Light, `--font-line-height-body1` = 1.5)
 *   - **Card Links**: Uses `.body1-txt` class (typography tokens: `--font-size-body1` = 16px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = Light, `--font-line-height-body1` = 1.5)
 * - **Component Dependencies**:
 *   - **Action Button**: Uses the **Button component** (`createButton` from `button.js`)
 *     - Button uses `element-` tokens for its own styling (padding, gap, radius, border)
 *     - Button uses Material Design 3 color tokens (`--color-primary`, `--color-on-primary`, etc.)
 *     - Button supports all Button variants: styles (primary, secondary, etc.), fills (filled, outline, tonal, text), sizes (small, default, large)
 *     - See `Molecules/Button` documentation for complete Button token usage
 * 
 * ### Size Variants
 * - **Small (sm)**: Compact cards for dense interfaces
 *   - Padding: 16px all sides
 *   - Gap: 8px
 * - **Medium (md)**: Standard size (default)
 *   - Padding: Top/Bottom 16px, Left/Right 24px
 *   - Gap: 16px
 * - **Large (lg)**: Spacious cards for content-rich layouts
 *   - Padding: 24px all sides
 *   - Gap: 32px
 * 
 * ### Best Practices
 * - Use appropriate padding size based on content density
 * - Match gap size to content hierarchy
 * - Use borders for cards that need visual separation
 * - Consider elevation/shadow for interactive cards
 * - Ensure sufficient contrast for accessibility
 * - Use consistent sizing within a section or layout
 * 
 * See design-system/components/overview.md for Card Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 * See Molecules/Button for Button component documentation (used for Action Button)
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Card',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Card components are self-contained containers that display related information and help users quickly scan, compare, and interact with content. Cards are modular - each part (image, title, subtitle, body, header, items, footer, links, button) can be added or removed independently.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all card combinations: different content configurations and sizes
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Basic card with title and body
    const basicCard = PlusInterface.createCard({
      title: 'Card Title',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      borderSize: 'sm',
      showBorder: true
    });
    container.appendChild(basicCard);
    
    // Card with image
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.style.width = '100%';
    imagePlaceholder.style.height = '200px';
    imagePlaceholder.style.display = 'flex';
    imagePlaceholder.style.alignItems = 'center';
    imagePlaceholder.style.justifyContent = 'center';
    imagePlaceholder.style.backgroundColor = 'var(--color-surface-variant)';
    imagePlaceholder.style.color = 'var(--color-on-surface-variant)';
    imagePlaceholder.textContent = 'Image cap';
    
    const cardWithImage = PlusInterface.createCard({
      image: imagePlaceholder,
      title: 'Card Title',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      borderSize: 'sm',
      showBorder: true
    });
    container.appendChild(cardWithImage);
    
    // Card with subtitle
    const cardWithSubtitle = PlusInterface.createCard({
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      borderSize: 'sm',
      showBorder: true
    });
    container.appendChild(cardWithSubtitle);
    
    // Card with action button
    const cardWithButton = PlusInterface.createCard({
      title: 'Card Title',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      actionButton: {
        text: 'Go somewhere',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => console.log('Button clicked')
      },
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      borderSize: 'sm',
      showBorder: true
    });
    container.appendChild(cardWithButton);
    
    // Card with links
    const cardWithLinks = PlusInterface.createCard({
      title: 'Card Title',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      links: [
        { text: 'Card link', href: '#', onClick: () => console.log('Link 1 clicked') },
        { text: 'Another link', href: '#', onClick: () => console.log('Link 2 clicked') }
      ],
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      borderSize: 'sm',
      showBorder: true
    });
    container.appendChild(cardWithLinks);
    
    // Card with items
    const cardWithItems = PlusInterface.createCard({
      title: 'Card Title',
      items: ['Item #1', 'Item #2', 'Item #3'],
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      borderSize: 'sm',
      showBorder: true
    });
    container.appendChild(cardWithItems);
    
    // Card with all elements
    const fullCard = PlusInterface.createCard({
      image: imagePlaceholder.cloneNode(true),
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      header: 'Header',
      items: ['Item #1', 'Item #2'],
      footer: 'Footer',
      links: [
        { text: 'Card link', href: '#' },
        { text: 'Another link', href: '#' }
      ],
      actionButton: {
        text: 'Action',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => console.log('Action clicked')
      },
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      borderSize: 'sm',
      showBorder: true
    });
    container.appendChild(fullCard);
    
    return container;
  },
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 */
export const Interactive = {
  render: (args) => {
    // Build card options based on args
    const cardOptions = {
      paddingSize: args.paddingSize || 'md',
      gapSize: args.gapSize || 'md',
      radiusSize: args.radiusSize || 'sm',
      borderSize: args.borderSize || 'sm',
      showBorder: args.showBorder !== false,
    };
    
    // Add image if enabled
    if (args.showImage) {
      const imagePlaceholder = document.createElement('div');
      imagePlaceholder.style.width = '100%';
      imagePlaceholder.style.height = '200px';
      imagePlaceholder.style.display = 'flex';
      imagePlaceholder.style.alignItems = 'center';
      imagePlaceholder.style.justifyContent = 'center';
      imagePlaceholder.style.backgroundColor = 'var(--color-surface-variant)';
      imagePlaceholder.style.color = 'var(--color-on-surface-variant)';
      imagePlaceholder.textContent = args.imageText || 'Image cap';
      cardOptions.image = imagePlaceholder;
    }
    
    // Add title if enabled
    if (args.showTitle) {
      cardOptions.title = args.title || 'Card Title';
    }
    
    // Add subtitle if enabled
    if (args.showSubtitle) {
      cardOptions.subtitle = args.subtitle || 'Card Subtitle';
    }
    
    // Add body if enabled
    if (args.showBody) {
      cardOptions.body = args.body || 'Some quick example text to build on the card title and make up the bulk of the card\'s content.';
    }
    
    // Add header if enabled
    if (args.showHeader) {
      cardOptions.header = args.header || 'Header';
    }
    
    // Add items if enabled
    if (args.showItems) {
      cardOptions.items = args.items ? args.items.split(',').map(item => item.trim()) : ['Item #1', 'Item #2', 'Item #3'];
    }
    
    // Add footer text if enabled
    if (args.showFooter) {
      cardOptions.footer = args.footer || 'Footer';
    }
    
    // Add links if enabled
    if (args.showLinks) {
      cardOptions.links = [
        { text: args.link1Text || 'Link #1', href: '#', onClick: () => alert('Link #1 clicked') },
        { text: args.link2Text || 'Link #2', href: '#', onClick: () => alert('Link #2 clicked') }
      ];
    }
    
    // Add action button if enabled
    if (args.showActionButton) {
      cardOptions.actionButton = {
        text: args.actionButtonText || 'Action',
        style: args.actionButtonStyle || 'primary',
        fill: args.actionButtonFill || 'filled',
        size: args.actionButtonSize || 'default',
        onClick: () => alert('Action button clicked')
      };
    }
    
    // Add card click handler if enabled
    if (args.cardClickable) {
      cardOptions.onClick = () => {
        alert('Card clicked!');
      };
    }
    
    const card = PlusInterface.createCard(cardOptions);
    return card;
  },
  argTypes: {
    // Content visibility controls
    showImage: {
      control: 'boolean',
      description: 'Show image/media area at top of card',
    },
    imageText: {
      control: 'text',
      description: 'Image placeholder text',
      if: { arg: 'showImage', eq: true },
    },
    showTitle: {
      control: 'boolean',
      description: 'Show card title',
    },
    title: {
      control: 'text',
      description: 'Card title text',
      if: { arg: 'showTitle', eq: true },
    },
    showSubtitle: {
      control: 'boolean',
      description: 'Show card subtitle',
    },
    subtitle: {
      control: 'text',
      description: 'Card subtitle text',
      if: { arg: 'showSubtitle', eq: true },
    },
    showBody: {
      control: 'boolean',
      description: 'Show card body content',
    },
    body: {
      control: 'text',
      description: 'Card body text',
      if: { arg: 'showBody', eq: true },
    },
    showHeader: {
      control: 'boolean',
      description: 'Show header section',
    },
    header: {
      control: 'text',
      description: 'Header section text',
      if: { arg: 'showHeader', eq: true },
    },
    showItems: {
      control: 'boolean',
      description: 'Show list items',
    },
    items: {
      control: 'text',
      description: 'Comma-separated list of items (e.g., "Item #1, Item #2, Item #3")',
      if: { arg: 'showItems', eq: true },
    },
    showFooter: {
      control: 'boolean',
      description: 'Show footer section text',
    },
    footer: {
      control: 'text',
      description: 'Footer section text',
      if: { arg: 'showFooter', eq: true },
    },
    showLinks: {
      control: 'boolean',
      description: 'Show footer links',
    },
    link1Text: {
      control: 'text',
      description: 'First link text',
      if: { arg: 'showLinks', eq: true },
    },
    link2Text: {
      control: 'text',
      description: 'Second link text',
      if: { arg: 'showLinks', eq: true },
    },
    showActionButton: {
      control: 'boolean',
      description: 'Show action button',
    },
    actionButtonText: {
      control: 'text',
      description: 'Action button text',
      if: { arg: 'showActionButton', eq: true },
    },
    actionButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Action button style',
      if: { arg: 'showActionButton', eq: true },
    },
    actionButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Action button fill variant',
      if: { arg: 'showActionButton', eq: true },
    },
    actionButtonSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Action button size',
      if: { arg: 'showActionButton', eq: true },
    },
    // Card styling controls
    paddingSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card padding size',
    },
    gapSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card gap size',
    },
    radiusSize: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Card border radius size',
    },
    borderSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card border size',
    },
    showBorder: {
      control: 'boolean',
      description: 'Show card border',
    },
    cardClickable: {
      control: 'boolean',
      description: 'Make entire card clickable',
    },
  },
  args: {
    // Content visibility defaults
    showImage: false,
    imageText: 'Image cap',
    showTitle: true,
    title: 'Card Title',
    showSubtitle: false,
    subtitle: 'Card Subtitle',
    showBody: true,
    body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
    showHeader: false,
    header: 'Header',
    showItems: false,
    items: 'Item #1, Item #2, Item #3',
    showFooter: false,
    footer: 'Footer',
    showLinks: false,
    link1Text: 'Link #1',
    link2Text: 'Link #2',
    showActionButton: false,
    actionButtonText: 'Action',
    actionButtonStyle: 'primary',
    actionButtonFill: 'filled',
    actionButtonSize: 'default',
    // Card styling defaults
    paddingSize: 'md',
    gapSize: 'md',
    radiusSize: 'sm',
    borderSize: 'sm',
    showBorder: true,
    cardClickable: false,
  },
};

Interactive.storyName = 'Interactive';
