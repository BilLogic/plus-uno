import{P as d}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const x={title:"Components/Dropdown/Dropdown List",tags:["autodocs"],parameters:{docs:{description:{component:"Dropdown list variants showing different numbers of items (1-9). Each item includes icon, text, counter, and dropright arrow."}}}},o={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-section-gap-lg)";const l={text:"Form",leadingIcon:"th",counter:20,dropright:!0};for(let r=1;r<=9;r++){const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-sm)";const i=document.createElement("div");i.className="body1-txt",i.textContent=`# of items=${r}`,i.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(i);const m=Array(r).fill(null).map(()=>({...l})),s=d.createDropdown({buttonText:"Dropdown",size:"default",style:"primary",split:!1,direction:"dropdown",items:m}),e=s.querySelector(".dropdown-menu");e&&(e.style.display="block",e.style.position="static",e.style.transform="none",e.style.opacity="1",e.style.marginTop="0",e.classList.add("show"));const a=s.querySelector(".dropdown-toggle");a&&(a.style.display="none"),t.appendChild(s),n.appendChild(t)}return n}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // Create items array - each item has icon, text, counter, and dropright arrow (matching Figma)
    const baseItem = {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    };

    // Show lists with 1-9 items
    for (let itemCount = 1; itemCount <= 9; itemCount++) {
      const itemGroup = document.createElement('div');
      itemGroup.style.display = 'flex';
      itemGroup.style.flexDirection = 'column';
      itemGroup.style.gap = 'var(--size-card-gap-sm)';
      const itemLabel = document.createElement('div');
      itemLabel.className = 'body1-txt';
      itemLabel.textContent = \`# of items=\${itemCount}\`;
      itemLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      itemGroup.appendChild(itemLabel);

      // Create items array
      const items = Array(itemCount).fill(null).map(() => ({
        ...baseItem
      }));

      // Create dropdown with menu shown (open state)
      const dropdown = PlusInterface.createDropdown({
        buttonText: 'Dropdown',
        size: 'default',
        style: 'primary',
        split: false,
        direction: 'dropdown',
        items: items
      });

      // Show the menu in open state
      const menu = dropdown.querySelector('.dropdown-menu');
      if (menu) {
        menu.style.display = 'block';
        menu.style.position = 'static';
        menu.style.transform = 'none';
        menu.style.opacity = '1';
        menu.style.marginTop = '0';
        // Add show class for Bootstrap compatibility
        menu.classList.add('show');
      }

      // Hide the button, only show the menu
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.style.display = 'none';
      }
      itemGroup.appendChild(dropdown);
      container.appendChild(itemGroup);
    }
    return container;
  }
}`,...o.parameters?.docs?.source},description:{story:`All Variants
Shows dropdown lists with 1-9 items
Organized exactly as shown in Figma design system

Note: According to Figma documentation, the number of items can be from 1-9.
Each item includes: leading icon, text, counter, and dropright arrow.`,...o.parameters?.docs?.description}}};const b=["AllVariants"];export{o as AllVariants,b as __namedExportsOrder,x as default};
