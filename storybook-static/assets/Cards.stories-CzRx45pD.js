const d={title:"Specs/Profile/Cards",tags:["autodocs"],parameters:{docs:{description:{component:"Card components for profile management. This category will be populated as needed."}}}},n={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1200px",t.style.margin="0 auto";const a=document.createElement("h1");a.className="h1",a.textContent="Profile Cards",a.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(a);const r=document.createElement("p");r.className="body1-txt",r.textContent="Card components for profile management. This category is currently empty and will be populated as needed.",r.style.marginBottom="var(--size-card-gap-lg)",t.appendChild(r);const e=document.createElement("div");e.style.padding="var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)",e.style.border="1px dashed var(--color-outline-variant)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.backgroundColor="var(--color-surface-container)",e.style.textAlign="center",e.style.color="var(--color-on-surface-variant)";const o=document.createElement("p");return o.className="body2-txt",o.textContent="No card components yet. Card components for profile management will be added here as needed.",e.appendChild(o),t.appendChild(e),t}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Profile Cards';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Card components for profile management. This category is currently empty and will be populated as needed.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const placeholder = document.createElement('div');
    placeholder.style.padding = 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)';
    placeholder.style.border = '1px dashed var(--color-outline-variant)';
    placeholder.style.borderRadius = 'var(--size-card-radius-sm)';
    placeholder.style.backgroundColor = 'var(--color-surface-container)';
    placeholder.style.textAlign = 'center';
    placeholder.style.color = 'var(--color-on-surface-variant)';
    const placeholderText = document.createElement('p');
    placeholderText.className = 'body2-txt';
    placeholderText.textContent = 'No card components yet. Card components for profile management will be added here as needed.';
    placeholder.appendChild(placeholderText);
    container.appendChild(placeholder);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:`Overview
Placeholder for future card components`,...n.parameters?.docs?.description}}};const l=["Overview"];export{n as Overview,l as __namedExportsOrder,d as default};
