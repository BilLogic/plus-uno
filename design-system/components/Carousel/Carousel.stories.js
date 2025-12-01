/**
 * Carousel Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Carousels are **Section** components used to display a rotating set of content slides.
 * They allow users to navigate through multiple items sequentially, typically images or content cards.
 * 
 * ### When to Use
 * - **Image galleries**: Display multiple images in a rotating slideshow
 * - **Featured content**: Showcase featured items, products, or announcements
 * - **Testimonials**: Rotate through customer testimonials or reviews
 * - **Content rotation**: Display multiple pieces of content in limited space
 * - **Hero sections**: Create engaging hero sections with rotating banners
 * - **Product showcases**: Display product images or features in sequence
 * - **News/Updates**: Rotate through news items or updates
 * 
 * ### When NOT to Use
 * - **Static content**: Use regular sections or cards for content that doesn't need rotation
 * - **Critical information**: Don't hide important information behind carousel navigation
 * - **Many items**: Consider pagination or grid layouts for large sets of items
 * - **Mobile-heavy audiences**: Carousels can be difficult to use on touch devices
 * 
 * ### Implementation Context
 * - **Component Type**: Section (uses `section-*` tokens for container, `element-*` tokens for controls)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `carousel` component
 * - **Token Usage**: 
 *   - Colors: `--color-primary` for active indicators
 *   - Colors: `--color-on-surface-variant` for control icons and text
 *   - Colors: `--color-surface-container-high` for inactive indicators
 *   - Spacing: `--size-section-gap-*` for container spacing
 *   - Controls: `--size-element-*` tokens for control button styling
 *   - Typography: Body typography scales for captions
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/carousel/
 * 
 * ### Carousel Types (from Figma)
 * The Carousel component has 4 types:
 * - **slides only**: Just the slides, no controls or indicators
 * - **with controls**: Has left/right arrow controls
 * - **with indicators**: Has controls + indicator bars at the bottom
 * - **with captions**: Has controls + indicators + captions
 * 
 * ### Configuration Options
 * - **showControls**: Show/hide previous/next navigation buttons (default: true)
 * - **showIndicators**: Show/hide slide indicator dots (default: true)
 * - **showCaptions**: Show/hide captions on slides (default: false)
 * - **interval**: Auto-advance interval in milliseconds (default: 5000, 0 to disable)
 * - **pauseOnHover**: Pause auto-advance when hovering (default: true)
 * - **wrap**: Wrap around when reaching start/end (default: true)
 * - **keyboard**: Enable keyboard navigation (default: true)
 * - **ride**: Auto-start behavior ("carousel" for auto-start, false to disable)
 * 
 * ### Content Types
 * - **Images**: Pass image URLs as slide content
 * - **HTML Content**: Pass HTML strings or HTMLElements as slide content
 * - **Mixed Content**: Combine images and custom HTML in different slides
 * 
 * ### Best Practices
 * - Always provide descriptive alt text for images
 * - Limit the number of slides (3-5 recommended)
 * - Ensure all content is accessible and keyboard navigable
 * - Use appropriate auto-advance intervals (5-7 seconds recommended)
 * - Provide clear visual indicators for current slide
 * - Test on mobile devices for touch interaction
 * - Consider accessibility for users with motion sensitivity
 * 
 * See design-system/components/overview.md for Section Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Carousel',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carousel component for displaying a rotating set of content slides. Built on Bootstrap 4.6.2 carousel with PLUS design token customizations.',
      },
    },
  },
};

/**
 * Overview
 * Shows all carousel types in a 2x2 grid layout exactly as shown in Figma
 * Layout: 
 *   Top-Left: slides only
 *   Top-Right: with captions
 *   Bottom-Left: with controls
 *   Bottom-Right: with indicators
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    container.style.backgroundColor = 'var(--color-surface, #f9f9fc)';
    
    // Create single column container
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'flex';
    gridContainer.style.flexDirection = 'column';
    gridContainer.style.gap = 'var(--size-section-gap-lg)';
    gridContainer.style.maxWidth = '800px';
    gridContainer.style.margin = '0 auto';
    
    // Helper function to create slide content
    const createSlideContent = (slideNumber) => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px'; // Match carousel height
      slideDiv.style.width = '100%';
      slideDiv.style.position = 'relative';
      
      const slideText = document.createElement('p');
      slideText.style.fontFamily = 'var(--font-family-title, Lato)';
      slideText.style.fontSize = '64px';
      slideText.style.fontWeight = '400';
      slideText.style.lineHeight = '1.5';
      slideText.style.color = 'var(--color-on-surface, #191c1e)';
      slideText.style.margin = '0';
      slideText.style.whiteSpace = 'nowrap';
      
      const slideNames = ['First Slide', 'Second Slide', 'Third Slide'];
      slideText.textContent = slideNames[slideNumber - 1];
      
      slideDiv.appendChild(slideText);
      return slideDiv;
    };
    
    // Helper function to create carousel
    const createCarouselVariant = (id, type, label) => {
      const variantContainer = document.createElement('div');
      variantContainer.style.display = 'flex';
      variantContainer.style.flexDirection = 'column';
      variantContainer.style.gap = 'var(--size-element-gap-md)';
      variantContainer.style.alignItems = 'center';
      
      // Label
      const labelEl = document.createElement('div');
      labelEl.style.fontFamily = 'var(--font-family-body, SF Pro Text)';
      labelEl.style.fontSize = '14px';
      labelEl.style.fontWeight = '400';
      labelEl.style.color = 'var(--color-outline, #6f797a)';
      labelEl.style.textAlign = 'center';
      labelEl.textContent = label;
      variantContainer.appendChild(labelEl);
      
      // Carousel wrapper
      const carouselWrapper = document.createElement('div');
      carouselWrapper.style.display = 'flex';
      carouselWrapper.style.alignItems = 'center';
      carouselWrapper.style.justifyContent = 'center';
      
      // Create slides
      const slides = [
        { content: createSlideContent(1), active: true },
        { content: createSlideContent(2) },
        { content: createSlideContent(3) }
      ];
      
      // Add captions for "with captions" type
      if (type === 'with-captions') {
        slides[0].title = 'First slide label';
        slides[0].caption = 'Some representative placeholder content for the first slide.';
        slides[1].title = 'Second slide label';
        slides[1].caption = 'Some representative placeholder content for the second slide.';
        slides[2].title = 'Third slide label';
        slides[2].caption = 'Some representative placeholder content for the third slide.';
      }
      
      // Create carousel based on type
      const carousel = PlusInterface.createCarousel({
        id: id,
        slides: slides,
        showControls: type !== 'slides-only',
        showIndicators: type === 'with-indicators' || type === 'with-captions',
        showCaptions: type === 'with-captions',
        interval: 0, // Disable auto-play for demo
        ride: false
      });
      
      // Apply width based on type
      if (type === 'slides-only') {
        carousel.style.width = '600px';
        carousel.style.height = '350px';
      } else {
        carousel.style.width = '680px';
        carousel.style.height = '350px';
      }
      
      // Ensure carousel inner has proper height
      const carouselInner = carousel.querySelector('.plus-carousel-inner');
      if (carouselInner) {
        carouselInner.style.height = '100%';
      }
      
      // Ensure carousel items have proper height
      const carouselItems = carousel.querySelectorAll('.plus-carousel-item');
      carouselItems.forEach(item => {
        item.style.height = '100%';
      });
      
      carouselWrapper.appendChild(carousel);
      variantContainer.appendChild(carouselWrapper);
      
      return variantContainer;
    };
    
    // Order: slides only, with controls, with indicators, with captions (single column)
    const slidesOnly = createCarouselVariant('carousel-all-slides-only', 'slides-only', 'slides only');
    gridContainer.appendChild(slidesOnly);
    
    const withControls = createCarouselVariant('carousel-all-with-controls', 'with-controls', 'with controls');
    gridContainer.appendChild(withControls);
    
    const withIndicators = createCarouselVariant('carousel-all-with-indicators', 'with-indicators', 'with indicators');
    gridContainer.appendChild(withIndicators);
    
    const withCaptions = createCarouselVariant('carousel-all-with-captions', 'with-captions', 'with captions');
    gridContainer.appendChild(withCaptions);
    
    container.appendChild(gridContainer);
    
    return container;
  },
};

/**
 * Interactive Carousel
 * Interactive playground for testing carousel variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const createSlideContent = (slideNumber) => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
      slideDiv.style.width = '100%';
      slideDiv.style.backgroundColor = 'var(--color-surface-variant)';
      
      const slideText = document.createElement('p');
      slideText.style.fontFamily = 'var(--font-family-title, Lato)';
      slideText.style.fontSize = '64px';
      slideText.style.fontWeight = '400';
      slideText.style.color = 'var(--color-on-surface-variant)';
      slideText.textContent = `Slide ${slideNumber}`;
      slideDiv.appendChild(slideText);
      
      return slideDiv;
    };
    
    const slides = [];
    for (let i = 1; i <= (args.slideCount || 3); i++) {
      slides.push({
        content: createSlideContent(i),
        active: i === 1,
        title: args.showCaptions ? `Slide ${i} label` : undefined,
        caption: args.showCaptions ? `Some representative placeholder content for slide ${i}.` : undefined
      });
    }
    
    const carousel = PlusInterface.createCarousel({
      id: args.id || 'interactive-carousel',
      slides: slides,
      showControls: args.showControls !== false,
      showIndicators: args.showIndicators !== false,
      showCaptions: args.showCaptions || false,
      interval: args.interval || 5000,
      pauseOnHover: args.pauseOnHover !== false,
      wrap: args.wrap !== false,
      keyboard: args.keyboard !== false,
      ride: args.ride || false,
      onSlide: (event, slideIndex) => {
        console.log('Slide changing to:', slideIndex);
      },
      onSlid: (event, slideIndex) => {
        console.log('Slide changed to:', slideIndex);
      }
    });
    
    carousel.style.width = args.width || '680px';
    carousel.style.height = args.height || '350px';
    
    const carouselInner = carousel.querySelector('.plus-carousel-inner');
    if (carouselInner) {
      carouselInner.style.height = '100%';
    }
    const carouselItems = carousel.querySelectorAll('.plus-carousel-item');
    carouselItems.forEach(item => {
      item.style.height = '100%';
    });
    
    container.appendChild(carousel);
    return container;
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Carousel ID (required for Bootstrap functionality)',
    },
    slideCount: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Number of slides',
    },
    showControls: {
      control: 'boolean',
      description: 'Show previous/next controls',
    },
    showIndicators: {
      control: 'boolean',
      description: 'Show slide indicators',
    },
    showCaptions: {
      control: 'boolean',
      description: 'Show captions on slides',
    },
    interval: {
      control: { type: 'number', min: 0, max: 10000, step: 500 },
      description: 'Auto-advance interval in milliseconds (0 to disable)',
    },
    pauseOnHover: {
      control: 'boolean',
      description: 'Pause on hover',
    },
    wrap: {
      control: 'boolean',
      description: 'Wrap around when reaching start/end',
    },
    keyboard: {
      control: 'boolean',
      description: 'Enable keyboard navigation',
    },
    ride: {
      control: 'select',
      options: ['carousel', false],
      description: 'Auto-start behavior',
    },
    width: {
      control: 'text',
      description: 'Carousel width',
    },
    height: {
      control: 'text',
      description: 'Carousel height',
    },
  },
  args: {
    id: 'interactive-carousel',
    slideCount: 3,
    showControls: true,
    showIndicators: true,
    showCaptions: false,
    interval: 5000,
    pauseOnHover: true,
    wrap: true,
    keyboard: true,
    ride: false,
    width: '680px',
    height: '350px',
  },
};

