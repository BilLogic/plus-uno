import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const _={title:"Components/Form/Size Variants",tags:["autodocs"]},d=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Small",e.appendChild(t);const n=document.createElement("input");return n.type="text",n.className="plus-text-field body3-txt",n.placeholder="Placeholder",e.appendChild(n),e},m=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Medium (Default)",e.appendChild(t);const n=document.createElement("input");return n.type="text",n.className="plus-text-field body2-txt",n.placeholder="Placeholder",e.appendChild(n),e},u=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Large",e.appendChild(t);const n=document.createElement("input");return n.type="text",n.className="plus-text-field body1-txt",n.placeholder="Placeholder",e.appendChild(n),e},x=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Small",e.appendChild(t);const n=o.createTextarea({placeholder:"Placeholder",size:"small"});return e.appendChild(n),e},y=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Medium (Default)",e.appendChild(t);const n=o.createTextarea({placeholder:"Placeholder",size:"medium"});return e.appendChild(n),e},b=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Large",e.appendChild(t);const n=o.createTextarea({placeholder:"Placeholder",size:"large"});return e.appendChild(n),e},h=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Small",e.appendChild(t);const n=o.createSelect({placeholder:"Select Form",size:"small",options:[]});return e.appendChild(n),e},C=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Medium (Default)",e.appendChild(t);const n=o.createSelect({placeholder:"Select Form",size:"medium",options:[]});return e.appendChild(n),e},g=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="400px";const t=document.createElement("label");t.className="body3-txt",t.textContent="Large",e.appendChild(t);const n=o.createSelect({placeholder:"Select Form",size:"large",options:[]});return e.appendChild(n),e},f=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=document.createElement("div"),n=document.createElement("h3");n.textContent="Form Input",n.style.marginBottom="24px",t.appendChild(n);const c=document.createElement("div");c.style.display="flex",c.style.flexDirection="column",c.style.gap="24px",c.style.maxWidth="400px",[{class:"body3-txt",label:"Small",size:"small"},{class:"body2-txt",label:"Medium (Default)",size:"medium"},{class:"body1-txt",label:"Large",size:"large"}].forEach(p=>{const r=document.createElement("div");r.style.display="flex",r.style.flexDirection="column",r.style.gap="var(--size-element-gap-xs)";const a=document.createElement("label");a.className="body3-txt",a.textContent=p.label,r.appendChild(a);const l=document.createElement("input");l.type="text",l.className=`plus-text-field ${p.class}`,l.placeholder="Placeholder",r.appendChild(l),c.appendChild(r)}),t.appendChild(c),e.appendChild(t);const S=document.createElement("div"),E=document.createElement("h3");E.textContent="Form Textarea",E.style.marginBottom="24px",S.appendChild(E);const s=document.createElement("div");s.style.display="flex",s.style.flexDirection="column",s.style.gap="24px",s.style.maxWidth="400px";const D=["small","medium","large"],L=["Small","Medium (Default)","Large"];D.forEach((p,r)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const l=document.createElement("label");l.className="body3-txt",l.textContent=L[r],a.appendChild(l);const F=o.createTextarea({placeholder:"Placeholder",size:p});a.appendChild(F),s.appendChild(a)}),S.appendChild(s),e.appendChild(S);const v=document.createElement("div"),z=document.createElement("h3");z.textContent="Form Select",z.style.marginBottom="24px",v.appendChild(z);const i=document.createElement("div");return i.style.display="flex",i.style.flexDirection="column",i.style.gap="24px",i.style.maxWidth="400px",D.forEach((p,r)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const l=document.createElement("label");l.className="body3-txt",l.textContent=L[r],a.appendChild(l);const F=o.createSelect({placeholder:"Select Form",size:p,options:[]});a.appendChild(F),i.appendChild(a)}),v.appendChild(i),e.appendChild(v),e};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => {
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
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'plus-text-field body3-txt';
  input.placeholder = 'Placeholder';
  container.appendChild(input);
  return container;
}`,...d.parameters?.docs?.source},description:{story:"Form Input - Small Size",...d.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => {
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
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'plus-text-field body2-txt';
  input.placeholder = 'Placeholder';
  container.appendChild(input);
  return container;
}`,...m.parameters?.docs?.source},description:{story:"Form Input - Medium Size (Default)",...m.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => {
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
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'plus-text-field body1-txt';
  input.placeholder = 'Placeholder';
  container.appendChild(input);
  return container;
}`,...u.parameters?.docs?.source},description:{story:"Form Input - Large Size",...u.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`() => {
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
}`,...x.parameters?.docs?.source},description:{story:"Form Textarea - Small Size",...x.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`() => {
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
}`,...y.parameters?.docs?.source},description:{story:"Form Textarea - Medium Size (Default)",...y.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`() => {
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
}`,...b.parameters?.docs?.source},description:{story:"Form Textarea - Large Size",...b.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => {
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
}`,...h.parameters?.docs?.source},description:{story:"Form Select - Small Size",...h.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`() => {
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
}`,...C.parameters?.docs?.source},description:{story:"Form Select - Medium Size (Default)",...C.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`() => {
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
}`,...g.parameters?.docs?.source},description:{story:"Form Select - Large Size",...g.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';

  // Form Input Section
  const inputSection = document.createElement('div');
  const inputLabel = document.createElement('h3');
  inputLabel.textContent = 'Form Input';
  inputLabel.style.marginBottom = '24px';
  inputSection.appendChild(inputLabel);
  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.flexDirection = 'column';
  inputContainer.style.gap = '24px';
  inputContainer.style.maxWidth = '400px';
  const inputSizes = [{
    class: 'body3-txt',
    label: 'Small',
    size: 'small'
  }, {
    class: 'body2-txt',
    label: 'Medium (Default)',
    size: 'medium'
  }, {
    class: 'body1-txt',
    label: 'Large',
    size: 'large'
  }];
  inputSizes.forEach(size => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = size.label;
    wrapper.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = \`plus-text-field \${size.class}\`;
    input.placeholder = 'Placeholder';
    wrapper.appendChild(input);
    inputContainer.appendChild(wrapper);
  });
  inputSection.appendChild(inputContainer);
  container.appendChild(inputSection);

  // Form Textarea Section
  const textareaSection = document.createElement('div');
  const textareaLabel = document.createElement('h3');
  textareaLabel.textContent = 'Form Textarea';
  textareaLabel.style.marginBottom = '24px';
  textareaSection.appendChild(textareaLabel);
  const textareaContainer = document.createElement('div');
  textareaContainer.style.display = 'flex';
  textareaContainer.style.flexDirection = 'column';
  textareaContainer.style.gap = '24px';
  textareaContainer.style.maxWidth = '400px';
  const textareaSizes = ['small', 'medium', 'large'];
  const textareaSizeLabels = ['Small', 'Medium (Default)', 'Large'];
  textareaSizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = textareaSizeLabels[index];
    wrapper.appendChild(label);
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: size
    });
    wrapper.appendChild(textarea);
    textareaContainer.appendChild(wrapper);
  });
  textareaSection.appendChild(textareaContainer);
  container.appendChild(textareaSection);

  // Form Select Section
  const selectSection = document.createElement('div');
  const selectLabel = document.createElement('h3');
  selectLabel.textContent = 'Form Select';
  selectLabel.style.marginBottom = '24px';
  selectSection.appendChild(selectLabel);
  const selectContainer = document.createElement('div');
  selectContainer.style.display = 'flex';
  selectContainer.style.flexDirection = 'column';
  selectContainer.style.gap = '24px';
  selectContainer.style.maxWidth = '400px';
  textareaSizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = textareaSizeLabels[index];
    wrapper.appendChild(label);
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    wrapper.appendChild(select);
    selectContainer.appendChild(wrapper);
  });
  selectSection.appendChild(selectContainer);
  container.appendChild(selectSection);
  return container;
}`,...f.parameters?.docs?.source},description:{story:"All Form Sizes Comparison",...f.parameters?.docs?.description}}};const A=["FormInputSmall","FormInputMedium","FormInputLarge","FormTextareaSmall","FormTextareaMedium","FormTextareaLarge","FormSelectSmall","FormSelectMedium","FormSelectLarge","AllFormSizes"];export{f as AllFormSizes,u as FormInputLarge,m as FormInputMedium,d as FormInputSmall,g as FormSelectLarge,C as FormSelectMedium,h as FormSelectSmall,b as FormTextareaLarge,y as FormTextareaMedium,x as FormTextareaSmall,A as __namedExportsOrder,_ as default};
