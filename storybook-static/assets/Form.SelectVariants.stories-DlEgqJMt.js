import{P as c}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const O={title:"Components/Form/Select Variants",tags:["autodocs"]},y=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=document.createElement("label");n.className="body3-txt",n.textContent="Small",e.appendChild(n);const l=c.createSelect({placeholder:"Select Form",size:"small",options:[]});return e.appendChild(l),e},x=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=document.createElement("label");n.className="body3-txt",n.textContent="Medium (Default)",e.appendChild(n);const l=c.createSelect({placeholder:"Select Form",size:"medium",options:[]});return e.appendChild(l),e},b=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=document.createElement("label");n.className="body3-txt",n.textContent="Large",e.appendChild(n);const l=c.createSelect({placeholder:"Select Form",size:"large",options:[]});return e.appendChild(l),e},h=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=["small","medium","large"],l=["Small","Medium","Large"];return n.forEach((s,o)=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-xs)";const a=document.createElement("label");a.className="body3-txt",a.textContent=`${l[o]} - Placeholder`,t.appendChild(a);const r=c.createSelect({placeholder:"Select Form",size:s,options:[]});t.appendChild(r),e.appendChild(t)}),e},f=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=["small","medium","large"],l=["Small","Medium","Large"];return n.forEach((s,o)=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-xs)";const a=document.createElement("label");a.className="body3-txt",a.textContent=`${l[o]} - With Value`,t.appendChild(a);const r=c.createSelect({size:s,options:[{value:"option1",text:"Select Form",selected:!0}]});t.appendChild(r),e.appendChild(t)}),e},g=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=["small","medium","large"],l=["Small","Medium","Large"];return n.forEach((s,o)=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-xs)";const a=document.createElement("label");a.className="body3-txt",a.textContent=`${l[o]} - Focus`,t.appendChild(a);const r=c.createSelect({placeholder:"Select Form",size:s,options:[]});o===0&&setTimeout(()=>{const d=r.querySelector("select");d&&d.focus()},100),t.appendChild(r),e.appendChild(t)}),e},S=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=["small","medium","large"],l=["Small","Medium","Large"];return n.forEach((s,o)=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-xs)";const a=document.createElement("label");a.className="body3-txt",a.textContent=`${l[o]} - Read-only`,t.appendChild(a);const r=c.createSelect({placeholder:o===0?"Select Form":"",size:s,readonly:!0,options:o===0?[]:[{value:"option1",text:"Select Form",selected:!0}]});t.appendChild(r),e.appendChild(t)}),e},C=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=["small","medium","large"],l=["Small","Medium","Large"];return n.forEach((s,o)=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-xs)";const a=document.createElement("label");a.className="body3-txt",a.textContent=`${l[o]} - Disabled`,t.appendChild(a);const r=c.createSelect({placeholder:o===0?"Select Form":"",size:s,disabled:!0,options:o===0?[]:[{value:"option1",text:"Select Form",selected:!0}]});t.appendChild(r),e.appendChild(t)}),e},v=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const n=c.createSelect({placeholder:"Select an option",size:"medium",options:[{value:"option1",text:"Option 1",selected:!1},{value:"option2",text:"Option 2",selected:!0},{value:"option3",text:"Option 3",selected:!1},{value:"option4",text:"Option 4",selected:!1}]}),l=document.createElement("label");return l.className="body3-txt",l.textContent="With Multiple Options",l.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(l),e.appendChild(n),e},z=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const n=document.createElement("div"),l=document.createElement("h3");l.textContent="Sizes",l.style.marginBottom="24px",n.appendChild(l);const s=document.createElement("div");s.style.display="flex",s.style.flexDirection="column",s.style.gap="24px",s.style.maxWidth="400px";const o=["small","medium","large"],t=["Small","Medium (Default)","Large"];o.forEach((p,m)=>{const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-xs)";const u=document.createElement("label");u.className="body3-txt",u.textContent=t[m],i.appendChild(u);const E=c.createSelect({placeholder:"Select Form",size:p,options:[]});i.appendChild(E),s.appendChild(i)}),n.appendChild(s),e.appendChild(n);const a=document.createElement("div"),r=document.createElement("h3");r.textContent="States",r.style.marginBottom="24px",a.appendChild(r);const d=document.createElement("div");return d.style.display="flex",d.style.flexDirection="column",d.style.gap="24px",d.style.maxWidth="400px",[{label:"Default (Placeholder)",placeholder:"Select Form",value:null,readonly:!1,disabled:!1},{label:"With Value",placeholder:"",value:"Select Form",readonly:!1,disabled:!1},{label:"Read-only (with value)",placeholder:"",value:"Select Form",readonly:!0,disabled:!1},{label:"Disabled (Placeholder)",placeholder:"Select Form",value:null,readonly:!1,disabled:!0},{label:"Disabled (with value)",placeholder:"",value:"Select Form",readonly:!1,disabled:!0}].forEach(p=>{const m=document.createElement("div");m.style.display="flex",m.style.flexDirection="column",m.style.gap="var(--size-element-gap-xs)";const i=document.createElement("label");i.className="body3-txt",i.textContent=p.label,m.appendChild(i);const u=c.createSelect({placeholder:p.placeholder,size:"medium",readonly:p.readonly,disabled:p.disabled,options:p.value?[{value:"option1",text:p.value,selected:!0}]:[]});m.appendChild(u),d.appendChild(m)}),a.appendChild(d),e.appendChild(a),e};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = 'var(--size-element-gap-xs)';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const label = document.createElement('label');
  label.className = 'body3-txt';
  label.textContent = 'Small';
  container.appendChild(label);
  const select = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'small',
    options: []
  });
  container.appendChild(select);
  return container;
}`,...y.parameters?.docs?.source},description:{story:"Select - Small Size",...y.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = 'var(--size-element-gap-xs)';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const label = document.createElement('label');
  label.className = 'body3-txt';
  label.textContent = 'Medium (Default)';
  container.appendChild(label);
  const select = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'medium',
    options: []
  });
  container.appendChild(select);
  return container;
}`,...x.parameters?.docs?.source},description:{story:"Select - Medium Size (Default)",...x.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = 'var(--size-element-gap-xs)';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const label = document.createElement('label');
  label.className = 'body3-txt';
  label.textContent = 'Large';
  container.appendChild(label);
  const select = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'large',
    options: []
  });
  container.appendChild(select);
  return container;
}`,...b.parameters?.docs?.source},description:{story:"Select - Large Size",...b.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = \`\${sizeLabels[index]} - Placeholder\`;
    wrapper.appendChild(label);
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  });
  return container;
}`,...h.parameters?.docs?.source},description:{story:"Select - Default State (Placeholder)",...h.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = \`\${sizeLabels[index]} - With Value\`;
    wrapper.appendChild(label);
    const select = PlusInterface.createSelect({
      size: size,
      options: [{
        value: 'option1',
        text: 'Select Form',
        selected: true
      }]
    });
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  });
  return container;
}`,...f.parameters?.docs?.source},description:{story:"Select - With Value",...f.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = \`\${sizeLabels[index]} - Focus\`;
    wrapper.appendChild(label);
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    // Auto-focus the first one for demonstration
    if (index === 0) {
      setTimeout(() => {
        const selectElement = select.querySelector('select');
        if (selectElement) {
          selectElement.focus();
        }
      }, 100);
    }
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  });
  return container;
}`,...g.parameters?.docs?.source},description:{story:"Select - Focus State",...g.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = \`\${sizeLabels[index]} - Read-only\`;
    wrapper.appendChild(label);
    const select = PlusInterface.createSelect({
      placeholder: index === 0 ? 'Select Form' : '',
      size: size,
      readonly: true,
      options: index === 0 ? [] : [{
        value: 'option1',
        text: 'Select Form',
        selected: true
      }]
    });
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  });
  return container;
}`,...S.parameters?.docs?.source},description:{story:"Select - Read-only State",...S.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = \`\${sizeLabels[index]} - Disabled\`;
    wrapper.appendChild(label);
    const select = PlusInterface.createSelect({
      placeholder: index === 0 ? 'Select Form' : '',
      size: size,
      disabled: true,
      options: index === 0 ? [] : [{
        value: 'option1',
        text: 'Select Form',
        selected: true
      }]
    });
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  });
  return container;
}`,...C.parameters?.docs?.source},description:{story:"Select - Disabled State",...C.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  const select = PlusInterface.createSelect({
    placeholder: 'Select an option',
    size: 'medium',
    options: [{
      value: 'option1',
      text: 'Option 1',
      selected: false
    }, {
      value: 'option2',
      text: 'Option 2',
      selected: true
    }, {
      value: 'option3',
      text: 'Option 3',
      selected: false
    }, {
      value: 'option4',
      text: 'Option 4',
      selected: false
    }]
  });
  const label = document.createElement('label');
  label.className = 'body3-txt';
  label.textContent = 'With Multiple Options';
  label.style.marginBottom = 'var(--size-element-gap-xs)';
  container.appendChild(label);
  container.appendChild(select);
  return container;
}`,...v.parameters?.docs?.source},description:{story:"Select - With Options",...v.parameters?.docs?.description}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';

  // Sizes Section
  const sizesSection = document.createElement('div');
  const sizesLabel = document.createElement('h3');
  sizesLabel.textContent = 'Sizes';
  sizesLabel.style.marginBottom = '24px';
  sizesSection.appendChild(sizesLabel);
  const sizesContainer = document.createElement('div');
  sizesContainer.style.display = 'flex';
  sizesContainer.style.flexDirection = 'column';
  sizesContainer.style.gap = '24px';
  sizesContainer.style.maxWidth = '400px';
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium (Default)', 'Large'];
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = sizeLabels[index];
    wrapper.appendChild(label);
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    wrapper.appendChild(select);
    sizesContainer.appendChild(wrapper);
  });
  sizesSection.appendChild(sizesContainer);
  container.appendChild(sizesSection);

  // States Section
  const statesSection = document.createElement('div');
  const statesLabel = document.createElement('h3');
  statesLabel.textContent = 'States';
  statesLabel.style.marginBottom = '24px';
  statesSection.appendChild(statesLabel);
  const statesContainer = document.createElement('div');
  statesContainer.style.display = 'flex';
  statesContainer.style.flexDirection = 'column';
  statesContainer.style.gap = '24px';
  statesContainer.style.maxWidth = '400px';
  const states = [{
    label: 'Default (Placeholder)',
    placeholder: 'Select Form',
    value: null,
    readonly: false,
    disabled: false
  }, {
    label: 'With Value',
    placeholder: '',
    value: 'Select Form',
    readonly: false,
    disabled: false
  }, {
    label: 'Read-only (with value)',
    placeholder: '',
    value: 'Select Form',
    readonly: true,
    disabled: false
  }, {
    label: 'Disabled (Placeholder)',
    placeholder: 'Select Form',
    value: null,
    readonly: false,
    disabled: true
  }, {
    label: 'Disabled (with value)',
    placeholder: '',
    value: 'Select Form',
    readonly: false,
    disabled: true
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
    const select = PlusInterface.createSelect({
      placeholder: state.placeholder,
      size: 'medium',
      readonly: state.readonly,
      disabled: state.disabled,
      options: state.value ? [{
        value: 'option1',
        text: state.value,
        selected: true
      }] : []
    });
    wrapper.appendChild(select);
    statesContainer.appendChild(wrapper);
  });
  statesSection.appendChild(statesContainer);
  container.appendChild(statesSection);
  return container;
}`,...z.parameters?.docs?.source},description:{story:"All Select Variants Comparison",...z.parameters?.docs?.description}}};const I=["SelectSmall","SelectMedium","SelectLarge","SelectDefault","SelectWithValue","SelectFocus","SelectReadOnly","SelectDisabled","SelectWithOptions","AllSelectVariants"];export{z as AllSelectVariants,h as SelectDefault,C as SelectDisabled,g as SelectFocus,b as SelectLarge,x as SelectMedium,S as SelectReadOnly,y as SelectSmall,v as SelectWithOptions,f as SelectWithValue,I as __namedExportsOrder,O as default};
