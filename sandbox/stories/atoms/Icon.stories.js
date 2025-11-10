/**
 * Icon Atom Stories
 * Font Awesome icons and status indicator icons
 */

export default {
  title: 'Atoms/Icon',
  tags: ['autodocs'],
  argTypes: {
    iconName: {
      control: 'text',
      description: 'Font Awesome icon name (without fa- prefix)',
    },
    iconStyle: {
      control: 'select',
      options: ['solid', 'regular'],
      description: 'Icon style',
    },
    iconSize: {
      control: 'select',
      options: ['body1-txt', 'body2-txt', 'body3-txt'],
      description: 'Icon size class (uses typography tokens: --font-size-body1/2/3)',
    },
    iconColor: {
      control: 'select',
      options: [
        'default',
        'color-primary',
        'color-secondary',
        'color-success',
        'color-info',
        'color-warning',
        'color-error',
      ],
      description: 'Icon color class (uses color tokens: --color-primary, --color-secondary, etc.)',
    },
  },
};

/**
 * Basic Icon
 */
export const Default = {
  render: (args) => {
    const icon = document.createElement('i');
    const styleClass = args.iconStyle === 'regular' ? 'far' : 'fas';
    icon.className = `${styleClass} fa-${args.iconName || 'star'} ${args.iconSize || 'body2-txt'} ${args.iconColor !== 'default' ? args.iconColor : ''}`;
    return icon;
  },
  args: {
    iconName: 'star',
    iconStyle: 'solid',
    iconSize: 'body2-txt',
    iconColor: 'default',
  },
};

/**
 * Icon Sizes
 */
export const Sizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const sizes = [
      { class: 'body1-txt', label: 'Body 1' },
      { class: 'body2-txt', label: 'Body 2' },
      { class: 'body3-txt', label: 'Body 3' },
    ];
    
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const icon = document.createElement('i');
      icon.className = `fas fa-star ${size.class}`;
      wrapper.appendChild(icon);
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = size.label;
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Icon Styles
 */
export const Styles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const styles = [
      { class: 'fas', label: 'Solid' },
      { class: 'far', label: 'Regular' },
    ];
    
    styles.forEach((style) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const icon = document.createElement('i');
      icon.className = `${style.class} fa-star body2-txt`;
      wrapper.appendChild(icon);
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = style.label;
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Icon Colors
 */
export const Colors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const colors = [
      { class: '', label: 'Default' },
      { class: 'color-primary', label: 'Primary' },
      { class: 'color-secondary', label: 'Secondary' },
      { class: 'color-success', label: 'Success' },
      { class: 'color-info', label: 'Info' },
      { class: 'color-warning', label: 'Warning' },
      { class: 'color-error', label: 'Error' },
    ];
    
    colors.forEach((color) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const icon = document.createElement('i');
      icon.className = `fas fa-star body2-txt ${color.class}`;
      wrapper.appendChild(icon);
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = color.label;
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Common Icons
 */
export const CommonIcons = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const icons = [
      'check', 'times', 'plus', 'minus', 'edit', 'trash', 'save', 'cancel',
      'user', 'users', 'home', 'settings', 'search', 'filter', 'download', 'upload',
      'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'chevron-left', 'chevron-right',
      'info', 'question', 'exclamation', 'bell', 'envelope', 'calendar', 'clock',
    ];
    
    icons.forEach((iconName) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const icon = document.createElement('i');
      icon.className = `fas fa-${iconName} body2-txt`;
      wrapper.appendChild(icon);
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = iconName;
      label.style.textAlign = 'center';
      label.style.fontSize = 'var(--font-size-body3)';
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Status Indicator Icons (icon only, no container)
 */
export const StatusIndicators = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const statuses = [
      { icon: 'fa-check-circle', color: 'color-success', label: 'Complete' },
      { icon: 'fa-spinner', color: 'color-warning', label: 'Started' },
      { icon: 'fa-stop-circle', color: 'color-error', label: 'Not Started' },
      { icon: 'fa-check-circle', color: 'color-info', label: 'Assigned' },
    ];
    
    statuses.forEach((status) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const icon = document.createElement('i');
      icon.className = `${status.icon} body2-txt ${status.color}`;
      wrapper.appendChild(icon);
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = status.label;
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

