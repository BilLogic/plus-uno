/**
 * Introduction Story
 * Overview and documentation for the PLUS Design System component playground
 */

export default {
  title: 'Introduction',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Welcome to the PLUS Design System component playground! This Storybook showcases all components organized by type: Components and Specs.',
      },
    },
  },
};

/**
 * Welcome Message
 */
export const Welcome = {
  render: () => {
    const container = document.createElement('div');
    // Responsive container with proper max-width and padding
    container.style.width = '100%';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    // Responsive padding for smaller screens
    container.style.boxSizing = 'border-box';
    
    // Add media query support via inline styles (will be overridden by CSS if needed)
    // For mobile: smaller padding
    if (window.innerWidth < 768) {
      container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    }
    
    // Title
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'PLUS Design System - Component Playground';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    title.style.wordWrap = 'break-word';
    container.appendChild(title);
    
    // Description
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Welcome to the PLUS Design System component playground! This Storybook showcases all components organized by type: Components and Specs, along with comprehensive design token documentation.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    description.style.lineHeight = '1.6';
    container.appendChild(description);
    
    // Component Organization Section
    const componentSection = document.createElement('section');
    componentSection.style.marginBottom = 'var(--size-card-gap-lg)';
    
    const componentTitle = document.createElement('h2');
    componentTitle.className = 'h2';
    componentTitle.textContent = 'Component Organization';
    componentTitle.style.marginBottom = 'var(--size-card-gap-md)';
    componentSection.appendChild(componentTitle);
    
    const componentDescription = document.createElement('p');
    componentDescription.className = 'body2-txt';
    componentDescription.textContent = 'Components in this design system are organized into two main categories:';
    componentDescription.style.marginBottom = 'var(--size-card-gap-md)';
    componentSection.appendChild(componentDescription);
    
    // Components
    const componentsDiv = document.createElement('div');
    componentsDiv.style.marginBottom = 'var(--size-section-pad-y-md)';
    
    const componentsTitle = document.createElement('h3');
    componentsTitle.className = 'h3';
    componentsTitle.textContent = 'Components';
    componentsTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    componentsDiv.appendChild(componentsTitle);
    
    const componentsDesc = document.createElement('p');
    componentsDesc.className = 'body2-txt';
    componentsDesc.style.fontWeight = 'bold';
    componentsDesc.textContent = 'Reusable UI components:';
    componentsDesc.style.marginBottom = 'var(--size-element-gap-sm)';
    componentsDiv.appendChild(componentsDesc);
    
    const componentsList = document.createElement('ul');
    componentsList.className = 'body2-txt';
    componentsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
    const componentItems = [
      'Button - Text + icon + container + styling with multiple variants',
      'Checkbox, Radio, Switch - Form input components with labels',
      'Alert, Toast - Notification components with dismiss functionality',
      'Badge, Chip - Icon + text combinations',
      'Card, Modal, Dropdown - Complex interactive components',
      'Form, DatePicker, InputGroup - Form building components',
      'Navigation, Breadcrumb, Pagination - Navigation components',
      'And many more...',
    ];
    componentItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = 'var(--size-element-gap-xs)';
      li.style.lineHeight = '1.5';
      componentsList.appendChild(li);
    });
    componentsDiv.appendChild(componentsList);
    componentSection.appendChild(componentsDiv);
    
    // Specs section
    const specsDiv = document.createElement('div');
    specsDiv.style.marginTop = 'var(--size-section-pad-y-md)';
    
    const specsTitle = document.createElement('h3');
    specsTitle.className = 'h3';
    specsTitle.textContent = 'Specs';
    specsTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    specsDiv.appendChild(specsTitle);
    
    const specsDesc = document.createElement('p');
    specsDesc.className = 'body2-txt';
    specsDesc.style.fontWeight = 'bold';
    specsDesc.textContent = 'Complex components composed of multiple components:';
    specsDesc.style.marginBottom = 'var(--size-element-gap-sm)';
    specsDiv.appendChild(specsDesc);
    
    const specsList = document.createElement('ul');
    specsList.className = 'body2-txt';
    specsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
    const specItems = [
      'Home - Home page components and sections',
      'Login - Authentication and login components',
      'Profile - User profile components',
      'Training - Training-related components',
      'Toolkit - Toolkit components',
      'Universal - Universal components used across multiple pillars',
      'Admin - Administrative interface components',
    ];
    specItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = 'var(--size-element-gap-xs)';
      li.style.lineHeight = '1.5';
      specsList.appendChild(li);
    });
    specsDiv.appendChild(specsList);
    componentSection.appendChild(specsDiv);
    
    container.appendChild(componentSection);
    
    // Usage Section
    const usageSection = document.createElement('section');
    usageSection.style.marginBottom = 'var(--size-card-gap-lg)';
    
    const usageTitle = document.createElement('h2');
    usageTitle.className = 'h2';
    usageTitle.textContent = 'Using This Playground';
    usageTitle.style.marginBottom = 'var(--size-card-gap-md)';
    usageSection.appendChild(usageTitle);
    
    const usageItems = [
      {
        title: 'Navigation',
        text: 'Use the sidebar to navigate between component categories. Click on any component to view its variations.',
      },
      {
        title: 'Interactive Controls',
        text: 'Each component story includes interactive controls that allow you to test different property values, see all component variations, and understand component behavior.',
      },
      {
        title: 'Component States',
        text: 'Stories demonstrate components in different states: default, hover, active/focused, disabled, and error states (where applicable).',
      },
    ];
    
    usageItems.forEach((item) => {
      const itemDiv = document.createElement('div');
      itemDiv.style.marginBottom = 'var(--size-card-gap-md)';
      
      const itemTitle = document.createElement('h3');
      itemTitle.className = 'h4';
      itemTitle.textContent = item.title;
      itemTitle.style.marginBottom = 'var(--size-element-gap-sm)';
      itemDiv.appendChild(itemTitle);
      
      const itemText = document.createElement('p');
      itemText.className = 'body2-txt';
      itemText.textContent = item.text;
      itemDiv.appendChild(itemText);
      
      usageSection.appendChild(itemDiv);
    });
    
    container.appendChild(usageSection);
    
    // Design Tokens Section
    const tokensSection = document.createElement('section');
    tokensSection.style.marginBottom = 'var(--size-card-gap-lg)';
    
    const tokensTitle = document.createElement('h2');
    tokensTitle.className = 'h2';
    tokensTitle.textContent = 'Design Tokens';
    tokensTitle.style.marginBottom = 'var(--size-card-gap-md)';
    tokensSection.appendChild(tokensTitle);
    
    const tokensDesc = document.createElement('p');
    tokensDesc.className = 'body2-txt';
    tokensDesc.textContent = 'All components use semantic design tokens from the PLUS design system:';
    tokensDesc.style.marginBottom = 'var(--size-element-gap-sm)';
    tokensSection.appendChild(tokensDesc);
    
    const tokensList = document.createElement('ul');
    tokensList.className = 'body2-txt';
    tokensList.style.paddingLeft = 'var(--size-section-pad-y-md)';
    const tokenItems = [
      'Colors - Material Design 3 color system with accent colors, SMART Framework colors, and state layers',
      'Layout - Semantic spacing tokens organized by component layer (elements, cards, sections, modals, surfaces, tables)',
      'Typography - Text size and weight tokens with display, headline, title, and body scales',
      'Icons - Font Awesome 6 Free icon library with typography-based sizing tokens',
      'Elevation - Box-shadow tokens for creating depth and hierarchy (elevation 1-5)',
    ];
    tokenItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = 'var(--size-element-gap-sm)';
      li.style.lineHeight = '1.5';
      tokensList.appendChild(li);
    });
    tokensSection.appendChild(tokensList);
    
    container.appendChild(tokensSection);
    
    // Getting Started Section
    const gettingStartedSection = document.createElement('section');
    
    const gettingStartedTitle = document.createElement('h2');
    gettingStartedTitle.className = 'h2';
    gettingStartedTitle.textContent = 'Getting Started';
    gettingStartedTitle.style.marginBottom = 'var(--size-card-gap-md)';
    gettingStartedSection.appendChild(gettingStartedTitle);
    
    const stepsList = document.createElement('ol');
    stepsList.className = 'body2-txt';
    stepsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
    const steps = [
      'Explore Styles section to understand design tokens (Colors, Layout, Typography, Icons, Elevation)',
      'Browse components by category (Components → Specs)',
      'Select a component to view its variations and interactive examples',
      'Use controls panel to test different configurations and property values',
      'Copy code examples for your prototypes and reference implementation patterns',
    ];
    steps.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      li.style.marginBottom = 'var(--size-element-gap-sm)';
      li.style.lineHeight = '1.5';
      stepsList.appendChild(li);
    });
    gettingStartedSection.appendChild(stepsList);
    
    container.appendChild(gettingStartedSection);
    
    // Add responsive behavior
    const handleResize = () => {
      if (window.innerWidth < 768) {
        container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
      } else {
        container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount (if component is remounted)
    return container;
  },
};

