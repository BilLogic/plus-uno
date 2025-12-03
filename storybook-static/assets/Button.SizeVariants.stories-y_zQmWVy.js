import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const b={title:"Components/Button/Size Variants",tags:["autodocs"]},r={render:()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexWrap="wrap",t.style.gap="var(--size-card-gap-md)",["filled","outline","tonal","text"].forEach(e=>{const n=o.createButton({btnText:`Small ${e}`,btnStyle:"primary",btnFill:e,btnSize:"small"});t.appendChild(n)}),t}},a={render:()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexWrap="wrap",t.style.gap="var(--size-card-gap-md)",["filled","outline","tonal","text"].forEach(e=>{const n=o.createButton({btnText:`Default ${e}`,btnStyle:"primary",btnFill:e,btnSize:"default"});t.appendChild(n)}),t}},l={render:()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexWrap="wrap",t.style.gap="var(--size-card-gap-md)",["filled","outline","tonal","text"].forEach(e=>{const n=o.createButton({btnText:`Large ${e}`,btnStyle:"primary",btnFill:e,btnSize:"large"});t.appendChild(n)}),t}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    const fills = ['filled', 'outline', 'tonal', 'text'];
    fills.forEach(fill => {
      const button = PlusInterface.createButton({
        btnText: \`Small \${fill}\`,
        btnStyle: 'primary',
        btnFill: fill,
        btnSize: 'small'
      });
      container.appendChild(button);
    });
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Small Button",...r.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    const fills = ['filled', 'outline', 'tonal', 'text'];
    fills.forEach(fill => {
      const button = PlusInterface.createButton({
        btnText: \`Default \${fill}\`,
        btnStyle: 'primary',
        btnFill: fill,
        btnSize: 'default'
      });
      container.appendChild(button);
    });
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:"Default Button",...a.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    const fills = ['filled', 'outline', 'tonal', 'text'];
    fills.forEach(fill => {
      const button = PlusInterface.createButton({
        btnText: \`Large \${fill}\`,
        btnStyle: 'primary',
        btnFill: fill,
        btnSize: 'large'
      });
      container.appendChild(button);
    });
    return container;
  }
}`,...l.parameters?.docs?.source},description:{story:"Large Button",...l.parameters?.docs?.description}}};const x=["Small","Default","Large"];export{a as Default,l as Large,r as Small,x as __namedExportsOrder,b as default};
