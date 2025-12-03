import{c as o}from"./index-p1xEmOam.js";const g={title:"Components/RichTextEditor",tags:["autodocs"],parameters:{docs:{description:{component:"Rich text editor component with formatting toolbar. Supports various text formatting options including bold, italic, lists, links, and more."}}}},c=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=document.createElement("div"),n=document.createElement("h3");n.textContent="Small",n.style.marginBottom="24px",t.appendChild(n);const d=o({id:"editor-small",placeholder:"Enter text...",size:"small",minHeight:100});t.appendChild(d),e.appendChild(t);const i=document.createElement("div"),a=document.createElement("h3");a.textContent="Medium (Default)",a.style.marginBottom="24px",i.appendChild(a);const h=o({id:"editor-medium",placeholder:"Enter text...",size:"medium",minHeight:120});i.appendChild(h),e.appendChild(i);const l=document.createElement("div"),r=document.createElement("h3");r.textContent="Large",r.style.marginBottom="24px",l.appendChild(r);const y=o({id:"editor-large",placeholder:"Enter text...",size:"large",minHeight:150});return l.appendChild(y),e.appendChild(l),e},s=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="800px";const t=o({id:"editor-with-content",placeholder:"Enter text...",size:"medium",value:"<p>This is <strong>bold</strong> text and this is <em>italic</em> text.</p><ul><li>First item</li><li>Second item</li></ul><p>You can edit this content.</p>",minHeight:200});return e.appendChild(t),e},m=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="800px";const t=document.createElement("div"),n=document.createElement("h3");n.textContent="Default",n.style.marginBottom="24px",t.appendChild(n);const d=o({id:"editor-default",placeholder:"Enter text...",size:"medium",minHeight:120});t.appendChild(d),e.appendChild(t);const i=document.createElement("div"),a=document.createElement("h3");a.textContent="Read-only",a.style.marginBottom="24px",i.appendChild(a);const h=o({id:"editor-readonly",placeholder:"Enter text...",size:"medium",readonly:!0,value:"<p>This is <strong>read-only</strong> content. You cannot edit it.</p>",minHeight:120});i.appendChild(h),e.appendChild(i);const l=document.createElement("div"),r=document.createElement("h3");r.textContent="Disabled",r.style.marginBottom="24px",l.appendChild(r);const y=o({id:"editor-disabled",placeholder:"Enter text...",size:"medium",disabled:!0,value:"<p>This editor is <strong>disabled</strong>.</p>",minHeight:120});return l.appendChild(y),e.appendChild(l),e},p=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="24px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)",e.style.maxWidth="800px";const t=o({id:"editor-custom",placeholder:"Enter text...",size:"medium",toolbarButtons:["bold","italic","underline","list-ul","list-ol","link"],minHeight:200}),n=document.createElement("div");return n.className="body2-txt",n.textContent="Custom Toolbar (Bold, Italic, Underline, Lists, Link only)",n.style.marginBottom="8px",e.appendChild(n),e.appendChild(t),e},u={render:e=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)",t.style.maxWidth="800px";const n=o({id:e.id||"editor-interactive",name:e.name,placeholder:e.placeholder||"Enter text...",value:e.value,size:e.size||"medium",readonly:e.readonly||!1,disabled:e.disabled||!1,minHeight:e.minHeight||200,onChange:e.onChange||(d=>console.log("Content changed:",d))});return t.appendChild(n),t},args:{id:"editor-interactive",placeholder:"Enter text...",value:"",size:"medium",readonly:!1,disabled:!1,minHeight:200},argTypes:{size:{control:{type:"select"},options:["small","medium","large"],description:"Editor size"},readonly:{control:{type:"boolean"},description:"Read-only state"},disabled:{control:{type:"boolean"},description:"Disabled state"},minHeight:{control:{type:"number"},description:"Minimum height in pixels"},placeholder:{control:{type:"text"},description:"Placeholder text"},value:{control:{type:"text"},description:"Initial HTML content"}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';

  // Small Size
  const smallSection = document.createElement('div');
  const smallLabel = document.createElement('h3');
  smallLabel.textContent = 'Small';
  smallLabel.style.marginBottom = '24px';
  smallSection.appendChild(smallLabel);
  const smallEditor = createRichTextEditor({
    id: 'editor-small',
    placeholder: 'Enter text...',
    size: 'small',
    minHeight: 100
  });
  smallSection.appendChild(smallEditor);
  container.appendChild(smallSection);

  // Medium Size
  const mediumSection = document.createElement('div');
  const mediumLabel = document.createElement('h3');
  mediumLabel.textContent = 'Medium (Default)';
  mediumLabel.style.marginBottom = '24px';
  mediumSection.appendChild(mediumLabel);
  const mediumEditor = createRichTextEditor({
    id: 'editor-medium',
    placeholder: 'Enter text...',
    size: 'medium',
    minHeight: 120
  });
  mediumSection.appendChild(mediumEditor);
  container.appendChild(mediumSection);

  // Large Size
  const largeSection = document.createElement('div');
  const largeLabel = document.createElement('h3');
  largeLabel.textContent = 'Large';
  largeLabel.style.marginBottom = '24px';
  largeSection.appendChild(largeLabel);
  const largeEditor = createRichTextEditor({
    id: 'editor-large',
    placeholder: 'Enter text...',
    size: 'large',
    minHeight: 150
  });
  largeSection.appendChild(largeEditor);
  container.appendChild(largeSection);
  return container;
}`,...c.parameters?.docs?.source},description:{story:`All Variants
Shows all rich text editor sizes and states`,...c.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '800px';
  const editor = createRichTextEditor({
    id: 'editor-with-content',
    placeholder: 'Enter text...',
    size: 'medium',
    value: '<p>This is <strong>bold</strong> text and this is <em>italic</em> text.</p><ul><li>First item</li><li>Second item</li></ul><p>You can edit this content.</p>',
    minHeight: 200
  });
  container.appendChild(editor);
  return container;
}`,...s.parameters?.docs?.source},description:{story:`With Content
Shows rich text editor with pre-filled content`,...s.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '800px';

  // Default
  const defaultSection = document.createElement('div');
  const defaultLabel = document.createElement('h3');
  defaultLabel.textContent = 'Default';
  defaultLabel.style.marginBottom = '24px';
  defaultSection.appendChild(defaultLabel);
  const defaultEditor = createRichTextEditor({
    id: 'editor-default',
    placeholder: 'Enter text...',
    size: 'medium',
    minHeight: 120
  });
  defaultSection.appendChild(defaultEditor);
  container.appendChild(defaultSection);

  // Read-only
  const readonlySection = document.createElement('div');
  const readonlyLabel = document.createElement('h3');
  readonlyLabel.textContent = 'Read-only';
  readonlyLabel.style.marginBottom = '24px';
  readonlySection.appendChild(readonlyLabel);
  const readonlyEditor = createRichTextEditor({
    id: 'editor-readonly',
    placeholder: 'Enter text...',
    size: 'medium',
    readonly: true,
    value: '<p>This is <strong>read-only</strong> content. You cannot edit it.</p>',
    minHeight: 120
  });
  readonlySection.appendChild(readonlyEditor);
  container.appendChild(readonlySection);

  // Disabled
  const disabledSection = document.createElement('div');
  const disabledLabel = document.createElement('h3');
  disabledLabel.textContent = 'Disabled';
  disabledLabel.style.marginBottom = '24px';
  disabledSection.appendChild(disabledLabel);
  const disabledEditor = createRichTextEditor({
    id: 'editor-disabled',
    placeholder: 'Enter text...',
    size: 'medium',
    disabled: true,
    value: '<p>This editor is <strong>disabled</strong>.</p>',
    minHeight: 120
  });
  disabledSection.appendChild(disabledEditor);
  container.appendChild(disabledSection);
  return container;
}`,...m.parameters?.docs?.source},description:{story:`States
Shows different states: default, read-only, disabled`,...m.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '800px';
  const editor = createRichTextEditor({
    id: 'editor-custom',
    placeholder: 'Enter text...',
    size: 'medium',
    toolbarButtons: ['bold', 'italic', 'underline', 'list-ul', 'list-ol', 'link'],
    minHeight: 200
  });
  const label = document.createElement('div');
  label.className = 'body2-txt';
  label.textContent = 'Custom Toolbar (Bold, Italic, Underline, Lists, Link only)';
  label.style.marginBottom = '8px';
  container.appendChild(label);
  container.appendChild(editor);
  return container;
}`,...p.parameters?.docs?.source},description:{story:`Custom Toolbar
Shows rich text editor with custom toolbar buttons`,...p.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '800px';
    const editor = createRichTextEditor({
      id: args.id || 'editor-interactive',
      name: args.name,
      placeholder: args.placeholder || 'Enter text...',
      value: args.value,
      size: args.size || 'medium',
      readonly: args.readonly || false,
      disabled: args.disabled || false,
      minHeight: args.minHeight || 200,
      onChange: args.onChange || (html => console.log('Content changed:', html))
    });
    container.appendChild(editor);
    return container;
  },
  args: {
    id: 'editor-interactive',
    placeholder: 'Enter text...',
    value: '',
    size: 'medium',
    readonly: false,
    disabled: false,
    minHeight: 200
  },
  argTypes: {
    size: {
      control: {
        type: 'select'
      },
      options: ['small', 'medium', 'large'],
      description: 'Editor size'
    },
    readonly: {
      control: {
        type: 'boolean'
      },
      description: 'Read-only state'
    },
    disabled: {
      control: {
        type: 'boolean'
      },
      description: 'Disabled state'
    },
    minHeight: {
      control: {
        type: 'number'
      },
      description: 'Minimum height in pixels'
    },
    placeholder: {
      control: {
        type: 'text'
      },
      description: 'Placeholder text'
    },
    value: {
      control: {
        type: 'text'
      },
      description: 'Initial HTML content'
    }
  }
}`,...u.parameters?.docs?.source},description:{story:`Interactive
Interactive playground with Storybook controls`,...u.parameters?.docs?.description}}};const b=["AllVariants","WithContent","States","CustomToolbar","Interactive"];export{c as AllVariants,p as CustomToolbar,u as Interactive,m as States,s as WithContent,b as __namedExportsOrder,g as default};
