/**
 * Collapse Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Collapse components are **Element** components used to show and hide content through a clickable trigger.
 * They allow users to expand or collapse sections of content to save space and organize information.
 * 
 * ### When to Use
 * - **Progressive disclosure**: When you want to hide detailed information until the user needs it
 * - **FAQ sections**: For frequently asked questions where answers can be expanded
 * - **Accordions**: For organizing related content into collapsible sections
 * - **Long content**: When content is lengthy and you want to reduce initial visual clutter
 * - **Settings panels**: For organizing settings into collapsible groups
 * - **Navigation menus**: For nested navigation items that can be expanded/collapsed
 * - **Details sections**: For showing additional details on demand
 * 
 * ### When NOT to Use
 * - **Critical information**: Don't hide information that users need to see immediately
 * - **Short content**: If content is very short, consider showing it directly
 * - **Primary actions**: Don't hide primary actions or important content behind a collapse
 * - **Modal content**: Use modals for pop-up windows, not collapse
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's collapse functionality
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-md`, `--size-element-pad-y-md`
 *   - Gap: `--size-element-gap-lg` (12px between buttons and content)
 *   - Typography: Uses body1-txt class for content
 *   - Colors: `--color-on-surface` for text, `--color-primary` for buttons
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/collapse/
 * 
 * ### Type Variants
 * - **default**: Toggle button to show corresponding content. Only one content can be shown at a time.
 * - **multiple target**: Each content takes up half of the container width. Both pieces of content can be toggled independently or together.
 * - **accordion**: Toggle the item name to show/hide corresponding content. Only one content can be shown at a time.
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Collapse',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Collapse component for showing and hiding content through a clickable trigger. Built on Bootstrap 4.6.2 collapse functionality with PLUS design token customizations. Supports three types: default, multiple target, and accordion.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all three collapse types exactly as shown in Figma design system
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = '511px';
    
    // ============================================
    // DEFAULT TYPE
    // ============================================
    const defaultSection = document.createElement('div');
    defaultSection.style.display = 'flex';
    defaultSection.style.flexDirection = 'column';
    defaultSection.style.gap = 'var(--size-element-gap-lg)'; // 12px gap between buttons and content
    
    // Button row
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = 'var(--size-section-gap-md)'; // 16px gap between buttons
    buttonRow.style.width = '100%';
    
    // Link with href button
    const linkButton = PlusInterface.createButton({
      btnId: 'default-link-button',
      btnText: 'Link with href',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      btnLink: '#default-collapse'
    });
    linkButton.setAttribute('data-toggle', 'collapse');
    linkButton.setAttribute('data-target', '#default-collapse');
    linkButton.setAttribute('aria-expanded', 'false');
    linkButton.setAttribute('aria-controls', 'default-collapse');
    linkButton.classList.add('collapsed');
    buttonRow.appendChild(linkButton);
    
    // Button with data-target
    const targetButton = PlusInterface.createButton({
      btnId: 'default-target-button',
      btnText: 'Button with data-target',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    targetButton.setAttribute('data-toggle', 'collapse');
    targetButton.setAttribute('data-target', '#default-collapse');
    targetButton.setAttribute('aria-expanded', 'false');
    targetButton.setAttribute('aria-controls', 'default-collapse');
    targetButton.classList.add('collapsed');
    buttonRow.appendChild(targetButton);
    
    defaultSection.appendChild(buttonRow);
    
    // Collapsible card content
    const defaultCard = PlusInterface.createCard({
      id: 'default-collapse',
      body: 'Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm', // Will override with modal-radius-lg
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse']
    });
    // Override radius to use modal-radius-lg (12px) for default type
    defaultCard.style.borderRadius = 'var(--size-modal-radius-lg)';
    defaultSection.appendChild(defaultCard);
    
    container.appendChild(defaultSection);
    
    // ============================================
    // MULTIPLE TARGET TYPE
    // ============================================
    const multipleSection = document.createElement('div');
    multipleSection.style.display = 'flex';
    multipleSection.style.flexDirection = 'column';
    multipleSection.style.gap = 'var(--size-element-gap-lg)'; // 12px gap between buttons and content
    
    // Button row with three buttons
    const multipleButtonRow = document.createElement('div');
    multipleButtonRow.style.display = 'flex';
    multipleButtonRow.style.gap = 'var(--size-section-gap-md)'; // 16px gap between buttons
    multipleButtonRow.style.width = '100%';
    
    // Toggle first element button
    const firstButton = PlusInterface.createButton({
      btnId: 'multiple-first-button',
      btnText: 'Toggle first element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    firstButton.setAttribute('data-toggle', 'collapse');
    firstButton.setAttribute('data-target', '#multiple-collapse-1');
    firstButton.setAttribute('aria-expanded', 'false');
    firstButton.setAttribute('aria-controls', 'multiple-collapse-1');
    firstButton.classList.add('collapsed');
    multipleButtonRow.appendChild(firstButton);
    
    // Toggle second element button
    const secondButton = PlusInterface.createButton({
      btnId: 'multiple-second-button',
      btnText: 'Toggle second element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    secondButton.setAttribute('data-toggle', 'collapse');
    secondButton.setAttribute('data-target', '#multiple-collapse-2');
    secondButton.setAttribute('aria-expanded', 'false');
    secondButton.setAttribute('aria-controls', 'multiple-collapse-2');
    secondButton.classList.add('collapsed');
    multipleButtonRow.appendChild(secondButton);
    
    // Toggle both element button
    const bothButton = PlusInterface.createButton({
      btnId: 'multiple-both-button',
      btnText: 'Toggle both element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    bothButton.setAttribute('data-toggle', 'collapse');
    bothButton.setAttribute('data-target', '#multiple-collapse-1,#multiple-collapse-2');
    bothButton.setAttribute('aria-expanded', 'false');
    bothButton.classList.add('collapsed');
    multipleButtonRow.appendChild(bothButton);
    
    multipleSection.appendChild(multipleButtonRow);
    
    // Two cards side-by-side
    const cardRow = document.createElement('div');
    cardRow.style.display = 'flex';
    cardRow.style.gap = 'var(--size-section-gap-md)'; // 16px gap between cards
    cardRow.style.width = '100%';
    
    // First card
    const firstCard = PlusInterface.createCard({
      id: 'multiple-collapse-1',
      body: 'Some placeholder content for the first collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md', // 16px radius (card-radius-md)
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: { flex: '1 1 0', minWidth: 0 }
    });
    cardRow.appendChild(firstCard);
    
    // Second card
    const secondCard = PlusInterface.createCard({
      id: 'multiple-collapse-2',
      body: 'Some placeholder content for the second collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md', // 16px radius (card-radius-md)
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: { flex: '1 1 0', minWidth: 0 }
    });
    cardRow.appendChild(secondCard);
    
    multipleSection.appendChild(cardRow);
    container.appendChild(multipleSection);
    
    // ============================================
    // ACCORDION TYPE
    // ============================================
    const accordionSection = document.createElement('div');
    accordionSection.style.display = 'flex';
    accordionSection.style.flexDirection = 'column';
    accordionSection.style.width = '100%';
    
    const accordionItems = [
      { id: 'accordion-1', title: 'Collapsible Group Item #1', content: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.' },
      { id: 'accordion-2', title: 'Collapsible Group Item #2', content: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.' },
      { id: 'accordion-3', title: 'Collapsible Group Item #3', content: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.' }
    ];
    
    accordionItems.forEach((item, index) => {
      // Header (trigger)
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.height = '48px';
      header.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)'; // 12px vertical, 20px horizontal
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
      
      accordionSection.appendChild(header);
      
      // Divider (only if not first item)
      if (index > 0) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        accordionSection.appendChild(divider);
      }
      
      // Content panel
      const contentPanel = document.createElement('div');
      contentPanel.id = `${item.id}-content`;
      contentPanel.classList.add('collapse');
      if (index === 0) {
        contentPanel.classList.add('show');
      }
      contentPanel.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)'; // 12px vertical, 20px horizontal
      contentPanel.style.backgroundColor = 'var(--color-surface)';
      contentPanel.setAttribute('aria-labelledby', item.id);
      
      const contentText = document.createElement('div');
      contentText.className = 'body1-txt';
      contentText.style.color = 'var(--color-on-surface-variant)';
      contentText.style.fontWeight = 'var(--font-weight-normal)';
      contentText.textContent = item.content;
      contentPanel.appendChild(contentText);
      
      accordionSection.appendChild(contentPanel);
      
      // Divider after content (except last item)
      if (index < accordionItems.length - 1) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        accordionSection.appendChild(divider);
      }
    });
    
    container.appendChild(accordionSection);
    
    return container;
  },
};

/**
 * Default Type
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
 * Multiple Target Type
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
 * Accordion Type
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
