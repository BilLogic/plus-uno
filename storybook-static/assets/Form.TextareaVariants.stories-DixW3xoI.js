import{P as c}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const k={title:"Components/Form/Textarea Variants",tags:["autodocs"]},u=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Small",e.appendChild(t);const l=c.createTextarea({placeholder:"Placeholder",size:"small"});return e.appendChild(l),e},y=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Medium (Default)",e.appendChild(t);const l=c.createTextarea({placeholder:"Placeholder",size:"medium"});return e.appendChild(l),e},b=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Large",e.appendChild(t);const l=c.createTextarea({placeholder:"Placeholder",size:"large"});return e.appendChild(l),e},h=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=["small","medium","large"],l=["Small","Medium","Large"];return t.forEach((r,s)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const n=document.createElement("label");n.className="body3-txt",n.textContent=`${l[s]} - Placeholder`,a.appendChild(n);const o=c.createTextarea({placeholder:"Placeholder",size:r});a.appendChild(o),e.appendChild(a)}),e},f=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=["small","medium","large"],l=["Small","Medium","Large"];return t.forEach((r,s)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const n=document.createElement("label");n.className="body3-txt",n.textContent=`${l[s]} - With Value`,a.appendChild(n);const o=c.createTextarea({value:"Value",size:r});a.appendChild(o),e.appendChild(a)}),e},g=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=["small","medium","large"],l=["Small","Medium","Large"];return t.forEach((r,s)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const n=document.createElement("label");n.className="body3-txt",n.textContent=`${l[s]} - Focus`,a.appendChild(n);const o=c.createTextarea({placeholder:"Placeholder",size:r});s===0&&setTimeout(()=>o.focus(),100),a.appendChild(o),e.appendChild(a)}),e},C=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=["small","medium","large"],l=["Small","Medium","Large"];return t.forEach((r,s)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const n=document.createElement("label");n.className="body3-txt",n.textContent=`${l[s]} - Read-only`,a.appendChild(n);const o=c.createTextarea({value:s===0?"Placeholder":"Value",size:r,readonly:!0});a.appendChild(o),e.appendChild(a)}),e},z=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=["small","medium","large"],l=["Small","Medium","Large"];return t.forEach((r,s)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const n=document.createElement("label");n.className="body3-txt",n.textContent=`${l[s]} - Disabled`,a.appendChild(n);const o=c.createTextarea({value:s===0?"":"Value",placeholder:s===0?"Placeholder":"",size:r,disabled:!0});a.appendChild(o),e.appendChild(a)}),e},v=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=["small","medium","large"],l=["Small","Medium","Large"];return t.forEach((r,s)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const n=document.createElement("label");n.className="body3-txt",n.textContent=`${l[s]} - Multiple Rows`,a.appendChild(n);const o=c.createTextarea({placeholder:"Enter multiple lines of text...",size:r,rows:5});a.appendChild(o),e.appendChild(a)}),e},E=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=document.createElement("div"),l=document.createElement("h3");l.textContent="Sizes",l.style.marginBottom="24px",t.appendChild(l);const r=document.createElement("div");r.style.display="flex",r.style.flexDirection="column",r.style.gap="24px",r.style.maxWidth="400px";const s=["small","medium","large"],a=["Small","Medium (Default)","Large"];s.forEach((p,d)=>{const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-xs)";const x=document.createElement("label");x.className="body3-txt",x.textContent=a[d],i.appendChild(x);const w=c.createTextarea({placeholder:"Placeholder",size:p});i.appendChild(w),r.appendChild(i)}),t.appendChild(r),e.appendChild(t);const n=document.createElement("div"),o=document.createElement("h3");o.textContent="States",o.style.marginBottom="24px",n.appendChild(o);const m=document.createElement("div");return m.style.display="flex",m.style.flexDirection="column",m.style.gap="24px",m.style.maxWidth="400px",[{label:"Default (Placeholder)",placeholder:"Placeholder",value:"",readonly:!1,disabled:!1},{label:"With Value",placeholder:"",value:"Value",readonly:!1,disabled:!1},{label:"Read-only (with value)",placeholder:"",value:"Value",readonly:!0,disabled:!1},{label:"Disabled (Placeholder)",placeholder:"Placeholder",value:"",readonly:!1,disabled:!0},{label:"Disabled (with value)",placeholder:"",value:"Value",readonly:!1,disabled:!0}].forEach(p=>{const d=document.createElement("div");d.style.display="flex",d.style.flexDirection="column",d.style.gap="var(--size-element-gap-xs)";const i=document.createElement("label");i.className="body3-txt",i.textContent=p.label,d.appendChild(i);const x=c.createTextarea({placeholder:p.placeholder,value:p.value,size:"medium",readonly:p.readonly,disabled:p.disabled});d.appendChild(x),m.appendChild(d)}),n.appendChild(m),e.appendChild(n),e};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => {
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
  const textarea = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'small'
  });
  container.appendChild(textarea);
  return container;
}`,...u.parameters?.docs?.source},description:{story:"Textarea - Small Size",...u.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`() => {
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
  const textarea = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'medium'
  });
  container.appendChild(textarea);
  return container;
}`,...y.parameters?.docs?.source},description:{story:"Textarea - Medium Size (Default)",...y.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`() => {
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
  const textarea = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'large'
  });
  container.appendChild(textarea);
  return container;
}`,...b.parameters?.docs?.source},description:{story:"Textarea - Large Size",...b.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => {
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
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: size
    });
    wrapper.appendChild(textarea);
    container.appendChild(wrapper);
  });
  return container;
}`,...h.parameters?.docs?.source},description:{story:"Textarea - Default State (Placeholder)",...h.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`() => {
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
    const textarea = PlusInterface.createTextarea({
      value: 'Value',
      size: size
    });
    wrapper.appendChild(textarea);
    container.appendChild(wrapper);
  });
  return container;
}`,...f.parameters?.docs?.source},description:{story:"Textarea - With Value",...f.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`() => {
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
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: size
    });
    // Auto-focus the first one for demonstration
    if (index === 0) {
      setTimeout(() => textarea.focus(), 100);
    }
    wrapper.appendChild(textarea);
    container.appendChild(wrapper);
  });
  return container;
}`,...g.parameters?.docs?.source},description:{story:"Textarea - Focus State",...g.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`() => {
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
    const textarea = PlusInterface.createTextarea({
      value: index === 0 ? 'Placeholder' : 'Value',
      size: size,
      readonly: true
    });
    wrapper.appendChild(textarea);
    container.appendChild(wrapper);
  });
  return container;
}`,...C.parameters?.docs?.source},description:{story:"Textarea - Read-only State",...C.parameters?.docs?.description}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`() => {
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
    const textarea = PlusInterface.createTextarea({
      value: index === 0 ? '' : 'Value',
      placeholder: index === 0 ? 'Placeholder' : '',
      size: size,
      disabled: true
    });
    wrapper.appendChild(textarea);
    container.appendChild(wrapper);
  });
  return container;
}`,...z.parameters?.docs?.source},description:{story:"Textarea - Disabled State",...z.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`() => {
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
    label.textContent = \`\${sizeLabels[index]} - Multiple Rows\`;
    wrapper.appendChild(label);
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Enter multiple lines of text...',
      size: size,
      rows: 5
    });
    wrapper.appendChild(textarea);
    container.appendChild(wrapper);
  });
  return container;
}`,...v.parameters?.docs?.source},description:{story:"Textarea - With Multiple Rows",...v.parameters?.docs?.description}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`() => {
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
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: size
    });
    wrapper.appendChild(textarea);
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
    placeholder: 'Placeholder',
    value: '',
    readonly: false,
    disabled: false
  }, {
    label: 'With Value',
    placeholder: '',
    value: 'Value',
    readonly: false,
    disabled: false
  }, {
    label: 'Read-only (with value)',
    placeholder: '',
    value: 'Value',
    readonly: true,
    disabled: false
  }, {
    label: 'Disabled (Placeholder)',
    placeholder: 'Placeholder',
    value: '',
    readonly: false,
    disabled: true
  }, {
    label: 'Disabled (with value)',
    placeholder: '',
    value: 'Value',
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
    const textarea = PlusInterface.createTextarea({
      placeholder: state.placeholder,
      value: state.value,
      size: 'medium',
      readonly: state.readonly,
      disabled: state.disabled
    });
    wrapper.appendChild(textarea);
    statesContainer.appendChild(wrapper);
  });
  statesSection.appendChild(statesContainer);
  container.appendChild(statesSection);
  return container;
}`,...E.parameters?.docs?.source},description:{story:"Textarea - All Variants Comparison",...E.parameters?.docs?.description}}};const I=["TextareaSmall","TextareaMedium","TextareaLarge","TextareaDefault","TextareaWithValue","TextareaFocus","TextareaReadOnly","TextareaDisabled","TextareaWithRows","AllTextareaVariants"];export{E as AllTextareaVariants,h as TextareaDefault,z as TextareaDisabled,g as TextareaFocus,b as TextareaLarge,y as TextareaMedium,C as TextareaReadOnly,u as TextareaSmall,v as TextareaWithRows,f as TextareaWithValue,I as __namedExportsOrder,k as default};
