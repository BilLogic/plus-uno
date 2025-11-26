import{P as r}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const T={title:"Components/Pagination",tags:["autodocs"],parameters:{docs:{description:{component:"Pagination component for navigating through paginated content. Built on Bootstrap 4.6.2 with PLUS design token customizations. Supports icon and text types, multiple sizes, and various configurations."}}}},c={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-md)";const i=r.createPagination({currentPage:5,totalPages:10,type:"icon",size:"default",onPageChange:n=>{console.log("Page changed to:",n)}});return e.appendChild(i),e}},l={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-md)";const i=r.createPagination({currentPage:5,totalPages:10,type:"text",size:"default",onPageChange:n=>console.log("Page:",n)});return e.appendChild(i),e}},p={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-md)";const i=r.createPagination({currentPage:1,totalPages:10,type:"icon",onPageChange:n=>console.log("Page:",n)});return e.appendChild(i),e}},d={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-md)";const i=r.createPagination({currentPage:10,totalPages:10,type:"icon",onPageChange:n=>console.log("Page:",n)});return e.appendChild(i),e}},g={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-md)";const i=r.createPagination({currentPage:25,totalPages:50,type:"icon",maxVisible:5,onPageChange:n=>console.log("Page:",n)});return e.appendChild(i),e}},m={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md)",["small","default","large"].forEach(n=>{const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.gap="var(--size-element-gap-sm)";const a=document.createElement("div");a.className="body2-txt",a.textContent=`${n.charAt(0).toUpperCase()+n.slice(1)} Size (Icon Type):`,a.style.marginBottom="var(--size-element-gap-xs)",o.appendChild(a);const t=r.createPagination({currentPage:5,totalPages:10,type:"icon",size:n,onPageChange:s=>console.log(`${n} pagination - Page:`,s)});o.appendChild(t),e.appendChild(o)}),e}},y={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md)",[{type:"icon",label:"Icon Type"},{type:"text",label:"Text Type"}].forEach(({type:n,label:o})=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-sm)";const t=document.createElement("div");t.className="body2-txt",t.textContent=`${o}:`,t.style.marginBottom="var(--size-element-gap-xs)",a.appendChild(t);const s=r.createPagination({currentPage:5,totalPages:10,type:n,size:"default",onPageChange:P=>console.log(`${n} pagination - Page:`,P)});a.appendChild(s),e.appendChild(a)}),e}},u={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="var(--size-section-pad-y-md)",[{type:"icon",size:"small",label:"Small Icon Type"},{type:"icon",size:"default",label:"Default Icon Type"},{type:"icon",size:"large",label:"Large Icon Type"},{type:"text",size:"small",label:"Small Text Type"},{type:"text",size:"default",label:"Default Text Type"},{type:"text",size:"large",label:"Large Text Type"}].forEach(({type:n,size:o,label:a})=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-sm)";const s=document.createElement("div");s.className="h6",s.textContent=`${a}:`,t.appendChild(s);const P=r.createPagination({currentPage:5,totalPages:10,type:n,size:o,onPageChange:()=>{}});t.appendChild(P),e.appendChild(t)}),e}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'icon',
      size: 'default',
      onPageChange: page => {
        console.log('Page changed to:', page);
      }
    });
    container.appendChild(pagination);
    return container;
  }
}`,...c.parameters?.docs?.source},description:{story:`Default Pagination (Icon Type, Medium Size)
Standard pagination with icon Previous/Next buttons`,...c.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'text',
      size: 'default',
      onPageChange: page => console.log('Page:', page)
    });
    container.appendChild(pagination);
    return container;
  }
}`,...l.parameters?.docs?.source},description:{story:`Text Type Pagination
Pagination with text Previous/Next buttons`,...l.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    const pagination = PlusInterface.createPagination({
      currentPage: 1,
      totalPages: 10,
      type: 'icon',
      onPageChange: page => console.log('Page:', page)
    });
    container.appendChild(pagination);
    return container;
  }
}`,...p.parameters?.docs?.source},description:{story:`First Page
Pagination showing the first page`,...p.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    const pagination = PlusInterface.createPagination({
      currentPage: 10,
      totalPages: 10,
      type: 'icon',
      onPageChange: page => console.log('Page:', page)
    });
    container.appendChild(pagination);
    return container;
  }
}`,...d.parameters?.docs?.source},description:{story:`Last Page
Pagination showing the last page`,...d.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    const pagination = PlusInterface.createPagination({
      currentPage: 25,
      totalPages: 50,
      type: 'icon',
      maxVisible: 5,
      onPageChange: page => console.log('Page:', page)
    });
    container.appendChild(pagination);
    return container;
  }
}`,...g.parameters?.docs?.source},description:{story:`Many Pages with Ellipsis
Pagination with many pages showing ellipsis for page ranges`,...g.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const sizes = ['small', 'default', 'large'];
    sizes.forEach(size => {
      const sizeContainer = document.createElement('div');
      sizeContainer.style.display = 'flex';
      sizeContainer.style.flexDirection = 'column';
      sizeContainer.style.gap = 'var(--size-element-gap-sm)';
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = \`\${size.charAt(0).toUpperCase() + size.slice(1)} Size (Icon Type):\`;
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      sizeContainer.appendChild(label);
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: 'icon',
        size: size,
        onPageChange: page => console.log(\`\${size} pagination - Page:\`, page)
      });
      sizeContainer.appendChild(pagination);
      container.appendChild(sizeContainer);
    });
    return container;
  }
}`,...m.parameters?.docs?.source},description:{story:`Size Variants
All size variants: small, default, and large`,...m.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const types = [{
      type: 'icon',
      label: 'Icon Type'
    }, {
      type: 'text',
      label: 'Text Type'
    }];
    types.forEach(({
      type,
      label
    }) => {
      const typeContainer = document.createElement('div');
      typeContainer.style.display = 'flex';
      typeContainer.style.flexDirection = 'column';
      typeContainer.style.gap = 'var(--size-element-gap-sm)';
      const typeLabel = document.createElement('div');
      typeLabel.className = 'body2-txt';
      typeLabel.textContent = \`\${label}:\`;
      typeLabel.style.marginBottom = 'var(--size-element-gap-xs)';
      typeContainer.appendChild(typeLabel);
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: type,
        size: 'default',
        onPageChange: page => console.log(\`\${type} pagination - Page:\`, page)
      });
      typeContainer.appendChild(pagination);
      container.appendChild(typeContainer);
    });
    return container;
  }
}`,...y.parameters?.docs?.source},description:{story:`Type Variants
Icon and text type variants`,...y.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const variants = [{
      type: 'icon',
      size: 'small',
      label: 'Small Icon Type'
    }, {
      type: 'icon',
      size: 'default',
      label: 'Default Icon Type'
    }, {
      type: 'icon',
      size: 'large',
      label: 'Large Icon Type'
    }, {
      type: 'text',
      size: 'small',
      label: 'Small Text Type'
    }, {
      type: 'text',
      size: 'default',
      label: 'Default Text Type'
    }, {
      type: 'text',
      size: 'large',
      label: 'Large Text Type'
    }];
    variants.forEach(({
      type,
      size,
      label
    }) => {
      const variantContainer = document.createElement('div');
      variantContainer.style.display = 'flex';
      variantContainer.style.flexDirection = 'column';
      variantContainer.style.gap = 'var(--size-element-gap-sm)';
      const variantLabel = document.createElement('div');
      variantLabel.className = 'h6';
      variantLabel.textContent = \`\${label}:\`;
      variantContainer.appendChild(variantLabel);
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: type,
        size: size,
        onPageChange: () => {}
      });
      variantContainer.appendChild(pagination);
      container.appendChild(variantContainer);
    });
    return container;
  }
}`,...u.parameters?.docs?.source},description:{story:`All Variants
Comprehensive showcase of all pagination variants`,...u.parameters?.docs?.description}}};const I=["Default","TextType","FirstPage","LastPage","ManyPages","SizeVariants","TypeVariants","AllVariants"];export{u as AllVariants,c as Default,p as FirstPage,d as LastPage,g as ManyPages,m as SizeVariants,l as TextType,y as TypeVariants,I as __namedExportsOrder,T as default};
