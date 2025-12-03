import{a as c}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const x={title:"Components/StatusIndicator",tags:["autodocs"]},s={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexWrap="wrap",e.style.gap="var(--size-card-gap-lg)",e.style.alignItems="center",["assigned","started","not started","complete"].forEach(a=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.alignItems="center",t.style.gap="var(--size-element-gap-sm)";const l=c.createStatusIcon(a);t.appendChild(l);const o=document.createElement("div");o.className="body3-txt",o.textContent=a.charAt(0).toUpperCase()+a.slice(1),t.appendChild(o),e.appendChild(t)}),e}},r={render:e=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",n.style.alignItems="center";const a=c.createStatusIcon(e.status);n.appendChild(a);const t=document.createElement("div");return t.className="body2-txt",t.textContent=`Status: ${e.status.charAt(0).toUpperCase()+e.status.slice(1)}`,n.appendChild(t),n},argTypes:{status:{control:"select",options:["assigned","started","not started","complete"],description:"Status type"}},args:{status:"complete"}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.alignItems = 'center';
    const statuses = ['assigned', 'started', 'not started', 'complete'];
    statuses.forEach(status => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      const indicator = PlusSmartComponents.createStatusIcon(status);
      wrapper.appendChild(indicator);
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:`All Variants
Shows all status indicator variants`,...s.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.alignItems = 'center';
    const indicator = PlusSmartComponents.createStatusIcon(args.status);
    container.appendChild(indicator);
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = \`Status: \${args.status.charAt(0).toUpperCase() + args.status.slice(1)}\`;
    container.appendChild(label);
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
}`,...r.parameters?.docs?.source},description:{story:`Interactive Status Indicator
Interactive playground for testing status indicator variations`,...r.parameters?.docs?.description}}};const C=["AllVariants","Interactive"];export{s as AllVariants,r as Interactive,C as __namedExportsOrder,x as default};
