const y={title:"Specs/Home/Elements",tags:["autodocs"],parameters:{docs:{description:{component:"Individual form elements and UI components used in home page flows. These are the building blocks that make up the home page cards and sections."}}}},i={render:()=>{const n=document.createElement("div");n.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",n.style.maxWidth="1200px",n.style.margin="0 auto";const d=document.createElement("h1");d.className="h1",d.textContent="Home Elements",d.style.marginBottom="var(--size-section-pad-y-md)",n.appendChild(d);const c=document.createElement("p");c.className="body1-txt",c.textContent="Individual form elements and UI components used in home page flows. These components will be implemented and documented here.",c.style.marginBottom="var(--size-card-gap-lg)",n.appendChild(c);const a=document.createElement("div");return a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-card-gap-md)",[{name:"ResourceType",description:"Icons for different resource types:",types:["pdf","link","video","image","slides"]},{name:"ProductAreaDropdown",description:"Dropdown for selecting product area with states:",states:["closed","open"]},{name:"CardBadges",description:"Badges for cards showing:",states:["increase","decrease"]},{name:"ButtonContainer",description:"Button container with states:",states:["disabled","enabled"]}].forEach(o=>{const t=document.createElement("div");t.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",t.style.border="1px solid var(--color-outline-variant)",t.style.borderRadius="var(--size-card-radius-sm)",t.style.backgroundColor="var(--color-surface-container)";const r=document.createElement("h3");r.className="h4",r.textContent=o.name,r.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(r);const m=document.createElement("p");if(m.className="body2-txt",m.textContent=o.description,m.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(m),o.types){const e=document.createElement("ul");e.className="body2-txt",e.style.paddingLeft="var(--size-section-pad-y-md)",e.style.marginTop="var(--size-element-gap-xs)",o.types.forEach(p=>{const s=document.createElement("li");s.textContent=p,s.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(s)}),t.appendChild(e)}if(o.states){const e=document.createElement("ul");e.className="body2-txt",e.style.paddingLeft="var(--size-section-pad-y-md)",e.style.marginTop="var(--size-element-gap-xs)",o.states.forEach(p=>{const s=document.createElement("li");s.textContent=p,s.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(s)}),t.appendChild(e)}a.appendChild(t)}),n.appendChild(a),n}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Home Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in home page flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'ResourceType',
      description: 'Icons for different resource types:',
      types: ['pdf', 'link', 'video', 'image', 'slides']
    }, {
      name: 'ProductAreaDropdown',
      description: 'Dropdown for selecting product area with states:',
      states: ['closed', 'open']
    }, {
      name: 'CardBadges',
      description: 'Badges for cards showing:',
      states: ['increase', 'decrease']
    }, {
      name: 'ButtonContainer',
      description: 'Button container with states:',
      states: ['disabled', 'enabled']
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
      if (component.types) {
        const typesList = document.createElement('ul');
        typesList.className = 'body2-txt';
        typesList.style.paddingLeft = 'var(--size-section-pad-y-md)';
        typesList.style.marginTop = 'var(--size-element-gap-xs)';
        component.types.forEach(type => {
          const li = document.createElement('li');
          li.textContent = type;
          li.style.marginBottom = 'var(--size-element-gap-xs)';
          typesList.appendChild(li);
        });
        componentCard.appendChild(typesList);
      }
      if (component.states) {
        const statesList = document.createElement('ul');
        statesList.className = 'body2-txt';
        statesList.style.paddingLeft = 'var(--size-section-pad-y-md)';
        statesList.style.marginTop = 'var(--size-element-gap-xs)';
        component.states.forEach(state => {
          const li = document.createElement('li');
          li.textContent = state;
          li.style.marginBottom = 'var(--size-element-gap-xs)';
          statesList.appendChild(li);
        });
        componentCard.appendChild(statesList);
      }
      componentsList.appendChild(componentCard);
    });
    container.appendChild(componentsList);
    return container;
  }
}`,...i.parameters?.docs?.source},description:{story:`Overview
Shows all elements that will be available in this category`,...i.parameters?.docs?.description}}};const g=["Overview"];export{i as Overview,g as __namedExportsOrder,y as default};
