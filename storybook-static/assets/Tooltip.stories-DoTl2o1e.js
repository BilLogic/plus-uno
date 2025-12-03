import{destroyAllTooltips as z,createTooltip as p}from"./index-CuLb3zNn.js";const E={title:"Components/Tooltip",tags:["autodocs"],parameters:{docs:{description:{component:"Tooltip component for displaying brief information. Supports multiple placements, trigger types, and sizes. Uses element-level tokens."}}},decorators:[e=>(z(),e())]},y={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)";const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");n.className="h4",n.textContent="Placements",n.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(n);const i=document.createElement("div");i.style.display="flex",i.style.flexWrap="wrap",i.style.gap="var(--size-card-gap-md)",i.style.alignItems="center",["top","bottom","left","right"].forEach(c=>{const l=document.createElement("button");l.type="button",l.className="btn btn-primary",l.textContent=`Tooltip ${c.charAt(0).toUpperCase()+c.slice(1)}`,p({trigger:l,text:`This is a tooltip positioned ${c} of the trigger element.`,placement:c,triggerType:"hover",size:"default"}),i.appendChild(l)}),t.appendChild(i),e.appendChild(t);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-card-gap-md)";const o=document.createElement("div");o.className="h4",o.textContent="Sizes",o.style.marginBottom="var(--size-element-gap-sm)",a.appendChild(o);const r=document.createElement("div");r.style.display="flex",r.style.flexWrap="wrap",r.style.gap="var(--size-card-gap-md)",r.style.alignItems="center",["small","default","large"].forEach(c=>{const l=document.createElement("button");l.type="button",l.className="btn btn-primary",l.textContent=`${c.charAt(0).toUpperCase()+c.slice(1)} Tooltip`,p({trigger:l,text:`This is a ${c} tooltip with different padding and typography.`,placement:"top",triggerType:"hover",size:c}),r.appendChild(l)}),a.appendChild(r),e.appendChild(a);const m=document.createElement("div");m.style.display="flex",m.style.flexDirection="column",m.style.gap="var(--size-card-gap-md)";const v=document.createElement("div");v.className="h4",v.textContent="Trigger Types",v.style.marginBottom="var(--size-element-gap-sm)",m.appendChild(v);const u=document.createElement("div");return u.style.display="flex",u.style.flexWrap="wrap",u.style.gap="var(--size-card-gap-md)",u.style.alignItems="center",[{type:"hover",label:"Hover Trigger"},{type:"focus",label:"Focus Trigger"},{type:"click",label:"Click Trigger"}].forEach(({type:c,label:l})=>{const g=document.createElement("button");g.type="button",g.className="btn btn-primary",g.textContent=l,p({trigger:g,text:`This tooltip is triggered by ${c}.`,placement:"top",triggerType:c,size:"default"}),u.appendChild(g)}),m.appendChild(u),e.appendChild(m),e}},f={render:e=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)";const n=document.createElement("button");return n.type="button",n.className="btn btn-primary",n.textContent=e.buttonText||"Tooltip Trigger",p({trigger:n,text:e.text||"This is an interactive tooltip. Adjust the controls to see different variations.",placement:e.placement||"top",triggerType:e.triggerType||"hover",size:e.size||"default"}),t.appendChild(n),t},argTypes:{buttonText:{control:"text",description:"Button text"},text:{control:"text",description:"Tooltip text content"},placement:{control:"select",options:["top","bottom","left","right"],description:"Tooltip placement relative to trigger"},triggerType:{control:"select",options:["hover","focus","click","manual"],description:"Trigger type for showing tooltip"},size:{control:"select",options:["small","default","large"],description:"Tooltip size. Uses element padding tokens for spacing."}},args:{buttonText:"Tooltip Trigger",text:"This is an interactive tooltip. Adjust the controls to see different variations.",placement:"top",triggerType:"hover",size:"default"}},b={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="500px";const t=document.createElement("form");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-xs)";const i=document.createElement("div");i.style.display="flex",i.style.alignItems="center",i.style.gap="var(--size-element-gap-sm)";const s=document.createElement("label");s.className="form-label",s.textContent="Email Address",i.appendChild(s);const a=document.createElement("i");a.className="fas fa-question-circle",a.style.cursor="help",a.style.color="var(--color-primary)",a.setAttribute("aria-label","Help"),p({trigger:a,text:"Enter your email address. We will use this to send you important updates.",placement:"right",triggerType:"hover",size:"default"}),i.appendChild(a),n.appendChild(i);const o=document.createElement("input");o.type="email",o.className="form-control plus-text-field body2-txt",o.placeholder="example@email.com",n.appendChild(o),t.appendChild(n);const r=document.createElement("div");r.style.display="flex",r.style.gap="var(--size-element-gap-sm)",r.style.alignItems="center";const d=document.createElement("button");return d.type="button",d.className="btn btn-link",d.style.padding="var(--size-element-pad-y-md) var(--size-element-pad-x-md)",d.innerHTML='<i class="fas fa-info-circle"></i>',d.setAttribute("aria-label","More information"),p({trigger:d,text:"Click for more information about this feature.",placement:"top",triggerType:"hover",size:"default"}),r.appendChild(d),t.appendChild(r),e.appendChild(t),e}},x={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const t=document.createElement("div");return t.style.display="flex",t.style.gap="var(--size-element-gap-sm)",t.style.flexWrap="wrap",[{icon:"fa-edit",text:"Edit this item",ariaLabel:"Edit"},{icon:"fa-trash",text:"Delete this item",ariaLabel:"Delete"},{icon:"fa-save",text:"Save changes",ariaLabel:"Save"},{icon:"fa-share",text:"Share this item",ariaLabel:"Share"},{icon:"fa-download",text:"Download file",ariaLabel:"Download"}].forEach(({icon:i,text:s,ariaLabel:a})=>{const o=document.createElement("button");o.type="button",o.className="btn btn-outline-primary",o.style.padding="var(--size-element-pad-y-md) var(--size-element-pad-x-md)",o.innerHTML=`<i class="fas ${i}"></i>`,o.setAttribute("aria-label",a),p({trigger:o,text:s,placement:"top",triggerType:"hover",size:"default"}),t.appendChild(o)}),e.appendChild(t),e}},h={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="500px";const t=document.createElement("form");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-xs)";const i=document.createElement("label");i.className="form-label",i.textContent="Password",n.appendChild(i);const s=document.createElement("input");s.type="password",s.className="form-control plus-text-field body2-txt",s.placeholder="Enter password",p({trigger:s,text:"Password must be at least 8 characters long and include uppercase, lowercase, and numbers.",placement:"right",triggerType:"focus",size:"large"}),n.appendChild(s),t.appendChild(n);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const o=document.createElement("label");o.className="form-label",o.textContent="Username",a.appendChild(o);const r=document.createElement("input");return r.type="text",r.className="form-control plus-text-field body2-txt",r.placeholder="Enter username",p({trigger:r,text:"Username must be 3-20 characters and can contain letters, numbers, and underscores.",placement:"right",triggerType:"focus",size:"default"}),a.appendChild(r),t.appendChild(a),e.appendChild(t),e}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';

    // Placements section
    const placementsSection = document.createElement('div');
    placementsSection.style.display = 'flex';
    placementsSection.style.flexDirection = 'column';
    placementsSection.style.gap = 'var(--size-card-gap-md)';
    const placementsLabel = document.createElement('div');
    placementsLabel.className = 'h4';
    placementsLabel.textContent = 'Placements';
    placementsLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    placementsSection.appendChild(placementsLabel);
    const placementsContainer = document.createElement('div');
    placementsContainer.style.display = 'flex';
    placementsContainer.style.flexWrap = 'wrap';
    placementsContainer.style.gap = 'var(--size-card-gap-md)';
    placementsContainer.style.alignItems = 'center';
    const placements = ['top', 'bottom', 'left', 'right'];
    placements.forEach(placement => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = \`Tooltip \${placement.charAt(0).toUpperCase() + placement.slice(1)}\`;
      createTooltip({
        trigger: button,
        text: \`This is a tooltip positioned \${placement} of the trigger element.\`,
        placement: placement,
        triggerType: 'hover',
        size: 'default'
      });
      placementsContainer.appendChild(button);
    });
    placementsSection.appendChild(placementsContainer);
    container.appendChild(placementsSection);

    // Sizes section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-card-gap-md)';
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h4';
    sizesLabel.textContent = 'Sizes';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesLabel);
    const sizesContainer = document.createElement('div');
    sizesContainer.style.display = 'flex';
    sizesContainer.style.flexWrap = 'wrap';
    sizesContainer.style.gap = 'var(--size-card-gap-md)';
    sizesContainer.style.alignItems = 'center';
    const sizes = ['small', 'default', 'large'];
    sizes.forEach(size => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = \`\${size.charAt(0).toUpperCase() + size.slice(1)} Tooltip\`;
      createTooltip({
        trigger: button,
        text: \`This is a \${size} tooltip with different padding and typography.\`,
        placement: 'top',
        triggerType: 'hover',
        size: size
      });
      sizesContainer.appendChild(button);
    });
    sizesSection.appendChild(sizesContainer);
    container.appendChild(sizesSection);

    // Trigger types section
    const triggersSection = document.createElement('div');
    triggersSection.style.display = 'flex';
    triggersSection.style.flexDirection = 'column';
    triggersSection.style.gap = 'var(--size-card-gap-md)';
    const triggersLabel = document.createElement('div');
    triggersLabel.className = 'h4';
    triggersLabel.textContent = 'Trigger Types';
    triggersLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    triggersSection.appendChild(triggersLabel);
    const triggersContainer = document.createElement('div');
    triggersContainer.style.display = 'flex';
    triggersContainer.style.flexWrap = 'wrap';
    triggersContainer.style.gap = 'var(--size-card-gap-md)';
    triggersContainer.style.alignItems = 'center';
    const triggerTypes = [{
      type: 'hover',
      label: 'Hover Trigger'
    }, {
      type: 'focus',
      label: 'Focus Trigger'
    }, {
      type: 'click',
      label: 'Click Trigger'
    }];
    triggerTypes.forEach(({
      type,
      label
    }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = label;
      createTooltip({
        trigger: button,
        text: \`This tooltip is triggered by \${type}.\`,
        placement: 'top',
        triggerType: type,
        size: 'default'
      });
      triggersContainer.appendChild(button);
    });
    triggersSection.appendChild(triggersContainer);
    container.appendChild(triggersSection);
    return container;
  }
}`,...y.parameters?.docs?.source},description:{story:`All Variants
Shows all tooltip combinations: placements, sizes, and trigger types`,...y.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = args.buttonText || 'Tooltip Trigger';
    createTooltip({
      trigger: button,
      text: args.text || 'This is an interactive tooltip. Adjust the controls to see different variations.',
      placement: args.placement || 'top',
      triggerType: args.triggerType || 'hover',
      size: args.size || 'default'
    });
    container.appendChild(button);
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Button text'
    },
    text: {
      control: 'text',
      description: 'Tooltip text content'
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Tooltip placement relative to trigger'
    },
    triggerType: {
      control: 'select',
      options: ['hover', 'focus', 'click', 'manual'],
      description: 'Trigger type for showing tooltip'
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Tooltip size. Uses element padding tokens for spacing.'
    }
  },
  args: {
    buttonText: 'Tooltip Trigger',
    text: 'This is an interactive tooltip. Adjust the controls to see different variations.',
    placement: 'top',
    triggerType: 'hover',
    size: 'default'
  }
}`,...f.parameters?.docs?.source},description:{story:`Interactive Tooltip
Interactive playground for testing tooltip variations`,...f.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '500px';
    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--size-card-gap-md)';

    // Form field with help tooltip
    const fieldGroup = document.createElement('div');
    fieldGroup.style.display = 'flex';
    fieldGroup.style.flexDirection = 'column';
    fieldGroup.style.gap = 'var(--size-element-gap-xs)';
    const labelContainer = document.createElement('div');
    labelContainer.style.display = 'flex';
    labelContainer.style.alignItems = 'center';
    labelContainer.style.gap = 'var(--size-element-gap-sm)';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Email Address';
    labelContainer.appendChild(label);
    const helpIcon = document.createElement('i');
    helpIcon.className = 'fas fa-question-circle';
    helpIcon.style.cursor = 'help';
    helpIcon.style.color = 'var(--color-primary)';
    helpIcon.setAttribute('aria-label', 'Help');
    createTooltip({
      trigger: helpIcon,
      text: 'Enter your email address. We will use this to send you important updates.',
      placement: 'right',
      triggerType: 'hover',
      size: 'default'
    });
    labelContainer.appendChild(helpIcon);
    fieldGroup.appendChild(labelContainer);
    const input = document.createElement('input');
    input.type = 'email';
    input.className = 'form-control plus-text-field body2-txt';
    input.placeholder = 'example@email.com';
    fieldGroup.appendChild(input);
    form.appendChild(fieldGroup);

    // Icon button with tooltip
    const iconButtonGroup = document.createElement('div');
    iconButtonGroup.style.display = 'flex';
    iconButtonGroup.style.gap = 'var(--size-element-gap-sm)';
    iconButtonGroup.style.alignItems = 'center';
    const iconButton = document.createElement('button');
    iconButton.type = 'button';
    iconButton.className = 'btn btn-link';
    iconButton.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    iconButton.innerHTML = '<i class="fas fa-info-circle"></i>';
    iconButton.setAttribute('aria-label', 'More information');
    createTooltip({
      trigger: iconButton,
      text: 'Click for more information about this feature.',
      placement: 'top',
      triggerType: 'hover',
      size: 'default'
    });
    iconButtonGroup.appendChild(iconButton);
    form.appendChild(iconButtonGroup);
    container.appendChild(form);
    return container;
  }
}`,...b.parameters?.docs?.source},description:{story:`Contextual Help Example
Shows tooltip used for form field help text and icon buttons`,...b.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = 'var(--size-element-gap-sm)';
    buttonGroup.style.flexWrap = 'wrap';
    const icons = [{
      icon: 'fa-edit',
      text: 'Edit this item',
      ariaLabel: 'Edit'
    }, {
      icon: 'fa-trash',
      text: 'Delete this item',
      ariaLabel: 'Delete'
    }, {
      icon: 'fa-save',
      text: 'Save changes',
      ariaLabel: 'Save'
    }, {
      icon: 'fa-share',
      text: 'Share this item',
      ariaLabel: 'Share'
    }, {
      icon: 'fa-download',
      text: 'Download file',
      ariaLabel: 'Download'
    }];
    icons.forEach(({
      icon,
      text,
      ariaLabel
    }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-outline-primary';
      button.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
      button.innerHTML = \`<i class="fas \${icon}"></i>\`;
      button.setAttribute('aria-label', ariaLabel);
      createTooltip({
        trigger: button,
        text: text,
        placement: 'top',
        triggerType: 'hover',
        size: 'default'
      });
      buttonGroup.appendChild(button);
    });
    container.appendChild(buttonGroup);
    return container;
  }
}`,...x.parameters?.docs?.source},description:{story:`Icon Buttons Example
Shows tooltips used for icon-only buttons to provide accessible descriptions`,...x.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '500px';
    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--size-card-gap-md)';

    // Password field with focus tooltip
    const fieldGroup = document.createElement('div');
    fieldGroup.style.display = 'flex';
    fieldGroup.style.flexDirection = 'column';
    fieldGroup.style.gap = 'var(--size-element-gap-xs)';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Password';
    fieldGroup.appendChild(label);
    const input = document.createElement('input');
    input.type = 'password';
    input.className = 'form-control plus-text-field body2-txt';
    input.placeholder = 'Enter password';
    createTooltip({
      trigger: input,
      text: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.',
      placement: 'right',
      triggerType: 'focus',
      size: 'large'
    });
    fieldGroup.appendChild(input);
    form.appendChild(fieldGroup);

    // Username field with focus tooltip
    const fieldGroup2 = document.createElement('div');
    fieldGroup2.style.display = 'flex';
    fieldGroup2.style.flexDirection = 'column';
    fieldGroup2.style.gap = 'var(--size-element-gap-xs)';
    const label2 = document.createElement('label');
    label2.className = 'form-label';
    label2.textContent = 'Username';
    fieldGroup2.appendChild(label2);
    const input2 = document.createElement('input');
    input2.type = 'text';
    input2.className = 'form-control plus-text-field body2-txt';
    input2.placeholder = 'Enter username';
    createTooltip({
      trigger: input2,
      text: 'Username must be 3-20 characters and can contain letters, numbers, and underscores.',
      placement: 'right',
      triggerType: 'focus',
      size: 'default'
    });
    fieldGroup2.appendChild(input2);
    form.appendChild(fieldGroup2);
    container.appendChild(form);
    return container;
  }
}`,...h.parameters?.docs?.source},description:{story:`Form Field Focus Example
Shows tooltips triggered on focus for form fields`,...h.parameters?.docs?.description}}};const S=["AllVariants","Interactive","ContextualHelp","IconButtons","FormFieldFocus"];export{y as AllVariants,b as ContextualHelp,h as FormFieldFocus,x as IconButtons,f as Interactive,S as __namedExportsOrder,E as default};
