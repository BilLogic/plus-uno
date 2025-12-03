import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const h={title:"Components/Badge/Size Variants",tags:["autodocs"]},t={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexWrap="wrap",e.style.alignItems="center",e.style.gap="var(--size-card-gap-md)",["h1","h2","h3","h4","h5","h6"].forEach(n=>{const r=i.createBadge({text:n.toUpperCase(),style:"primary",size:n});e.appendChild(r)}),e}},s={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexWrap="wrap",e.style.alignItems="center",e.style.gap="var(--size-card-gap-md)",["b1","b2","b3"].forEach(n=>{const r=i.createBadge({text:n.toUpperCase(),style:"primary",size:n});e.appendChild(r)}),e}},a={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexWrap="wrap",e.style.alignItems="center",e.style.gap="var(--size-card-gap-md)",["h1","h2","h3","h4","h5","h6","b1","b2","b3"].forEach(n=>{const r=i.createBadge({text:n.toUpperCase(),style:"primary",size:n});e.appendChild(r)}),e}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    sizes.forEach(size => {
      const badge = PlusInterface.createBadge({
        text: size.toUpperCase(),
        style: 'primary',
        size: size
      });
      container.appendChild(badge);
    });
    return container;
  }
}`,...t.parameters?.docs?.source},description:{story:"Headline Sizes (H1-H6)",...t.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    const sizes = ['b1', 'b2', 'b3'];
    sizes.forEach(size => {
      const badge = PlusInterface.createBadge({
        text: size.toUpperCase(),
        style: 'primary',
        size: size
      });
      container.appendChild(badge);
    });
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:"Body Sizes (B1-B3)",...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    sizes.forEach(size => {
      const badge = PlusInterface.createBadge({
        text: size.toUpperCase(),
        style: 'primary',
        size: size
      });
      container.appendChild(badge);
    });
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:"All Sizes",...a.parameters?.docs?.description}}};const u=["HeadlineSizes","BodySizes","AllSizes"];export{a as AllSizes,s as BodySizes,t as HeadlineSizes,u as __namedExportsOrder,h as default};
