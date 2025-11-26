import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const x={title:"Components/Checkbox",tags:["autodocs"],parameters:{docs:{description:{component:"Checkbox component for selecting multiple options. Includes input and label combination with checked/unchecked states. Uses element-level tokens for spacing."}}}},c={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)";const n=document.createElement("div");n.className="h6",n.textContent="States",n.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(n);const s=o.createCheckbox({label:"Checked checkbox",name:"checkbox",value:"value",id:"checkbox-checked",checked:!0});e.appendChild(s);const r=o.createCheckbox({label:"Unchecked checkbox",name:"checkbox",value:"value",id:"checkbox-unchecked",checked:!1});e.appendChild(r);const i=o.createCheckbox({label:"Indeterminate checkbox (dash/minus)",name:"checkbox",value:"value",id:"checkbox-indeterminate",checked:!1,indeterminate:!0});return e.appendChild(i),t.appendChild(e),t}},a={render:t=>{const e=document.createElement("div"),n=o.createCheckbox(t);return e.appendChild(n),e},argTypes:{label:{control:"text",description:"Checkbox label"},name:{control:"text",description:"Input name attribute"},value:{control:"text",description:"Input value attribute"},checked:{control:"boolean",description:"Checked state"},indeterminate:{control:"boolean",description:"Indeterminate state (shows dash/minus instead of checkmark)"}},args:{label:"Interactive checkbox",name:"interactive",value:"value",id:"checkbox-interactive",checked:!1}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // States
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-element-gap-sm)';
    const statesLabel = document.createElement('div');
    statesLabel.className = 'h6';
    statesLabel.textContent = 'States';
    statesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesLabel);
    const checked = PlusInterface.createCheckbox({
      label: 'Checked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-checked',
      checked: true
    });
    statesSection.appendChild(checked);
    const unchecked = PlusInterface.createCheckbox({
      label: 'Unchecked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-unchecked',
      checked: false
    });
    statesSection.appendChild(unchecked);
    const indeterminate = PlusInterface.createCheckbox({
      label: 'Indeterminate checkbox (dash/minus)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-indeterminate',
      checked: false,
      indeterminate: true
    });
    statesSection.appendChild(indeterminate);
    container.appendChild(statesSection);
    return container;
  }
}`,...c.parameters?.docs?.source},description:{story:`All Variants
Shows all checkbox combinations: states and content variants`,...c.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox(args);
    container.appendChild(checkbox);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Checkbox label'
    },
    name: {
      control: 'text',
      description: 'Input name attribute'
    },
    value: {
      control: 'text',
      description: 'Input value attribute'
    },
    checked: {
      control: 'boolean',
      description: 'Checked state'
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state (shows dash/minus instead of checkmark)'
    }
  },
  args: {
    label: 'Interactive checkbox',
    name: 'interactive',
    value: 'value',
    id: 'checkbox-interactive',
    checked: false
  }
}`,...a.parameters?.docs?.source},description:{story:`Interactive Checkbox
Interactive playground for testing checkbox variations`,...a.parameters?.docs?.description}}};const v=["AllVariants","Interactive"];export{c as AllVariants,a as Interactive,v as __namedExportsOrder,x as default};
