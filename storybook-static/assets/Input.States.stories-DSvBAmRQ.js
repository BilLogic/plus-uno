const p={title:"Components/Input/States",tags:["autodocs"],parameters:{docs:{description:{component:`Input States Stories
State variants organized under "States" subcategory`}}}},s={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.width="var(--size-card-pad-x-lg)";const n=document.createElement("label");n.className="body3-txt",n.textContent="Default",e.appendChild(n);const t=document.createElement("input");return t.type="text",t.className="plus-text-field body2-txt",t.placeholder="Enter text...",e.appendChild(t),e}},r={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.width="var(--size-card-pad-x-lg)";const n=document.createElement("label");n.className="body3-txt",n.textContent="With Value",e.appendChild(n);const t=document.createElement("input");return t.type="text",t.className="plus-text-field body2-txt",t.placeholder="Enter text...",t.value="Sample text",e.appendChild(t),e}},i={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.width="var(--size-card-pad-x-lg)";const n=document.createElement("label");n.className="body3-txt",n.textContent="Disabled",e.appendChild(n);const t=document.createElement("input");return t.type="text",t.className="plus-text-field body2-txt",t.placeholder="Enter text...",t.disabled=!0,e.appendChild(t),e}},d={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.width="var(--size-card-pad-x-lg)";const n=document.createElement("label");n.className="body3-txt",n.textContent="Disabled with Value",e.appendChild(n);const t=document.createElement("input");return t.type="text",t.className="plus-text-field body2-txt",t.placeholder="Enter text...",t.value="Disabled text",t.disabled=!0,e.appendChild(t),e}},c={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)",e.style.width="var(--size-card-pad-x-lg)",[{label:"Default",disabled:!1,value:""},{label:"With Value",disabled:!1,value:"Sample text"},{label:"Disabled",disabled:!0,value:""},{label:"Disabled with Value",disabled:!0,value:"Disabled text"}].forEach(t=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const o=document.createElement("label");o.className="body3-txt",o.textContent=t.label,a.appendChild(o);const l=document.createElement("input");l.type="text",l.className="plus-text-field body2-txt",l.placeholder="Enter text...",l.value=t.value,l.disabled=t.disabled,a.appendChild(l),e.appendChild(a)}),e}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Default';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    container.appendChild(input);
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:"Default State",...s.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'With Value';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    input.value = 'Sample text';
    container.appendChild(input);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"With Value",...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Disabled';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    input.disabled = true;
    container.appendChild(input);
    return container;
  }
}`,...i.parameters?.docs?.source},description:{story:"Disabled State",...i.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Disabled with Value';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    input.value = 'Disabled text';
    input.disabled = true;
    container.appendChild(input);
    return container;
  }
}`,...d.parameters?.docs?.source},description:{story:"Disabled with Value",...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const states = [{
      label: 'Default',
      disabled: false,
      value: ''
    }, {
      label: 'With Value',
      disabled: false,
      value: 'Sample text'
    }, {
      label: 'Disabled',
      disabled: true,
      value: ''
    }, {
      label: 'Disabled with Value',
      disabled: true,
      value: 'Disabled text'
    }];
    states.forEach(state => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = state.label;
      wrapper.appendChild(label);
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'plus-text-field body2-txt';
      input.placeholder = 'Enter text...';
      input.value = state.value;
      input.disabled = state.disabled;
      wrapper.appendChild(input);
      container.appendChild(wrapper);
    });
    return container;
  }
}`,...c.parameters?.docs?.source},description:{story:"All States Comparison",...c.parameters?.docs?.description}}};const u=["Default","WithValue","Disabled","DisabledWithValue","AllStates"];export{c as AllStates,s as Default,i as Disabled,d as DisabledWithValue,r as WithValue,u as __namedExportsOrder,p as default};
