/**
 * Jumbotron Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Jumbotrons are **Section** components used for marketing/landing pages to display prominent content.
 * They create large hero sections that grab attention and communicate key messages.
 * 
 * ### When to Use
 * - **Hero sections**: Main landing page hero areas with key messaging
 * - **Marketing pages**: Prominent sections for product launches, announcements, or campaigns
 * - **Feature highlights**: Showcase important features or benefits
 * - **Call-to-action sections**: Prominent areas for user actions
 * - **Welcome screens**: First-time user experiences or onboarding
 * 
 * ### Implementation Context
 * - **Component Type**: Section (uses `section-` tokens)
 * - **Section Container Token Usage**: 
 *   - Padding: `--size-section-pad-x-sm/md/lg`, `--size-section-pad-y-sm/md/lg`
 *   - Gap: `--size-section-gap-sm/md/lg` (for spacing between title, subtitle, body, buttons)
 *   - Radius: `--size-section-radius-sm/md/lg` (8px default)
 *   - Surface: `--color-surface-container` for background
 *   - Content: `--color-on-surface` for text
 * - **Spacing Rules** (from Figma specs):
 *   - Responsive padding: 24px on mobile, 36px on desktop (section-pad-md/lg)
 *   - Gap between elements: 16px (section-gap-md)
 *   - Title margin: 8px bottom (section-gap-sm)
 *   - Subtitle margin: 8px bottom (section-gap-sm)
 *   - Body margin: 8px bottom (section-gap-sm)
 *   - Actions margin: 8px top (section-gap-sm)
 * - **Typography Token Usage**:
 *   - **Jumbotron Title**: Uses `.h1` class (typography tokens: `--font-size-h1` = 32px, `--font-family-header` = Lato, `--font-weight-semibold-2` = 600, `--font-line-height-h1` = 1.25)
 *   - **Jumbotron Subtitle**: Uses `.h4` class (typography tokens: `--font-size-h4` = 24px, `--font-family-header` = Lato, `--font-weight-semibold-2` = 600, `--font-line-height-h4` = 1.333)
 *   - **Jumbotron Body**: Uses `.body1-txt` class (typography tokens: `--font-size-body1` = 16px, `--font-family-body` = Merriweather Sans, `--font-weight-normal` = 300, `--font-line-height-body1` = 1.5)
 * - **Component Dependencies**:
 *   - **Action Buttons**: Uses the **Button component** (`createButton` from `button.js`)
 *     - Buttons use `element-` tokens for their own styling (padding, gap, radius, border)
 *     - Buttons use Material Design 3 color tokens (`--color-primary`, `--color-on-primary`, etc.)
 *     - Buttons support all Button variants: styles (primary, secondary, etc.), fills (filled, outline, tonal, text), sizes (small, default, large)
 *     - See `Molecules/Button` documentation for complete Button token usage
 * 
 * ### Size Variants
 * - **Small (sm)**: Compact jumbotrons for dense interfaces
 *   - Padding: 16px all sides (mobile), 24px (desktop)
 *   - Gap: 8px
 * - **Medium (md)**: Standard size (default)
 *   - Padding: 24px all sides (mobile), 36px (desktop)
 *   - Gap: 16px
 * - **Large (lg)**: Spacious jumbotrons for content-rich layouts
 *   - Padding: 36px all sides
 *   - Gap: 24px
 * 
 * ### Fluid Variant
 * - **Fluid**: Full-width jumbotron with no border-radius
 *   - Removes horizontal padding
 *   - Removes border-radius
 *   - Useful for edge-to-edge hero sections
 * 
 * ### Best Practices
 * - Use appropriate padding size based on content density
 * - Match gap size to content hierarchy
 * - Use fluid variant for full-width hero sections
 * - Keep titles concise and impactful
 * - Use clear call-to-action buttons
 * - Ensure sufficient contrast for accessibility
 * - Test responsive behavior across breakpoints
 * 
 * See design-system/components/overview.md for Section Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 * See Molecules/Button for Button component documentation (used for Action Buttons)
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Jumbotron',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Jumbotron component for creating large hero sections on marketing/landing pages. Supports multiple content configurations, size variants, and fluid layout. Uses section-level tokens for spacing and layout.',
      },
    },
  },
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 */
export const Interactive = {
  render: (args) => {
    // Build jumbotron options based on args
    const jumbotronOptions = {
      title: args.title || 'Hello, world!',
      subtitle: args.subtitle || null,
      body: args.body || 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      fluid: args.fluid || false,
      paddingSize: args.paddingSize || 'md',
      gapSize: args.gapSize || 'md',
      radiusSize: args.radiusSize || 'md',
    };
    
    // Add subtitle if enabled
    if (args.showSubtitle) {
      jumbotronOptions.subtitle = args.subtitle || 'It uses utility classes for typography and spacing to space content out within the larger container.';
    }
    
    // Add primary button if enabled
    if (args.showPrimaryButton) {
      jumbotronOptions.primaryButton = {
        text: args.primaryButtonText || 'Learn more',
        style: args.primaryButtonStyle || 'primary',
        fill: args.primaryButtonFill || 'filled',
        size: args.primaryButtonSize || 'default',
        onClick: () => alert('Primary button clicked')
      };
    }
    
    // Add secondary button if enabled
    if (args.showSecondaryButton) {
      jumbotronOptions.secondaryButton = {
        text: args.secondaryButtonText || 'Get started',
        style: args.secondaryButtonStyle || 'secondary',
        fill: args.secondaryButtonFill || 'outline',
        size: args.secondaryButtonSize || 'default',
        onClick: () => alert('Secondary button clicked')
      };
    }
    
    const jumbotron = PlusInterface.createJumbotron(jumbotronOptions);
    return jumbotron;
  },
  argTypes: {
    // Content controls
    title: {
      control: 'text',
      description: 'Jumbotron title/heading',
    },
    showSubtitle: {
      control: 'boolean',
      description: 'Show subtitle',
    },
    subtitle: {
      control: 'text',
      description: 'Jumbotron subtitle',
      if: { arg: 'showSubtitle', eq: true },
    },
    body: {
      control: 'text',
      description: 'Jumbotron body text',
    },
    showPrimaryButton: {
      control: 'boolean',
      description: 'Show primary action button',
    },
    primaryButtonText: {
      control: 'text',
      description: 'Primary button text',
      if: { arg: 'showPrimaryButton', eq: true },
    },
    primaryButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Primary button style',
      if: { arg: 'showPrimaryButton', eq: true },
    },
    primaryButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Primary button fill variant',
      if: { arg: 'showPrimaryButton', eq: true },
    },
    primaryButtonSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Primary button size',
      if: { arg: 'showPrimaryButton', eq: true },
    },
    showSecondaryButton: {
      control: 'boolean',
      description: 'Show secondary action button',
    },
    secondaryButtonText: {
      control: 'text',
      description: 'Secondary button text',
      if: { arg: 'showSecondaryButton', eq: true },
    },
    secondaryButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Secondary button style',
      if: { arg: 'showSecondaryButton', eq: true },
    },
    secondaryButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Secondary button fill variant',
      if: { arg: 'showSecondaryButton', eq: true },
    },
    secondaryButtonSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Secondary button size',
      if: { arg: 'showSecondaryButton', eq: true },
    },
    // Styling controls
    fluid: {
      control: 'boolean',
      description: 'Make jumbotron fluid (full width, no border-radius)',
    },
    paddingSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Jumbotron padding size',
    },
    gapSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Jumbotron gap size',
    },
    radiusSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Jumbotron border radius size',
    },
  },
  args: {
    // Content defaults
    title: 'Hello, world!',
    showSubtitle: false,
    subtitle: 'It uses utility classes for typography and spacing to space content out within the larger container.',
    body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
    showPrimaryButton: true,
    primaryButtonText: 'Learn more',
    primaryButtonStyle: 'primary',
    primaryButtonFill: 'filled',
    primaryButtonSize: 'default',
    showSecondaryButton: false,
    secondaryButtonText: 'Get started',
    secondaryButtonStyle: 'secondary',
    secondaryButtonFill: 'outline',
    secondaryButtonSize: 'default',
    // Styling defaults
    fluid: false,
    paddingSize: 'md',
    gapSize: 'md',
    radiusSize: 'md',
  },
};

Interactive.storyName = 'Interactive';

/**
 * Default
 * Standard jumbotron with title, body, and primary button
 */
export const Default = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      }
    });
  },
};

Default.storyName = 'Default';

/**
 * With Subtitle
 * Jumbotron with title, subtitle, body, and buttons
 */
export const WithSubtitle = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      subtitle: 'It uses utility classes for typography and spacing to space content out within the larger container.',
      body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      },
      secondaryButton: {
        text: 'Get started',
        style: 'secondary',
        fill: 'outline',
        size: 'default',
        onClick: () => alert('Get started clicked')
      }
    });
  },
};

WithSubtitle.storyName = 'With Subtitle';

/**
 * Fluid
 * Full-width jumbotron with no border-radius
 */
export const Fluid = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Fluid Jumbotron',
      body: 'This is a fluid jumbotron that spans the full width of its container with no border-radius.',
      fluid: true,
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      }
    });
  },
};

Fluid.storyName = 'Fluid';

/**
 * Size Variants
 * Shows all padding and gap size variants
 */
export const SizeVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const sizes = ['sm', 'md', 'lg'];
    sizes.forEach((size) => {
      const label = document.createElement('div');
      label.className = 'h6';
      label.textContent = `Size: ${size.toUpperCase()}`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      container.appendChild(label);
      
      const jumbotron = PlusInterface.createJumbotron({
        title: `Jumbotron ${size.toUpperCase()}`,
        body: `This is a ${size} size jumbotron with ${size} padding and gap.`,
        paddingSize: size,
        gapSize: size,
        primaryButton: {
          text: 'Action',
          style: 'primary',
          fill: 'filled',
          size: 'default',
          onClick: () => {}
        }
      });
      container.appendChild(jumbotron);
    });
    
    return container;
  },
};

SizeVariants.storyName = 'Size Variants';

/**
 * Content Variants
 * Shows different content configurations
 */
export const ContentVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Title only
    const titleOnlyLabel = document.createElement('div');
    titleOnlyLabel.className = 'h6';
    titleOnlyLabel.textContent = 'Title Only';
    titleOnlyLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(titleOnlyLabel);
    
    const titleOnly = PlusInterface.createJumbotron({
      title: 'Title Only Jumbotron',
    });
    container.appendChild(titleOnly);
    
    // Title + Body
    const titleBodyLabel = document.createElement('div');
    titleBodyLabel.className = 'h6';
    titleBodyLabel.textContent = 'Title + Body';
    titleBodyLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(titleBodyLabel);
    
    const titleBody = PlusInterface.createJumbotron({
      title: 'Title + Body',
      body: 'This jumbotron has a title and body text.',
    });
    container.appendChild(titleBody);
    
    // Title + Subtitle + Body
    const fullLabel = document.createElement('div');
    fullLabel.className = 'h6';
    fullLabel.textContent = 'Title + Subtitle + Body';
    fullLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(fullLabel);
    
    const full = PlusInterface.createJumbotron({
      title: 'Full Content',
      subtitle: 'Subtitle text here',
      body: 'This jumbotron has title, subtitle, and body text.',
    });
    container.appendChild(full);
    
    // With buttons
    const withButtonsLabel = document.createElement('div');
    withButtonsLabel.className = 'h6';
    withButtonsLabel.textContent = 'With Action Buttons';
    withButtonsLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(withButtonsLabel);
    
    const withButtons = PlusInterface.createJumbotron({
      title: 'With Buttons',
      body: 'This jumbotron includes action buttons.',
      primaryButton: {
        text: 'Primary',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => {}
      },
      secondaryButton: {
        text: 'Secondary',
        style: 'secondary',
        fill: 'outline',
        size: 'default',
        onClick: () => {}
      }
    });
    container.appendChild(withButtons);
    
    return container;
  },
};

ContentVariants.storyName = 'Content Variants';





