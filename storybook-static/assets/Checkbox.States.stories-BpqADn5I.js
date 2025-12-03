import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const u={title:"Components/Checkbox/States",tags:["autodocs"]},n={render:()=>{const e=document.createElement("div"),c=o.createCheckbox({label:"Checked checkbox",name:"checkbox",value:"value",id:"checkbox-checked",checked:!0});return e.appendChild(c),e}},r={render:()=>{const e=document.createElement("div"),c=o.createCheckbox({label:"Unchecked checkbox",name:"checkbox",value:"value",id:"checkbox-unchecked",checked:!1});return e.appendChild(c),e}},t={render:()=>{const e=document.createElement("div"),c=o.createCheckbox({label:"Indeterminate checkbox (dash/minus)",name:"checkbox",value:"value",id:"checkbox-indeterminate",checked:!1,indeterminate:!0});return e.appendChild(c),e}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Checked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-checked',
      checked: true
    });
    container.appendChild(checkbox);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:"Checked Checkbox",...n.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Unchecked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-unchecked',
      checked: false
    });
    container.appendChild(checkbox);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Unchecked Checkbox",...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Indeterminate checkbox (dash/minus)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-indeterminate',
      checked: false,
      indeterminate: true
    });
    container.appendChild(checkbox);
    return container;
  }
}`,...t.parameters?.docs?.source},description:{story:`Indeterminate Checkbox
Shows a dash/minus instead of a checkmark, used when some items in a group are selected`,...t.parameters?.docs?.description}}};const p=["Checked","Unchecked","Indeterminate"];export{n as Checked,t as Indeterminate,r as Unchecked,p as __namedExportsOrder,u as default};
