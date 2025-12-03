import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const u={title:"Components/Form/Content Variants",tags:["autodocs"]},t=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=o.createSelectMultiple({size:"medium",options:[{value:"form1",text:"Form 1",selected:!0},{value:"form2",text:"Form 2",selected:!1},{value:"form3",text:"Form 3",selected:!0},{value:"form4",text:"Form 4",selected:!1},{value:"form5",text:"Form 5",selected:!1}]});return e.appendChild(n),e};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const selectMultiple = PlusInterface.createSelectMultiple({
    size: 'medium',
    options: [{
      value: 'form1',
      text: 'Form 1',
      selected: true
    }, {
      value: 'form2',
      text: 'Form 2',
      selected: false
    }, {
      value: 'form3',
      text: 'Form 3',
      selected: true
    }, {
      value: 'form4',
      text: 'Form 4',
      selected: false
    }, {
      value: 'form5',
      text: 'Form 5',
      selected: false
    }]
  });
  container.appendChild(selectMultiple);
  return container;
}`,...t.parameters?.docs?.source},description:{story:`Select Multiple with Many Options
Multiple select with scrollable list`,...t.parameters?.docs?.description}}};const d=["SelectMultipleWithManyOptions"];export{t as SelectMultipleWithManyOptions,d as __namedExportsOrder,u as default};
