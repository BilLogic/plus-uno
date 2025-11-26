import{P as c}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const v={title:"Components/Navigation/Content Variants",tags:["autodocs"]},o=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=c.createNavigation({items:[{text:"Tab",selected:!0},{text:"Dropdown",selected:!1,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")},{text:"Option 3",href:"#",onClick:()=>console.log("Option 3")}]},{text:"Tab",selected:!1},{text:"Tab",selected:!1}],type:"horizontal",alignment:"left"}),n=document.createElement("div");n.style.marginBottom="24px";const s=document.createElement("h3");s.textContent="Horizontal with Dropdown",s.style.marginBottom="12px",n.appendChild(s),n.appendChild(t),e.appendChild(n);const d=c.createNavigation({items:[{text:"Pill",selected:!0},{text:"Dropdown",selected:!1,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]},{text:"Pill",selected:!1}],type:"pills",alignment:"left"}),i=document.createElement("div");i.style.marginBottom="24px";const r=document.createElement("h3");return r.textContent="Pills with Dropdown",r.style.marginBottom="12px",i.appendChild(r),i.appendChild(d),e.appendChild(i),e},l=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=c.createNavigation({items:[{text:"Home",href:"#home",selected:!0},{text:"About",href:"#about",selected:!1},{text:"Services",href:"#services",selected:!1},{text:"Contact",href:"#contact",selected:!1}],type:"horizontal",alignment:"left"});return e.appendChild(t),e},a=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=c.createNavigation({items:[{text:"Tab 1",selected:!0,onClick:n=>{n.preventDefault(),console.log("Tab 1 clicked")}},{text:"Tab 2",selected:!1,onClick:n=>{n.preventDefault(),console.log("Tab 2 clicked")}},{text:"Tab 3",selected:!1,onClick:n=>{n.preventDefault(),console.log("Tab 3 clicked")}}],type:"tabs",alignment:"left"});return e.appendChild(t),e};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';

  // Horizontal with dropdown
  const nav1 = PlusInterface.createNavigation({
    items: [{
      text: 'Tab',
      selected: true
    }, {
      text: 'Dropdown',
      selected: false,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }, {
        text: 'Option 3',
        href: '#',
        onClick: () => console.log('Option 3')
      }]
    }, {
      text: 'Tab',
      selected: false
    }, {
      text: 'Tab',
      selected: false
    }],
    type: 'horizontal',
    alignment: 'left'
  });
  const section1 = document.createElement('div');
  section1.style.marginBottom = '24px';
  const label1 = document.createElement('h3');
  label1.textContent = 'Horizontal with Dropdown';
  label1.style.marginBottom = '12px';
  section1.appendChild(label1);
  section1.appendChild(nav1);
  container.appendChild(section1);

  // Pills with dropdown
  const nav2 = PlusInterface.createNavigation({
    items: [{
      text: 'Pill',
      selected: true
    }, {
      text: 'Dropdown',
      selected: false,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }]
    }, {
      text: 'Pill',
      selected: false
    }],
    type: 'pills',
    alignment: 'left'
  });
  const section2 = document.createElement('div');
  section2.style.marginBottom = '24px';
  const label2 = document.createElement('h3');
  label2.textContent = 'Pills with Dropdown';
  label2.style.marginBottom = '12px';
  section2.appendChild(label2);
  section2.appendChild(nav2);
  container.appendChild(section2);
  return container;
}`,...o.parameters?.docs?.source},description:{story:`With Dropdowns
Navigation items with dropdown menus`,...o.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Home',
      href: '#home',
      selected: true
    }, {
      text: 'About',
      href: '#about',
      selected: false
    }, {
      text: 'Services',
      href: '#services',
      selected: false
    }, {
      text: 'Contact',
      href: '#contact',
      selected: false
    }],
    type: 'horizontal',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...l.parameters?.docs?.source},description:{story:`With Links
Navigation items with href links`,...l.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Tab 1',
      selected: true,
      onClick: e => {
        e.preventDefault();
        console.log('Tab 1 clicked');
      }
    }, {
      text: 'Tab 2',
      selected: false,
      onClick: e => {
        e.preventDefault();
        console.log('Tab 2 clicked');
      }
    }, {
      text: 'Tab 3',
      selected: false,
      onClick: e => {
        e.preventDefault();
        console.log('Tab 3 clicked');
      }
    }],
    type: 'tabs',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...a.parameters?.docs?.source},description:{story:`With Click Handlers
Navigation items with onClick handlers`,...a.parameters?.docs?.description}}};const C=["WithDropdowns","WithLinks","WithClickHandlers"];export{a as WithClickHandlers,o as WithDropdowns,l as WithLinks,C as __namedExportsOrder,v as default};
