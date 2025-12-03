import{P as n}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const ae={title:"Components/Navigation/Item Variants",tags:["autodocs"]},r=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Tab",selected:!1}],type:"tabs",alignment:"left"});return e.appendChild(t),e},s=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Tab",selected:!0}],type:"tabs",alignment:"left"});return e.appendChild(t),e},d=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Tab",selected:!1,disabled:!0}],type:"tabs",alignment:"left"});return e.appendChild(t),e},c=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Dropdown",selected:!1,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")},{text:"Option 3",href:"#",onClick:()=>console.log("Option 3")}]}],type:"tabs",alignment:"left"});return e.appendChild(t),e},p=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Dropdown",selected:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")},{text:"Option 3",href:"#",onClick:()=>console.log("Option 3")}]}],type:"tabs",alignment:"left"});return e.appendChild(t),e},m=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Dropdown",selected:!1,disabled:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"tabs",alignment:"left"});return e.appendChild(t),e},b=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Pill",selected:!1}],type:"pills",alignment:"left"});return e.appendChild(t),e},u=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Pill",selected:!0}],type:"pills",alignment:"left"});return e.appendChild(t),e},f=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Pill",selected:!1,disabled:!0}],type:"pills",alignment:"left"});return e.appendChild(t),e},y=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Dropdown",selected:!1,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")},{text:"Option 3",href:"#",onClick:()=>console.log("Option 3")}]}],type:"pills",alignment:"left"});return e.appendChild(t),e},D=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Dropdown",selected:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")},{text:"Option 3",href:"#",onClick:()=>console.log("Option 3")}]}],type:"pills",alignment:"left"});return e.appendChild(t),e},C=()=>{const e=document.createElement("div");e.style.display="flex",e.style.justifyContent="center",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=n.createNavigation({items:[{text:"Dropdown",selected:!1,disabled:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"pills",alignment:"left"});return e.appendChild(t),e},x=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="48px",e.style.padding="24px",e.style.backgroundColor="var(--color-surface)";const t=document.createElement("div"),T=document.createElement("h3");T.textContent="Tab Items",T.style.marginBottom="24px",t.appendChild(T);const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.gap="24px";const q=n.createNavigation({items:[{text:"Tab",selected:!1}],type:"tabs",alignment:"left"}),g=document.createElement("div");g.className="body2-txt",g.textContent="Default",g.style.marginBottom="8px",o.appendChild(g),o.appendChild(q);const z=n.createNavigation({items:[{text:"Tab",selected:!0}],type:"tabs",alignment:"left"}),w=document.createElement("div");w.className="body2-txt",w.textContent="Selected",w.style.marginBottom="8px",o.appendChild(w),o.appendChild(z);const F=n.createNavigation({items:[{text:"Tab",selected:!1,disabled:!0}],type:"tabs",alignment:"left"}),v=document.createElement("div");v.className="body2-txt",v.textContent="Disabled",v.style.marginBottom="8px",o.appendChild(v),o.appendChild(F),t.appendChild(o),e.appendChild(t);const B=document.createElement("div"),j=document.createElement("h3");j.textContent="Tab Item Dropdowns",j.style.marginBottom="24px",B.appendChild(j);const l=document.createElement("div");l.style.display="flex",l.style.flexDirection="column",l.style.gap="24px";const G=n.createNavigation({items:[{text:"Dropdown",selected:!1,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"tabs",alignment:"left"}),h=document.createElement("div");h.className="body2-txt",h.textContent="Default",h.style.marginBottom="8px",l.appendChild(h),l.appendChild(G);const H=n.createNavigation({items:[{text:"Dropdown",selected:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"tabs",alignment:"left"}),O=document.createElement("div");O.className="body2-txt",O.textContent="Selected",O.style.marginBottom="8px",l.appendChild(O),l.appendChild(H);const J=n.createNavigation({items:[{text:"Dropdown",selected:!1,disabled:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"tabs",alignment:"left"}),S=document.createElement("div");S.className="body2-txt",S.textContent="Disabled",S.style.marginBottom="8px",l.appendChild(S),l.appendChild(J),B.appendChild(l),e.appendChild(B);const V=document.createElement("div"),U=document.createElement("h3");U.textContent="Pill Items",U.style.marginBottom="24px",V.appendChild(U);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="24px";const K=n.createNavigation({items:[{text:"Pill",selected:!1}],type:"pills",alignment:"left"}),I=document.createElement("div");I.className="body2-txt",I.textContent="Default",I.style.marginBottom="8px",a.appendChild(I),a.appendChild(K);const M=n.createNavigation({items:[{text:"Pill",selected:!0}],type:"pills",alignment:"left"}),L=document.createElement("div");L.className="body2-txt",L.textContent="Selected",L.style.marginBottom="8px",a.appendChild(L),a.appendChild(M);const Q=n.createNavigation({items:[{text:"Pill",selected:!1,disabled:!0}],type:"pills",alignment:"left"}),k=document.createElement("div");k.className="body2-txt",k.textContent="Disabled",k.style.marginBottom="8px",a.appendChild(k),a.appendChild(Q),V.appendChild(a),e.appendChild(V);const _=document.createElement("div"),A=document.createElement("h3");A.textContent="Pill Item Dropdowns",A.style.marginBottom="24px",_.appendChild(A);const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="24px";const R=n.createNavigation({items:[{text:"Dropdown",selected:!1,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"pills",alignment:"left"}),E=document.createElement("div");E.className="body2-txt",E.textContent="Default",E.style.marginBottom="8px",i.appendChild(E),i.appendChild(R);const W=n.createNavigation({items:[{text:"Dropdown",selected:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"pills",alignment:"left"}),N=document.createElement("div");N.className="body2-txt",N.textContent="Selected",N.style.marginBottom="8px",i.appendChild(N),i.appendChild(W);const X=n.createNavigation({items:[{text:"Dropdown",selected:!1,disabled:!0,dropdownItems:[{text:"Option 1",href:"#",onClick:()=>console.log("Option 1")},{text:"Option 2",href:"#",onClick:()=>console.log("Option 2")}]}],type:"pills",alignment:"left"}),P=document.createElement("div");return P.className="body2-txt",P.textContent="Disabled",P.style.marginBottom="8px",i.appendChild(P),i.appendChild(X),_.appendChild(i),e.appendChild(_),e};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Tab',
      selected: false
    }],
    type: 'tabs',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...r.parameters?.docs?.source},description:{story:`Tab Item - Default State
Unselected tab item in default state`,...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Tab',
      selected: true
    }],
    type: 'tabs',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...s.parameters?.docs?.source},description:{story:`Tab Item - Selected State
Selected tab item in default state`,...s.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Tab',
      selected: false,
      disabled: true
    }],
    type: 'tabs',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...d.parameters?.docs?.source},description:{story:`Tab Item - Disabled State
Disabled tab item`,...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
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
    }],
    type: 'tabs',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...c.parameters?.docs?.source},description:{story:`Tab Item Dropdown - Default State
Unselected tab item with dropdown in default state`,...c.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: true,
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
    }],
    type: 'tabs',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...p.parameters?.docs?.source},description:{story:`Tab Item Dropdown - Selected State
Selected tab item with dropdown`,...p.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: false,
      disabled: true,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }]
    }],
    type: 'tabs',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...m.parameters?.docs?.source},description:{story:`Tab Item Dropdown - Disabled State
Disabled tab item with dropdown`,...m.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Pill',
      selected: false
    }],
    type: 'pills',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...b.parameters?.docs?.source},description:{story:`Pill Item - Default State
Unselected pill item in default state`,...b.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Pill',
      selected: true
    }],
    type: 'pills',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...u.parameters?.docs?.source},description:{story:`Pill Item - Selected State
Selected pill item in default state`,...u.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Pill',
      selected: false,
      disabled: true
    }],
    type: 'pills',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...f.parameters?.docs?.source},description:{story:`Pill Item - Disabled State
Disabled pill item`,...f.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
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
    }],
    type: 'pills',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...y.parameters?.docs?.source},description:{story:`Pill Item Dropdown - Default State
Unselected pill item with dropdown in default state`,...y.parameters?.docs?.description}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: true,
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
    }],
    type: 'pills',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...D.parameters?.docs?.source},description:{story:`Pill Item Dropdown - Selected State
Selected pill item with dropdown`,...D.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const nav = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: false,
      disabled: true,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }]
    }],
    type: 'pills',
    alignment: 'left'
  });
  container.appendChild(nav);
  return container;
}`,...C.parameters?.docs?.source},description:{story:`Pill Item Dropdown - Disabled State
Disabled pill item with dropdown`,...C.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';

  // Tab Items
  const tabSection = document.createElement('div');
  const tabLabel = document.createElement('h3');
  tabLabel.textContent = 'Tab Items';
  tabLabel.style.marginBottom = '24px';
  tabSection.appendChild(tabLabel);
  const tabContainer = document.createElement('div');
  tabContainer.style.display = 'flex';
  tabContainer.style.flexDirection = 'column';
  tabContainer.style.gap = '24px';

  // Tab - Default
  const tabDefault = PlusInterface.createNavigation({
    items: [{
      text: 'Tab',
      selected: false
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDefaultLabel = document.createElement('div');
  tabDefaultLabel.className = 'body2-txt';
  tabDefaultLabel.textContent = 'Default';
  tabDefaultLabel.style.marginBottom = '8px';
  tabContainer.appendChild(tabDefaultLabel);
  tabContainer.appendChild(tabDefault);

  // Tab - Selected
  const tabSelected = PlusInterface.createNavigation({
    items: [{
      text: 'Tab',
      selected: true
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabSelectedLabel = document.createElement('div');
  tabSelectedLabel.className = 'body2-txt';
  tabSelectedLabel.textContent = 'Selected';
  tabSelectedLabel.style.marginBottom = '8px';
  tabContainer.appendChild(tabSelectedLabel);
  tabContainer.appendChild(tabSelected);

  // Tab - Disabled
  const tabDisabled = PlusInterface.createNavigation({
    items: [{
      text: 'Tab',
      selected: false,
      disabled: true
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDisabledLabel = document.createElement('div');
  tabDisabledLabel.className = 'body2-txt';
  tabDisabledLabel.textContent = 'Disabled';
  tabDisabledLabel.style.marginBottom = '8px';
  tabContainer.appendChild(tabDisabledLabel);
  tabContainer.appendChild(tabDisabled);
  tabSection.appendChild(tabContainer);
  container.appendChild(tabSection);

  // Tab Item Dropdowns
  const tabDropdownSection = document.createElement('div');
  const tabDropdownLabel = document.createElement('h3');
  tabDropdownLabel.textContent = 'Tab Item Dropdowns';
  tabDropdownLabel.style.marginBottom = '24px';
  tabDropdownSection.appendChild(tabDropdownLabel);
  const tabDropdownContainer = document.createElement('div');
  tabDropdownContainer.style.display = 'flex';
  tabDropdownContainer.style.flexDirection = 'column';
  tabDropdownContainer.style.gap = '24px';

  // Tab Dropdown - Default
  const tabDropdownDefault = PlusInterface.createNavigation({
    items: [{
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
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDropdownDefaultLabel = document.createElement('div');
  tabDropdownDefaultLabel.className = 'body2-txt';
  tabDropdownDefaultLabel.textContent = 'Default';
  tabDropdownDefaultLabel.style.marginBottom = '8px';
  tabDropdownContainer.appendChild(tabDropdownDefaultLabel);
  tabDropdownContainer.appendChild(tabDropdownDefault);

  // Tab Dropdown - Selected
  const tabDropdownSelected = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: true,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }]
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDropdownSelectedLabel = document.createElement('div');
  tabDropdownSelectedLabel.className = 'body2-txt';
  tabDropdownSelectedLabel.textContent = 'Selected';
  tabDropdownSelectedLabel.style.marginBottom = '8px';
  tabDropdownContainer.appendChild(tabDropdownSelectedLabel);
  tabDropdownContainer.appendChild(tabDropdownSelected);

  // Tab Dropdown - Disabled
  const tabDropdownDisabled = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: false,
      disabled: true,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }]
    }],
    type: 'tabs',
    alignment: 'left'
  });
  const tabDropdownDisabledLabel = document.createElement('div');
  tabDropdownDisabledLabel.className = 'body2-txt';
  tabDropdownDisabledLabel.textContent = 'Disabled';
  tabDropdownDisabledLabel.style.marginBottom = '8px';
  tabDropdownContainer.appendChild(tabDropdownDisabledLabel);
  tabDropdownContainer.appendChild(tabDropdownDisabled);
  tabDropdownSection.appendChild(tabDropdownContainer);
  container.appendChild(tabDropdownSection);

  // Pill Items
  const pillSection = document.createElement('div');
  const pillLabel = document.createElement('h3');
  pillLabel.textContent = 'Pill Items';
  pillLabel.style.marginBottom = '24px';
  pillSection.appendChild(pillLabel);
  const pillContainer = document.createElement('div');
  pillContainer.style.display = 'flex';
  pillContainer.style.flexDirection = 'column';
  pillContainer.style.gap = '24px';

  // Pill - Default
  const pillDefault = PlusInterface.createNavigation({
    items: [{
      text: 'Pill',
      selected: false
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDefaultLabel = document.createElement('div');
  pillDefaultLabel.className = 'body2-txt';
  pillDefaultLabel.textContent = 'Default';
  pillDefaultLabel.style.marginBottom = '8px';
  pillContainer.appendChild(pillDefaultLabel);
  pillContainer.appendChild(pillDefault);

  // Pill - Selected
  const pillSelected = PlusInterface.createNavigation({
    items: [{
      text: 'Pill',
      selected: true
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillSelectedLabel = document.createElement('div');
  pillSelectedLabel.className = 'body2-txt';
  pillSelectedLabel.textContent = 'Selected';
  pillSelectedLabel.style.marginBottom = '8px';
  pillContainer.appendChild(pillSelectedLabel);
  pillContainer.appendChild(pillSelected);

  // Pill - Disabled
  const pillDisabled = PlusInterface.createNavigation({
    items: [{
      text: 'Pill',
      selected: false,
      disabled: true
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDisabledLabel = document.createElement('div');
  pillDisabledLabel.className = 'body2-txt';
  pillDisabledLabel.textContent = 'Disabled';
  pillDisabledLabel.style.marginBottom = '8px';
  pillContainer.appendChild(pillDisabledLabel);
  pillContainer.appendChild(pillDisabled);
  pillSection.appendChild(pillContainer);
  container.appendChild(pillSection);

  // Pill Item Dropdowns
  const pillDropdownSection = document.createElement('div');
  const pillDropdownLabel = document.createElement('h3');
  pillDropdownLabel.textContent = 'Pill Item Dropdowns';
  pillDropdownLabel.style.marginBottom = '24px';
  pillDropdownSection.appendChild(pillDropdownLabel);
  const pillDropdownContainer = document.createElement('div');
  pillDropdownContainer.style.display = 'flex';
  pillDropdownContainer.style.flexDirection = 'column';
  pillDropdownContainer.style.gap = '24px';

  // Pill Dropdown - Default
  const pillDropdownDefault = PlusInterface.createNavigation({
    items: [{
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
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDropdownDefaultLabel = document.createElement('div');
  pillDropdownDefaultLabel.className = 'body2-txt';
  pillDropdownDefaultLabel.textContent = 'Default';
  pillDropdownDefaultLabel.style.marginBottom = '8px';
  pillDropdownContainer.appendChild(pillDropdownDefaultLabel);
  pillDropdownContainer.appendChild(pillDropdownDefault);

  // Pill Dropdown - Selected
  const pillDropdownSelected = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: true,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }]
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDropdownSelectedLabel = document.createElement('div');
  pillDropdownSelectedLabel.className = 'body2-txt';
  pillDropdownSelectedLabel.textContent = 'Selected';
  pillDropdownSelectedLabel.style.marginBottom = '8px';
  pillDropdownContainer.appendChild(pillDropdownSelectedLabel);
  pillDropdownContainer.appendChild(pillDropdownSelected);

  // Pill Dropdown - Disabled
  const pillDropdownDisabled = PlusInterface.createNavigation({
    items: [{
      text: 'Dropdown',
      selected: false,
      disabled: true,
      dropdownItems: [{
        text: 'Option 1',
        href: '#',
        onClick: () => console.log('Option 1')
      }, {
        text: 'Option 2',
        href: '#',
        onClick: () => console.log('Option 2')
      }]
    }],
    type: 'pills',
    alignment: 'left'
  });
  const pillDropdownDisabledLabel = document.createElement('div');
  pillDropdownDisabledLabel.className = 'body2-txt';
  pillDropdownDisabledLabel.textContent = 'Disabled';
  pillDropdownDisabledLabel.style.marginBottom = '8px';
  pillDropdownContainer.appendChild(pillDropdownDisabledLabel);
  pillDropdownContainer.appendChild(pillDropdownDisabled);
  pillDropdownSection.appendChild(pillDropdownContainer);
  container.appendChild(pillDropdownSection);
  return container;
}`,...x.parameters?.docs?.source},description:{story:`All Item Variants
Shows all item variants side by side for comparison`,...x.parameters?.docs?.description}}};const ie=["TabItemDefault","TabItemSelected","TabItemDisabled","TabItemDropdownDefault","TabItemDropdownSelected","TabItemDropdownDisabled","PillItemDefault","PillItemSelected","PillItemDisabled","PillItemDropdownDefault","PillItemDropdownSelected","PillItemDropdownDisabled","AllItemVariants"];export{x as AllItemVariants,b as PillItemDefault,f as PillItemDisabled,y as PillItemDropdownDefault,C as PillItemDropdownDisabled,D as PillItemDropdownSelected,u as PillItemSelected,r as TabItemDefault,d as TabItemDisabled,c as TabItemDropdownDefault,m as TabItemDropdownDisabled,p as TabItemDropdownSelected,s as TabItemSelected,ie as __namedExportsOrder,ae as default};
