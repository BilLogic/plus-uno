import{a as r}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const y={title:"Components/StatusTag",tags:["autodocs"]},e={render:()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexWrap="wrap",t.style.gap="var(--size-section-gap-md)",t.style.alignItems="center",["assigned","started","not started","complete"].forEach(n=>{const o=r.createContentStatusTag(n);t.appendChild(o)}),t}},s={render:t=>{const a=document.createElement("div"),n=r.createContentStatusTag(t.status);return a.appendChild(n),a},argTypes:{status:{control:"select",options:["assigned","started","not started","complete"],description:"Status type"}},args:{status:"complete"}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.alignItems = 'center';
    const statuses = ['assigned', 'started', 'not started', 'complete'];
    statuses.forEach(status => {
      const statusTag = PlusSmartComponents.createContentStatusTag(status);
      container.appendChild(statusTag);
    });
    return container;
  }
}`,...e.parameters?.docs?.source},description:{story:`All Variants
Shows all status tag variants`,...e.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag(args.status);
    container.appendChild(statusTag);
    return container;
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['assigned', 'started', 'not started', 'complete'],
      description: 'Status type'
    }
  },
  args: {
    status: 'complete'
  }
}`,...s.parameters?.docs?.source},description:{story:`Interactive Status Tag
Interactive playground for testing status tag variations`,...s.parameters?.docs?.description}}};const S=["AllVariants","Interactive"];export{e as AllVariants,s as Interactive,S as __namedExportsOrder,y as default};
