import{P as n}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const A={title:"Components/Navigation",tags:["autodocs"],parameters:{docs:{description:{component:"Navigation components for guiding users through various categories of information. Supports horizontal/vertical layouts, tabs/pills variants, alignment options, and dropdown menus."}}}},o=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=[{text:"Tab",selected:!0},{text:"Tab",selected:!1},{text:"Tab",selected:!1},{text:"Tab",selected:!1,disabled:!0}],m=n.createNavigation({items:t,type:"horizontal",alignment:"left"}),a=document.createElement("div");a.style.marginBottom="24px";const p=document.createElement("h3");p.textContent="Horizontal - Left",p.style.marginBottom="12px",a.appendChild(p),a.appendChild(m),e.appendChild(a);const C=n.createNavigation({items:t.map((y,u)=>({...y,selected:u===1})),type:"horizontal",alignment:"center"}),l=document.createElement("div");l.style.marginBottom="24px";const g=document.createElement("h3");g.textContent="Horizontal - Center",g.style.marginBottom="12px",l.appendChild(g),l.appendChild(C),e.appendChild(l);const f=n.createNavigation({items:t.map((y,u)=>({...y,selected:u===2})),type:"horizontal",alignment:"right"}),s=document.createElement("div");s.style.marginBottom="24px";const b=document.createElement("h3");b.textContent="Horizontal - Right",b.style.marginBottom="12px",s.appendChild(b),s.appendChild(f),e.appendChild(s);const I=n.createNavigation({items:t,type:"vertical",alignment:"left"}),c=document.createElement("div");c.style.marginBottom="24px";const h=document.createElement("h3");h.textContent="Vertical - Left",h.style.marginBottom="12px",c.appendChild(h),c.appendChild(I),e.appendChild(c);const E=n.createNavigation({items:t,type:"tabs",alignment:"left"}),r=document.createElement("div");r.style.marginBottom="24px";const v=document.createElement("h3");v.textContent="Tabs",v.style.marginBottom="12px",r.appendChild(v),r.appendChild(E),e.appendChild(r);const B=n.createNavigation({items:t,type:"pills",alignment:"left"}),d=document.createElement("div");d.style.marginBottom="24px";const x=document.createElement("h3");return x.textContent="Pills",x.style.marginBottom="12px",d.appendChild(x),d.appendChild(B),e.appendChild(d),e},i={render:e=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)";const m=[{text:"Tab",selected:e.selectedIndex===0},{text:"Tab",selected:e.selectedIndex===1},{text:"Tab",selected:e.selectedIndex===2},{text:"Tab",selected:e.selectedIndex===3,disabled:e.showDisabled}],a=n.createNavigation({items:m,type:e.type,alignment:e.alignment});return t.appendChild(a),t},args:{type:"horizontal",alignment:"left",selectedIndex:0,showDisabled:!1},argTypes:{type:{control:"select",options:["horizontal","vertical","tabs","pills"],description:"Navigation type: horizontal, vertical, tabs, or pills"},alignment:{control:"select",options:["left","center","right"],description:"Alignment of navigation items"},selectedIndex:{control:{type:"number",min:0,max:3},description:"Index of selected item (0-3)"},showDisabled:{control:"boolean",description:"Show disabled state on last item"}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const baseItems = [{
    text: 'Tab',
    selected: true
  }, {
    text: 'Tab',
    selected: false
  }, {
    text: 'Tab',
    selected: false
  }, {
    text: 'Tab',
    selected: false,
    disabled: true
  }];

  // Horizontal Navigation - Left
  const nav1 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'horizontal',
    alignment: 'left'
  });
  const section1 = document.createElement('div');
  section1.style.marginBottom = '24px';
  const label1 = document.createElement('h3');
  label1.textContent = 'Horizontal - Left';
  label1.style.marginBottom = '12px';
  section1.appendChild(label1);
  section1.appendChild(nav1);
  container.appendChild(section1);

  // Horizontal Navigation - Center
  const nav2 = PlusInterface.createNavigation({
    items: baseItems.map((item, i) => ({
      ...item,
      selected: i === 1
    })),
    type: 'horizontal',
    alignment: 'center'
  });
  const section2 = document.createElement('div');
  section2.style.marginBottom = '24px';
  const label2 = document.createElement('h3');
  label2.textContent = 'Horizontal - Center';
  label2.style.marginBottom = '12px';
  section2.appendChild(label2);
  section2.appendChild(nav2);
  container.appendChild(section2);

  // Horizontal Navigation - Right
  const nav3 = PlusInterface.createNavigation({
    items: baseItems.map((item, i) => ({
      ...item,
      selected: i === 2
    })),
    type: 'horizontal',
    alignment: 'right'
  });
  const section3 = document.createElement('div');
  section3.style.marginBottom = '24px';
  const label3 = document.createElement('h3');
  label3.textContent = 'Horizontal - Right';
  label3.style.marginBottom = '12px';
  section3.appendChild(label3);
  section3.appendChild(nav3);
  container.appendChild(section3);

  // Vertical Navigation - Left
  const nav4 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'vertical',
    alignment: 'left'
  });
  const section4 = document.createElement('div');
  section4.style.marginBottom = '24px';
  const label4 = document.createElement('h3');
  label4.textContent = 'Vertical - Left';
  label4.style.marginBottom = '12px';
  section4.appendChild(label4);
  section4.appendChild(nav4);
  container.appendChild(section4);

  // Tabs Navigation
  const nav5 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'tabs',
    alignment: 'left'
  });
  const section5 = document.createElement('div');
  section5.style.marginBottom = '24px';
  const label5 = document.createElement('h3');
  label5.textContent = 'Tabs';
  label5.style.marginBottom = '12px';
  section5.appendChild(label5);
  section5.appendChild(nav5);
  container.appendChild(section5);

  // Pills Navigation
  const nav6 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'pills',
    alignment: 'left'
  });
  const section6 = document.createElement('div');
  section6.style.marginBottom = '24px';
  const label6 = document.createElement('h3');
  label6.textContent = 'Pills';
  label6.style.marginBottom = '12px';
  section6.appendChild(label6);
  section6.appendChild(nav6);
  container.appendChild(section6);
  return container;
}`,...o.parameters?.docs?.source},description:{story:`All Variants
Shows all navigation types and alignments`,...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    const items = [{
      text: 'Tab',
      selected: args.selectedIndex === 0
    }, {
      text: 'Tab',
      selected: args.selectedIndex === 1
    }, {
      text: 'Tab',
      selected: args.selectedIndex === 2
    }, {
      text: 'Tab',
      selected: args.selectedIndex === 3,
      disabled: args.showDisabled
    }];
    const nav = PlusInterface.createNavigation({
      items: items,
      type: args.type,
      alignment: args.alignment
    });
    container.appendChild(nav);
    return container;
  },
  args: {
    type: 'horizontal',
    alignment: 'left',
    selectedIndex: 0,
    showDisabled: false
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['horizontal', 'vertical', 'tabs', 'pills'],
      description: 'Navigation type: horizontal, vertical, tabs, or pills'
    },
    alignment: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Alignment of navigation items'
    },
    selectedIndex: {
      control: {
        type: 'number',
        min: 0,
        max: 3
      },
      description: 'Index of selected item (0-3)'
    },
    showDisabled: {
      control: 'boolean',
      description: 'Show disabled state on last item'
    }
  }
}`,...i.parameters?.docs?.source},description:{story:`Interactive
Interactive playground with Storybook controls
Based on Figma Properties: Type and Alignment`,...i.parameters?.docs?.description}}};const L=["AllVariants","Interactive"];export{o as AllVariants,i as Interactive,L as __namedExportsOrder,A as default};
