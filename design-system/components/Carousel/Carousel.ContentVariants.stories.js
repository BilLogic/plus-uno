/**
 * Carousel Content Variants Stories
 * 
 * Shows individual carousel type variants:
 * 1. Slides Only - Just the slides, no controls or indicators
 * 2. With Controls - Has left/right arrow controls
 * 3. With Indicators - Has controls + indicator bars at the bottom
 * 4. With Captions - Has controls + indicators + captions
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Carousel/Content Variants',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Carousel content variants show different combinations of controls, indicators, and captions.',
      },
    },
  },
};

/**
 * Slides Only
 * Carousel with just slides, no controls or indicators
 */
export const SlidesOnly = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const createSlideContent = (slideNumber) => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
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
    
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-slides-only',
      slides: [
        { content: createSlideContent(1), active: true },
        { content: createSlideContent(2) },
        { content: createSlideContent(3) }
      ],
      showControls: false,
      showIndicators: false,
      interval: 0,
      ride: false
    });
    
    carousel.style.width = '600px';
    carousel.style.height = '350px';
    
    // Ensure carousel inner and items have proper height
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
};

/**
 * With Controls
 * Carousel with navigation controls
 */
export const WithControls = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const createSlideContent = (slideNumber) => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
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
    
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-with-controls',
      slides: [
        { content: createSlideContent(1), active: true },
        { content: createSlideContent(2) },
        { content: createSlideContent(3) }
      ],
      showControls: true,
      showIndicators: false,
      interval: 0,
      ride: false
    });
    
    carousel.style.width = '680px';
    carousel.style.height = '350px';
    
    // Ensure carousel inner and items have proper height
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
};

/**
 * With Indicators
 * Carousel with controls and indicators
 */
export const WithIndicators = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const createSlideContent = (slideNumber) => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
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
    
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-with-indicators',
      slides: [
        { content: createSlideContent(1), active: true },
        { content: createSlideContent(2) },
        { content: createSlideContent(3) }
      ],
      showControls: true,
      showIndicators: true,
      interval: 0,
      ride: false
    });
    
    carousel.style.width = '680px';
    carousel.style.height = '350px';
    
    // Ensure carousel inner and items have proper height
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
};

/**
 * With Captions
 * Carousel with controls, indicators, and captions
 */
export const WithCaptions = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const createSlideContent = (slideNumber) => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
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
    
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-with-captions',
      slides: [
        { 
          content: createSlideContent(1), 
          active: true,
          title: 'First slide label',
          caption: 'Some representative placeholder content for the first slide.'
        },
        { 
          content: createSlideContent(2),
          title: 'Second slide label',
          caption: 'Some representative placeholder content for the second slide.'
        },
        { 
          content: createSlideContent(3),
          title: 'Third slide label',
          caption: 'Some representative placeholder content for the third slide.'
        }
      ],
      showControls: true,
      showIndicators: true,
      showCaptions: true,
      interval: 0,
      ride: false
    });
    
    carousel.style.width = '680px';
    carousel.style.height = '350px';
    
    // Ensure carousel inner and items have proper height
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
};

