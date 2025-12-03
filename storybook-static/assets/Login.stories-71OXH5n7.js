const m={title:"Specs/Login",tags:["autodocs"],parameters:{docs:{description:{component:"Login organism - higher-level components for authentication flows. Navigate to each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) to see individual components."}}}},a={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const i=document.createElement("h1");i.className="h1",i.textContent="Login Organism",i.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(i);const s=document.createElement("p");s.className="body1-txt",s.textContent="The Login organism combines multiple components to create complete login/authentication experiences. It is organized into the following categories, each with its own Storybook page:",s.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(s);const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",[{name:"Elements",description:"Individual form elements and UI components (dropdowns, forms, buttons, alerts, footer)",path:"Organisms/Login/Elements"},{name:"Cards",description:"Card components containing login forms (login portal with various steps)",path:"Organisms/Login/Cards"},{name:"Tables",description:"Table components used in login contexts (currently empty)",path:"Organisms/Login/Tables"},{name:"Modals",description:"Modal dialogs for notifications and other interactions",path:"Organisms/Login/Modals"},{name:"Sections",description:"Section-level components (currently empty)",path:"Organisms/Login/Sections"},{name:"Pages",description:"Complete page-level components (sign-in portal)",path:"Organisms/Login/Pages"}].forEach(d=>{const t=document.createElement("div");t.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",t.style.border="1px solid var(--color-outline-variant)",t.style.borderRadius="var(--size-card-radius-sm)",t.style.backgroundColor="var(--color-surface-container)";const r=document.createElement("h3");r.className="h4",r.textContent=d.name,r.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(r);const c=document.createElement("p");c.className="body2-txt",c.textContent=d.description,t.appendChild(c),n.appendChild(t)}),e.appendChild(n);const o=document.createElement("p");return o.className="body2-txt",o.style.marginTop="var(--size-card-gap-lg)",o.style.color="var(--color-on-surface-variant)",o.textContent="Navigate to each category in the sidebar to see the individual components and their stories.",e.appendChild(o),e}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Login Organism';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'The Login organism combines multiple components to create complete login/authentication experiences. It is organized into the following categories, each with its own Storybook page:';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const categoriesList = document.createElement('div');
    categoriesList.style.display = 'flex';
    categoriesList.style.flexDirection = 'column';
    categoriesList.style.gap = 'var(--size-card-gap-md)';
    const categories = [{
      name: 'Elements',
      description: 'Individual form elements and UI components (dropdowns, forms, buttons, alerts, footer)',
      path: 'Organisms/Login/Elements'
    }, {
      name: 'Cards',
      description: 'Card components containing login forms (login portal with various steps)',
      path: 'Organisms/Login/Cards'
    }, {
      name: 'Tables',
      description: 'Table components used in login contexts (currently empty)',
      path: 'Organisms/Login/Tables'
    }, {
      name: 'Modals',
      description: 'Modal dialogs for notifications and other interactions',
      path: 'Organisms/Login/Modals'
    }, {
      name: 'Sections',
      description: 'Section-level components (currently empty)',
      path: 'Organisms/Login/Sections'
    }, {
      name: 'Pages',
      description: 'Complete page-level components (sign-in portal)',
      path: 'Organisms/Login/Pages'
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
}`,...a.parameters?.docs?.source},description:{story:`Overview
Main overview of the Login organism structure`,...a.parameters?.docs?.description}}};const p=["Overview"];export{a as Overview,p as __namedExportsOrder,m as default};
