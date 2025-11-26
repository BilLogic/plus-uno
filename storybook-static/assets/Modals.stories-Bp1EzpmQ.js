const v={title:"Specs/Login/Modals",tags:["autodocs"],parameters:{docs:{description:{component:"Modal dialogs used in login/authentication flows. These modals provide important notifications and confirmations during the login process."}}}},a={render:()=>{const n=document.createElement("div");n.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",n.style.maxWidth="1200px",n.style.margin="0 auto";const i=document.createElement("h1");i.className="h1",i.textContent="Login Modals",i.style.marginBottom="var(--size-section-pad-y-md)",n.appendChild(i);const s=document.createElement("p");s.className="body1-txt",s.textContent="Modal dialogs used in login/authentication flows. These components will be implemented and documented here.",s.style.marginBottom="var(--size-card-gap-lg)",n.appendChild(s);const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",[{name:"NotificationsModal",description:"Modal for displaying notifications during login/authentication flows with variants:",variants:["type A","type B"]}].forEach(c=>{const e=document.createElement("div");e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.border="1px solid var(--color-outline-variant)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.backgroundColor="var(--color-surface-container)";const r=document.createElement("h3");r.className="h4",r.textContent=c.name,r.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(r);const d=document.createElement("p");if(d.className="body2-txt",d.textContent=c.description,d.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(d),c.variants){const o=document.createElement("ul");o.className="body2-txt",o.style.paddingLeft="var(--size-section-pad-y-md)",o.style.marginTop="var(--size-element-gap-xs)",c.variants.forEach(m=>{const l=document.createElement("li");l.textContent=m,l.style.marginBottom="var(--size-element-gap-xs)",o.appendChild(l)}),e.appendChild(o)}t.appendChild(e)}),n.appendChild(t),n}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Login Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs used in login/authentication flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'NotificationsModal',
      description: 'Modal for displaying notifications during login/authentication flows with variants:',
      variants: ['type A', 'type B']
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
      if (component.variants) {
        const variantsList = document.createElement('ul');
        variantsList.className = 'body2-txt';
        variantsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
        variantsList.style.marginTop = 'var(--size-element-gap-xs)';
        component.variants.forEach(variant => {
          const li = document.createElement('li');
          li.textContent = variant;
          li.style.marginBottom = 'var(--size-element-gap-xs)';
          variantsList.appendChild(li);
        });
        componentCard.appendChild(variantsList);
      }
      componentsList.appendChild(componentCard);
    });
    container.appendChild(componentsList);
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:`Overview
Shows all modals that will be available in this category`,...a.parameters?.docs?.description}}};const g=["Overview"];export{a as Overview,g as __namedExportsOrder,v as default};
