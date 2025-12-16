/**
 * Toolkit Organism - Elements
 * 
 * Individual form elements and UI components used in toolkit flows.
 */

export default {
  title: 'Specs/Toolkit/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual form elements and UI components used in toolkit flows. See STRUCTURE.md for complete component list.',
      },
    },
  },
};

export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Toolkit Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in toolkit flows. These components will be implemented and documented here. See STRUCTURE.md for the complete list of elements.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const categories = [
      {
        name: 'Controls & Buttons',
        items: ['Session Control Buttons', 'Reflection Control Buttons', 'Primary Buttons', 'Supervisor Sign-up Management Buttons', 'CTAs (Sign up related, tutor view, supervisor view, Call-offs)'],
      },
      {
        name: 'Dropdowns',
        items: ['Reflection Filter Dropdown', 'Students Dropdown', 'Sessions Dropdown', 'Call-off Form Dropdowns (Reason, Supervisor selection)', 'Attendance Dropdown'],
      },
      {
        name: 'Ratings',
        items: ['Student Rating', 'Self Rating', 'Session Rating', 'Form Rating'],
      },
      {
        name: 'Badges',
        items: ['Tutor/Student Type Badge', 'Headcount Status Badge', 'Session Status Badges', 'Call-off Status Badges', 'Reflection Status Badges', 'School Badge', 'Tutor Badges', 'Student Badges'],
      },
      {
        name: 'Form Components',
        items: ['Call-off Form Text Inputs', 'Consent Form Input Group Checkbox', 'Filters (timeframe, call-off type, site, days, capacity, completion)'],
      },
      {
        name: 'Cards & Items',
        items: ['Student Table Item', 'Student Card Item', 'Assignment Cards', 'Session Info Card'],
      },
      {
        name: 'Actions & Feedback',
        items: ['Copy Button', 'Session Actions', 'Toast/Reminder', 'Attendance List Items'],
      },
    ];
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    categories.forEach((category) => {
      const categoryCard = document.createElement('div');
      categoryCard.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      categoryCard.style.border = '1px solid var(--color-outline-variant)';
      categoryCard.style.borderRadius = 'var(--size-card-radius-sm)';
      categoryCard.style.backgroundColor = 'var(--color-surface-container)';
      
      const categoryName = document.createElement('h3');
      categoryName.className = 'h4';
      categoryName.textContent = category.name;
      categoryName.style.marginBottom = 'var(--size-element-gap-sm)';
      categoryCard.appendChild(categoryName);
      
      const itemsList = document.createElement('ul');
      itemsList.className = 'body2-txt';
      itemsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
      
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

