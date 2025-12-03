import{c as l}from"./index-Cv3BXN2l.js";const f={title:"Components/Popover",tags:["autodocs"],parameters:{docs:{description:{component:"Popover component for displaying additional information. Matches Figma design system specifications exactly. Supports two types (title + content, content only) and four directions (top, bottom, left, right)."}}}},g={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)",t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const i=document.createElement("div");i.className="h4",i.textContent="Type Variants",i.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(i);const a=document.createElement("div");a.style.display="flex",a.style.flexWrap="wrap",a.style.gap="var(--size-card-gap-lg)",a.style.alignItems="center";const n=document.createElement("button");n.type="button",n.className="btn btn-primary",n.textContent="Title + Content",l({trigger:n,content:"And here's some amazing content. It's very engaging. Right?",title:"Popover title",placement:"top",triggerType:"click"}),a.appendChild(n);const r=document.createElement("button");r.type="button",r.className="btn btn-primary",r.textContent="Content Only",l({trigger:r,content:"And here's some amazing content. It's very engaging. Right?",placement:"top",triggerType:"click"}),a.appendChild(r),e.appendChild(a),t.appendChild(e);const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.gap="var(--size-card-gap-md)";const v=document.createElement("div");v.className="h4",v.textContent="Direction Variants (Title + Content)",v.style.marginBottom="var(--size-element-gap-sm)",o.appendChild(v);const p=document.createElement("div");p.style.display="flex",p.style.flexWrap="wrap",p.style.gap="var(--size-card-gap-md)",p.style.alignItems="center";const h=["top","bottom","left","right"];h.forEach(s=>{const c=document.createElement("button");c.type="button",c.className="btn btn-primary",c.textContent=`${s.charAt(0).toUpperCase()+s.slice(1)}`,l({trigger:c,content:"And here's some amazing content. It's very engaging. Right?",title:"Popover title",placement:s,triggerType:"click"}),p.appendChild(c)}),o.appendChild(p),t.appendChild(o);const d=document.createElement("div");d.style.display="flex",d.style.flexDirection="column",d.style.gap="var(--size-card-gap-md)";const C=document.createElement("div");C.className="h4",C.textContent="Direction Variants (Content Only)",C.style.marginBottom="var(--size-element-gap-sm)",d.appendChild(C);const m=document.createElement("div");return m.style.display="flex",m.style.flexWrap="wrap",m.style.gap="var(--size-card-gap-md)",m.style.alignItems="center",h.forEach(s=>{const c=document.createElement("button");c.type="button",c.className="btn btn-primary",c.textContent=`${s.charAt(0).toUpperCase()+s.slice(1)}`,l({trigger:c,content:"And here's some amazing content. It's very engaging. Right?",placement:s,triggerType:"click"}),m.appendChild(c)}),d.appendChild(m),t.appendChild(d),t}},y={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-lg)",t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.alignItems="center";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)",e.style.alignItems="center";const i=document.createElement("div");i.className="body2-txt",i.textContent="title + content",e.appendChild(i);const a=document.createElement("button");a.type="button",a.className="btn btn-primary",a.textContent="Show Popover",l({trigger:a,content:"And here's some amazing content. It's very engaging. Right?",title:"Popover title",placement:"top",triggerType:"click"}),e.appendChild(a),t.appendChild(e);const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-sm)",n.style.alignItems="center";const r=document.createElement("div");r.className="body2-txt",r.textContent="content",n.appendChild(r);const o=document.createElement("button");return o.type="button",o.className="btn btn-primary",o.textContent="Show Popover",l({trigger:o,content:"And here's some amazing content. It's very engaging. Right?",placement:"top",triggerType:"click"}),n.appendChild(o),t.appendChild(n),t}},u={render:()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.alignItems="center",[{name:"bottom",label:"bottom"},{name:"left",label:"left"},{name:"right",label:"right"},{name:"top",label:"top"}].forEach(({name:i,label:a})=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-sm)",n.style.alignItems="center";const r=document.createElement("div");r.className="body2-txt",r.textContent=a,n.appendChild(r);const o=document.createElement("button");o.type="button",o.className="btn btn-primary",o.textContent="Show Popover",l({trigger:o,content:"And here's some amazing content. It's very engaging. Right?",title:"Popover title",placement:i,triggerType:"click"}),n.appendChild(o),t.appendChild(n)}),t}},b={render:t=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)",e.style.alignItems="center";const i=document.createElement("button");return i.type="button",i.className="btn btn-primary",i.textContent=t.buttonText||"Popover Trigger",l({trigger:i,content:t.content||"And here's some amazing content. It's very engaging. Right?",title:t.title,placement:t.placement||"top",triggerType:t.triggerType||"click"}),e.appendChild(i),e},argTypes:{buttonText:{control:"text",description:"Button text"},content:{control:"text",description:"Popover content text"},title:{control:"text",description:'Popover title (optional - if provided, creates "title + content" type)'},placement:{control:"select",options:["top","bottom","left","right"],description:"Popover placement relative to trigger"},triggerType:{control:"select",options:["click","hover","focus","manual"],description:"Trigger type for showing popover"}},args:{buttonText:"Popover Trigger",content:"And here's some amazing content. It's very engaging. Right?",title:"Popover title",placement:"top",triggerType:"click"}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';

    // Type Variants Section
    const typeSection = document.createElement('div');
    typeSection.style.display = 'flex';
    typeSection.style.flexDirection = 'column';
    typeSection.style.gap = 'var(--size-card-gap-md)';
    const typeLabel = document.createElement('div');
    typeLabel.className = 'h4';
    typeLabel.textContent = 'Type Variants';
    typeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    typeSection.appendChild(typeLabel);
    const typeContainer = document.createElement('div');
    typeContainer.style.display = 'flex';
    typeContainer.style.flexWrap = 'wrap';
    typeContainer.style.gap = 'var(--size-card-gap-lg)';
    typeContainer.style.alignItems = 'center';

    // Title + Content
    const buttonWithTitle = document.createElement('button');
    buttonWithTitle.type = 'button';
    buttonWithTitle.className = 'btn btn-primary';
    buttonWithTitle.textContent = 'Title + Content';
    createPopover({
      trigger: buttonWithTitle,
      content: "And here's some amazing content. It's very engaging. Right?",
      title: 'Popover title',
      placement: 'top',
      triggerType: 'click'
    });
    typeContainer.appendChild(buttonWithTitle);

    // Content Only
    const buttonContentOnly = document.createElement('button');
    buttonContentOnly.type = 'button';
    buttonContentOnly.className = 'btn btn-primary';
    buttonContentOnly.textContent = 'Content Only';
    createPopover({
      trigger: buttonContentOnly,
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'top',
      triggerType: 'click'
    });
    typeContainer.appendChild(buttonContentOnly);
    typeSection.appendChild(typeContainer);
    container.appendChild(typeSection);

    // Direction Variants Section - Title + Content
    const directionTitleSection = document.createElement('div');
    directionTitleSection.style.display = 'flex';
    directionTitleSection.style.flexDirection = 'column';
    directionTitleSection.style.gap = 'var(--size-card-gap-md)';
    const directionTitleLabel = document.createElement('div');
    directionTitleLabel.className = 'h4';
    directionTitleLabel.textContent = 'Direction Variants (Title + Content)';
    directionTitleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    directionTitleSection.appendChild(directionTitleLabel);
    const directionTitleContainer = document.createElement('div');
    directionTitleContainer.style.display = 'flex';
    directionTitleContainer.style.flexWrap = 'wrap';
    directionTitleContainer.style.gap = 'var(--size-card-gap-md)';
    directionTitleContainer.style.alignItems = 'center';
    const directions = ['top', 'bottom', 'left', 'right'];
    directions.forEach(direction => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = \`\${direction.charAt(0).toUpperCase() + direction.slice(1)}\`;
      createPopover({
        trigger: button,
        content: "And here's some amazing content. It's very engaging. Right?",
        title: 'Popover title',
        placement: direction,
        triggerType: 'click'
      });
      directionTitleContainer.appendChild(button);
    });
    directionTitleSection.appendChild(directionTitleContainer);
    container.appendChild(directionTitleSection);

    // Direction Variants Section - Content Only
    const directionContentSection = document.createElement('div');
    directionContentSection.style.display = 'flex';
    directionContentSection.style.flexDirection = 'column';
    directionContentSection.style.gap = 'var(--size-card-gap-md)';
    const directionContentLabel = document.createElement('div');
    directionContentLabel.className = 'h4';
    directionContentLabel.textContent = 'Direction Variants (Content Only)';
    directionContentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    directionContentSection.appendChild(directionContentLabel);
    const directionContentContainer = document.createElement('div');
    directionContentContainer.style.display = 'flex';
    directionContentContainer.style.flexWrap = 'wrap';
    directionContentContainer.style.gap = 'var(--size-card-gap-md)';
    directionContentContainer.style.alignItems = 'center';
    directions.forEach(direction => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = \`\${direction.charAt(0).toUpperCase() + direction.slice(1)}\`;
      createPopover({
        trigger: button,
        content: "And here's some amazing content. It's very engaging. Right?",
        placement: direction,
        triggerType: 'click'
      });
      directionContentContainer.appendChild(button);
    });
    directionContentSection.appendChild(directionContentContainer);
    container.appendChild(directionContentSection);
    return container;
  }
}`,...g.parameters?.docs?.source},description:{story:`All Variants
Shows all popover combinations from Figma: types and directions`,...g.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.alignItems = 'center';

    // Title + Content
    const section1 = document.createElement('div');
    section1.style.display = 'flex';
    section1.style.flexDirection = 'column';
    section1.style.gap = 'var(--size-element-gap-sm)';
    section1.style.alignItems = 'center';
    const label1 = document.createElement('div');
    label1.className = 'body2-txt';
    label1.textContent = 'title + content';
    section1.appendChild(label1);
    const button1 = document.createElement('button');
    button1.type = 'button';
    button1.className = 'btn btn-primary';
    button1.textContent = 'Show Popover';
    createPopover({
      trigger: button1,
      content: "And here's some amazing content. It's very engaging. Right?",
      title: 'Popover title',
      placement: 'top',
      triggerType: 'click'
    });
    section1.appendChild(button1);
    container.appendChild(section1);

    // Content Only
    const section2 = document.createElement('div');
    section2.style.display = 'flex';
    section2.style.flexDirection = 'column';
    section2.style.gap = 'var(--size-element-gap-sm)';
    section2.style.alignItems = 'center';
    const label2 = document.createElement('div');
    label2.className = 'body2-txt';
    label2.textContent = 'content';
    section2.appendChild(label2);
    const button2 = document.createElement('button');
    button2.type = 'button';
    button2.className = 'btn btn-primary';
    button2.textContent = 'Show Popover';
    createPopover({
      trigger: button2,
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'top',
      triggerType: 'click'
    });
    section2.appendChild(button2);
    container.appendChild(section2);
    return container;
  }
}`,...y.parameters?.docs?.source},description:{story:`Type Variants
Shows the two type options: title + content vs content only`,...y.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.alignItems = 'center';
    const directions = [{
      name: 'bottom',
      label: 'bottom'
    }, {
      name: 'left',
      label: 'left'
    }, {
      name: 'right',
      label: 'right'
    }, {
      name: 'top',
      label: 'top'
    }];
    directions.forEach(({
      name,
      label
    }) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-element-gap-sm)';
      section.style.alignItems = 'center';
      const labelEl = document.createElement('div');
      labelEl.className = 'body2-txt';
      labelEl.textContent = label;
      section.appendChild(labelEl);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = 'Show Popover';
      createPopover({
        trigger: button,
        content: "And here's some amazing content. It's very engaging. Right?",
        title: 'Popover title',
        placement: name,
        triggerType: 'click'
      });
      section.appendChild(button);
      container.appendChild(section);
    });
    return container;
  }
}`,...u.parameters?.docs?.source},description:{story:`Direction Variants
Shows all four direction options`,...u.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.alignItems = 'center';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = args.buttonText || 'Popover Trigger';
    createPopover({
      trigger: button,
      content: args.content || "And here's some amazing content. It's very engaging. Right?",
      title: args.title,
      placement: args.placement || 'top',
      triggerType: args.triggerType || 'click'
    });
    container.appendChild(button);
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Button text'
    },
    content: {
      control: 'text',
      description: 'Popover content text'
    },
    title: {
      control: 'text',
      description: 'Popover title (optional - if provided, creates "title + content" type)'
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Popover placement relative to trigger'
    },
    triggerType: {
      control: 'select',
      options: ['click', 'hover', 'focus', 'manual'],
      description: 'Trigger type for showing popover'
    }
  },
  args: {
    buttonText: 'Popover Trigger',
    content: "And here's some amazing content. It's very engaging. Right?",
    title: 'Popover title',
    placement: 'top',
    triggerType: 'click'
  }
}`,...b.parameters?.docs?.source},description:{story:`Interactive Popover
Interactive playground for testing popover variations`,...b.parameters?.docs?.description}}};const T=["AllVariants","TypeVariants","DirectionVariants","Interactive"];export{g as AllVariants,u as DirectionVariants,b as Interactive,y as TypeVariants,T as __namedExportsOrder,f as default};
