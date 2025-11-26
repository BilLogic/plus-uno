import{P as u}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const E={title:"Components/Button",tags:["autodocs"],parameters:{docs:{description:{component:"Button component for triggering actions. Supports multiple styles, fills, sizes, and states. Uses element-level tokens for spacing and Material Design 3 color roles for styling."}}}},o={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)";const i=["primary","secondary","tertiary","success","info","warning","error","default"],d=["filled","outline","tonal","text"],y=["small","default","large"];return i.forEach(p=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)";const r=document.createElement("div");r.className="h6",r.textContent=`${p.charAt(0).toUpperCase()+p.slice(1)} Style - All Fills × All Sizes`,r.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(r),d.forEach(a=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-sm)";const c=document.createElement("div");c.className="body2-txt",c.textContent=`${a.charAt(0).toUpperCase()+a.slice(1)} Fill:`,c.style.marginBottom="var(--size-element-gap-xs)",n.appendChild(c);const l=document.createElement("div");l.style.display="flex",l.style.flexWrap="wrap",l.style.alignItems="center",l.style.gap="var(--size-card-gap-md)",y.forEach(m=>{const f=u.createButton({btnText:`${a} ${m}`,btnStyle:p,btnFill:a,btnSize:m});l.appendChild(f)}),n.appendChild(l),t.appendChild(n)}),e.appendChild(t)}),e}},s={render:e=>{const i=document.createElement("div"),d=u.createButton({...e,buttonOnClick:()=>{console.log("Button clicked!",e)}});return i.appendChild(d),i},argTypes:{btnText:{control:"text",description:"Button text"},btnStyle:{control:"select",options:["primary","secondary","tertiary","success","info","warning","error","default"],description:"Button style (uses color tokens: --color-primary, --color-secondary, etc.)"},btnFill:{control:"select",options:["filled","outline","tonal","text"],description:"Button fill variant (uses color and state layer tokens)"},btnSize:{control:"select",options:["small","default","large"],description:"Button size (uses element padding tokens: --size-element-pad-x-sm/md/lg, --size-element-pad-y-sm/md/lg)"},icon:{control:"text",description:"Icon name (without fa- prefix)"},iconPosition:{control:"select",options:["left","right"],description:"Icon position"},enabled:{control:"boolean",description:"Enabled state"},tooltip:{control:"text",description:"Tooltip text"}},args:{btnText:"Click Me",btnStyle:"primary",btnFill:"filled",btnSize:"default",icon:"",iconPosition:"left",enabled:!0,tooltip:""}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'];
    const fills = ['filled', 'outline', 'tonal', 'text'];
    const sizes = ['small', 'default', 'large'];

    // Organize by visual style - each style shows all fills × all sizes
    styles.forEach(style => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = \`\${style.charAt(0).toUpperCase() + style.slice(1)} Style - All Fills × All Sizes\`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);

      // For each fill, show all sizes
      fills.forEach(fill => {
        const fillGroup = document.createElement('div');
        fillGroup.style.display = 'flex';
        fillGroup.style.flexDirection = 'column';
        fillGroup.style.gap = 'var(--size-element-gap-sm)';
        const fillLabel = document.createElement('div');
        fillLabel.className = 'body2-txt';
        fillLabel.textContent = \`\${fill.charAt(0).toUpperCase() + fill.slice(1)} Fill:\`;
        fillLabel.style.marginBottom = 'var(--size-element-gap-xs)';
        fillGroup.appendChild(fillLabel);
        const sizesRow = document.createElement('div');
        sizesRow.style.display = 'flex';
        sizesRow.style.flexWrap = 'wrap';
        sizesRow.style.alignItems = 'center';
        sizesRow.style.gap = 'var(--size-card-gap-md)';
        sizes.forEach(size => {
          const button = PlusInterface.createButton({
            btnText: \`\${fill} \${size}\`,
            btnStyle: style,
            btnFill: fill,
            btnSize: size
          });
          sizesRow.appendChild(button);
        });
        fillGroup.appendChild(sizesRow);
        styleSection.appendChild(fillGroup);
      });
      container.appendChild(styleSection);
    });
    return container;
  }
}`,...o.parameters?.docs?.source},description:{story:`All Variants
Shows all button combinations organized by visual style: each style shows all fills × all sizes`,...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      ...args,
      buttonOnClick: () => {
        console.log('Button clicked!', args);
      }
    });
    container.appendChild(button);
    return container;
  },
  argTypes: {
    btnText: {
      control: 'text',
      description: 'Button text'
    },
    btnStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Button style (uses color tokens: --color-primary, --color-secondary, etc.)'
    },
    btnFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Button fill variant (uses color and state layer tokens)'
    },
    btnSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Button size (uses element padding tokens: --size-element-pad-x-sm/md/lg, --size-element-pad-y-sm/md/lg)'
    },
    icon: {
      control: 'text',
      description: 'Icon name (without fa- prefix)'
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Icon position'
    },
    enabled: {
      control: 'boolean',
      description: 'Enabled state'
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip text'
    }
  },
  args: {
    btnText: 'Click Me',
    btnStyle: 'primary',
    btnFill: 'filled',
    btnSize: 'default',
    icon: '',
    iconPosition: 'left',
    enabled: true,
    tooltip: ''
  }
}`,...s.parameters?.docs?.source},description:{story:`Interactive Button
Interactive playground for testing button variations`,...s.parameters?.docs?.description}}};const B=["AllVariants","Interactive"];export{o as AllVariants,s as Interactive,B as __namedExportsOrder,E as default};
