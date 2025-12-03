import{P as s}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const h={title:"Components/Breadcrumb",tags:["autodocs"],parameters:{docs:{description:{component:"Breadcrumb component for navigation hierarchy and wayfinding. Shows current location and provides navigation to parent pages. Uses element-level tokens for spacing."}}}},t={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)",[1,2,3,4,5,6].forEach(n=>{const o=[];for(let c=1;c<n;c++)o.push({text:`Page ${c}`,href:"#"});o.push({text:`Page ${n}`});const i=s.createBreadcrumb({items:o});e.appendChild(i)}),e}},r={render:e=>{const a=document.createElement("div"),n=s.createBreadcrumb({items:e.items||[{text:"Home",href:"#",onClick:()=>console.log("Home clicked")},{text:"Category",href:"#",onClick:()=>console.log("Category clicked")},{text:"Current Page"}],separator:e.separator||"/"});return a.appendChild(n),a},argTypes:{items:{control:"object",description:"Array of breadcrumb items"},separator:{control:"text",description:"Separator character"}},args:{items:[{text:"Home",href:"#"},{text:"Category",href:"#"},{text:"Current Page"}],separator:"/"}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    const itemCounts = [1, 2, 3, 4, 5, 6];
    itemCounts.forEach(count => {
      const items = [];
      // Add link items (all but last)
      for (let i = 1; i < count; i++) {
        items.push({
          text: \`Page \${i}\`,
          href: '#'
        });
      }
      // Add current page (last item, no link)
      items.push({
        text: \`Page \${count}\`
      });
      const breadcrumb = PlusInterface.createBreadcrumb({
        items: items
      });
      container.appendChild(breadcrumb);
    });
    return container;
  }
}`,...t.parameters?.docs?.source},description:{story:`All Variants
Shows all breadcrumb variants: different item counts`,...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: args.items || [{
        text: 'Home',
        href: '#',
        onClick: () => console.log('Home clicked')
      }, {
        text: 'Category',
        href: '#',
        onClick: () => console.log('Category clicked')
      }, {
        text: 'Current Page'
      }],
      separator: args.separator || '/'
    });
    container.appendChild(breadcrumb);
    return container;
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of breadcrumb items'
    },
    separator: {
      control: 'text',
      description: 'Separator character'
    }
  },
  args: {
    items: [{
      text: 'Home',
      href: '#'
    }, {
      text: 'Category',
      href: '#'
    }, {
      text: 'Current Page'
    }],
    separator: '/'
  }
}`,...r.parameters?.docs?.source},description:{story:`Interactive Breadcrumb
Interactive playground for testing breadcrumb variations`,...r.parameters?.docs?.description}}};const x=["AllVariants","Interactive"];export{t as AllVariants,r as Interactive,x as __namedExportsOrder,h as default};
