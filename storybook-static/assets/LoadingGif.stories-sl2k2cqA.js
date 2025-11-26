import{P as u}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const G={title:"Components/LoadingGif",tags:["autodocs"],parameters:{docs:{description:{component:"Loading GIF component for indicating loading states using CSS-animated grid patterns. Implements three animation types from Figma: Growing Grid, Rotating Grid, and Stacking Grid. No actual GIF file required - uses pure CSS animations."}}}},m={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-section-gap-lg)";const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-sm)";const a=document.createElement("div");a.className="h6",a.textContent="Animation Types",a.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(a);const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="row",e.style.alignItems="center",e.style.gap="var(--size-card-gap-lg)",e.style.flexWrap="wrap",[{type:"growing",label:"Growing Grid",description:"For Generating Content"},{type:"rotating",label:"Rotating Grid",description:"For Working with Existing Content"},{type:"stacking",label:"Stacking Grid",description:"For Uploading/Importing Content"}].forEach(o=>{const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.alignItems="center",i.style.gap="var(--size-element-gap-sm)";const f=u.createLoadingGif({type:o.type,size:"default",label:`${o.label}...`});i.appendChild(f);const c=document.createElement("div");c.className="body2-txt",c.style.textAlign="center",c.innerHTML=`<strong>${o.label}</strong><br>${o.description}`,i.appendChild(c),e.appendChild(i)}),t.appendChild(e),n.appendChild(t);const l=document.createElement("div");l.style.display="flex",l.style.flexDirection="column",l.style.gap="var(--size-element-gap-sm)";const r=document.createElement("div");r.className="h6",r.textContent="Sizes",r.style.marginBottom="var(--size-element-gap-sm)",l.appendChild(r);const s=document.createElement("div");return s.style.display="flex",s.style.flexDirection="row",s.style.alignItems="center",s.style.gap="var(--size-card-gap-md)",s.style.flexWrap="wrap",["small","default","large"].forEach(o=>{const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.alignItems="center",i.style.gap="var(--size-element-gap-sm)";const f=u.createLoadingGif({type:"growing",size:o,label:`Loading (${o})...`});i.appendChild(f);const c=document.createElement("div");c.className="body2-txt",c.textContent=o.charAt(0).toUpperCase()+o.slice(1),i.appendChild(c),s.appendChild(i)}),l.appendChild(s),n.appendChild(l),n}},g={render:n=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.alignItems="center",t.style.gap="var(--size-element-gap-sm)";const a=u.createLoadingGif(n);t.appendChild(a);const e=document.createElement("div");return e.className="body2-txt",e.textContent=n.label||"Loading...",t.appendChild(e),t},argTypes:{type:{control:"select",options:["growing","rotating","stacking"],description:"Animation type"},size:{control:"select",options:["small","default","large"],description:"Loading GIF size"},label:{control:"text",description:"Screen reader label text"}},args:{type:"growing",size:"default",label:"Loading..."}},y={render:()=>{const n=document.createElement("div");return n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-section-gap-lg)",[{type:"growing",title:"Generating Content",description:"Use Growing Grid when user creates new content from scratch using AI or a built-in editor.",example:"Creating a new document, generating AI content, starting a new project"},{type:"rotating",title:"Working with Existing Content",description:"Use Rotating Grid when user edits or enhances content they previously created or saved.",example:"Editing a saved document, updating existing content, modifying previous work"},{type:"stacking",title:"Uploading/Importing Content",description:"Use Stacking Grid when user brings in external content (e.g., files, text, media) into the system.",example:"Uploading files, importing documents, bringing in external media"}].forEach(a=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)",e.style.padding="var(--size-card-pad-y-md)",e.style.backgroundColor="var(--color-surface-container)",e.style.borderRadius="var(--size-card-radius-sm)";const d=document.createElement("div");d.style.display="flex",d.style.alignItems="center",d.style.gap="var(--size-element-gap-md)";const l=u.createLoadingGif({type:a.type,size:"default",label:`${a.title}...`});d.appendChild(l);const r=document.createElement("div");r.className="h6",r.textContent=a.title,d.appendChild(r),e.appendChild(d);const s=document.createElement("div");s.className="body2-txt",s.textContent=a.description,e.appendChild(s);const p=document.createElement("div");p.className="body3-txt",p.style.color="var(--color-on-surface-variant)",p.style.fontStyle="italic",p.textContent=`Example: ${a.example}`,e.appendChild(p),n.appendChild(e)}),n}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // Animation types section
    const typesSection = document.createElement('div');
    typesSection.style.display = 'flex';
    typesSection.style.flexDirection = 'column';
    typesSection.style.gap = 'var(--size-element-gap-sm)';
    const typesLabel = document.createElement('div');
    typesLabel.className = 'h6';
    typesLabel.textContent = 'Animation Types';
    typesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    typesSection.appendChild(typesLabel);
    const typesContainer = document.createElement('div');
    typesContainer.style.display = 'flex';
    typesContainer.style.flexDirection = 'row';
    typesContainer.style.alignItems = 'center';
    typesContainer.style.gap = 'var(--size-card-gap-lg)';
    typesContainer.style.flexWrap = 'wrap';
    const types = [{
      type: 'growing',
      label: 'Growing Grid',
      description: 'For Generating Content'
    }, {
      type: 'rotating',
      label: 'Rotating Grid',
      description: 'For Working with Existing Content'
    }, {
      type: 'stacking',
      label: 'Stacking Grid',
      description: 'For Uploading/Importing Content'
    }];
    types.forEach(typeInfo => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      const loadingGif = PlusInterface.createLoadingGif({
        type: typeInfo.type,
        size: 'default',
        label: \`\${typeInfo.label}...\`
      });
      wrapper.appendChild(loadingGif);
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.style.textAlign = 'center';
      label.innerHTML = \`<strong>\${typeInfo.label}</strong><br>\${typeInfo.description}\`;
      wrapper.appendChild(label);
      typesContainer.appendChild(wrapper);
    });
    typesSection.appendChild(typesContainer);
    container.appendChild(typesSection);

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
      const loadingGif = PlusInterface.createLoadingGif({
        type: 'growing',
        size: size,
        label: \`Loading (\${size})...\`
      });
      wrapper.appendChild(loadingGif);
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
}`,...m.parameters?.docs?.source},description:{story:`All Animation Types
Shows all three loading animation types from Figma`,...m.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-element-gap-sm)';
    const loadingGif = PlusInterface.createLoadingGif(args);
    container.appendChild(loadingGif);
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = args.label || 'Loading...';
    container.appendChild(label);
    return container;
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['growing', 'rotating', 'stacking'],
      description: 'Animation type'
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Loading GIF size'
    },
    label: {
      control: 'text',
      description: 'Screen reader label text'
    }
  },
  args: {
    type: 'growing',
    size: 'default',
    label: 'Loading...'
  }
}`,...g.parameters?.docs?.source},description:{story:`Interactive Loading GIF
Interactive playground for testing loading GIF variations`,...g.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    const useCases = [{
      type: 'growing',
      title: 'Generating Content',
      description: 'Use Growing Grid when user creates new content from scratch using AI or a built-in editor.',
      example: 'Creating a new document, generating AI content, starting a new project'
    }, {
      type: 'rotating',
      title: 'Working with Existing Content',
      description: 'Use Rotating Grid when user edits or enhances content they previously created or saved.',
      example: 'Editing a saved document, updating existing content, modifying previous work'
    }, {
      type: 'stacking',
      title: 'Uploading/Importing Content',
      description: 'Use Stacking Grid when user brings in external content (e.g., files, text, media) into the system.',
      example: 'Uploading files, importing documents, bringing in external media'
    }];
    useCases.forEach(useCase => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-element-gap-sm)';
      section.style.padding = 'var(--size-card-pad-y-md)';
      section.style.backgroundColor = 'var(--color-surface-container)';
      section.style.borderRadius = 'var(--size-card-radius-sm)';
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = 'var(--size-element-gap-md)';
      const loadingGif = PlusInterface.createLoadingGif({
        type: useCase.type,
        size: 'default',
        label: \`\${useCase.title}...\`
      });
      header.appendChild(loadingGif);
      const title = document.createElement('div');
      title.className = 'h6';
      title.textContent = useCase.title;
      header.appendChild(title);
      section.appendChild(header);
      const description = document.createElement('div');
      description.className = 'body2-txt';
      description.textContent = useCase.description;
      section.appendChild(description);
      const example = document.createElement('div');
      example.className = 'body3-txt';
      example.style.color = 'var(--color-on-surface-variant)';
      example.style.fontStyle = 'italic';
      example.textContent = \`Example: \${useCase.example}\`;
      section.appendChild(example);
      container.appendChild(section);
    });
    return container;
  }
}`,...y.parameters?.docs?.source},description:{story:`Use Cases
Examples showing when to use each animation type`,...y.parameters?.docs?.description}}};const I=["AllAnimationTypes","Interactive","UseCases"];export{m as AllAnimationTypes,g as Interactive,y as UseCases,I as __namedExportsOrder,G as default};
