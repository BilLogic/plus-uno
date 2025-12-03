const m={title:"Specs/Training/Tables",tags:["autodocs"],parameters:{docs:{description:{component:"Table components used in training contexts."}}}},c={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const o=document.createElement("h1");o.className="h1",o.textContent="Training Tables",o.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(o);const a=document.createElement("p");a.className="body1-txt",a.textContent="Table components used in training contexts. These components will be implemented and documented here.",a.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(a);const d=[{name:"LessonListItem",description:"Lesson list item with types: header, item; states: default, hover, pressed, focus, disable; expand?: false, true"}],t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",d.forEach(i=>{const n=document.createElement("div");n.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",n.style.border="1px solid var(--color-outline-variant)",n.style.borderRadius="var(--size-card-radius-sm)",n.style.backgroundColor="var(--color-surface-container)";const s=document.createElement("h3");s.className="h4",s.textContent=i.name,s.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(s);const r=document.createElement("p");r.className="body2-txt",r.textContent=i.description,n.appendChild(r),t.appendChild(n)}),e.appendChild(t),e}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Training Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components used in training contexts. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const components = [{
      name: 'LessonListItem',
      description: 'Lesson list item with types: header, item; states: default, hover, pressed, focus, disable; expand?: false, true'
    }];
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
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
}`,...c.parameters?.docs?.source}}};const p=["Overview"];export{c as Overview,p as __namedExportsOrder,m as default};
