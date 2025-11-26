import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const u={title:"Components/Divider/Visual Style Variants",tags:["autodocs"]},n={render:()=>{const e=document.createElement("div");e.style.width="100%",e.style.maxWidth="600px",e.style.padding="var(--size-section-pad-y-md) 0";const t=document.createElement("div");t.className="body2-txt",t.textContent="Light Style (Medium size)",t.style.marginBottom="var(--size-element-gap-md)",t.style.color="var(--color-on-surface-variant)",e.appendChild(t);const a=i.createDivider({size:"md",style:"light",width:"100%"});return e.appendChild(a),e}},r={render:()=>{const e=document.createElement("div");e.style.width="100%",e.style.maxWidth="600px",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.backgroundColor="var(--color-surface-container)",e.style.borderRadius="var(--size-card-radius-sm)";const t=document.createElement("div");t.className="body2-txt",t.textContent="Dark Style (Medium size)",t.style.marginBottom="var(--size-element-gap-md)",t.style.color="var(--color-on-surface)",e.appendChild(t);const a=i.createDivider({size:"md",style:"dark",width:"100%"});return e.appendChild(a),e}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) 0';
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Light Style (Medium size)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);
    const divider = PlusInterface.createDivider({
      size: 'md',
      // Uses semantic token (maps to 1.5px via --size-element-stroke-md)
      style: 'light',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:`Light Style
Shows light style with default size (medium/1.5px) for style comparison`,...n.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Dark Style (Medium size)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface)';
    container.appendChild(label);
    const divider = PlusInterface.createDivider({
      size: 'md',
      // Uses semantic token (maps to 1.5px via --size-element-stroke-md)
      style: 'dark',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:`Dark Style
Shows dark style with default size (medium/1.5px) for style comparison`,...r.parameters?.docs?.description}}};const v=["Light","Dark"];export{r as Dark,n as Light,v as __namedExportsOrder,u as default};
