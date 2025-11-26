const x={title:"Components/Input",tags:["autodocs"],parameters:{docs:{description:{component:"Input components for collecting user text input. Includes text fields and textareas with multiple sizes and states. Uses element-level tokens and body typography scales."}}}},i={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.width="var(--size-card-pad-x-lg)";const t=[{class:"body1-txt",label:"Body 1"},{class:"body2-txt",label:"Body 2 (Default)"},{class:"body3-txt",label:"Body 3"}],r=document.createElement("div");r.style.display="flex",r.style.flexDirection="column",r.style.gap="var(--size-card-gap-md)";const p=document.createElement("div");p.className="h6",p.textContent="Text Input - All Sizes",p.style.marginBottom="var(--size-element-gap-sm)",r.appendChild(p),t.forEach(l=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-xs)";const s=document.createElement("label");s.className="body3-txt",s.textContent=l.label,n.appendChild(s);const a=document.createElement("input");a.type="text",a.className=`plus-text-field ${l.class}`,a.placeholder=`Input with ${l.label} size`,n.appendChild(a),r.appendChild(n)}),e.appendChild(r);const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.gap="var(--size-card-gap-md)";const d=document.createElement("div");return d.className="h6",d.textContent="Textarea - All Sizes",d.style.marginBottom="var(--size-element-gap-sm)",o.appendChild(d),t.forEach(l=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-xs)";const s=document.createElement("label");s.className="body3-txt",s.textContent=l.label,n.appendChild(s);const a=document.createElement("textarea");a.className=`plus-textarea ${l.class}`,a.placeholder=`Textarea with ${l.label} size`,a.rows=4,n.appendChild(a),o.appendChild(n)}),e.appendChild(o),e}},c={render:e=>{if(e.type==="textarea"){const t=document.createElement("textarea");return t.className=`plus-textarea ${e.size||"body2-txt"}`,t.placeholder=e.placeholder||"Enter text...",t.value=e.value||"",t.disabled=e.disabled||!1,t.rows=4,t}else{const t=document.createElement("input");return t.type="text",t.className=`plus-text-field ${e.size||"body2-txt"}`,t.placeholder=e.placeholder||"Enter text...",t.value=e.value||"",t.disabled=e.disabled||!1,t}},argTypes:{type:{control:"select",options:["text","textarea"],description:"Input type"},placeholder:{control:"text",description:"Placeholder text"},value:{control:"text",description:"Input value"},disabled:{control:"boolean",description:"Disabled state"},size:{control:"select",options:["body1-txt","body2-txt","body3-txt"],description:"Input size class"}},args:{type:"text",placeholder:"Enter text...",value:"",disabled:!1,size:"body2-txt"}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
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

    // Text Input - All Sizes
    const textInputSection = document.createElement('div');
    textInputSection.style.display = 'flex';
    textInputSection.style.flexDirection = 'column';
    textInputSection.style.gap = 'var(--size-card-gap-md)';
    const textInputLabel = document.createElement('div');
    textInputLabel.className = 'h6';
    textInputLabel.textContent = 'Text Input - All Sizes';
    textInputLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    textInputSection.appendChild(textInputLabel);
    sizes.forEach(size => {
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
      input.placeholder = \`Input with \${size.label} size\`;
      wrapper.appendChild(input);
      textInputSection.appendChild(wrapper);
    });
    container.appendChild(textInputSection);

    // Textarea - All Sizes
    const textareaSection = document.createElement('div');
    textareaSection.style.display = 'flex';
    textareaSection.style.flexDirection = 'column';
    textareaSection.style.gap = 'var(--size-card-gap-md)';
    const textareaLabel = document.createElement('div');
    textareaLabel.className = 'h6';
    textareaLabel.textContent = 'Textarea - All Sizes';
    textareaLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    textareaSection.appendChild(textareaLabel);
    sizes.forEach(size => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = size.label;
      wrapper.appendChild(label);
      const textarea = document.createElement('textarea');
      textarea.className = \`plus-textarea \${size.class}\`;
      textarea.placeholder = \`Textarea with \${size.label} size\`;
      textarea.rows = 4;
      wrapper.appendChild(textarea);
      textareaSection.appendChild(wrapper);
    });
    container.appendChild(textareaSection);
    return container;
  }
}`,...i.parameters?.docs?.source},description:{story:`All Variants
Shows all input combinations organized by type: each type shows all sizes and states`,...i.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: args => {
    if (args.type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.className = \`plus-textarea \${args.size || 'body2-txt'}\`;
      textarea.placeholder = args.placeholder || 'Enter text...';
      textarea.value = args.value || '';
      textarea.disabled = args.disabled || false;
      textarea.rows = 4;
      return textarea;
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = \`plus-text-field \${args.size || 'body2-txt'}\`;
      input.placeholder = args.placeholder || 'Enter text...';
      input.value = args.value || '';
      input.disabled = args.disabled || false;
      return input;
    }
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'textarea'],
      description: 'Input type'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text'
    },
    value: {
      control: 'text',
      description: 'Input value'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    },
    size: {
      control: 'select',
      options: ['body1-txt', 'body2-txt', 'body3-txt'],
      description: 'Input size class'
    }
  },
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    value: '',
    disabled: false,
    size: 'body2-txt'
  }
}`,...c.parameters?.docs?.source},description:{story:`Interactive Input
Interactive playground for testing input variations`,...c.parameters?.docs?.description}}};const u=["AllVariants","Interactive"];export{i as AllVariants,c as Interactive,u as __namedExportsOrder,x as default};
