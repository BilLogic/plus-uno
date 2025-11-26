const v={title:"Specs/Home/Pages",tags:["autodocs"],parameters:{docs:{description:{component:"Complete page-level components for home page. These are full-page experiences that combine multiple elements, cards, and sections."}}}},o={render:()=>{const n=document.createElement("div");n.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",n.style.maxWidth="1200px",n.style.margin="0 auto";const s=document.createElement("h1");s.className="h1",s.textContent="Home Pages",s.style.marginBottom="var(--size-section-pad-y-md)",n.appendChild(s);const i=document.createElement("p");i.className="body1-txt",i.textContent="Complete page-level components for home page. These components will be implemented and documented here.",i.style.marginBottom="var(--size-card-gap-lg)",n.appendChild(i);const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",[{name:"SkillsOverview",description:"Complete skills overview page with different layout. This is a full-page view for displaying skills overview."},{name:"SkillsHomePage",description:"Skills home page with variants:",variants:["Property 1=skill overview","Property 1=skill progress"]}].forEach(r=>{const e=document.createElement("div");e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.border="1px solid var(--color-outline-variant)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.backgroundColor="var(--color-surface-container)";const c=document.createElement("h3");c.className="h4",c.textContent=r.name,c.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(c);const l=document.createElement("p");if(l.className="body2-txt",l.textContent=r.description,l.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(l),r.variants){const a=document.createElement("ul");a.className="body2-txt",a.style.paddingLeft="var(--size-section-pad-y-md)",a.style.marginTop="var(--size-element-gap-xs)",r.variants.forEach(d=>{const m=document.createElement("li");m.textContent=d,m.style.marginBottom="var(--size-element-gap-xs)",a.appendChild(m)}),e.appendChild(a)}t.appendChild(e)}),n.appendChild(t),n}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Home Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for home page. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'SkillsOverview',
      description: 'Complete skills overview page with different layout. This is a full-page view for displaying skills overview.'
    }, {
      name: 'SkillsHomePage',
      description: 'Skills home page with variants:',
      variants: ['Property 1=skill overview', 'Property 1=skill progress']
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
Shows all pages that will be available in this category`,...o.parameters?.docs?.description}}};const g=["Overview"];export{o as Overview,g as __namedExportsOrder,v as default};
