import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const R={title:"Components/Radio",tags:["autodocs"],parameters:{docs:{description:{component:"Radio button component for selecting a single option from a set. Built on Bootstrap 4.6.2 form-check pattern. Currently uses Bootstrap default styling."}}}},r={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)";const a=document.createElement("div");a.className="h6",a.textContent="States",a.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(a);const p=o.createRadio({label:"Selected radio",name:"radio-group-1",value:"option1",id:"radio-checked",checked:!0});e.appendChild(p);const u=o.createRadio({label:"Unselected radio",name:"radio-group-1",value:"option2",id:"radio-unchecked",checked:!1});e.appendChild(u);const m=o.createRadio({label:"Disabled radio",name:"radio-group-1",value:"option3",id:"radio-disabled",disabled:!0});e.appendChild(m);const s=o.createRadio({label:"Focused radio",name:"radio-group-1",value:"option4",id:"radio-focused",checked:!1});setTimeout(()=>{const n=s.querySelector(".plus-radio");n&&n.focus()},0),e.appendChild(s);const l=o.createRadio({label:"Focused selected radio",name:"radio-group-1",value:"option5",id:"radio-focused-checked",checked:!0});setTimeout(()=>{const n=l.querySelector(".plus-radio");n&&n.focus()},0),e.appendChild(l),t.appendChild(e);const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-sm)";const c=document.createElement("div");c.className="h6",c.textContent="Radio Group",c.style.marginBottom="var(--size-element-gap-sm)",i.appendChild(c);const g=[{label:"Option 1",value:"opt1",id:"radio-group-opt1",checked:!0},{label:"Option 2",value:"opt2",id:"radio-group-opt2",checked:!1},{label:"Option 3",value:"opt3",id:"radio-group-opt3",checked:!1}];return o.createRadioGroup(g,"radio-group-2").forEach(n=>i.appendChild(n)),t.appendChild(i),t}},d={render:t=>{const e=document.createElement("div"),a=o.createRadio(t);return e.appendChild(a),e},argTypes:{label:{control:"text",description:"Radio label"},name:{control:"text",description:"Input name attribute (required for radio groups)"},value:{control:"text",description:"Input value attribute"},checked:{control:"boolean",description:"Checked state"},disabled:{control:"boolean",description:"Disabled state"}},args:{label:"Interactive radio",name:"interactive",value:"value",id:"radio-interactive",checked:!1,disabled:!1}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
    const checked = PlusInterface.createRadio({
      label: 'Selected radio',
      name: 'radio-group-1',
      value: 'option1',
      id: 'radio-checked',
      checked: true
    });
    statesSection.appendChild(checked);
    const unchecked = PlusInterface.createRadio({
      label: 'Unselected radio',
      name: 'radio-group-1',
      value: 'option2',
      id: 'radio-unchecked',
      checked: false
    });
    statesSection.appendChild(unchecked);
    const disabled = PlusInterface.createRadio({
      label: 'Disabled radio',
      name: 'radio-group-1',
      value: 'option3',
      id: 'radio-disabled',
      disabled: true
    });
    statesSection.appendChild(disabled);
    const focused = PlusInterface.createRadio({
      label: 'Focused radio',
      name: 'radio-group-1',
      value: 'option4',
      id: 'radio-focused',
      checked: false
    });
    // Programmatically focus the input after it's added to DOM
    setTimeout(() => {
      const input = focused.querySelector('.plus-radio');
      if (input) {
        input.focus();
      }
    }, 0);
    statesSection.appendChild(focused);
    const focusedChecked = PlusInterface.createRadio({
      label: 'Focused selected radio',
      name: 'radio-group-1',
      value: 'option5',
      id: 'radio-focused-checked',
      checked: true
    });
    // Programmatically focus the input after it's added to DOM
    setTimeout(() => {
      const input = focusedChecked.querySelector('.plus-radio');
      if (input) {
        input.focus();
      }
    }, 0);
    statesSection.appendChild(focusedChecked);
    container.appendChild(statesSection);

    // Radio Group
    const groupSection = document.createElement('div');
    groupSection.style.display = 'flex';
    groupSection.style.flexDirection = 'column';
    groupSection.style.gap = 'var(--size-element-gap-sm)';
    const groupLabel = document.createElement('div');
    groupLabel.className = 'h6';
    groupLabel.textContent = 'Radio Group';
    groupLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    groupSection.appendChild(groupLabel);
    const options = [{
      label: 'Option 1',
      value: 'opt1',
      id: 'radio-group-opt1',
      checked: true
    }, {
      label: 'Option 2',
      value: 'opt2',
      id: 'radio-group-opt2',
      checked: false
    }, {
      label: 'Option 3',
      value: 'opt3',
      id: 'radio-group-opt3',
      checked: false
    }];
    const radioGroup = PlusInterface.createRadioGroup(options, 'radio-group-2');
    radioGroup.forEach(radio => groupSection.appendChild(radio));
    container.appendChild(groupSection);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:`All Variants
Shows all radio combinations: states and content variants`,...r.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const radio = PlusInterface.createRadio(args);
    container.appendChild(radio);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Radio label'
    },
    name: {
      control: 'text',
      description: 'Input name attribute (required for radio groups)'
    },
    value: {
      control: 'text',
      description: 'Input value attribute'
    },
    checked: {
      control: 'boolean',
      description: 'Checked state'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    }
  },
  args: {
    label: 'Interactive radio',
    name: 'interactive',
    value: 'value',
    id: 'radio-interactive',
    checked: false,
    disabled: false
  }
}`,...d.parameters?.docs?.source},description:{story:`Interactive Radio
Interactive playground for testing radio variations`,...d.parameters?.docs?.description}}};const I=["AllVariants","Interactive"];export{r as AllVariants,d as Interactive,I as __namedExportsOrder,R as default};
