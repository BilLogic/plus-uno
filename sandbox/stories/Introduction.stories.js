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
    container.style.padding = '2rem';
    container.style.maxWidth = '900px';
    container.style.margin = '0 auto';
    
    // Title
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'PLUS Design System - Component Playground';
    title.style.marginBottom = '1.5rem';
    container.appendChild(title);
    
    // Description
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Welcome to the PLUS Design System component playground! This Storybook showcases all components organized using atomic design principles.';
    description.style.marginBottom = '2rem';
    container.appendChild(description);
    
    // Atomic Design Section
    const atomicSection = document.createElement('section');
    atomicSection.style.marginBottom = '2rem';
    
    const atomicTitle = document.createElement('h2');
    atomicTitle.className = 'h2';
    atomicTitle.textContent = 'Atomic Design Organization';
    atomicTitle.style.marginBottom = '1rem';
    atomicSection.appendChild(atomicTitle);
    
    const atomicDescription = document.createElement('p');
    atomicDescription.className = 'body2-txt';
    atomicDescription.textContent = 'Components in this design system are organized into two main categories:';
    atomicDescription.style.marginBottom = '1rem';
    atomicSection.appendChild(atomicDescription);
    
    // Atoms
    const atomsDiv = document.createElement('div');
    atomsDiv.style.marginBottom = '1.5rem';
    
    const atomsTitle = document.createElement('h3');
    atomsTitle.className = 'h3';
    atomsTitle.textContent = 'Atoms';
    atomsTitle.style.marginBottom = '0.5rem';
    atomsDiv.appendChild(atomsTitle);
    
    const atomsDesc = document.createElement('p');
    atomsDesc.className = 'body2-txt';
    atomsDesc.style.fontWeight = 'bold';
    atomsDesc.textContent = 'Basic building blocks that cannot be broken down further:';
    atomsDesc.style.marginBottom = '0.5rem';
    atomsDiv.appendChild(atomsDesc);
    
    const atomsList = document.createElement('ul');
    atomsList.className = 'body2-txt';
    atomsList.style.paddingLeft = '1.5rem';
    const atomItems = [
      'Typography - Text elements, labels, headlines, body text',
      'Icons - Font Awesome icons, status indicator icons',
      'Inputs - Text fields, textareas (bare input elements)',
      'Status Indicators - Icon-only status indicators',
    ];
    atomItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = '0.25rem';
      atomsList.appendChild(li);
    });
    atomsDiv.appendChild(atomsList);
    atomicSection.appendChild(atomsDiv);
    
    // Molecules
    const moleculesDiv = document.createElement('div');
    
    const moleculesTitle = document.createElement('h3');
    moleculesTitle.className = 'h3';
    moleculesTitle.textContent = 'Molecules';
    moleculesTitle.style.marginBottom = '0.5rem';
    moleculesDiv.appendChild(moleculesTitle);
    
    const moleculesDesc = document.createElement('p');
    moleculesDesc.className = 'body2-txt';
    moleculesDesc.style.fontWeight = 'bold';
    moleculesDesc.textContent = 'Component combinations built from atoms:';
    moleculesDesc.style.marginBottom = '0.5rem';
    moleculesDiv.appendChild(moleculesDesc);
    
    const moleculesList = document.createElement('ul');
    moleculesList.className = 'body2-txt';
    moleculesList.style.paddingLeft = '1.5rem';
    const moleculeItems = [
      'Button - Text + icon + container + styling',
      'Checkbox - Input + label',
      'Alert - Title + text + dismiss button',
      'Status Tag - Icon + text combination',
      'Competency Pill - Text + styling container',
    ];
    moleculeItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = '0.25rem';
      moleculesList.appendChild(li);
    });
    moleculesDiv.appendChild(moleculesList);
    atomicSection.appendChild(moleculesDiv);
    
    container.appendChild(atomicSection);
    
    // Usage Section
    const usageSection = document.createElement('section');
    usageSection.style.marginBottom = '2rem';
    
    const usageTitle = document.createElement('h2');
    usageTitle.className = 'h2';
    usageTitle.textContent = 'Using This Playground';
    usageTitle.style.marginBottom = '1rem';
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
      itemDiv.style.marginBottom = '1rem';
      
      const itemTitle = document.createElement('h3');
      itemTitle.className = 'h4';
      itemTitle.textContent = item.title;
      itemTitle.style.marginBottom = '0.5rem';
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
    tokensSection.style.marginBottom = '2rem';
    
    const tokensTitle = document.createElement('h2');
    tokensTitle.className = 'h2';
    tokensTitle.textContent = 'Design Tokens';
    tokensTitle.style.marginBottom = '1rem';
    tokensSection.appendChild(tokensTitle);
    
    const tokensDesc = document.createElement('p');
    tokensDesc.className = 'body2-txt';
    tokensDesc.textContent = 'All components use semantic design tokens from the PLUS design system:';
    tokensDesc.style.marginBottom = '0.5rem';
    tokensSection.appendChild(tokensDesc);
    
    const tokensList = document.createElement('ul');
    tokensList.className = 'body2-txt';
    tokensList.style.paddingLeft = '1.5rem';
    const tokenItems = [
      'Colors - Material Design 3 color system',
      'Spacing - Semantic spacing tokens',
      'Typography - Text size and weight tokens',
      'Layout - Container and layout tokens',
    ];
    tokenItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.marginBottom = '0.25rem';
      tokensList.appendChild(li);
    });
    tokensSection.appendChild(tokensList);
    
    container.appendChild(tokensSection);
    
    // Getting Started Section
    const gettingStartedSection = document.createElement('section');
    
    const gettingStartedTitle = document.createElement('h2');
    gettingStartedTitle.className = 'h2';
    gettingStartedTitle.textContent = 'Getting Started';
    gettingStartedTitle.style.marginBottom = '1rem';
    gettingStartedSection.appendChild(gettingStartedTitle);
    
    const stepsList = document.createElement('ol');
    stepsList.className = 'body2-txt';
    stepsList.style.paddingLeft = '1.5rem';
    const steps = [
      'Browse components by category (Atoms → Molecules)',
      'Select a component to view its variations',
      'Use controls to test different configurations',
      'Copy code examples for your prototypes',
    ];
    steps.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      li.style.marginBottom = '0.5rem';
      stepsList.appendChild(li);
    });
    gettingStartedSection.appendChild(stepsList);
    
    container.appendChild(gettingStartedSection);
    
    return container;
  },
};

