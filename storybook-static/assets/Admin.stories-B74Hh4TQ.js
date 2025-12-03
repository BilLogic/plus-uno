const i={title:"Specs/Admin",tags:["autodocs"],parameters:{docs:{description:{component:`Admin Organisms
Admin-specific organisms for administrative interfaces`}}}},e={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg)";const n=document.createElement("h2");n.className="h2",n.textContent="Admin Organisms",n.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(n);const s=document.createElement("p");return s.className="body1-txt",s.textContent="Admin organisms are specific to administrative interfaces and functionality. These components are organized by type: Elements, Tables, Cards, Modals, Sections, and Pages.",s.style.marginBottom="var(--size-card-gap-lg)",t.appendChild(s),t}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Admin Organisms';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Admin organisms are specific to administrative interfaces and functionality. These components are organized by type: Elements, Tables, Cards, Modals, Sections, and Pages.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    return container;
  }
}`,...e.parameters?.docs?.source},description:{story:"Overview",...e.parameters?.docs?.description}}};const a=["Overview"];export{e as Overview,a as __namedExportsOrder,i as default};
