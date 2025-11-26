import{P as d}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const C={title:"Components/Badge",tags:["autodocs"],parameters:{docs:{description:{component:"Badge component for labels, tags, and status indicators. Supports multiple styles and typography-based sizes. Uses element-level tokens and pill-shaped border radius. For removable tags and selections, use the Chip component instead."}}}},a={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)";const i=["primary","secondary","tertiary","success","danger","warning"],l=["h1","h2","h3","h4","h5","h6","b1","b2","b3"];return i.forEach(n=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)";const o=document.createElement("div");o.className="h6",o.textContent=`${n.charAt(0).toUpperCase()+n.slice(1)} Style - All Sizes`,o.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(o);const s=document.createElement("div");s.style.display="flex",s.style.flexDirection="column",s.style.gap="var(--size-element-gap-sm)",l.forEach(c=>{const p=d.createBadge({text:`${n.charAt(0).toUpperCase()+n.slice(1)} ${c.toUpperCase()}`,style:n,size:c});s.appendChild(p)}),t.appendChild(s),e.appendChild(t)}),e}},r={render:e=>{const i=document.createElement("div"),l=d.createBadge(e);return i.appendChild(l),i},argTypes:{text:{control:"text",description:"Badge text"},style:{control:"select",options:["primary","secondary","tertiary","success","danger","warning"],description:"Badge style"},size:{control:"select",options:["h1","h2","h3","h4","h5","h6","b1","b2","b3"],description:"Badge size"}},args:{text:"Badge",style:"primary",size:"b2"}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'];
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'];

    // Organize by visual style - each style shows all sizes
    styles.forEach(style => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = \`\${style.charAt(0).toUpperCase() + style.slice(1)} Style - All Sizes\`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      const sizesContainer = document.createElement('div');
      sizesContainer.style.display = 'flex';
      sizesContainer.style.flexDirection = 'column';
      sizesContainer.style.gap = 'var(--size-element-gap-sm)';
      sizes.forEach(size => {
        const badge = PlusInterface.createBadge({
          text: \`\${style.charAt(0).toUpperCase() + style.slice(1)} \${size.toUpperCase()}\`,
          style: style,
          size: size
        });
        sizesContainer.appendChild(badge);
      });
      styleSection.appendChild(sizesContainer);
      container.appendChild(styleSection);
    });
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:`All Variants
Shows all badge combinations organized by visual style: each style shows all sizes`,...a.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge(args);
    container.appendChild(badge);
    return container;
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Badge text'
    },
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'],
      description: 'Badge style'
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Badge size'
    }
  },
  args: {
    text: 'Badge',
    style: 'primary',
    size: 'b2'
  }
}`,...r.parameters?.docs?.source},description:{story:`Interactive Badge
Interactive playground for testing badge variations`,...r.parameters?.docs?.description}}};const x=["AllVariants","Interactive"];export{a as AllVariants,r as Interactive,x as __namedExportsOrder,C as default};
