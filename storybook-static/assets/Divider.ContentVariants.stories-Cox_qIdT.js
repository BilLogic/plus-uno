import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const f={title:"Components/Divider/Content Variants",tags:["autodocs"]},n={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.width="100%",e.style.maxWidth="600px",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.backgroundColor="var(--color-surface-container)",e.style.borderRadius="var(--size-card-radius-sm)";const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-sm)",a.style.padding="var(--size-section-pad-y-sm) 0";const r=document.createElement("div");r.className="body2-txt",r.textContent="Normal opacity",r.style.color="var(--color-on-surface)",a.appendChild(r);const s=i.createDivider({size:"sm",style:"dark",width:"100%"});a.appendChild(s),e.appendChild(a);const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-sm)",t.style.padding="var(--size-section-pad-y-sm) 0";const o=document.createElement("div");o.className="body2-txt",o.textContent="10% opacity (for accordion/collapse)",o.style.color="var(--color-on-surface)",t.appendChild(o);const l=i.createDivider({size:"sm",style:"dark",opacity10:!0,width:"100%"});return t.appendChild(l),e.appendChild(t),e}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';

    // Normal opacity example
    const normalWrapper = document.createElement('div');
    normalWrapper.style.display = 'flex';
    normalWrapper.style.flexDirection = 'column';
    normalWrapper.style.gap = 'var(--size-element-gap-sm)';
    normalWrapper.style.padding = 'var(--size-section-pad-y-sm) 0';
    const normalLabel = document.createElement('div');
    normalLabel.className = 'body2-txt';
    normalLabel.textContent = 'Normal opacity';
    normalLabel.style.color = 'var(--color-on-surface)';
    normalWrapper.appendChild(normalLabel);
    const normalDivider = PlusInterface.createDivider({
      size: 'sm',
      // Uses semantic token (maps to 1px via --size-element-stroke-sm)
      style: 'dark',
      width: '100%'
    });
    normalWrapper.appendChild(normalDivider);
    container.appendChild(normalWrapper);

    // 10% opacity example
    const opacityWrapper = document.createElement('div');
    opacityWrapper.style.display = 'flex';
    opacityWrapper.style.flexDirection = 'column';
    opacityWrapper.style.gap = 'var(--size-element-gap-sm)';
    opacityWrapper.style.padding = 'var(--size-section-pad-y-sm) 0';
    const opacityLabel = document.createElement('div');
    opacityLabel.className = 'body2-txt';
    opacityLabel.textContent = '10% opacity (for accordion/collapse)';
    opacityLabel.style.color = 'var(--color-on-surface)';
    opacityWrapper.appendChild(opacityLabel);
    const opacityDivider = PlusInterface.createDivider({
      size: 'sm',
      // Uses semantic token (maps to 1px via --size-element-stroke-sm)
      style: 'dark',
      opacity10: true,
      width: '100%'
    });
    opacityWrapper.appendChild(opacityDivider);
    container.appendChild(opacityWrapper);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:"Divider with Opacity",...n.parameters?.docs?.description}}};const h=["WithOpacity"];export{n as WithOpacity,h as __namedExportsOrder,f as default};
