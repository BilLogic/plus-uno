const u={title:"Specs/Profile/Elements",tags:["autodocs"],parameters:{docs:{description:{component:"Individual form elements and UI components used in profile management flows. These are the building blocks that make up the profile pages."}}}},a={render:()=>{const n=document.createElement("div");n.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",n.style.maxWidth="1200px",n.style.margin="0 auto";const s=document.createElement("h1");s.className="h1",s.textContent="Profile Elements",s.style.marginBottom="var(--size-section-pad-y-md)",n.appendChild(s);const i=document.createElement("p");i.className="body1-txt",i.textContent="Individual form elements and UI components used in profile management flows. These components will be implemented and documented here.",i.style.marginBottom="var(--size-card-gap-lg)",n.appendChild(i);const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",[{name:"TutorProfileSelect",description:"Dropdown for selecting tutor profile type with states: Closed (Selection=None), Open (Selection=None), and various selection options:",options:["Current Teacher","Current Undergraduate Student","Graduate Student","Retired Teacher","Retired Professional","Americorps","Other"]}].forEach(r=>{const e=document.createElement("div");e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.border="1px solid var(--color-outline-variant)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.backgroundColor="var(--color-surface-container)";const c=document.createElement("h3");c.className="h4",c.textContent=r.name,c.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(c);const d=document.createElement("p");if(d.className="body2-txt",d.textContent=r.description,d.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(d),r.options){const o=document.createElement("ul");o.className="body2-txt",o.style.paddingLeft="var(--size-section-pad-y-md)",o.style.marginTop="var(--size-element-gap-xs)",r.options.forEach(l=>{const m=document.createElement("li");m.textContent=l,m.style.marginBottom="var(--size-element-gap-xs)",o.appendChild(m)}),e.appendChild(o)}t.appendChild(e)}),n.appendChild(t),n}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Profile Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in profile management flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'TutorProfileSelect',
      description: 'Dropdown for selecting tutor profile type with states: Closed (Selection=None), Open (Selection=None), and various selection options:',
      options: ['Current Teacher', 'Current Undergraduate Student', 'Graduate Student', 'Retired Teacher', 'Retired Professional', 'Americorps', 'Other']
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
      componentDesc.style.marginBottom = 'var(--size-element-gap-sm)';
      componentCard.appendChild(componentDesc);
      if (component.options) {
        const optionsList = document.createElement('ul');
        optionsList.className = 'body2-txt';
        optionsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
        optionsList.style.marginTop = 'var(--size-element-gap-xs)';
        component.options.forEach(option => {
          const li = document.createElement('li');
          li.textContent = option;
          li.style.marginBottom = 'var(--size-element-gap-xs)';
          optionsList.appendChild(li);
        });
        componentCard.appendChild(optionsList);
      }
      componentsList.appendChild(componentCard);
    });
    container.appendChild(componentsList);
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:`Overview
Shows all elements that will be available in this category`,...a.parameters?.docs?.description}}};const g=["Overview"];export{a as Overview,g as __namedExportsOrder,u as default};
