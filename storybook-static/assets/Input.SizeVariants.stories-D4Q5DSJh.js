const d={title:"Components/Input/Size Variants",tags:["autodocs"],parameters:{docs:{description:{component:`Input Size Variants Stories
Size variants organized under "Size Variants" subcategory`}}}},l={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.width="var(--size-card-pad-x-lg)";const n=document.createElement("label");n.className="body3-txt",n.textContent="Body 1",e.appendChild(n);const t=document.createElement("input");return t.type="text",t.className="plus-text-field body1-txt",t.placeholder="Input with Body 1 size",e.appendChild(t),e}},r={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.width="var(--size-card-pad-x-lg)";const n=document.createElement("label");n.className="body3-txt",n.textContent="Body 2 (Default)",e.appendChild(n);const t=document.createElement("input");return t.type="text",t.className="plus-text-field body2-txt",t.placeholder="Input with Body 2 size",e.appendChild(t),e}},s={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-xs)",e.style.width="var(--size-card-pad-x-lg)";const n=document.createElement("label");n.className="body3-txt",n.textContent="Body 3",e.appendChild(n);const t=document.createElement("input");return t.type="text",t.className="plus-text-field body3-txt",t.placeholder="Input with Body 3 size",e.appendChild(t),e}},o={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)",e.style.width="var(--size-card-pad-x-lg)",[{class:"body1-txt",label:"Body 1"},{class:"body2-txt",label:"Body 2 (Default)"},{class:"body3-txt",label:"Body 3"}].forEach(t=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const i=document.createElement("label");i.className="body3-txt",i.textContent=`Textarea ${t.label}`,a.appendChild(i);const c=document.createElement("textarea");c.className=`plus-textarea ${t.class}`,c.placeholder=`Textarea with ${t.label} size`,c.rows=4,a.appendChild(c),e.appendChild(a)}),e}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Body 1';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body1-txt';
    input.placeholder = 'Input with Body 1 size';
    container.appendChild(input);
    return container;
  }
}`,...l.parameters?.docs?.source},description:{story:"Body 1 Size",...l.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Body 2 (Default)';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Input with Body 2 size';
    container.appendChild(input);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Body 2 Size (Default)",...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Body 3';
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body3-txt';
    input.placeholder = 'Input with Body 3 size';
    container.appendChild(input);
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:"Body 3 Size",...s.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    const sizes = [{
      class: 'body1-txt',
      label: 'Body 1'
    }, {
      class: 'body2-txt',
      label: 'Body 2 (Default)'
    }, {
      class: 'body3-txt',
      label: 'Body 3'
    }];
    sizes.forEach(size => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = \`Textarea \${size.label}\`;
      wrapper.appendChild(label);
      const textarea = document.createElement('textarea');
      textarea.className = \`plus-textarea \${size.class}\`;
      textarea.placeholder = \`Textarea with \${size.label} size\`;
      textarea.rows = 4;
      wrapper.appendChild(textarea);
      container.appendChild(wrapper);
    });
    return container;
  }
}`,...o.parameters?.docs?.source},description:{story:"Textarea Sizes",...o.parameters?.docs?.description}}};const p=["Body1","Body2","Body3","TextareaSizes"];export{l as Body1,r as Body2,s as Body3,o as TextareaSizes,p as __namedExportsOrder,d as default};
