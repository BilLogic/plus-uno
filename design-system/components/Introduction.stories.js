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
        component: 'Welcome to the PLUS Design System component playground! This Storybook showcases all components organized using atomic design principles.',
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
    description.textContent = 'Welcome to the PLUS Design System component playground! This Storybook showcases all components organized using atomic design principles, along with comprehensive design token documentation.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    description.style.lineHeight = '1.6';
    container.appendChild(description);
    
    // Atomic Design Section
    const atomicSection = document.createElement('section');
    atomicSection.style.marginBottom = 'var(--size-card-gap-lg)';
    
    const atomicTitle = document.createElement('h2');
    atomicTitle.className = 'h2';
    atomicTitle.textContent = 'Atomic Design Organization';
    atomicTitle.style.marginBottom = 'var(--size-card-gap-md)';
    atomicSection.appendChild(atomicTitle);
    
    const atomicDescription = document.createElement('p');
    atomicDescription.className = 'body2-txt';
    atomicDescription.textContent = 'Components in this design system are organized into two main categories:';
    atomicDescription.style.marginBottom = 'var(--size-card-gap-md)';
    atomicSection.appendChild(atomicDescription);
    
    // Atoms
    const atomsDiv = document.createElement('div');
    atomsDiv.style.marginBottom = 'var(--size-section-pad-y-md)';
    
    const atomsTitle = document.createElement('h3');
    atomsTitle.className = 'h3';
    atomsTitle.textContent = 'Atoms';
    atomsTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    atomsDiv.appendChild(atomsTitle);
    
    const atomsDesc = document.createElement('p');
    atomsDesc.className = 'body2-txt';
    atomsDesc.style.fontWeight = 'bold';
    atomsDesc.textContent = 'Basic building blocks that cannot be broken down further:';
    atomsDesc.style.marginBottom = 'var(--size-element-gap-sm)';
    atomsDiv.appendChild(atomsDesc);
    
    const atomsList = document.createElement('ul');
    atomsList.className = 'body2-txt';
    atomsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
    const atomItems = [
      'Typography - Text elements, labels, headlines, body text',
      'Icons - Font Awesome icons, status indicator icons',
      'Inputs - Text fields, textareas (bare input elements)',
      'Status Indicators - Icon-only status indicators',
    ];
    atomItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = 'var(--size-element-gap-xs)';
      atomsList.appendChild(li);
    });
    atomsDiv.appendChild(atomsList);
    atomicSection.appendChild(atomsDiv);
    
    // Molecules
    const moleculesDiv = document.createElement('div');
    
    const moleculesTitle = document.createElement('h3');
    moleculesTitle.className = 'h3';
    moleculesTitle.textContent = 'Molecules';
    moleculesTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    moleculesDiv.appendChild(moleculesTitle);
    
    const moleculesDesc = document.createElement('p');
    moleculesDesc.className = 'body2-txt';
    moleculesDesc.style.fontWeight = 'bold';
    moleculesDesc.textContent = 'Component combinations built from atoms:';
    moleculesDesc.style.marginBottom = 'var(--size-element-gap-sm)';
    moleculesDiv.appendChild(moleculesDesc);
    
    const moleculesList = document.createElement('ul');
    moleculesList.className = 'body2-txt';
    moleculesList.style.paddingLeft = 'var(--size-section-pad-y-md)';
    const moleculeItems = [
      'Button - Text + icon + container + styling with multiple variants',
      'Checkbox, Radio, Switch - Form input components with labels',
      'Alert, Toast - Notification components with dismiss functionality',
      'Badge, Chip, Status Tag - Icon + text combinations',
      'Card, Modal, Dropdown - Complex interactive components',
      'Form, DatePicker, InputGroup - Form building components',
      'Navigation, Breadcrumb, Pagination - Navigation components',
      'And many more...',
    ];
    moleculeItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = 'var(--size-element-gap-xs)';
      li.style.lineHeight = '1.5';
      moleculesList.appendChild(li);
    });
    moleculesDiv.appendChild(moleculesList);
    atomicSection.appendChild(moleculesDiv);
    
    // Organisms section
    const organismsDiv = document.createElement('div');
    organismsDiv.style.marginTop = 'var(--size-section-pad-y-md)';
    
    const organismsTitle = document.createElement('h3');
    organismsTitle.className = 'h3';
    organismsTitle.textContent = 'Organisms';
    organismsTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    organismsDiv.appendChild(organismsTitle);
    
    const organismsDesc = document.createElement('p');
    organismsDesc.className = 'body2-txt';
    organismsDesc.style.fontWeight = 'bold';
    organismsDesc.textContent = 'Complex components composed of molecules and atoms:';
    organismsDesc.style.marginBottom = 'var(--size-element-gap-sm)';
    organismsDiv.appendChild(organismsDesc);
    
    const organismsList = document.createElement('ul');
    organismsList.className = 'body2-txt';
    organismsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
    const organismItems = [
      'Home - Home page components and sections',
      'Login - Authentication and login components',
      'Profile - User profile components',
      'Training - Training-related components',
      'Toolkit - Toolkit components',
      'Shared - Shared components used across multiple pillars',
    ];
    organismItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = 'var(--size-element-gap-xs)';
      li.style.lineHeight = '1.5';
      organismsList.appendChild(li);
    });
    organismsDiv.appendChild(organismsList);
    atomicSection.appendChild(organismsDiv);
    
    container.appendChild(atomicSection);
    
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
      'Browse components by category (Atoms → Molecules → Organisms)',
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

