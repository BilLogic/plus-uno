import{P as c}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const v={title:"Components/Spinner",tags:["autodocs"],parameters:{docs:{description:{component:"Spinner component for indicating loading states. Built on Bootstrap 4.6.2 spinner-border pattern. Uses fixed black color (--color-on-surface-variant) and supports multiple sizes."}}}},r={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)";const a=document.createElement("div");a.className="h6",a.textContent="Sizes",a.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(a);const n=document.createElement("div");return n.style.display="flex",n.style.flexDirection="row",n.style.alignItems="center",n.style.gap="var(--size-card-gap-md)",n.style.flexWrap="wrap",["small","default","large"].forEach(p=>{const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.alignItems="center",i.style.gap="var(--size-element-gap-sm)";const m=c.createSpinner({size:p,label:`Loading (${p})...`});i.appendChild(m);const d=document.createElement("div");d.className="body2-txt",d.textContent=p.charAt(0).toUpperCase()+p.slice(1),i.appendChild(d),n.appendChild(i)}),e.appendChild(n),t.appendChild(e),t}},l={render:t=>{const e=document.createElement("div");e.style.display="flex",e.style.alignItems="center",e.style.gap="var(--size-element-gap-sm)";const a=c.createSpinner(t);e.appendChild(a);const n=document.createElement("div");return n.className="body2-txt",n.textContent=t.label||"Loading...",e.appendChild(n),e},argTypes:{size:{control:"select",options:["small","default","large"],description:"Spinner size"},label:{control:"text",description:"Screen reader label text"}},args:{size:"default",label:"Loading..."}},o={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-md)";const e=document.createElement("div");e.className="body1-txt",e.style.display="flex",e.style.alignItems="center",e.style.gap="var(--size-element-gap-sm)",e.appendChild(c.createSpinner({size:"small",label:"Loading..."})),e.appendChild(document.createTextNode("Loading data...")),t.appendChild(e);const a=document.createElement("div"),n=document.createElement("button");n.className="btn btn-primary",n.style.display="flex",n.style.alignItems="center",n.style.gap="var(--size-element-gap-sm)",n.appendChild(c.createSpinner({size:"small",label:"Submitting..."})),n.appendChild(document.createTextNode("Submit")),a.appendChild(n),t.appendChild(a);const s=document.createElement("div");return s.style.display="flex",s.style.flexDirection="column",s.style.alignItems="center",s.style.gap="var(--size-element-gap-sm)",s.appendChild(c.createSpinner({size:"large",label:"Loading page..."})),s.appendChild(document.createTextNode("Loading page content...")),t.appendChild(s),t}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // Sizes section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-element-gap-sm)';
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h6';
    sizesLabel.textContent = 'Sizes';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesLabel);
    const sizesContainer = document.createElement('div');
    sizesContainer.style.display = 'flex';
    sizesContainer.style.flexDirection = 'row';
    sizesContainer.style.alignItems = 'center';
    sizesContainer.style.gap = 'var(--size-card-gap-md)';
    sizesContainer.style.flexWrap = 'wrap';
    const sizes = ['small', 'default', 'large'];
    sizes.forEach(size => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      const spinner = PlusInterface.createSpinner({
        size: size,
        label: \`Loading (\${size})...\`
      });
      wrapper.appendChild(spinner);
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = size.charAt(0).toUpperCase() + size.slice(1);
      wrapper.appendChild(label);
      sizesContainer.appendChild(wrapper);
    });
    sizesSection.appendChild(sizesContainer);
    container.appendChild(sizesSection);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:`All Variants
Shows all spinner size variants`,...r.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-element-gap-sm)';
    const spinner = PlusInterface.createSpinner(args);
    container.appendChild(spinner);
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = args.label || 'Loading...';
    container.appendChild(label);
    return container;
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Spinner size'
    },
    label: {
      control: 'text',
      description: 'Screen reader label text'
    }
  },
  args: {
    size: 'default',
    label: 'Loading...'
  }
}`,...l.parameters?.docs?.source},description:{story:`Interactive Spinner
Interactive playground for testing spinner variations`,...l.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';

    // Inline with text
    const inline1 = document.createElement('div');
    inline1.className = 'body1-txt';
    inline1.style.display = 'flex';
    inline1.style.alignItems = 'center';
    inline1.style.gap = 'var(--size-element-gap-sm)';
    inline1.appendChild(PlusInterface.createSpinner({
      size: 'small',
      label: 'Loading...'
    }));
    inline1.appendChild(document.createTextNode('Loading data...'));
    container.appendChild(inline1);

    // In button
    const buttonWrapper = document.createElement('div');
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.gap = 'var(--size-element-gap-sm)';
    button.appendChild(PlusInterface.createSpinner({
      size: 'small',
      label: 'Submitting...'
    }));
    button.appendChild(document.createTextNode('Submit'));
    buttonWrapper.appendChild(button);
    container.appendChild(buttonWrapper);

    // Center aligned
    const centerWrapper = document.createElement('div');
    centerWrapper.style.display = 'flex';
    centerWrapper.style.flexDirection = 'column';
    centerWrapper.style.alignItems = 'center';
    centerWrapper.style.gap = 'var(--size-element-gap-sm)';
    centerWrapper.appendChild(PlusInterface.createSpinner({
      size: 'large',
      label: 'Loading page...'
    }));
    centerWrapper.appendChild(document.createTextNode('Loading page content...'));
    container.appendChild(centerWrapper);
    return container;
  }
}`,...o.parameters?.docs?.source},description:{story:`Inline Usage
Examples of spinner used inline with text`,...o.parameters?.docs?.description}}};const h=["AllVariants","Interactive","InlineUsage"];export{r as AllVariants,o as InlineUsage,l as Interactive,h as __namedExportsOrder,v as default};
