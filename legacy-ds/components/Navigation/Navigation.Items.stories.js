/**
 * Navigation Item Variants Stories
 * 
 * Shows all navigation items with their styles (tabs/pills) and states
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navigation/Items',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navigation items are the individual navigation elements. Each item type shows all its styles (tabs and pills) and states (default, selected, disabled).',
      },
    },
  },
};

/**
 * All Items
 * Shows all item types together with both tabs and pills styles
 */
export const AllItems = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const itemTypes = [
      { name: 'TabItem', hasDropdown: false },
      { name: 'TabItemDropdown', hasDropdown: true },
      { name: 'PillItem', hasDropdown: false },
      { name: 'PillItemDropdown', hasDropdown: true },
    ];
    
    const styles = [
      { name: 'Tabs Style', type: 'tabs' },
      { name: 'Pills Style', type: 'pills' },
    ];
    
    itemTypes.forEach((itemType) => {
      const itemSection = document.createElement('div');
      itemSection.style.display = 'flex';
      itemSection.style.flexDirection = 'column';
      itemSection.style.gap = 'var(--size-element-gap-md)';
      
      const itemLabel = document.createElement('div');
      itemLabel.className = 'h4';
      itemLabel.textContent = itemType.name;
      itemLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      itemSection.appendChild(itemLabel);
      
      styles.forEach((style) => {
        const styleSubsection = document.createElement('div');
        styleSubsection.style.display = 'flex';
        styleSubsection.style.flexDirection = 'column';
        styleSubsection.style.gap = 'var(--size-element-gap-xs)';
        
        const styleLabel = document.createElement('div');
        styleLabel.className = 'h6';
        styleLabel.textContent = style.name;
        styleSubsection.appendChild(styleLabel);
        
        const item = {
          text: itemType.hasDropdown ? 'Dropdown' : 'Item',
          selected: false,
          disabled: false,
        };
        
        if (itemType.hasDropdown) {
          item.dropdownItems = [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' }
          ];
        }
        
        const nav = PlusInterface.createNavigation({
          items: [item],
          type: style.type,
          alignment: 'left'
        });
        
        styleSubsection.appendChild(nav);
        itemSection.appendChild(styleSubsection);
      });
      
      container.appendChild(itemSection);
    });
    
    return container;
  },
};





