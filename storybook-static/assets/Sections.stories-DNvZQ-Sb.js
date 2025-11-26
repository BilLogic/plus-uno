const v={title:"Specs/Home/Sections",tags:["autodocs"],parameters:{docs:{description:{component:"Section-level components for home pages. These are larger container components that organize multiple cards and elements."}}}},a={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1200px",t.style.margin="0 auto";const s=document.createElement("h1");s.className="h1",s.textContent="Home Sections",s.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(s);const i=document.createElement("p");i.className="body1-txt",i.textContent="Section-level components for home pages. These components will be implemented and documented here.",i.style.marginBottom="var(--size-card-gap-lg)",t.appendChild(i);const n=document.createElement("div");return n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",[{name:"HomepageJumbotron",description:"Homepage jumbotron with tabs:",variants:["tabs=sign-up","tabs=session","tabs=reflection"]},{name:"BottomDiv",description:"Bottom section with variants:",variants:["Property 1=Default","Property 1=Variant2"]}].forEach(r=>{const e=document.createElement("div");e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.border="1px solid var(--color-outline-variant)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.backgroundColor="var(--color-surface-container)";const c=document.createElement("h3");c.className="h4",c.textContent=r.name,c.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(c);const m=document.createElement("p");if(m.className="body2-txt",m.textContent=r.description,m.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(m),r.variants){const o=document.createElement("ul");o.className="body2-txt",o.style.paddingLeft="var(--size-section-pad-y-md)",o.style.marginTop="var(--size-element-gap-xs)",r.variants.forEach(p=>{const d=document.createElement("li");d.textContent=p,d.style.marginBottom="var(--size-element-gap-xs)",o.appendChild(d)}),e.appendChild(o)}n.appendChild(e)}),t.appendChild(n),t}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Home Sections';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Section-level components for home pages. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'HomepageJumbotron',
      description: 'Homepage jumbotron with tabs:',
      variants: ['tabs=sign-up', 'tabs=session', 'tabs=reflection']
    }, {
      name: 'BottomDiv',
      description: 'Bottom section with variants:',
      variants: ['Property 1=Default', 'Property 1=Variant2']
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
Shows all sections that will be available in this category`,...a.parameters?.docs?.description}}};const g=["Overview"];export{a as Overview,g as __namedExportsOrder,v as default};
