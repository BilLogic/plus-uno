import{P as m}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const b={title:"Components/Divider",tags:["autodocs"],parameters:{docs:{description:{component:"Divider component for visually separating content. Supports light and dark styles with multiple stroke widths. Uses element-level stroke tokens."}}}},i={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-section-gap-lg)",n.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)";const s=[{value:"light",label:"Light"},{value:"dark",label:"Dark"}],c=[{value:"sm",label:"Small",token:"--size-element-stroke-sm",px:"1px"},{value:"md",label:"Medium",token:"--size-element-stroke-md",px:"1.5px"},{value:"lg",label:"Large",token:"--size-element-stroke-lg",px:"2px"},{value:"xl",label:"Extra Large",token:"--size-element-stroke-xl",px:"2.5px"}];return s.forEach(p=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.width="100%",e.style.maxWidth="600px",p.value==="dark"&&(e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.backgroundColor="var(--color-surface-container)",e.style.borderRadius="var(--size-card-radius-sm)");const r=document.createElement("div");r.className="h6",r.textContent=`${p.label} Style - All Sizes`,r.style.marginBottom="var(--size-element-gap-md)",e.appendChild(r),c.forEach(a=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-sm)",t.style.padding="var(--size-section-pad-y-sm) 0";const d=document.createElement("div");d.className="body2-txt",d.style.color="var(--color-on-surface-variant)",d.textContent=`${a.label} (${a.value})`,t.appendChild(d);const l=document.createElement("div");l.className="body3-txt",l.style.color="var(--color-on-surface-variant)",l.style.fontFamily="monospace",l.textContent=`${a.token} = ${a.px}`,t.appendChild(l);const y=m.createDivider({size:a.value,style:p.value,width:"100%"});t.appendChild(y),e.appendChild(t)}),n.appendChild(e)}),n}},o={render:n=>{const s=document.createElement("div");s.style.width="var(--size-card-pad-x-lg)",s.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",s.style.backgroundColor="var(--color-surface-container)";const c=m.createDivider(n);return s.appendChild(c),s},argTypes:{size:{control:"select",options:["sm","md","lg","xl"],description:"Divider size using semantic tokens (sm=1px, md=1.5px, lg=2px, xl=2.5px). Uses --size-element-stroke-* tokens."},style:{control:"select",options:["light","dark"],description:"Divider style (light uses outline-variant, dark uses outline)"},opacity10:{control:"boolean",description:"Apply 10% opacity (for accordion/collapse use cases)"}},args:{size:"md",style:"light",opacity10:!1,width:"100%"}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    const styles = [{
      value: 'light',
      label: 'Light'
    }, {
      value: 'dark',
      label: 'Dark'
    }];
    const sizes = [{
      value: 'sm',
      label: 'Small',
      token: '--size-element-stroke-sm',
      px: '1px'
    }, {
      value: 'md',
      label: 'Medium',
      token: '--size-element-stroke-md',
      px: '1.5px'
    }, {
      value: 'lg',
      label: 'Large',
      token: '--size-element-stroke-lg',
      px: '2px'
    }, {
      value: 'xl',
      label: 'Extra Large',
      token: '--size-element-stroke-xl',
      px: '2.5px'
    }];

    // Organize by visual style - each style shows all sizes
    styles.forEach(style => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-section-gap-md)';
      styleSection.style.width = '100%';
      styleSection.style.maxWidth = '600px';

      // Add background for dark style to show contrast
      if (style.value === 'dark') {
        styleSection.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
        styleSection.style.backgroundColor = 'var(--color-surface-container)';
        styleSection.style.borderRadius = 'var(--size-card-radius-sm)';
      }
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = \`\${style.label} Style - All Sizes\`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-md)';
      styleSection.appendChild(styleLabel);
      sizes.forEach(size => {
        // Create a wrapper for each divider example
        const exampleWrapper = document.createElement('div');
        exampleWrapper.style.display = 'flex';
        exampleWrapper.style.flexDirection = 'column';
        exampleWrapper.style.gap = 'var(--size-element-gap-sm)';
        exampleWrapper.style.padding = 'var(--size-section-pad-y-sm) 0';

        // Add label above divider
        const sizeLabel = document.createElement('div');
        sizeLabel.className = 'body2-txt';
        sizeLabel.style.color = 'var(--color-on-surface-variant)';
        sizeLabel.textContent = \`\${size.label} (\${size.value})\`;
        exampleWrapper.appendChild(sizeLabel);

        // Add token info
        const tokenInfo = document.createElement('div');
        tokenInfo.className = 'body3-txt';
        tokenInfo.style.color = 'var(--color-on-surface-variant)';
        tokenInfo.style.fontFamily = 'monospace';
        tokenInfo.textContent = \`\${size.token} = \${size.px}\`;
        exampleWrapper.appendChild(tokenInfo);

        // Add the divider
        const divider = PlusInterface.createDivider({
          size: size.value,
          // Use semantic token (sm, md, lg, xl)
          style: style.value,
          width: '100%'
        });
        exampleWrapper.appendChild(divider);
        styleSection.appendChild(exampleWrapper);
      });
      container.appendChild(styleSection);
    });
    return container;
  }
}`,...i.parameters?.docs?.source},description:{story:`All Variants
Shows all divider combinations organized by visual style: each style shows all sizes`,...i.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.width = 'var(--size-card-pad-x-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    const divider = PlusInterface.createDivider(args);
    container.appendChild(divider);
    return container;
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Divider size using semantic tokens (sm=1px, md=1.5px, lg=2px, xl=2.5px). Uses --size-element-stroke-* tokens.'
    },
    style: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Divider style (light uses outline-variant, dark uses outline)'
    },
    opacity10: {
      control: 'boolean',
      description: 'Apply 10% opacity (for accordion/collapse use cases)'
    }
  },
  args: {
    size: 'md',
    style: 'light',
    opacity10: false,
    width: '100%'
  }
}`,...o.parameters?.docs?.source},description:{story:`Interactive Divider
Interactive playground for testing divider variations`,...o.parameters?.docs?.description}}};const C=["AllVariants","Interactive"];export{i as AllVariants,o as Interactive,C as __namedExportsOrder,b as default};
