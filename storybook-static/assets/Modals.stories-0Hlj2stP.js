const v={title:"Specs/Home/Modals",tags:["autodocs"],parameters:{docs:{description:{component:"Modal dialogs used in home page flows. These modals provide important user feedback and interaction capabilities."}}}},o={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1200px",t.style.margin="0 auto";const s=document.createElement("h1");s.className="h1",s.textContent="Home Modals",s.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(s);const i=document.createElement("p");i.className="body1-txt",i.textContent="Modal dialogs used in home page flows. These components will be implemented and documented here.",i.style.marginBottom="var(--size-card-gap-lg)",t.appendChild(i);const n=document.createElement("div");return n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",[{name:"UserFeedbackModal",description:"Modal for user feedback with types:",variants:["type=problem","type=question","type=feedback"]}].forEach(r=>{const e=document.createElement("div");e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.border="1px solid var(--color-outline-variant)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.backgroundColor="var(--color-surface-container)";const c=document.createElement("h3");c.className="h4",c.textContent=r.name,c.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(c);const d=document.createElement("p");if(d.className="body2-txt",d.textContent=r.description,d.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(d),r.variants){const a=document.createElement("ul");a.className="body2-txt",a.style.paddingLeft="var(--size-section-pad-y-md)",a.style.marginTop="var(--size-element-gap-xs)",r.variants.forEach(l=>{const m=document.createElement("li");m.textContent=l,m.style.marginBottom="var(--size-element-gap-xs)",a.appendChild(m)}),e.appendChild(a)}n.appendChild(e)}),t.appendChild(n),t}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Home Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs used in home page flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'UserFeedbackModal',
      description: 'Modal for user feedback with types:',
      variants: ['type=problem', 'type=question', 'type=feedback']
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
}`,...o.parameters?.docs?.source},description:{story:`Overview
Shows all modals that will be available in this category`,...o.parameters?.docs?.description}}};const y=["Overview"];export{o as Overview,y as __namedExportsOrder,v as default};
