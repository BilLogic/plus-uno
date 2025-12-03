const p={title:"Specs/Universal",tags:["autodocs"],parameters:{docs:{description:{component:`Universal Organisms
Commonly used universal organisms across multiple product pillars`}}}},r={render:()=>{const a=document.createElement("div");a.style.padding="var(--size-section-pad-y-lg)";const o=document.createElement("h2");o.className="h2",o.textContent="Universal Organisms",o.style.marginBottom="var(--size-section-pad-y-md)",a.appendChild(o);const s=document.createElement("p");s.className="body1-txt",s.textContent="Universal organisms are commonly used across multiple product pillars. These include navigation components like the sidebar, top bar, footer, and other universal UI patterns.",s.style.marginBottom="var(--size-card-gap-lg)",a.appendChild(s);const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",t.style.marginTop="var(--size-section-pad-y-md)",[{category:"Elements",items:["SidebarTab - Sidebar navigation tab with states","UserAvatar - User avatar with name and notification counter","StaticBadgeSmart - SMART competency area badge"]},{category:"Sections",items:["Sidebar - Navigation sidebar with tutor and supervisor variants","TopBar - Top navigation bar with breadcrumb and user avatar","Footer - Page footer with copyright and version information"]}].forEach(d=>{const e=document.createElement("div");e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.border="1px solid var(--color-outline-variant)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.backgroundColor="var(--color-surface-container)";const i=document.createElement("h3");i.className="h4",i.textContent=d.category,i.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(i);const n=document.createElement("ul");n.className="body2-txt",n.style.paddingLeft="var(--size-section-pad-y-md)",n.style.marginTop="var(--size-element-gap-xs)",d.items.forEach(m=>{const c=document.createElement("li");c.textContent=m,c.style.marginBottom="var(--size-element-gap-xs)",n.appendChild(c)}),e.appendChild(n),t.appendChild(e)}),a.appendChild(t),a}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Universal Organisms';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Universal organisms are commonly used across multiple product pillars. These include navigation components like the sidebar, top bar, footer, and other universal UI patterns.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    componentsList.style.marginTop = 'var(--size-section-pad-y-md)';
    const components = [{
      category: 'Elements',
      items: ['SidebarTab - Sidebar navigation tab with states', 'UserAvatar - User avatar with name and notification counter', 'StaticBadgeSmart - SMART competency area badge']
    }, {
      category: 'Sections',
      items: ['Sidebar - Navigation sidebar with tutor and supervisor variants', 'TopBar - Top navigation bar with breadcrumb and user avatar', 'Footer - Page footer with copyright and version information']
    }];
    components.forEach(category => {
      const categoryCard = document.createElement('div');
      categoryCard.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      categoryCard.style.border = '1px solid var(--color-outline-variant)';
      categoryCard.style.borderRadius = 'var(--size-card-radius-sm)';
      categoryCard.style.backgroundColor = 'var(--color-surface-container)';
      const categoryName = document.createElement('h3');
      categoryName.className = 'h4';
      categoryName.textContent = category.category;
      categoryName.style.marginBottom = 'var(--size-element-gap-sm)';
      categoryCard.appendChild(categoryName);
      const itemsList = document.createElement('ul');
      itemsList.className = 'body2-txt';
      itemsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
      itemsList.style.marginTop = 'var(--size-element-gap-xs)';
      category.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.style.marginBottom = 'var(--size-element-gap-xs)';
        itemsList.appendChild(li);
      });
      categoryCard.appendChild(itemsList);
      componentsList.appendChild(categoryCard);
    });
    container.appendChild(componentsList);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Overview",...r.parameters?.docs?.description}}};const g=["Overview"];export{r as Overview,g as __namedExportsOrder,p as default};
