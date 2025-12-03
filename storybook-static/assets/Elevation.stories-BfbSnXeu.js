const y={title:"Styles/Elevation",tags:["autodocs"],parameters:{docs:{description:{component:"Elevation tokens provide box-shadow values for creating depth and hierarchy in the UI. Use elevation tokens instead of custom box-shadow values to maintain consistency."}}}};function h(e,o){const n=document.createElement("table");n.style.width="100%",n.style.borderCollapse="collapse",n.style.marginBottom="var(--size-section-pad-y-md)",n.style.border="1px solid var(--color-outline-variant, #bec8ca)";const l=document.createElement("thead"),a=document.createElement("tr");a.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",a.style.borderBottom="2px solid var(--color-outline, #6f797a)",e.forEach(i=>{const t=document.createElement("th");t.textContent=i,t.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",t.style.textAlign="left",t.style.fontWeight="600",t.className="body2-txt",a.appendChild(t)}),l.appendChild(a),n.appendChild(l);const r=document.createElement("tbody");return o.forEach(i=>{const t=document.createElement("tr");t.style.borderBottom="1px solid var(--color-outline-variant, #bec8ca)";const v=document.createElement("td");v.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)";const x=document.createElement("code");x.textContent=i.token,x.style.fontSize="0.875rem",v.appendChild(x),t.appendChild(v);const d=document.createElement("td");if(d.style.fontFamily="monospace",d.style.fontSize="0.75rem",d.style.wordBreak="break-all",d.textContent=i.value,t.appendChild(d),e.includes("Visual")){const g=document.createElement("td");g.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)";const s=document.createElement("div");s.style.width="100px",s.style.height="60px",s.style.backgroundColor="var(--color-surface-container, #edeef0)",s.style.borderRadius="var(--size-card-radius-sm, 12px)",s.style.boxShadow=i.value,s.style.margin="0 auto",g.appendChild(s),t.appendChild(g)}const u=document.createElement("td");u.textContent=i.description,u.className="body2-txt",t.appendChild(u),r.appendChild(t)}),n.appendChild(r),n}const c={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const o=document.createElement("h1");o.className="h1",o.textContent="Elevation",o.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(o);const n=document.createElement("p");n.className="body1-txt",n.textContent="Elevation tokens provide box-shadow values for creating depth and hierarchy in the UI. Always use elevation tokens instead of custom box-shadow values. Higher elevation indicates more important or urgent content.",n.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(n);const l=document.createElement("h2");l.className="h2",l.textContent="Elevation Principles",l.style.marginTop="var(--size-section-pad-y-md)",l.style.marginBottom="var(--size-element-gap-md)",e.appendChild(l);const a=document.createElement("ul");return a.className="body2-txt",a.style.paddingLeft="var(--size-section-pad-x-md)",["Use elevation tokens: Always use elevation tokens instead of custom box-shadow values","Match elevation to importance: Use higher elevation for more important/urgent content","Consider context: Modals typically use elevation 3-5, cards use elevation 1-2"].forEach(i=>{const t=document.createElement("li");t.textContent=i,t.style.marginBottom="var(--size-element-gap-sm)",a.appendChild(t)}),e.appendChild(a),e}},p={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const o=document.createElement("h2");o.className="h2",o.textContent="Elevation Levels",o.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(o);const n=h(["Token","Value","Visual","Use Case"],[{token:"--elevation-light-1",value:"0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",description:"Subtle elevation, cards at rest"},{token:"--elevation-light-2",value:"0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",description:"Slightly raised elements, hover states"},{token:"--elevation-light-3",value:"0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)",description:"Modals, dialogs, raised cards"},{token:"--elevation-light-4",value:"0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)",description:"Prominent modals, important overlays"},{token:"--elevation-light-5",value:"0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)",description:"Maximum elevation, critical dialogs"}]);return e.appendChild(n),e}},m={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const o=document.createElement("h2");o.className="h2",o.textContent="Usage Examples",o.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(o);const n=document.createElement("div");n.style.marginBottom="var(--size-card-gap-lg)";const l=document.createElement("h3");l.className="h3",l.textContent="Card at Rest and Hover",l.style.marginBottom="var(--size-element-gap-md)",n.appendChild(l);const a=document.createElement("pre");a.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",a.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",a.style.borderRadius="var(--size-card-radius-sm, 12px)",a.style.overflow="auto",a.style.fontSize="0.875rem",a.style.fontFamily="monospace",a.textContent=`.card {
    box-shadow: var(--elevation-light-1);
}

.card:hover {
    box-shadow: var(--elevation-light-2);
}`,n.appendChild(a),e.appendChild(n);const r=document.createElement("div"),i=document.createElement("h3");i.className="h3",i.textContent="Modal/Dialog",i.style.marginBottom="var(--size-element-gap-md)",r.appendChild(i);const t=document.createElement("pre");return t.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",t.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",t.style.borderRadius="var(--size-card-radius-sm, 12px)",t.style.overflow="auto",t.style.fontSize="0.875rem",t.style.fontFamily="monospace",t.textContent=`.modal {
    box-shadow: var(--elevation-light-3);
}

/* For prominent modals */
.modal.prominent {
    box-shadow: var(--elevation-light-4);
}

/* For critical dialogs */
.modal.critical {
    box-shadow: var(--elevation-light-5);
}`,r.appendChild(t),e.appendChild(r),e}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Elevation';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Elevation tokens provide box-shadow values for creating depth and hierarchy in the UI. Always use elevation tokens instead of custom box-shadow values. Higher elevation indicates more important or urgent content.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const principlesTitle = document.createElement('h2');
    principlesTitle.className = 'h2';
    principlesTitle.textContent = 'Elevation Principles';
    principlesTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    principlesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(principlesTitle);
    const principlesList = document.createElement('ul');
    principlesList.className = 'body2-txt';
    principlesList.style.paddingLeft = 'var(--size-section-pad-x-md)';
    const principles = ['Use elevation tokens: Always use elevation tokens instead of custom box-shadow values', 'Match elevation to importance: Use higher elevation for more important/urgent content', 'Consider context: Modals typically use elevation 3-5, cards use elevation 1-2'];
    principles.forEach(principle => {
      const li = document.createElement('li');
      li.textContent = principle;
      li.style.marginBottom = 'var(--size-element-gap-sm)';
      principlesList.appendChild(li);
    });
    container.appendChild(principlesList);
    return container;
  }
}`,...c.parameters?.docs?.source},description:{story:"Elevation Overview",...c.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Elevation Levels';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const table = createElevationTable(['Token', 'Value', 'Visual', 'Use Case'], [{
      token: '--elevation-light-1',
      value: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
      description: 'Subtle elevation, cards at rest'
    }, {
      token: '--elevation-light-2',
      value: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
      description: 'Slightly raised elements, hover states'
    }, {
      token: '--elevation-light-3',
      value: '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
      description: 'Modals, dialogs, raised cards'
    }, {
      token: '--elevation-light-4',
      value: '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
      description: 'Prominent modals, important overlays'
    }, {
      token: '--elevation-light-5',
      value: '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      description: 'Maximum elevation, critical dialogs'
    }]);
    container.appendChild(table);
    return container;
  }
}`,...p.parameters?.docs?.source},description:{story:"All Elevation Levels",...p.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Usage Examples';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const cardExample = document.createElement('div');
    cardExample.style.marginBottom = 'var(--size-card-gap-lg)';
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'h3';
    cardTitle.textContent = 'Card at Rest and Hover';
    cardTitle.style.marginBottom = 'var(--size-element-gap-md)';
    cardExample.appendChild(cardTitle);
    const codeBlock = document.createElement('pre');
    codeBlock.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    codeBlock.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    codeBlock.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
    codeBlock.style.overflow = 'auto';
    codeBlock.style.fontSize = '0.875rem';
    codeBlock.style.fontFamily = 'monospace';
    codeBlock.textContent = \`.card {
    box-shadow: var(--elevation-light-1);
}

.card:hover {
    box-shadow: var(--elevation-light-2);
}\`;
    cardExample.appendChild(codeBlock);
    container.appendChild(cardExample);
    const modalExample = document.createElement('div');
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'h3';
    modalTitle.textContent = 'Modal/Dialog';
    modalTitle.style.marginBottom = 'var(--size-element-gap-md)';
    modalExample.appendChild(modalTitle);
    const modalCodeBlock = document.createElement('pre');
    modalCodeBlock.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    modalCodeBlock.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    modalCodeBlock.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
    modalCodeBlock.style.overflow = 'auto';
    modalCodeBlock.style.fontSize = '0.875rem';
    modalCodeBlock.style.fontFamily = 'monospace';
    modalCodeBlock.textContent = \`.modal {
    box-shadow: var(--elevation-light-3);
}

/* For prominent modals */
.modal.prominent {
    box-shadow: var(--elevation-light-4);
}

/* For critical dialogs */
.modal.critical {
    box-shadow: var(--elevation-light-5);
}\`;
    modalExample.appendChild(modalCodeBlock);
    container.appendChild(modalExample);
    return container;
  }
}`,...m.parameters?.docs?.source},description:{story:"Usage Examples",...m.parameters?.docs?.description}}};const C=["Overview","AllElevations","UsageExamples"];export{p as AllElevations,c as Overview,m as UsageExamples,C as __namedExportsOrder,y as default};
