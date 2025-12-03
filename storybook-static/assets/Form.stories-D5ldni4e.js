import{P as l}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const v={title:"Components/Form",tags:["autodocs"],parameters:{docs:{description:{component:"Form components for collecting user input. Includes textarea, select, and range input elements with various sizes and states."}}}},a=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=document.createElement("div");t.className="body2-txt",t.textContent="Form components include textarea, select, range input, and select multiple. See the subcategories for detailed variants:",t.style.marginBottom="24px",e.appendChild(t);const n=document.createElement("ul");return n.style.paddingLeft="24px",n.style.marginBottom="24px",["Size Variants - All sizes (small, medium, large)","States - Default, with value, read-only, disabled","Content Variants - Options, multiple rows, custom ranges","Textarea Variants - All textarea-specific variations"].forEach(i=>{const r=document.createElement("li");r.className="body2-txt",r.textContent=i,n.appendChild(r)}),e.appendChild(n),e},o={render:e=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)",t.style.maxWidth="400px";let n;return e.type==="textarea"?n=l.createTextarea({placeholder:e.placeholder,value:e.value,size:e.size,readonly:e.readonly,disabled:e.disabled}):e.type==="select"?n=l.createSelect({placeholder:e.placeholder,size:e.size,readonly:e.readonly,disabled:e.disabled,options:e.options||[]}):e.type==="range"?n=l.createRangeInput({size:e.size,value:e.value,min:e.min,max:e.max,disabled:e.disabled}):e.type==="selectMultiple"&&(n=l.createSelectMultiple({size:e.size,disabled:e.disabled,options:e.options||[{value:"option1",text:"Form",selected:!0},{value:"option2",text:"Form",selected:!1},{value:"option3",text:"Form",selected:!1}]})),t.appendChild(n),t},args:{type:"textarea",size:"medium",placeholder:"Placeholder",value:"",readonly:!1,disabled:!1,min:0,max:100},argTypes:{type:{control:"select",options:["textarea","select","range","selectMultiple"],description:"Form component type"},size:{control:"select",options:["small","medium","large"],description:"Component size"},placeholder:{control:"text",description:"Placeholder text"},value:{control:"text",description:"Initial value (for textarea/select)"},readonly:{control:"boolean",description:"Read-only state"},disabled:{control:"boolean",description:"Disabled state"},min:{control:"number",description:"Minimum value (for range)"},max:{control:"number",description:"Maximum value (for range)"}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const info = document.createElement('div');
  info.className = 'body2-txt';
  info.textContent = 'Form components include textarea, select, range input, and select multiple. See the subcategories for detailed variants:';
  info.style.marginBottom = '24px';
  container.appendChild(info);
  const list = document.createElement('ul');
  list.style.paddingLeft = '24px';
  list.style.marginBottom = '24px';
  const items = ['Size Variants - All sizes (small, medium, large)', 'States - Default, with value, read-only, disabled', 'Content Variants - Options, multiple rows, custom ranges', 'Textarea Variants - All textarea-specific variations'];
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'body2-txt';
    li.textContent = item;
    list.appendChild(li);
  });
  container.appendChild(list);
  return container;
}`,...a.parameters?.docs?.source},description:{story:`Overview
Overview of all form components
See Size Variants, States, and Content Variants for detailed examples`,...a.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    let component;
    if (args.type === 'textarea') {
      component = PlusInterface.createTextarea({
        placeholder: args.placeholder,
        value: args.value,
        size: args.size,
        readonly: args.readonly,
        disabled: args.disabled
      });
    } else if (args.type === 'select') {
      component = PlusInterface.createSelect({
        placeholder: args.placeholder,
        size: args.size,
        readonly: args.readonly,
        disabled: args.disabled,
        options: args.options || []
      });
    } else if (args.type === 'range') {
      component = PlusInterface.createRangeInput({
        size: args.size,
        value: args.value,
        min: args.min,
        max: args.max,
        disabled: args.disabled
      });
    } else if (args.type === 'selectMultiple') {
      component = PlusInterface.createSelectMultiple({
        size: args.size,
        disabled: args.disabled,
        options: args.options || [{
          value: 'option1',
          text: 'Form',
          selected: true
        }, {
          value: 'option2',
          text: 'Form',
          selected: false
        }, {
          value: 'option3',
          text: 'Form',
          selected: false
        }]
      });
    }
    container.appendChild(component);
    return container;
  },
  args: {
    type: 'textarea',
    size: 'medium',
    placeholder: 'Placeholder',
    value: '',
    readonly: false,
    disabled: false,
    min: 0,
    max: 100
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['textarea', 'select', 'range', 'selectMultiple'],
      description: 'Form component type'
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Component size'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text'
    },
    value: {
      control: 'text',
      description: 'Initial value (for textarea/select)'
    },
    readonly: {
      control: 'boolean',
      description: 'Read-only state'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    },
    min: {
      control: 'number',
      description: 'Minimum value (for range)'
    },
    max: {
      control: 'number',
      description: 'Maximum value (for range)'
    }
  }
}`,...o.parameters?.docs?.source},description:{story:`Interactive
Interactive playground with Storybook controls`,...o.parameters?.docs?.description}}};const g=["Overview","Interactive"];export{o as Interactive,a as Overview,g as __namedExportsOrder,v as default};
