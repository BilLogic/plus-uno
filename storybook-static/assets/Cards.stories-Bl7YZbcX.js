const v={title:"Specs/Home/Cards",tags:["autodocs"],parameters:{docs:{description:{component:"Card components for home page and dashboard. These are complete, self-contained card experiences for displaying data, metrics, and content."}}}},i={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1200px",t.style.margin="0 auto";const r=document.createElement("h1");r.className="h1",r.textContent="Home Cards",r.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(r);const c=document.createElement("p");c.className="body1-txt",c.textContent="Card components for home page and dashboard. These components will be implemented and documented here.",c.style.marginBottom="var(--size-card-gap-lg)",t.appendChild(c);const o=document.createElement("div");return o.style.display="flex",o.style.flexDirection="column",o.style.gap="var(--size-card-gap-md)",[{name:"OverviewCard",description:"Overview cards with multiple types:",types:["relationships","socio-emotional","mastering","advocacy","technology","status","completion","accuracy","avg-accuracy","avg-completion","time-spent","effort","progress"]},{name:"ResourceCard",description:"Resource card component for displaying resources."},{name:"MetricsCard",description:"Metrics card component for displaying key metrics."},{name:"MetricsCard2",description:"Metrics card with pagination variants:",variants:["page=1","page=2","page=3"]},{name:"DataVisualization",description:"Data visualization cards with variants:",variants:["page=skills progress","page=skills overview"]},{name:"RecommendedLessons",description:"Recommended lessons card with responsive variants:",variants:["breakpoint=< XXL","breakpoint=XXL & above"]},{name:"TrainingProgressCard",description:"Training progress card with size variants:",variants:["size=default","size=small"]}].forEach(s=>{const n=document.createElement("div");n.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",n.style.border="1px solid var(--color-outline-variant)",n.style.borderRadius="var(--size-card-radius-sm)",n.style.backgroundColor="var(--color-surface-container)";const d=document.createElement("h3");d.className="h4",d.textContent=s.name,d.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(d);const p=document.createElement("p");if(p.className="body2-txt",p.textContent=s.description,p.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(p),s.types){const e=document.createElement("ul");e.className="body2-txt",e.style.paddingLeft="var(--size-section-pad-y-md)",e.style.marginTop="var(--size-element-gap-xs)",s.types.forEach(m=>{const a=document.createElement("li");a.textContent=m,a.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(a)}),n.appendChild(e)}if(s.variants){const e=document.createElement("ul");e.className="body2-txt",e.style.paddingLeft="var(--size-section-pad-y-md)",e.style.marginTop="var(--size-element-gap-xs)",s.variants.forEach(m=>{const a=document.createElement("li");a.textContent=m,a.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(a)}),n.appendChild(e)}o.appendChild(n)}),t.appendChild(o),t}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Home Cards';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Card components for home page and dashboard. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    const components = [{
      name: 'OverviewCard',
      description: 'Overview cards with multiple types:',
      types: ['relationships', 'socio-emotional', 'mastering', 'advocacy', 'technology', 'status', 'completion', 'accuracy', 'avg-accuracy', 'avg-completion', 'time-spent', 'effort', 'progress']
    }, {
      name: 'ResourceCard',
      description: 'Resource card component for displaying resources.'
    }, {
      name: 'MetricsCard',
      description: 'Metrics card component for displaying key metrics.'
    }, {
      name: 'MetricsCard2',
      description: 'Metrics card with pagination variants:',
      variants: ['page=1', 'page=2', 'page=3']
    }, {
      name: 'DataVisualization',
      description: 'Data visualization cards with variants:',
      variants: ['page=skills progress', 'page=skills overview']
    }, {
      name: 'RecommendedLessons',
      description: 'Recommended lessons card with responsive variants:',
      variants: ['breakpoint=< XXL', 'breakpoint=XXL & above']
    }, {
      name: 'TrainingProgressCard',
      description: 'Training progress card with size variants:',
      variants: ['size=default', 'size=small']
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
}`,...i.parameters?.docs?.source},description:{story:`Overview
Shows all cards that will be available in this category`,...i.parameters?.docs?.description}}};const g=["Overview"];export{i as Overview,g as __namedExportsOrder,v as default};
