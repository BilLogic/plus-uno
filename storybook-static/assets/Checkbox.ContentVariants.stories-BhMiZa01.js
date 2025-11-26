import{P as s}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const f={title:"Components/Checkbox/Content Variants",tags:["autodocs"]},t={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)";const n=[{label:"Option 1",value:"option1",id:"opt1",checked:!1},{label:"Option 2",value:"option2",id:"opt2",checked:!0},{label:"Option 3",value:"option3",id:"opt3",checked:!1}];return s.createCheckboxGroup(n,"options").forEach(c=>{e.appendChild(c)}),e}},r={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-lg)";const n=document.createElement("div"),o=document.createElement("div");o.className="h6",o.textContent="Category 1",o.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(o);const c=[{label:"Item A",value:"a",id:"grp1-a",checked:!1},{label:"Item B",value:"b",id:"grp1-b",checked:!0},{label:"Item C",value:"c",id:"grp1-c",checked:!1}];s.createCheckboxGroup(c,"group1").forEach(l=>{n.appendChild(l)}),e.appendChild(n);const p=document.createElement("div"),a=document.createElement("div");a.className="h6",a.textContent="Category 2",a.style.marginBottom="var(--size-element-gap-sm)",p.appendChild(a);const i=[{label:"Item X",value:"x",id:"grp2-x",checked:!0},{label:"Item Y",value:"y",id:"grp2-y",checked:!1}];return s.createCheckboxGroup(i,"group2").forEach(l=>{p.appendChild(l)}),e.appendChild(p),e}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    const options = [{
      label: 'Option 1',
      value: 'option1',
      id: 'opt1',
      checked: false
    }, {
      label: 'Option 2',
      value: 'option2',
      id: 'opt2',
      checked: true
    }, {
      label: 'Option 3',
      value: 'option3',
      id: 'opt3',
      checked: false
    }];
    const checkboxes = PlusInterface.createCheckboxGroup(options, 'options');
    checkboxes.forEach(checkbox => {
      container.appendChild(checkbox);
    });
    return container;
  }
}`,...t.parameters?.docs?.source},description:{story:"Checkbox Group",...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';

    // Group 1
    const group1Container = document.createElement('div');
    const group1Label = document.createElement('div');
    group1Label.className = 'h6';
    group1Label.textContent = 'Category 1';
    group1Label.style.marginBottom = 'var(--size-element-gap-sm)';
    group1Container.appendChild(group1Label);
    const group1Options = [{
      label: 'Item A',
      value: 'a',
      id: 'grp1-a',
      checked: false
    }, {
      label: 'Item B',
      value: 'b',
      id: 'grp1-b',
      checked: true
    }, {
      label: 'Item C',
      value: 'c',
      id: 'grp1-c',
      checked: false
    }];
    const group1Checkboxes = PlusInterface.createCheckboxGroup(group1Options, 'group1');
    group1Checkboxes.forEach(checkbox => {
      group1Container.appendChild(checkbox);
    });
    container.appendChild(group1Container);

    // Group 2
    const group2Container = document.createElement('div');
    const group2Label = document.createElement('div');
    group2Label.className = 'h6';
    group2Label.textContent = 'Category 2';
    group2Label.style.marginBottom = 'var(--size-element-gap-sm)';
    group2Container.appendChild(group2Label);
    const group2Options = [{
      label: 'Item X',
      value: 'x',
      id: 'grp2-x',
      checked: true
    }, {
      label: 'Item Y',
      value: 'y',
      id: 'grp2-y',
      checked: false
    }];
    const group2Checkboxes = PlusInterface.createCheckboxGroup(group2Options, 'group2');
    group2Checkboxes.forEach(checkbox => {
      group2Container.appendChild(checkbox);
    });
    container.appendChild(group2Container);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Multiple Checkbox Groups",...r.parameters?.docs?.description}}};const y=["CheckboxGroup","MultipleGroups"];export{t as CheckboxGroup,r as MultipleGroups,y as __namedExportsOrder,f as default};
