import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const y={title:"Components/Switch",tags:["autodocs"],parameters:{docs:{description:{component:"Switch component for toggling between two states. Includes input and label combination with on/off states. Uses element-level tokens for spacing."}}}},c={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)";const n=document.createElement("div");n.className="h6",n.textContent="States",n.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(n);const l=i.createSwitch({label:"Switch on",name:"switch-on",id:"switch-checked",checked:!0});e.appendChild(l);const r=i.createSwitch({label:"Switch off",name:"switch-off",id:"switch-unchecked",checked:!1});e.appendChild(r);const d=i.createSwitch({label:"Disabled switch",name:"switch-disabled",id:"switch-disabled",disabled:!0});e.appendChild(d),t.appendChild(e);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-md)";const o=document.createElement("div");return o.className="h6",o.textContent="Switch Group (Settings Example)",o.style.marginBottom="var(--size-element-gap-sm)",a.appendChild(o),[{label:"Enable notifications",name:"notifications",id:"switch-notifications",checked:!0},{label:"Auto-save drafts",name:"autosave",id:"switch-autosave",checked:!1},{label:"Dark mode",name:"darkmode",id:"switch-darkmode",checked:!1}].forEach(p=>{const h=i.createSwitch(p);a.appendChild(h)}),t.appendChild(a),t}},s={render:t=>{const e=document.createElement("div"),n=i.createSwitch(t);return e.appendChild(n),e},argTypes:{label:{control:"text",description:"Switch label"},name:{control:"text",description:"Input name attribute"},checked:{control:"boolean",description:"Checked (on) state"},disabled:{control:"boolean",description:"Disabled state"}},args:{label:"Interactive switch",name:"interactive",id:"switch-interactive",checked:!1,disabled:!1}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
    const checked = PlusInterface.createSwitch({
      label: 'Switch on',
      name: 'switch-on',
      id: 'switch-checked',
      checked: true
    });
    statesSection.appendChild(checked);
    const unchecked = PlusInterface.createSwitch({
      label: 'Switch off',
      name: 'switch-off',
      id: 'switch-unchecked',
      checked: false
    });
    statesSection.appendChild(unchecked);
    const disabled = PlusInterface.createSwitch({
      label: 'Disabled switch',
      name: 'switch-disabled',
      id: 'switch-disabled',
      disabled: true
    });
    statesSection.appendChild(disabled);
    container.appendChild(statesSection);

    // Switch Group
    const groupSection = document.createElement('div');
    groupSection.style.display = 'flex';
    groupSection.style.flexDirection = 'column';
    groupSection.style.gap = 'var(--size-element-gap-md)';
    const groupLabel = document.createElement('div');
    groupLabel.className = 'h6';
    groupLabel.textContent = 'Switch Group (Settings Example)';
    groupLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    groupSection.appendChild(groupLabel);
    const switches = [{
      label: 'Enable notifications',
      name: 'notifications',
      id: 'switch-notifications',
      checked: true
    }, {
      label: 'Auto-save drafts',
      name: 'autosave',
      id: 'switch-autosave',
      checked: false
    }, {
      label: 'Dark mode',
      name: 'darkmode',
      id: 'switch-darkmode',
      checked: false
    }];
    switches.forEach(sw => {
      const switchEl = PlusInterface.createSwitch(sw);
      groupSection.appendChild(switchEl);
    });
    container.appendChild(groupSection);
    return container;
  }
}`,...c.parameters?.docs?.source},description:{story:`All Variants
Shows all switch combinations: states and content variants`,...c.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const switchEl = PlusInterface.createSwitch(args);
    container.appendChild(switchEl);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Switch label'
    },
    name: {
      control: 'text',
      description: 'Input name attribute'
    },
    checked: {
      control: 'boolean',
      description: 'Checked (on) state'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    }
  },
  args: {
    label: 'Interactive switch',
    name: 'interactive',
    id: 'switch-interactive',
    checked: false,
    disabled: false
  }
}`,...s.parameters?.docs?.source},description:{story:`Interactive Switch
Interactive playground for testing switch variations`,...s.parameters?.docs?.description}}};const C=["AllVariants","Interactive"];export{c as AllVariants,s as Interactive,C as __namedExportsOrder,y as default};
