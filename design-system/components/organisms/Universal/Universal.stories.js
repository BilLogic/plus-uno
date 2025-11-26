/**
 * Universal Organisms
 * Commonly used universal organisms across multiple product pillars
 */

export default {
  title: 'Organisms/Universal',
  tags: ['autodocs'],
};

/**
 * Overview
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Universal Organisms';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Universal organisms are commonly used across multiple product pillars. These include navigation components like the sidebar, top bar, footer, and other universal UI patterns.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    componentsList.style.marginTop = 'var(--size-section-pad-y-md)';
    
    const components = [
      {
        category: 'Elements',
        items: [
          'SidebarTab - Sidebar navigation tab with states',
          'UserAvatar - User avatar with name and notification counter',
          'StaticBadgeSmart - SMART competency area badge'
        ]
      },
      {
        category: 'Sections',
        items: [
          'Sidebar - Navigation sidebar with tutor and supervisor variants',
          'TopBar - Top navigation bar with breadcrumb and user avatar',
          'Footer - Page footer with copyright and version information'
        ]
      }
    ];
    
    components.forEach((category) => {
      const categoryCard = document.createElement('div');
      categoryCard.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      categoryCard.style.border = '1px solid var(--color-outline-variant)';
      categoryCard.style.borderRadius = 'var(--size-card-radius-sm)';
      categoryCard.style.backgroundColor = 'var(--color-surface-container)';
      
      const categoryName = document.createElement('h3');
      categoryName.className = 'h4';
      categoryName.textContent = category.category;
      categoryName.style.marginBottom = 'var(--size-element-gap-sm)';
      categoryCard.appendChild(categoryName);
      
      const itemsList = document.createElement('ul');
      itemsList.className = 'body2-txt';
      itemsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
      itemsList.style.marginTop = 'var(--size-element-gap-xs)';
      
      category.items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        li.style.marginBottom = 'var(--size-element-gap-xs)';
        itemsList.appendChild(li);
      });
      
      categoryCard.appendChild(itemsList);
      componentsList.appendChild(categoryCard);
    });
    
    container.appendChild(componentsList);
    
    return container;
  },
};

