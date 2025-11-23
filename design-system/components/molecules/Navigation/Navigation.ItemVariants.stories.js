/**
 * Navigation Item Variants Stories
 * Individual item variants organized under "Item Variants" subcategory
 * Shows Tab Item, Pill Item, Tab Item Dropdown, and Pill Item Dropdown with all states
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Navigation/Item Variants',
  tags: ['autodocs'],
};

/**
 * Tab Item - Default State
 * Unselected tab item in default state
 */
export const TabItemDefault = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { text: 'Tab', selected: false }
    ],
    type: 'tabs',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Tab Item - Selected State
 * Selected tab item in default state
 */
export const TabItemSelected = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { text: 'Tab', selected: true }
    ],
    type: 'tabs',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Tab Item - Disabled State
 * Disabled tab item
 */
export const TabItemDisabled = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { text: 'Tab', selected: false, disabled: true }
    ],
    type: 'tabs',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Tab Item Dropdown - Default State
 * Unselected tab item with dropdown in default state
 */
export const TabItemDropdownDefault = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { 
        text: 'Dropdown', 
        selected: false,
        dropdownItems: [
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') },
          { text: 'Option 3', href: '#', onClick: () => console.log('Option 3') }
        ]
      }
    ],
    type: 'tabs',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Tab Item Dropdown - Selected State
 * Selected tab item with dropdown
 */
export const TabItemDropdownSelected = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { 
        text: 'Dropdown', 
        selected: true,
        dropdownItems: [
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') },
          { text: 'Option 3', href: '#', onClick: () => console.log('Option 3') }
        ]
      }
    ],
    type: 'tabs',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Tab Item Dropdown - Disabled State
 * Disabled tab item with dropdown
 */
export const TabItemDropdownDisabled = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { 
        text: 'Dropdown', 
        selected: false,
        disabled: true,
        dropdownItems: [
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
        ]
      }
    ],
    type: 'tabs',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Pill Item - Default State
 * Unselected pill item in default state
 */
export const PillItemDefault = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { text: 'Pill', selected: false }
    ],
    type: 'pills',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Pill Item - Selected State
 * Selected pill item in default state
 */
export const PillItemSelected = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { text: 'Pill', selected: true }
    ],
    type: 'pills',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Pill Item - Disabled State
 * Disabled pill item
 */
export const PillItemDisabled = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { text: 'Pill', selected: false, disabled: true }
    ],
    type: 'pills',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Pill Item Dropdown - Default State
 * Unselected pill item with dropdown in default state
 */
export const PillItemDropdownDefault = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { 
        text: 'Dropdown', 
        selected: false,
        dropdownItems: [
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') },
          { text: 'Option 3', href: '#', onClick: () => console.log('Option 3') }
        ]
      }
    ],
    type: 'pills',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Pill Item Dropdown - Selected State
 * Selected pill item with dropdown
 */
export const PillItemDropdownSelected = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { 
        text: 'Dropdown', 
        selected: true,
        dropdownItems: [
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') },
          { text: 'Option 3', href: '#', onClick: () => console.log('Option 3') }
        ]
      }
    ],
    type: 'pills',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * Pill Item Dropdown - Disabled State
 * Disabled pill item with dropdown
 */
export const PillItemDropdownDisabled = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const nav = PlusInterface.createNavigation({
    items: [
      { 
        text: 'Dropdown', 
        selected: false,
        disabled: true,
        dropdownItems: [
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
        ]
      }
    ],
    type: 'pills',
    alignment: 'left'
  });
  
  container.appendChild(nav);
  return container;
};

/**
 * All Item Variants
 * Shows all item variants side by side for comparison
 */
export const AllItemVariants = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  // Tab Items
  const tabSection = document.createElement('div');
  const tabLabel = document.createElement('h3');
  tabLabel.textContent = 'Tab Items';
  tabLabel.style.marginBottom = '24px';
  tabSection.appendChild(tabLabel);
  
  const tabContainer = document.createElement('div');
  tabContainer.style.display = 'flex';
  tabContainer.style.flexDirection = 'column';
  tabContainer.style.gap = '24px';
  
  // Tab - Default
  const tabDefault = PlusInterface.createNavigation({
    items: [{ text: 'Tab', selected: false }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDefaultLabel = document.createElement('div');
  tabDefaultLabel.className = 'body2-txt';
  tabDefaultLabel.textContent = 'Default';
  tabDefaultLabel.style.marginBottom = '8px';
  tabContainer.appendChild(tabDefaultLabel);
  tabContainer.appendChild(tabDefault);
  
  // Tab - Selected
  const tabSelected = PlusInterface.createNavigation({
    items: [{ text: 'Tab', selected: true }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabSelectedLabel = document.createElement('div');
  tabSelectedLabel.className = 'body2-txt';
  tabSelectedLabel.textContent = 'Selected';
  tabSelectedLabel.style.marginBottom = '8px';
  tabContainer.appendChild(tabSelectedLabel);
  tabContainer.appendChild(tabSelected);
  
  // Tab - Disabled
  const tabDisabled = PlusInterface.createNavigation({
    items: [{ text: 'Tab', selected: false, disabled: true }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDisabledLabel = document.createElement('div');
  tabDisabledLabel.className = 'body2-txt';
  tabDisabledLabel.textContent = 'Disabled';
  tabDisabledLabel.style.marginBottom = '8px';
  tabContainer.appendChild(tabDisabledLabel);
  tabContainer.appendChild(tabDisabled);
  
  tabSection.appendChild(tabContainer);
  container.appendChild(tabSection);
  
  // Tab Item Dropdowns
  const tabDropdownSection = document.createElement('div');
  const tabDropdownLabel = document.createElement('h3');
  tabDropdownLabel.textContent = 'Tab Item Dropdowns';
  tabDropdownLabel.style.marginBottom = '24px';
  tabDropdownSection.appendChild(tabDropdownLabel);
  
  const tabDropdownContainer = document.createElement('div');
  tabDropdownContainer.style.display = 'flex';
  tabDropdownContainer.style.flexDirection = 'column';
  tabDropdownContainer.style.gap = '24px';
  
  // Tab Dropdown - Default
  const tabDropdownDefault = PlusInterface.createNavigation({
    items: [{ 
      text: 'Dropdown', 
      selected: false,
      dropdownItems: [
        { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
        { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
      ]
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDropdownDefaultLabel = document.createElement('div');
  tabDropdownDefaultLabel.className = 'body2-txt';
  tabDropdownDefaultLabel.textContent = 'Default';
  tabDropdownDefaultLabel.style.marginBottom = '8px';
  tabDropdownContainer.appendChild(tabDropdownDefaultLabel);
  tabDropdownContainer.appendChild(tabDropdownDefault);
  
  // Tab Dropdown - Selected
  const tabDropdownSelected = PlusInterface.createNavigation({
    items: [{ 
      text: 'Dropdown', 
      selected: true,
      dropdownItems: [
        { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
        { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
      ]
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDropdownSelectedLabel = document.createElement('div');
  tabDropdownSelectedLabel.className = 'body2-txt';
  tabDropdownSelectedLabel.textContent = 'Selected';
  tabDropdownSelectedLabel.style.marginBottom = '8px';
  tabDropdownContainer.appendChild(tabDropdownSelectedLabel);
  tabDropdownContainer.appendChild(tabDropdownSelected);
  
  // Tab Dropdown - Disabled
  const tabDropdownDisabled = PlusInterface.createNavigation({
    items: [{ 
      text: 'Dropdown', 
      selected: false,
      disabled: true,
      dropdownItems: [
        { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
        { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
      ]
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDropdownDisabledLabel = document.createElement('div');
  tabDropdownDisabledLabel.className = 'body2-txt';
  tabDropdownDisabledLabel.textContent = 'Disabled';
  tabDropdownDisabledLabel.style.marginBottom = '8px';
  tabDropdownContainer.appendChild(tabDropdownDisabledLabel);
  tabDropdownContainer.appendChild(tabDropdownDisabled);
  
  tabDropdownSection.appendChild(tabDropdownContainer);
  container.appendChild(tabDropdownSection);
  
  // Pill Items
  const pillSection = document.createElement('div');
  const pillLabel = document.createElement('h3');
  pillLabel.textContent = 'Pill Items';
  pillLabel.style.marginBottom = '24px';
  pillSection.appendChild(pillLabel);
  
  const pillContainer = document.createElement('div');
  pillContainer.style.display = 'flex';
  pillContainer.style.flexDirection = 'column';
  pillContainer.style.gap = '24px';
  
  // Pill - Default
  const pillDefault = PlusInterface.createNavigation({
    items: [{ text: 'Pill', selected: false }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDefaultLabel = document.createElement('div');
  pillDefaultLabel.className = 'body2-txt';
  pillDefaultLabel.textContent = 'Default';
  pillDefaultLabel.style.marginBottom = '8px';
  pillContainer.appendChild(pillDefaultLabel);
  pillContainer.appendChild(pillDefault);
  
  // Pill - Selected
  const pillSelected = PlusInterface.createNavigation({
    items: [{ text: 'Pill', selected: true }],
    type: 'pills',
    alignment: 'left'
  });
  const pillSelectedLabel = document.createElement('div');
  pillSelectedLabel.className = 'body2-txt';
  pillSelectedLabel.textContent = 'Selected';
  pillSelectedLabel.style.marginBottom = '8px';
  pillContainer.appendChild(pillSelectedLabel);
  pillContainer.appendChild(pillSelected);
  
  // Pill - Disabled
  const pillDisabled = PlusInterface.createNavigation({
    items: [{ text: 'Pill', selected: false, disabled: true }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDisabledLabel = document.createElement('div');
  pillDisabledLabel.className = 'body2-txt';
  pillDisabledLabel.textContent = 'Disabled';
  pillDisabledLabel.style.marginBottom = '8px';
  pillContainer.appendChild(pillDisabledLabel);
  pillContainer.appendChild(pillDisabled);
  
  pillSection.appendChild(pillContainer);
  container.appendChild(pillSection);
  
  // Pill Item Dropdowns
  const pillDropdownSection = document.createElement('div');
  const pillDropdownLabel = document.createElement('h3');
  pillDropdownLabel.textContent = 'Pill Item Dropdowns';
  pillDropdownLabel.style.marginBottom = '24px';
  pillDropdownSection.appendChild(pillDropdownLabel);
  
  const pillDropdownContainer = document.createElement('div');
  pillDropdownContainer.style.display = 'flex';
  pillDropdownContainer.style.flexDirection = 'column';
  pillDropdownContainer.style.gap = '24px';
  
  // Pill Dropdown - Default
  const pillDropdownDefault = PlusInterface.createNavigation({
    items: [{ 
      text: 'Dropdown', 
      selected: false,
      dropdownItems: [
        { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
        { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
      ]
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDropdownDefaultLabel = document.createElement('div');
  pillDropdownDefaultLabel.className = 'body2-txt';
  pillDropdownDefaultLabel.textContent = 'Default';
  pillDropdownDefaultLabel.style.marginBottom = '8px';
  pillDropdownContainer.appendChild(pillDropdownDefaultLabel);
  pillDropdownContainer.appendChild(pillDropdownDefault);
  
  // Pill Dropdown - Selected
  const pillDropdownSelected = PlusInterface.createNavigation({
    items: [{ 
      text: 'Dropdown', 
      selected: true,
      dropdownItems: [
        { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
        { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
      ]
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDropdownSelectedLabel = document.createElement('div');
  pillDropdownSelectedLabel.className = 'body2-txt';
  pillDropdownSelectedLabel.textContent = 'Selected';
  pillDropdownSelectedLabel.style.marginBottom = '8px';
  pillDropdownContainer.appendChild(pillDropdownSelectedLabel);
  pillDropdownContainer.appendChild(pillDropdownSelected);
  
  // Pill Dropdown - Disabled
  const pillDropdownDisabled = PlusInterface.createNavigation({
    items: [{ 
      text: 'Dropdown', 
      selected: false,
      disabled: true,
      dropdownItems: [
        { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
        { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
      ]
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDropdownDisabledLabel = document.createElement('div');
  pillDropdownDisabledLabel.className = 'body2-txt';
  pillDropdownDisabledLabel.textContent = 'Disabled';
  pillDropdownDisabledLabel.style.marginBottom = '8px';
  pillDropdownContainer.appendChild(pillDropdownDisabledLabel);
  pillDropdownContainer.appendChild(pillDropdownDisabled);
  
  pillDropdownSection.appendChild(pillDropdownContainer);
  container.appendChild(pillDropdownSection);
  
  return container;
};






