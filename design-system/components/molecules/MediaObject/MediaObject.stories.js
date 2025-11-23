/**
 * Media Object Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Media Objects are **Element** components used for displaying content with an image, icon, or other media alongside text.
 * They provide a flexible way to align media and content horizontally, commonly used for comments, posts, profiles, and lists.
 * 
 * ### When to Use
 * - **Comments**: Display user comments with avatars and text
 * - **Posts**: Show social media posts with images and content
 * - **Profiles**: Display user profiles with avatars and information
 * - **List items**: Create list items with icons/images and descriptions
 * - **Notifications**: Show notifications with icons and messages
 * - **Product listings**: Display products with images and descriptions
 * - **Search results**: Show search results with thumbnails and content
 * - **Activity feeds**: Display activity items with icons and details
 * 
 * ### When NOT to Use
 * - **Cards**: Use Card component for self-contained containers with multiple sections
 * - **Complex layouts**: Use grid or flexbox layouts for complex multi-column designs
 * - **Simple text**: Use regular text elements if no media is needed
 * - **Navigation**: Use Navigation component for navigation menus
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `media` object pattern
 * - **Styling**: Customized with PLUS design tokens for colors, spacing, and typography
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/media-object/
 * 
 * ### Alignment Variants
 * - **Left (default)**: Media on the left, content on the right
 * - **Right**: Media on the right, content on the left
 * - **Top**: Media on top, content below (vertical alignment)
 * - **Center**: Media and content vertically centered
 * 
 * ### Size Variants
 * - **Small**: Compact media object for dense interfaces
 * - **Default**: Standard size (default)
 * - **Large**: Spacious media object for content-rich layouts
 * 
 * ### Content Variants
 * - **With heading**: Media object with heading and body text
 * - **Without heading**: Media object with body text only
 * - **Nested**: Media object within another media object (for replies, threads)
 * - **Multiple media objects**: Several media objects in a list
 * 
 * ### Best Practices
 * - Use appropriate alignment based on content and context
 * - Choose media size that matches content importance
 * - Include clear, descriptive headings when needed
 * - Use nested media objects for threaded conversations
 * - Ensure media and content are visually balanced
 * - Use consistent sizing within a list or section
 * - Consider responsive behavior for different screen sizes
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/MediaObject',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Media Object component for displaying content with images, icons, or other media alongside text. Built on Bootstrap 4.6.2 media object pattern with PLUS design token customizations.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all media object combinations: alignments, sizes, and content variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Alignment Variants
    const alignmentSection = document.createElement('div');
    alignmentSection.style.display = 'flex';
    alignmentSection.style.flexDirection = 'column';
    alignmentSection.style.gap = 'var(--size-element-gap-sm)';
    
    const alignmentLabel = document.createElement('div');
    alignmentLabel.className = 'h6';
    alignmentLabel.textContent = 'Alignment Variants';
    alignmentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    alignmentSection.appendChild(alignmentLabel);
    
    // Left alignment (default)
    const leftMedia = document.createElement('div');
    leftMedia.style.width = '64px';
    leftMedia.style.height = '64px';
    leftMedia.style.borderRadius = '50%';
    leftMedia.style.backgroundColor = 'var(--color-primary)';
    leftMedia.style.display = 'flex';
    leftMedia.style.alignItems = 'center';
    leftMedia.style.justifyContent = 'center';
    leftMedia.style.color = 'var(--color-on-primary)';
    leftMedia.textContent = '64';
    
    const left = PlusInterface.createMediaObject({
      media: leftMedia,
      heading: 'Left Aligned Media',
      body: 'This is a media object with the media aligned to the left (default). The content flows to the right of the media element.',
      alignment: 'left',
    });
    alignmentSection.appendChild(left);
    
    // Right alignment
    const rightMedia = document.createElement('div');
    rightMedia.style.width = '64px';
    rightMedia.style.height = '64px';
    rightMedia.style.borderRadius = '50%';
    rightMedia.style.backgroundColor = 'var(--color-secondary)';
    rightMedia.style.display = 'flex';
    rightMedia.style.alignItems = 'center';
    rightMedia.style.justifyContent = 'center';
    rightMedia.style.color = 'var(--color-on-secondary)';
    rightMedia.textContent = '64';
    
    const right = PlusInterface.createMediaObject({
      media: rightMedia,
      heading: 'Right Aligned Media',
      body: 'This is a media object with the media aligned to the right. The content flows to the left of the media element.',
      alignment: 'right',
    });
    alignmentSection.appendChild(right);
    
    container.appendChild(alignmentSection);
    
    // Size Variants
    const sizeSection = document.createElement('div');
    sizeSection.style.display = 'flex';
    sizeSection.style.flexDirection = 'column';
    sizeSection.style.gap = 'var(--size-element-gap-sm)';
    
    const sizeLabel = document.createElement('div');
    sizeLabel.className = 'h6';
    sizeLabel.textContent = 'Size Variants';
    sizeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sizeSection.appendChild(sizeLabel);
    
    // Small size
    const smallMedia = document.createElement('div');
    smallMedia.style.width = '40px';
    smallMedia.style.height = '40px';
    smallMedia.style.borderRadius = '50%';
    smallMedia.style.backgroundColor = 'var(--color-tertiary)';
    smallMedia.style.display = 'flex';
    smallMedia.style.alignItems = 'center';
    smallMedia.style.justifyContent = 'center';
    smallMedia.style.color = 'var(--color-on-tertiary)';
    smallMedia.textContent = '40';
    
    const small = PlusInterface.createMediaObject({
      media: smallMedia,
      heading: 'Small Media Object',
      body: 'This is a small media object with compact spacing.',
      mediaSize: 'small',
    });
    sizeSection.appendChild(small);
    
    // Default size
    const defaultMedia = document.createElement('div');
    defaultMedia.style.width = '64px';
    defaultMedia.style.height = '64px';
    defaultMedia.style.borderRadius = '50%';
    defaultMedia.style.backgroundColor = 'var(--color-primary)';
    defaultMedia.style.display = 'flex';
    defaultMedia.style.alignItems = 'center';
    defaultMedia.style.justifyContent = 'center';
    defaultMedia.style.color = 'var(--color-on-primary)';
    defaultMedia.textContent = '64';
    
    const defaultObj = PlusInterface.createMediaObject({
      media: defaultMedia,
      heading: 'Default Media Object',
      body: 'This is a default-sized media object with standard spacing.',
      mediaSize: 'default',
    });
    sizeSection.appendChild(defaultObj);
    
    // Large size
    const largeMedia = document.createElement('div');
    largeMedia.style.width = '96px';
    largeMedia.style.height = '96px';
    largeMedia.style.borderRadius = '50%';
    largeMedia.style.backgroundColor = 'var(--color-primary)';
    largeMedia.style.display = 'flex';
    largeMedia.style.alignItems = 'center';
    largeMedia.style.justifyContent = 'center';
    largeMedia.style.color = 'var(--color-on-primary)';
    largeMedia.textContent = '96';
    
    const large = PlusInterface.createMediaObject({
      media: largeMedia,
      heading: 'Large Media Object',
      body: 'This is a large media object with spacious spacing for content-rich layouts.',
      mediaSize: 'large',
    });
    sizeSection.appendChild(large);
    
    container.appendChild(sizeSection);
    
    // Content Variants
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-element-gap-sm)';
    
    const contentLabel = document.createElement('div');
    contentLabel.className = 'h6';
    contentLabel.textContent = 'Content Variants';
    contentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentLabel);
    
    // With heading
    const withHeadingMedia = document.createElement('div');
    withHeadingMedia.style.width = '64px';
    withHeadingMedia.style.height = '64px';
    withHeadingMedia.style.borderRadius = '50%';
    withHeadingMedia.style.backgroundColor = 'var(--color-surface-variant)';
    withHeadingMedia.style.display = 'flex';
    withHeadingMedia.style.alignItems = 'center';
    withHeadingMedia.style.justifyContent = 'center';
    withHeadingMedia.style.color = 'var(--color-on-surface-variant)';
    withHeadingMedia.textContent = 'IMG';
    
    const withHeading = PlusInterface.createMediaObject({
      media: withHeadingMedia,
      heading: 'Media Object with Heading',
      body: 'This media object includes both a heading and body text. The heading uses h6 typography.',
    });
    contentSection.appendChild(withHeading);
    
    // Without heading
    const withoutHeadingMedia = document.createElement('div');
    withoutHeadingMedia.style.width = '64px';
    withoutHeadingMedia.style.height = '64px';
    withoutHeadingMedia.style.borderRadius = '50%';
    withoutHeadingMedia.style.backgroundColor = 'var(--color-surface-variant)';
    withoutHeadingMedia.style.display = 'flex';
    withoutHeadingMedia.style.alignItems = 'center';
    withoutHeadingMedia.style.justifyContent = 'center';
    withoutHeadingMedia.style.color = 'var(--color-on-surface-variant)';
    withoutHeadingMedia.textContent = 'IMG';
    
    const withoutHeading = PlusInterface.createMediaObject({
      media: withoutHeadingMedia,
      body: 'This media object only includes body text without a heading. Useful for simpler content displays.',
    });
    contentSection.appendChild(withoutHeading);
    
    container.appendChild(contentSection);
    
    // Nested Media Objects
    const nestedSection = document.createElement('div');
    nestedSection.style.display = 'flex';
    nestedSection.style.flexDirection = 'column';
    nestedSection.style.gap = 'var(--size-element-gap-sm)';
    
    const nestedLabel = document.createElement('div');
    nestedLabel.className = 'h6';
    nestedLabel.textContent = 'Nested Media Objects';
    nestedLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    nestedSection.appendChild(nestedLabel);
    
    const parentMedia = document.createElement('div');
    parentMedia.style.width = '64px';
    parentMedia.style.height = '64px';
    parentMedia.style.borderRadius = '50%';
    parentMedia.style.backgroundColor = 'var(--color-primary)';
    parentMedia.style.display = 'flex';
    parentMedia.style.alignItems = 'center';
    parentMedia.style.justifyContent = 'center';
    parentMedia.style.color = 'var(--color-on-primary)';
    parentMedia.textContent = 'P';
    
    const parent = PlusInterface.createMediaObject({
      media: parentMedia,
      heading: 'Parent Comment',
      body: 'This is the parent comment in a threaded conversation.',
    });
    
    const nestedMedia = document.createElement('div');
    nestedMedia.style.width = '48px';
    nestedMedia.style.height = '48px';
    nestedMedia.style.borderRadius = '50%';
    nestedMedia.style.backgroundColor = 'var(--color-secondary)';
    nestedMedia.style.display = 'flex';
    nestedMedia.style.alignItems = 'center';
    nestedMedia.style.justifyContent = 'center';
    nestedMedia.style.color = 'var(--color-on-secondary)';
    nestedMedia.textContent = 'R';
    
    PlusInterface.createNestedMediaObject({
      parent: parent,
      media: nestedMedia,
      heading: 'Reply Comment',
      body: 'This is a nested reply to the parent comment. Useful for threaded conversations and comments.',
    });
    
    nestedSection.appendChild(parent);
    container.appendChild(nestedSection);
    
    return container;
  },
};

/**
 * Interactive Media Object
 * Interactive playground for testing media object variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    
    // Create media element based on args
    const mediaEl = document.createElement('div');
    mediaEl.style.width = args.mediaSize === 'small' ? '40px' : args.mediaSize === 'large' ? '96px' : '64px';
    mediaEl.style.height = args.mediaSize === 'small' ? '40px' : args.mediaSize === 'large' ? '96px' : '64px';
    mediaEl.style.borderRadius = '50%';
    mediaEl.style.backgroundColor = 'var(--color-primary)';
    mediaEl.style.display = 'flex';
    mediaEl.style.alignItems = 'center';
    mediaEl.style.justifyContent = 'center';
    mediaEl.style.color = 'var(--color-on-primary)';
    mediaEl.textContent = mediaEl.style.width.replace('px', '');
    
    const mediaObject = PlusInterface.createMediaObject({
      media: mediaEl,
      heading: args.heading || undefined,
      body: args.body || 'Media object body content',
      alignment: args.alignment || 'left',
      mediaSize: args.mediaSize || 'default',
    });
    
    container.appendChild(mediaObject);
    return container;
  },
  argTypes: {
    heading: {
      control: 'text',
      description: 'Optional heading text (uses h6 typography)',
    },
    body: {
      control: 'text',
      description: 'Body content text',
    },
    alignment: {
      control: 'select',
      options: ['left', 'right', 'top', 'center'],
      description: 'Media alignment',
    },
    mediaSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Media size variant',
    },
  },
  args: {
    heading: 'Media Object Heading',
    body: 'This is the body content of the media object. It can contain any text or HTML content.',
    alignment: 'left',
    mediaSize: 'default',
  },
};

/**
 * Example: Comment Thread
 * Real-world example showing nested media objects for a comment thread
 */
export const CommentThread = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    
    // Comment 1
    const comment1Media = document.createElement('div');
    comment1Media.style.width = '64px';
    comment1Media.style.height = '64px';
    comment1Media.style.borderRadius = '50%';
    comment1Media.style.backgroundColor = 'var(--color-primary)';
    comment1Media.style.display = 'flex';
    comment1Media.style.alignItems = 'center';
    comment1Media.style.justifyContent = 'center';
    comment1Media.style.color = 'var(--color-on-primary)';
    comment1Media.textContent = 'JD';
    
    const comment1 = PlusInterface.createMediaObject({
      media: comment1Media,
      heading: 'John Doe',
      body: 'This is a great post! I really enjoyed reading it. The insights are very valuable.',
    });
    
    // Reply to comment 1
    const reply1Media = document.createElement('div');
    reply1Media.style.width = '48px';
    reply1Media.style.height = '48px';
    reply1Media.style.borderRadius = '50%';
    reply1Media.style.backgroundColor = 'var(--color-secondary)';
    reply1Media.style.display = 'flex';
    reply1Media.style.alignItems = 'center';
    reply1Media.style.justifyContent = 'center';
    reply1Media.style.color = 'var(--color-on-secondary)';
    reply1Media.textContent = 'JS';
    
    PlusInterface.createNestedMediaObject({
      parent: comment1,
      media: reply1Media,
      heading: 'Jane Smith',
      body: 'I agree! The author did a fantastic job explaining the concepts.',
    });
    
    container.appendChild(comment1);
    
    // Comment 2
    const comment2Media = document.createElement('div');
    comment2Media.style.width = '64px';
    comment2Media.style.height = '64px';
    comment2Media.style.borderRadius = '50%';
    comment2Media.style.backgroundColor = 'var(--color-tertiary)';
    comment2Media.style.display = 'flex';
    comment2Media.style.alignItems = 'center';
    comment2Media.style.justifyContent = 'center';
    comment2Media.style.color = 'var(--color-on-tertiary)';
    comment2Media.textContent = 'AB';
    
    const comment2 = PlusInterface.createMediaObject({
      media: comment2Media,
      heading: 'Alice Brown',
      body: 'Thanks for sharing this. It helped me understand the topic better.',
    });
    
    container.appendChild(comment2);
    
    return container;
  },
};

/**
 * Example: Product List
 * Real-world example showing multiple media objects in a list
 */
export const ProductList = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const products = [
      {
        name: 'Product A',
        description: 'High-quality product with excellent features and great value.',
        color: 'var(--color-primary)',
      },
      {
        name: 'Product B',
        description: 'Premium product designed for professional use.',
        color: 'var(--color-secondary)',
      },
      {
        name: 'Product C',
        description: 'Affordable option perfect for everyday use.',
        color: 'var(--color-tertiary)',
      },
    ];
    
    products.forEach((product) => {
      const productMedia = document.createElement('div');
      productMedia.style.width = '80px';
      productMedia.style.height = '80px';
      productMedia.style.borderRadius = 'var(--size-card-radius-sm)';
      productMedia.style.backgroundColor = product.color;
      productMedia.style.display = 'flex';
      productMedia.style.alignItems = 'center';
      productMedia.style.justifyContent = 'center';
      productMedia.style.color = 'white';
      productMedia.textContent = 'IMG';
      
      const productObj = PlusInterface.createMediaObject({
        media: productMedia,
        heading: product.name,
        body: product.description,
        mediaSize: 'large',
      });
      
      container.appendChild(productObj);
    });
    
    return container;
  },
};



