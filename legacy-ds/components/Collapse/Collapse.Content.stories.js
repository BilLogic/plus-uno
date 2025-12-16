/**
 * Collapse Content Variants Stories
 * 
 * Shows all 3 content variations:
 * 1. Default - Toggle button to show corresponding content. Only one content can be shown at a time.
 * 2. Multiple Target - Each content takes up half of the container width. Both pieces of content can be toggled independently or together.
 * 3. Accordion - Toggle the item name to show/hide corresponding content. Only one content can be shown at a time.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Collapse/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Collapse content variants show different ways to organize and display collapsible content. Each variant has a specific use case and behavior pattern.',
      },
    },
  },
};

/**
 * Default
 * Toggle button to show corresponding content. Only one content can be shown at a time.
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = '511px';
    
    // Button row
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = 'var(--size-section-gap-md)';
    buttonRow.style.width = '100%';
    
    const linkButton = PlusInterface.createButton({
      btnId: 'default-link',
      btnText: 'Link with href',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      btnLink: '#default-collapse-card'
    });
    linkButton.setAttribute('data-toggle', 'collapse');
    linkButton.setAttribute('data-target', '#default-collapse-card');
    linkButton.setAttribute('aria-expanded', 'false');
    linkButton.setAttribute('aria-controls', 'default-collapse-card');
    linkButton.classList.add('collapsed');
    buttonRow.appendChild(linkButton);
    
    const targetButton = PlusInterface.createButton({
      btnId: 'default-target',
      btnText: 'Button with data-target',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    targetButton.setAttribute('data-toggle', 'collapse');
    targetButton.setAttribute('data-target', '#default-collapse-card');
    targetButton.setAttribute('aria-expanded', 'false');
    targetButton.setAttribute('aria-controls', 'default-collapse-card');
    targetButton.classList.add('collapsed');
    buttonRow.appendChild(targetButton);
    
    container.appendChild(buttonRow);
    
    const card = PlusInterface.createCard({
      id: 'default-collapse-card',
      body: 'Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm', // Will override with modal-radius-lg
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse']
    });
    // Override radius to use modal-radius-lg (12px) for default type
    card.style.borderRadius = 'var(--size-modal-radius-lg)';
    container.appendChild(card);
    
    return container;
  },
};

/**
 * Multiple Target
 * Each content takes up half of the container width. Both pieces of content can be toggled independently or together.
 */
export const MultipleTarget = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = '511px';
    
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = 'var(--size-section-gap-md)';
    buttonRow.style.width = '100%';
    
    const firstButton = PlusInterface.createButton({
      btnId: 'multi-first',
      btnText: 'Toggle first element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    firstButton.setAttribute('data-toggle', 'collapse');
    firstButton.setAttribute('data-target', '#multi-collapse-1');
    firstButton.setAttribute('aria-expanded', 'false');
    firstButton.setAttribute('aria-controls', 'multi-collapse-1');
    firstButton.classList.add('collapsed');
    buttonRow.appendChild(firstButton);
    
    const secondButton = PlusInterface.createButton({
      btnId: 'multi-second',
      btnText: 'Toggle second element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    secondButton.setAttribute('data-toggle', 'collapse');
    secondButton.setAttribute('data-target', '#multi-collapse-2');
    secondButton.setAttribute('aria-expanded', 'false');
    secondButton.setAttribute('aria-controls', 'multi-collapse-2');
    secondButton.classList.add('collapsed');
    buttonRow.appendChild(secondButton);
    
    const bothButton = PlusInterface.createButton({
      btnId: 'multi-both',
      btnText: 'Toggle both element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    bothButton.setAttribute('data-toggle', 'collapse');
    bothButton.setAttribute('data-target', '#multi-collapse-1,#multi-collapse-2');
    bothButton.setAttribute('aria-expanded', 'false');
    bothButton.classList.add('collapsed');
    buttonRow.appendChild(bothButton);
    
    container.appendChild(buttonRow);
    
    const cardRow = document.createElement('div');
    cardRow.style.display = 'flex';
    cardRow.style.gap = 'var(--size-section-gap-md)';
    cardRow.style.width = '100%';
    
    const firstCard = PlusInterface.createCard({
      id: 'multi-collapse-1',
      body: 'Some placeholder content for the first collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md',
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: { flex: '1 1 0', minWidth: 0 }
    });
    cardRow.appendChild(firstCard);
    
    const secondCard = PlusInterface.createCard({
      id: 'multi-collapse-2',
      body: 'Some placeholder content for the second collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md',
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: { flex: '1 1 0', minWidth: 0 }
    });
    cardRow.appendChild(secondCard);
    
    container.appendChild(cardRow);
    
    return container;
  },
};

/**
 * Accordion
 * Toggle the item name to show/hide corresponding content. Only one content can be shown at a time.
 */
export const Accordion = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.width = '511px';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const items = [
      { id: 'acc-1', title: 'Collapsible Group Item #1', content: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.' },
      { id: 'acc-2', title: 'Collapsible Group Item #2', content: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.' },
      { id: 'acc-3', title: 'Collapsible Group Item #3', content: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.' }
    ];
    
    items.forEach((item, index) => {
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.height = '48px';
      header.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      header.style.backgroundColor = 'var(--color-surface-container-high)';
      header.style.cursor = 'pointer';
      header.setAttribute('data-toggle', 'collapse');
      header.setAttribute('data-target', `#${item.id}-content`);
      header.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
      header.setAttribute('aria-controls', `${item.id}-content`);
      if (index !== 0) {
        header.classList.add('collapsed');
      }
      
      const headerText = document.createElement('div');
      headerText.className = 'body1-txt';
      headerText.style.color = 'var(--color-primary)';
      headerText.style.fontWeight = 'var(--font-weight-normal)';
      headerText.textContent = item.title;
      header.appendChild(headerText);
      
      container.appendChild(header);
      
      if (index > 0) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        container.appendChild(divider);
      }
      
      const contentPanel = document.createElement('div');
      contentPanel.id = `${item.id}-content`;
      contentPanel.classList.add('collapse');
      if (index === 0) {
        contentPanel.classList.add('show');
      }
      contentPanel.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      contentPanel.style.backgroundColor = 'var(--color-surface)';
      contentPanel.setAttribute('aria-labelledby', item.id);
      
      const contentText = document.createElement('div');
      contentText.className = 'body1-txt';
      contentText.style.color = 'var(--color-on-surface-variant)';
      contentText.style.fontWeight = 'var(--font-weight-normal)';
      contentText.textContent = item.content;
      contentPanel.appendChild(contentText);
      
      container.appendChild(contentPanel);
      
      if (index < items.length - 1) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        container.appendChild(divider);
      }
    });
    
    return container;
  },
};

