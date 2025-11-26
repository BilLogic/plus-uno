const l={title:"Specs/Home",tags:["autodocs"],parameters:{docs:{description:{component:"Home organism - higher-level components for home page and dashboard. Navigate to each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) to see individual components."}}}},o={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const s=document.createElement("h1");s.className="h1",s.textContent="Home Organism",s.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(s);const r=document.createElement("p");r.className="body1-txt",r.textContent="The Home organism combines multiple components to create complete home page and dashboard experiences. It is organized into the following categories, each with its own Storybook page:",r.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(r);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-card-gap-md)",[{name:"Elements",description:"Individual form elements and UI components (resource type icons, dropdowns, badges, buttons)",path:"Organisms/Home/Elements"},{name:"Cards",description:"Card components (overview cards, resource cards, metrics cards, data visualization, recommended lessons, training progress)",path:"Organisms/Home/Cards"},{name:"Tables",description:"Table components (to be added as needed)",path:"Organisms/Home/Tables"},{name:"Modals",description:"Modal dialogs (user feedback modal)",path:"Organisms/Home/Modals"},{name:"Sections",description:"Section-level components (homepage jumbotron, bottom div)",path:"Organisms/Home/Sections"},{name:"Pages",description:"Complete page-level components (skills overview, skills home page)",path:"Organisms/Home/Pages"}].forEach(d=>{const t=document.createElement("div");t.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",t.style.border="1px solid var(--color-outline-variant)",t.style.borderRadius="var(--size-card-radius-sm)",t.style.backgroundColor="var(--color-surface-container)";const i=document.createElement("h3");i.className="h4",i.textContent=d.name,i.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(i);const c=document.createElement("p");c.className="body2-txt",c.textContent=d.description,t.appendChild(c),a.appendChild(t)}),e.appendChild(a);const n=document.createElement("p");return n.className="body2-txt",n.style.marginTop="var(--size-card-gap-lg)",n.style.color="var(--color-on-surface-variant)",n.textContent="Navigate to each category in the sidebar to see the individual components and their stories.",e.appendChild(n),e}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Home Organism';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'The Home organism combines multiple components to create complete home page and dashboard experiences. It is organized into the following categories, each with its own Storybook page:';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const categoriesList = document.createElement('div');
    categoriesList.style.display = 'flex';
    categoriesList.style.flexDirection = 'column';
    categoriesList.style.gap = 'var(--size-card-gap-md)';
    const categories = [{
      name: 'Elements',
      description: 'Individual form elements and UI components (resource type icons, dropdowns, badges, buttons)',
      path: 'Organisms/Home/Elements'
    }, {
      name: 'Cards',
      description: 'Card components (overview cards, resource cards, metrics cards, data visualization, recommended lessons, training progress)',
      path: 'Organisms/Home/Cards'
    }, {
      name: 'Tables',
      description: 'Table components (to be added as needed)',
      path: 'Organisms/Home/Tables'
    }, {
      name: 'Modals',
      description: 'Modal dialogs (user feedback modal)',
      path: 'Organisms/Home/Modals'
    }, {
      name: 'Sections',
      description: 'Section-level components (homepage jumbotron, bottom div)',
      path: 'Organisms/Home/Sections'
    }, {
      name: 'Pages',
      description: 'Complete page-level components (skills overview, skills home page)',
      path: 'Organisms/Home/Pages'
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
Main overview of the Home organism structure`,...o.parameters?.docs?.description}}};const p=["Overview"];export{o as Overview,p as __namedExportsOrder,l as default};
