import{P as t}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const L={title:"Components/InputGroup",tags:["autodocs"],parameters:{docs:{description:{component:"Input groups extend form controls by adding text, checkboxes, radios, buttons, or icons on either side of inputs. Built on Bootstrap 4.6.2 input-group pattern with PLUS design token customizations."}}}},b={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const r=document.createElement("div");r.className="h6",r.textContent="Input Group Text",r.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(r);const n=document.createElement("div");n.style.display="flex",n.style.flexWrap="wrap",n.style.gap="var(--size-element-gap-md)",n.style.alignItems="center";const l=t.createInputGroup({prepend:"Text",input:{type:"text",placeholder:"Placeholder",id:"all-text-1"},size:"default"});n.appendChild(l),e.appendChild(n);const a=document.createElement("div");a.className="h6",a.textContent="Input Group Checkbox",a.style.marginTop="var(--size-section-gap-md)",a.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(a);const o=document.createElement("div");o.style.display="flex",o.style.flexWrap="wrap",o.style.gap="var(--size-element-gap-md)",o.style.alignItems="center";const c=t.createCheckbox({label:"",name:"all-checkbox-1",value:"1",id:"all-checkbox-checked",checked:!0}),s=t.createInputGroup({prepend:{type:"checkbox",checkbox:c},input:{type:"text",placeholder:"Placeholder",id:"all-input-checked"},size:"default"});o.appendChild(s),e.appendChild(o);const p=document.createElement("div");p.className="h6",p.textContent="Input Group Radio",p.style.marginTop="var(--size-section-gap-md)",p.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(p);const d=document.createElement("div");d.style.display="flex",d.style.flexWrap="wrap",d.style.gap="var(--size-element-gap-md)",d.style.alignItems="center";const f=t.createRadio({label:"",name:"all-radio-group",value:"1",id:"all-radio-selected",checked:!0}),k=t.createInputGroup({prepend:{type:"radio",radio:f},input:{type:"text",placeholder:"Placeholder",id:"all-input-selected"},size:"default"});d.appendChild(k),e.appendChild(d);const u=document.createElement("div");u.className="h6",u.textContent="Input Group Button",u.style.marginTop="var(--size-section-gap-md)",u.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(u);const i=document.createElement("div");i.style.display="flex",i.style.flexWrap="wrap",i.style.gap="var(--size-element-gap-md)",i.style.alignItems="center";const g=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"filled",btnSize:"default"}),I=t.createInputGroup({prepend:{type:"button",button:g},input:{type:"text",placeholder:"Placeholder",id:"all-input-button"},size:"default"});return i.appendChild(I),e.appendChild(i),e}},h={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-md)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const r=t.createInputGroup({prepend:"Text",input:{type:"text",placeholder:"Placeholder",id:"text-prepend-1"},size:"default"});e.appendChild(r);const n=t.createInputGroup({prepend:["Text","Text"],input:{type:"text",placeholder:"Placeholder",id:"text-prepend-2"},size:"default"});e.appendChild(n);const l=t.createInputGroup({append:"Text",input:{type:"text",placeholder:"Placeholder",id:"text-append-1"},size:"default"});e.appendChild(l);const a=t.createInputGroup({append:["Text","Text"],input:{type:"text",placeholder:"Placeholder",id:"text-append-2"},size:"default"});e.appendChild(a);const o=t.createInputGroup({prepend:"Text",append:"Text",input:{type:"text",placeholder:"Placeholder",id:"text-both-1"},size:"default"});e.appendChild(o);const c=t.createInputGroup({prepend:["Text","Text"],append:["Text","Text"],input:{type:"text",placeholder:"Placeholder",id:"text-both-2"},size:"default"});return e.appendChild(c),e}},x={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-md)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const r=t.createCheckbox({label:"",name:"checkbox-1",value:"1",id:"checkbox-checked-1",checked:!0}),n=t.createInputGroup({prepend:{type:"checkbox",checkbox:r},input:{type:"text",placeholder:"Placeholder",id:"input-checked"},size:"default"});e.appendChild(n);const l=t.createCheckbox({label:"",name:"checkbox-2",value:"2",id:"checkbox-indeterminate-1",indeterminate:!0}),a=t.createInputGroup({prepend:{type:"checkbox",checkbox:l},input:{type:"text",placeholder:"Placeholder",id:"input-indeterminate"},size:"default"});e.appendChild(a);const o=t.createCheckbox({label:"",name:"checkbox-3",value:"3",id:"checkbox-unchecked-1",checked:!1}),c=t.createInputGroup({prepend:{type:"checkbox",checkbox:o},input:{type:"text",placeholder:"Placeholder",id:"input-unchecked"},size:"default"});e.appendChild(c);const s=t.createCheckbox({label:"",name:"checkbox-4",value:"4",id:"checkbox-disabled-1",checked:!1,disabled:!0}),p=t.createInputGroup({prepend:{type:"checkbox",checkbox:s},input:{type:"text",placeholder:"Placeholder",id:"input-enabled"},size:"default"});return e.appendChild(p),e}},y={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-md)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const r=t.createRadio({label:"",name:"radio-group-1",value:"1",id:"radio-selected-1",checked:!0}),n=t.createInputGroup({prepend:{type:"radio",radio:r},input:{type:"text",placeholder:"Placeholder",id:"input-selected"},size:"default"});e.appendChild(n);const l=t.createRadio({label:"",name:"radio-group-1",value:"2",id:"radio-unselected-1",checked:!1}),a=t.createInputGroup({prepend:{type:"radio",radio:l},input:{type:"text",placeholder:"Placeholder",id:"input-unselected-1"},size:"default"});e.appendChild(a);const o=t.createRadio({label:"",name:"radio-group-2",value:"1",id:"radio-disabled-1",checked:!1,disabled:!0}),c=t.createInputGroup({prepend:{type:"radio",radio:o},input:{type:"text",placeholder:"Placeholder",id:"input-enabled-radio"},size:"default"});return e.appendChild(c),e}},m={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-md)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const r=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),n=t.createInputGroup({prepend:{type:"button",button:r},input:{type:"text",placeholder:"Placeholder",id:"button-prepend-1"},size:"default"});e.appendChild(n);const l=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),a=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),o=t.createInputGroup({prepend:[{type:"button",button:l},{type:"button",button:a}],input:{type:"text",placeholder:"Placeholder",id:"button-prepend-2"},size:"default"});e.appendChild(o);const c=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),s=t.createInputGroup({append:{type:"button",button:c},input:{type:"text",placeholder:"Placeholder",id:"button-append-1"},size:"default"});e.appendChild(s);const p=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),d=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),f=t.createInputGroup({append:[{type:"button",button:p},{type:"button",button:d}],input:{type:"text",placeholder:"Placeholder",id:"button-append-2"},size:"default"});e.appendChild(f);const k=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),u=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),i=t.createInputGroup({prepend:{type:"button",button:k},append:{type:"button",button:u},input:{type:"text",placeholder:"Placeholder",id:"button-both-1"},size:"default"});e.appendChild(i);const g=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),I=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),C=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),w=t.createButton({btnText:"Button",btnStyle:"primary",btnFill:"outline",btnSize:"default"}),z=t.createInputGroup({prepend:[{type:"button",button:g},{type:"button",button:I}],append:[{type:"button",button:C},{type:"button",button:w}],input:{type:"text",placeholder:"Placeholder",id:"button-both-2"},size:"default"});return e.appendChild(z),e}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';

    // Text Section
    const textLabel = document.createElement('div');
    textLabel.className = 'h6';
    textLabel.textContent = 'Input Group Text';
    textLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(textLabel);
    const textRow = document.createElement('div');
    textRow.style.display = 'flex';
    textRow.style.flexWrap = 'wrap';
    textRow.style.gap = 'var(--size-element-gap-md)';
    textRow.style.alignItems = 'center';
    const textPrepend = PlusInterface.createInputGroup({
      prepend: 'Text',
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'all-text-1'
      },
      size: 'default'
    });
    textRow.appendChild(textPrepend);
    container.appendChild(textRow);

    // Checkbox Section
    const checkboxLabel = document.createElement('div');
    checkboxLabel.className = 'h6';
    checkboxLabel.textContent = 'Input Group Checkbox';
    checkboxLabel.style.marginTop = 'var(--size-section-gap-md)';
    checkboxLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(checkboxLabel);
    const checkboxRow = document.createElement('div');
    checkboxRow.style.display = 'flex';
    checkboxRow.style.flexWrap = 'wrap';
    checkboxRow.style.gap = 'var(--size-element-gap-md)';
    checkboxRow.style.alignItems = 'center';
    const checkedCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'all-checkbox-1',
      value: '1',
      id: 'all-checkbox-checked',
      checked: true
    });
    const checkedGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'checkbox',
        checkbox: checkedCheckbox
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'all-input-checked'
      },
      size: 'default'
    });
    checkboxRow.appendChild(checkedGroup);
    container.appendChild(checkboxRow);

    // Radio Section
    const radioLabel = document.createElement('div');
    radioLabel.className = 'h6';
    radioLabel.textContent = 'Input Group Radio';
    radioLabel.style.marginTop = 'var(--size-section-gap-md)';
    radioLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(radioLabel);
    const radioRow = document.createElement('div');
    radioRow.style.display = 'flex';
    radioRow.style.flexWrap = 'wrap';
    radioRow.style.gap = 'var(--size-element-gap-md)';
    radioRow.style.alignItems = 'center';
    const selectedRadio = PlusInterface.createRadio({
      label: '',
      name: 'all-radio-group',
      value: '1',
      id: 'all-radio-selected',
      checked: true
    });
    const selectedGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'radio',
        radio: selectedRadio
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'all-input-selected'
      },
      size: 'default'
    });
    radioRow.appendChild(selectedGroup);
    container.appendChild(radioRow);

    // Button Section
    const buttonLabel = document.createElement('div');
    buttonLabel.className = 'h6';
    buttonLabel.textContent = 'Input Group Button';
    buttonLabel.style.marginTop = 'var(--size-section-gap-md)';
    buttonLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(buttonLabel);
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.flexWrap = 'wrap';
    buttonRow.style.gap = 'var(--size-element-gap-md)';
    buttonRow.style.alignItems = 'center';
    const button1 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const buttonGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'button',
        button: button1
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'all-input-button'
      },
      size: 'default'
    });
    buttonRow.appendChild(buttonGroup);
    container.appendChild(buttonRow);
    return container;
  }
}`,...b.parameters?.docs?.source},description:{story:`All Variants
Shows all input group types: Text, Checkbox, Radio, and Button addons`,...b.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';

    // Row 1: Single text prepend + input
    const row1 = PlusInterface.createInputGroup({
      prepend: 'Text',
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'text-prepend-1'
      },
      size: 'default'
    });
    container.appendChild(row1);

    // Row 2: Two text prepends + input
    const row2 = PlusInterface.createInputGroup({
      prepend: ['Text', 'Text'],
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'text-prepend-2'
      },
      size: 'default'
    });
    container.appendChild(row2);

    // Row 3: Input + single text append
    const row3 = PlusInterface.createInputGroup({
      append: 'Text',
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'text-append-1'
      },
      size: 'default'
    });
    container.appendChild(row3);

    // Row 4: Input + two text appends (two text to the right)
    const row4 = PlusInterface.createInputGroup({
      append: ['Text', 'Text'],
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'text-append-2'
      },
      size: 'default'
    });
    container.appendChild(row4);

    // Row 5: One text prepend + input + one text append (one on each side)
    const row5 = PlusInterface.createInputGroup({
      prepend: 'Text',
      append: 'Text',
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'text-both-1'
      },
      size: 'default'
    });
    container.appendChild(row5);

    // Row 6: Two text prepends + input + two text appends (two on each side)
    const row6 = PlusInterface.createInputGroup({
      prepend: ['Text', 'Text'],
      append: ['Text', 'Text'],
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'text-both-2'
      },
      size: 'default'
    });
    container.appendChild(row6);
    return container;
  }
}`,...h.parameters?.docs?.source},description:{story:`Input Group Text
Text addons (prefixes and suffixes) for input fields
Based on Figma Design System specifications - exact layout match`,...h.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';

    // Row 1: Checked checkbox + input
    const checkedCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-1',
      value: '1',
      id: 'checkbox-checked-1',
      checked: true
    });
    const checkedGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'checkbox',
        checkbox: checkedCheckbox
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'input-checked'
      },
      size: 'default'
    });
    container.appendChild(checkedGroup);

    // Row 2: Indeterminate checkbox + input
    const indeterminateCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-2',
      value: '2',
      id: 'checkbox-indeterminate-1',
      indeterminate: true
    });
    const indeterminateGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'checkbox',
        checkbox: indeterminateCheckbox
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'input-indeterminate'
      },
      size: 'default'
    });
    container.appendChild(indeterminateGroup);

    // Row 3: Unchecked checkbox + input
    const uncheckedCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-3',
      value: '3',
      id: 'checkbox-unchecked-1',
      checked: false
    });
    const uncheckedGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'checkbox',
        checkbox: uncheckedCheckbox
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'input-unchecked'
      },
      size: 'default'
    });
    container.appendChild(uncheckedGroup);

    // Row 4: Disabled checkbox (checkbox disabled, input enabled)
    const disabledCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-4',
      value: '4',
      id: 'checkbox-disabled-1',
      checked: false,
      disabled: true
    });
    const disabledGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'checkbox',
        checkbox: disabledCheckbox
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'input-enabled'
      },
      size: 'default'
    });
    container.appendChild(disabledGroup);
    return container;
  }
}`,...x.parameters?.docs?.source},description:{story:`Input Group Checkbox
Checkbox addons for input fields
Based on Figma Design System specifications - exact layout match`,...x.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';

    // Row 1: Selected radio + input
    const selectedRadio = PlusInterface.createRadio({
      label: '',
      name: 'radio-group-1',
      value: '1',
      id: 'radio-selected-1',
      checked: true
    });
    const selectedGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'radio',
        radio: selectedRadio
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'input-selected'
      },
      size: 'default'
    });
    container.appendChild(selectedGroup);

    // Row 2: Unselected radio + input
    const unselectedRadio1 = PlusInterface.createRadio({
      label: '',
      name: 'radio-group-1',
      value: '2',
      id: 'radio-unselected-1',
      checked: false
    });
    const unselectedGroup1 = PlusInterface.createInputGroup({
      prepend: {
        type: 'radio',
        radio: unselectedRadio1
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'input-unselected-1'
      },
      size: 'default'
    });
    container.appendChild(unselectedGroup1);

    // Row 3: Disabled radio (radio disabled, input enabled)
    const disabledRadio = PlusInterface.createRadio({
      label: '',
      name: 'radio-group-2',
      value: '1',
      id: 'radio-disabled-1',
      checked: false,
      disabled: true
    });
    const disabledRadioGroup = PlusInterface.createInputGroup({
      prepend: {
        type: 'radio',
        radio: disabledRadio
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'input-enabled-radio'
      },
      size: 'default'
    });
    container.appendChild(disabledRadioGroup);
    return container;
  }
}`,...y.parameters?.docs?.source},description:{story:`Input Group Radio
Radio button addons for input fields
Based on Figma Design System specifications - exact layout match`,...y.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';

    // Row 1: Single button prepend + input
    const button1 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row1 = PlusInterface.createInputGroup({
      prepend: {
        type: 'button',
        button: button1
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'button-prepend-1'
      },
      size: 'default'
    });
    container.appendChild(row1);

    // Row 2: Two button prepends + input
    const button2 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button3 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row2 = PlusInterface.createInputGroup({
      prepend: [{
        type: 'button',
        button: button2
      }, {
        type: 'button',
        button: button3
      }],
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'button-prepend-2'
      },
      size: 'default'
    });
    container.appendChild(row2);

    // Row 3: Input + single button append
    const button4 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row3 = PlusInterface.createInputGroup({
      append: {
        type: 'button',
        button: button4
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'button-append-1'
      },
      size: 'default'
    });
    container.appendChild(row3);

    // Row 4: Input + two button appends (two buttons to the right)
    const button5 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button6 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row4 = PlusInterface.createInputGroup({
      append: [{
        type: 'button',
        button: button5
      }, {
        type: 'button',
        button: button6
      }],
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'button-append-2'
      },
      size: 'default'
    });
    container.appendChild(row4);

    // Row 5: One button prepend + input + one button append (one on each side)
    const button7 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button8 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row5 = PlusInterface.createInputGroup({
      prepend: {
        type: 'button',
        button: button7
      },
      append: {
        type: 'button',
        button: button8
      },
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'button-both-1'
      },
      size: 'default'
    });
    container.appendChild(row5);

    // Row 6: Two button prepends + input + two button appends (two on each side)
    const button9 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button10 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button11 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button12 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row6 = PlusInterface.createInputGroup({
      prepend: [{
        type: 'button',
        button: button9
      }, {
        type: 'button',
        button: button10
      }],
      append: [{
        type: 'button',
        button: button11
      }, {
        type: 'button',
        button: button12
      }],
      input: {
        type: 'text',
        placeholder: 'Placeholder',
        id: 'button-both-2'
      },
      size: 'default'
    });
    container.appendChild(row6);
    return container;
  }
}`,...m.parameters?.docs?.source},description:{story:`Input Group Button
Button addons for input fields
Based on Figma Design System specifications - exact layout match
Uses outline buttons (text and border use primary color, no background fill)`,...m.parameters?.docs?.description}}};const E=["AllVariants","InputGroupText","InputGroupCheckbox","InputGroupRadio","InputGroupButton"];export{b as AllVariants,m as InputGroupButton,x as InputGroupCheckbox,y as InputGroupRadio,h as InputGroupText,E as __namedExportsOrder,L as default};
