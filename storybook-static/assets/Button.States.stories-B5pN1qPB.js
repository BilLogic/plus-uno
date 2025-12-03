import{P as l}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const f={title:"Components/Button/States",tags:["autodocs"]},n={render:()=>{const e=document.createElement("div"),t=l.createButton({btnText:"Enabled Button",btnStyle:"primary",btnFill:"filled",btnSize:"default",enabled:!0});return e.appendChild(t),e}},r={render:()=>{const e=document.createElement("div"),t=l.createButton({btnText:"Disabled Button",btnStyle:"primary",btnFill:"filled",btnSize:"default",enabled:!1});return e.appendChild(t),e}},a={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexWrap="wrap",e.style.gap="var(--size-card-gap-md)",e.style.flexDirection="column";const t=l.createButton({btnText:"Enabled",btnStyle:"primary",btnFill:"filled",btnSize:"default",enabled:!0});e.appendChild(t);const o=l.createButton({btnText:"Disabled",btnStyle:"primary",btnFill:"filled",btnSize:"default",enabled:!1});return e.appendChild(o),e}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Enabled Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true
    });
    container.appendChild(button);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:"Enabled Button",...n.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Disabled Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false
    });
    container.appendChild(button);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Disabled Button",...r.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.flexDirection = 'column';
    const enabledButton = PlusInterface.createButton({
      btnText: 'Enabled',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true
    });
    container.appendChild(enabledButton);
    const disabledButton = PlusInterface.createButton({
      btnText: 'Disabled',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false
    });
    container.appendChild(disabledButton);
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:"All States Comparison",...a.parameters?.docs?.description}}};const y=["Enabled","Disabled","AllStates"];export{a as AllStates,r as Disabled,n as Enabled,y as __namedExportsOrder,f as default};
