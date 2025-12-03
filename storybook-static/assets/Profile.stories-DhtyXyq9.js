const m={title:"Specs/Profile",tags:["autodocs"],parameters:{docs:{description:{component:"Profile organism - higher-level components for user profile management and tutor profile selection. Navigate to each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) to see individual components."}}}},o={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const r=document.createElement("h1");r.className="h1",r.textContent="Profile Organism",r.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(r);const s=document.createElement("p");s.className="body1-txt",s.textContent="The Profile organism combines multiple components to create complete profile management experiences. It is organized into the following categories, each with its own Storybook page:",s.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(s);const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",[{name:"Elements",description:"Individual form elements and UI components (tutor profile select dropdown)",path:"Organisms/Profile/Elements"},{name:"Cards",description:"Card components (to be added as needed)",path:"Organisms/Profile/Cards"},{name:"Tables",description:"Table components (to be added as needed)",path:"Organisms/Profile/Tables"},{name:"Modals",description:"Modal dialogs (to be added as needed)",path:"Organisms/Profile/Modals"},{name:"Sections",description:"Section-level components (to be added as needed)",path:"Organisms/Profile/Sections"},{name:"Pages",description:"Complete page-level components (tutor profile page)",path:"Organisms/Profile/Pages"}].forEach(c=>{const t=document.createElement("div");t.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",t.style.border="1px solid var(--color-outline-variant)",t.style.borderRadius="var(--size-card-radius-sm)",t.style.backgroundColor="var(--color-surface-container)";const i=document.createElement("h3");i.className="h4",i.textContent=c.name,i.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(i);const d=document.createElement("p");d.className="body2-txt",d.textContent=c.description,t.appendChild(d),n.appendChild(t)}),e.appendChild(n);const a=document.createElement("p");return a.className="body2-txt",a.style.marginTop="var(--size-card-gap-lg)",a.style.color="var(--color-on-surface-variant)",a.textContent="Navigate to each category in the sidebar to see the individual components and their stories.",e.appendChild(a),e}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Profile Organism';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'The Profile organism combines multiple components to create complete profile management experiences. It is organized into the following categories, each with its own Storybook page:';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const categoriesList = document.createElement('div');
    categoriesList.style.display = 'flex';
    categoriesList.style.flexDirection = 'column';
    categoriesList.style.gap = 'var(--size-card-gap-md)';
    const categories = [{
      name: 'Elements',
      description: 'Individual form elements and UI components (tutor profile select dropdown)',
      path: 'Organisms/Profile/Elements'
    }, {
      name: 'Cards',
      description: 'Card components (to be added as needed)',
      path: 'Organisms/Profile/Cards'
    }, {
      name: 'Tables',
      description: 'Table components (to be added as needed)',
      path: 'Organisms/Profile/Tables'
    }, {
      name: 'Modals',
      description: 'Modal dialogs (to be added as needed)',
      path: 'Organisms/Profile/Modals'
    }, {
      name: 'Sections',
      description: 'Section-level components (to be added as needed)',
      path: 'Organisms/Profile/Sections'
    }, {
      name: 'Pages',
      description: 'Complete page-level components (tutor profile page)',
      path: 'Organisms/Profile/Pages'
    }];
    categories.forEach(category => {
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
  }
}`,...o.parameters?.docs?.source},description:{story:`Overview
Main overview of the Profile organism structure`,...o.parameters?.docs?.description}}};const p=["Overview"];export{o as Overview,p as __namedExportsOrder,m as default};
