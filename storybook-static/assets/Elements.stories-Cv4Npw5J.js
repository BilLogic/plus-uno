const l={title:"Specs/Login/Elements",tags:["autodocs"],parameters:{docs:{description:{component:"Individual form elements and UI components used in login/authentication flows. These are the building blocks that make up the login cards and pages."}}}},o={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const a=document.createElement("h1");a.className="h1",a.textContent="Login Elements",a.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(a);const i=document.createElement("p");i.className="body1-txt",i.textContent="Individual form elements and UI components used in login flows. These components will be implemented and documented here.",i.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(i);const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",[{name:"InstitutionSelection",description:"Dropdown for selecting institution with states: empty, filled, open, typing. Supports official and independent types."},{name:"AccessCodeForm",description:"Form for entering access code with default and invalid states."},{name:"LoginButtons",description:"Miscellaneous action buttons including: try a demo, back to log in portal, continue, and log in. Supports enabled and disabled states."},{name:"AuthButtons",description:"Authentication provider buttons for Google and Clever."},{name:"LoginFooter",description:"Footer component for login pages."},{name:"LoginAlert",description:"Alert component for displaying login error messages and notifications."}].forEach(r=>{const n=document.createElement("div");n.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",n.style.border="1px solid var(--color-outline-variant)",n.style.borderRadius="var(--size-card-radius-sm)",n.style.backgroundColor="var(--color-surface-container)";const s=document.createElement("h3");s.className="h4",s.textContent=r.name,s.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(s);const c=document.createElement("p");c.className="body2-txt",c.textContent=r.description,n.appendChild(c),t.appendChild(n)}),e.appendChild(t),e}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Login Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in login flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'InstitutionSelection',
      description: 'Dropdown for selecting institution with states: empty, filled, open, typing. Supports official and independent types.'
    }, {
      name: 'AccessCodeForm',
      description: 'Form for entering access code with default and invalid states.'
    }, {
      name: 'LoginButtons',
      description: 'Miscellaneous action buttons including: try a demo, back to log in portal, continue, and log in. Supports enabled and disabled states.'
    }, {
      name: 'AuthButtons',
      description: 'Authentication provider buttons for Google and Clever.'
    }, {
      name: 'LoginFooter',
      description: 'Footer component for login pages.'
    }, {
      name: 'LoginAlert',
      description: 'Alert component for displaying login error messages and notifications.'
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
Shows all elements that will be available in this category`,...o.parameters?.docs?.description}}};const m=["Overview"];export{o as Overview,m as __namedExportsOrder,l as default};
