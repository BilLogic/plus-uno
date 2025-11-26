const p={title:"Specs/Profile/Pages",tags:["autodocs"],parameters:{docs:{description:{component:"Complete page-level components for profile management. These are full-page experiences that combine multiple elements, cards, and sections."}}}},o={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const a=document.createElement("h1");a.className="h1",a.textContent="Profile Pages",a.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(a);const s=document.createElement("p");s.className="body1-txt",s.textContent="Complete page-level components for profile management. These components will be implemented and documented here.",s.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(s);const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",[{name:"TutorProfile",description:"Complete tutor profile page that combines all profile elements into a full page experience. This is the main page for viewing and managing tutor profiles."}].forEach(i=>{const n=document.createElement("div");n.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",n.style.border="1px solid var(--color-outline-variant)",n.style.borderRadius="var(--size-card-radius-sm)",n.style.backgroundColor="var(--color-surface-container)";const r=document.createElement("h3");r.className="h4",r.textContent=i.name,r.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(r);const c=document.createElement("p");c.className="body2-txt",c.textContent=i.description,n.appendChild(c),t.appendChild(n)}),e.appendChild(t),e}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Profile Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for profile management. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'TutorProfile',
      description: 'Complete tutor profile page that combines all profile elements into a full page experience. This is the main page for viewing and managing tutor profiles.'
    }];
    components.forEach(component => {
      const componentCard = document.createElement('div');
      componentCard.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      componentCard.style.border = '1px solid var(--color-outline-variant)';
      componentCard.style.borderRadius = 'var(--size-card-radius-sm)';
      componentCard.style.backgroundColor = 'var(--color-surface-container)';
      const componentName = document.createElement('h3');
      componentName.className = 'h4';
      componentName.textContent = component.name;
      componentName.style.marginBottom = 'var(--size-element-gap-sm)';
      componentCard.appendChild(componentName);
      const componentDesc = document.createElement('p');
      componentDesc.className = 'body2-txt';
      componentDesc.textContent = component.description;
      componentCard.appendChild(componentDesc);
      componentsList.appendChild(componentCard);
    });
    container.appendChild(componentsList);
    return container;
  }
}`,...o.parameters?.docs?.source},description:{story:`Overview
Shows all pages that will be available in this category`,...o.parameters?.docs?.description}}};const l=["Overview"];export{o as Overview,l as __namedExportsOrder,p as default};
