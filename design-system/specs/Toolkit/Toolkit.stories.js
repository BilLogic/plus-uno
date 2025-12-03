/**
 * Toolkit Organism - Main Overview Story
 * 
 * This organism combines multiple components to create complete toolkit experiences.
 * 
 * ## Structure
 * 
 * The Toolkit organism is organized into the following categories:
 * 
 * - **Elements**: Individual form elements and UI components (buttons, dropdowns, ratings, badges, filters, etc.)
 * - **Cards**: Card components (call-off alerts)
 * - **Tables**: Table components (my sessions, call-offs, sign-ups, reflections, schedule rows, student lists)
 * - **Modals**: Modal dialogs (view tutors, session sign-up, call-off details, session details, fill-in, assignments, etc.)
 * - **Sections**: Section-level components (side nav bar, forms, overview cards)
 * - **Pages**: Complete page-level components (session info, form feedback, steps, call-offs, sign-ups, reflections, my sessions, dashboards)
 * 
 * Each category has its own Storybook page for easy navigation.
 * 
 * See STRUCTURE.md for detailed component breakdown.
 */

export default {
  title: 'Specs/Toolkit',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Toolkit organism - higher-level components for sessions, sign-ups, call-offs, reflections, and student management. Navigate to each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) to see individual components.',
      },
    },
  },
};

/**
 * Overview
 * Main overview of the Toolkit organism structure
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Toolkit Organism';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'The Toolkit organism combines multiple components to create complete toolkit experiences. It is organized into the following categories, each with its own Storybook page:';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const categoriesList = document.createElement('div');
    categoriesList.style.display = 'flex';
    categoriesList.style.flexDirection = 'column';
    categoriesList.style.gap = 'var(--size-card-gap-md)';
    
    const categories = [
      {
        name: 'Elements',
        description: 'Individual form elements and UI components (buttons, dropdowns, ratings, badges, filters, attendance components, etc.)',
        path: 'Organisms/Toolkit/Elements',
      },
      {
        name: 'Cards',
        description: 'Card components (call-off alerts)',
        path: 'Organisms/Toolkit/Cards',
      },
      {
        name: 'Tables',
        description: 'Table components (my sessions, call-offs, sign-ups, reflections, schedule rows, student lists)',
        path: 'Organisms/Toolkit/Tables',
      },
      {
        name: 'Modals',
        description: 'Modal dialogs (view tutors, session sign-up, call-off details, session details, fill-in, assignments, etc.)',
        path: 'Organisms/Toolkit/Modals',
      },
      {
        name: 'Sections',
        description: 'Section-level components (side nav bar, forms, overview cards)',
        path: 'Organisms/Toolkit/Sections',
      },
      {
        name: 'Pages',
        description: 'Complete page-level components (session info, form feedback, steps, call-offs, sign-ups, reflections, my sessions, dashboards)',
        path: 'Organisms/Toolkit/Pages',
      },
    ];
    
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
      
      const categoryDesc = document.createElement('p');
      categoryDesc.className = 'body2-txt';
      categoryDesc.textContent = category.description;
      categoryCard.appendChild(categoryDesc);
      
      categoriesList.appendChild(categoryCard);
    });
    
    container.appendChild(categoriesList);
    
    const navigationNote = document.createElement('p');
    navigationNote.className = 'body2-txt';
    navigationNote.style.marginTop = 'var(--size-card-gap-lg)';
    navigationNote.style.color = 'var(--color-on-surface-variant)';
    navigationNote.textContent = 'Navigate to each category in the sidebar to see the individual components and their stories.';
    container.appendChild(navigationNote);
    
    return container;
  },
};

