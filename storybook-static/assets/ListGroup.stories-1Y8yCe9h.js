import{P as t}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const _={title:"Components/ListGroup",tags:["autodocs"],parameters:{docs:{description:{component:"List group component for displaying a series of content items. Built on Bootstrap 4.6.2 list-group pattern with PLUS design token customizations. Matches Figma design system specifications exactly."}}}},v={render:()=>{const e=t.createBadge({text:"14",style:"primary"}),n=t.createListGroup({items:[{content:"An item"},{content:"A second item",badge:e},{content:"A third item",badge:e},{content:"A fourth item",badge:e},{content:"And a fifth one",badge:e}]});return n.classList.add("body1-txt"),n}},S={render:()=>{const e=t.createListGroup({items:[{content:"Action item 1",href:"#"},{content:"Action item 2",href:"#"},{content:"Action item 3",href:"#"}]});return e.classList.add("body1-txt"),e}},x={render:()=>{const e=t.createBadge({text:"14",style:"primary"}),n=t.createBadge({text:"14",style:"primary"}),s=t.createListGroup({items:[{content:"An active item",active:!0,badge:n},{content:"A second item",badge:e},{content:"A third item",badge:e},{content:"A fourth item",badge:e},{content:"And a fifth one",badge:e}]});return s.classList.add("body1-txt"),s}},C={render:()=>{const e=t.createBadge({text:"14",style:"primary"}),n=t.createBadge({text:"14",style:"secondary"}),s=t.createListGroup({items:[{content:"A disabled item",disabled:!0,badge:n},{content:"A second item",badge:e},{content:"A third item",badge:e},{content:"A fourth item",badge:e},{content:"And a fifth one",badge:e}]});return s.classList.add("body1-txt"),s}},G={render:()=>{const e=t.createBadge({text:"14",style:"primary"}),n=t.createBadge({text:"2",style:"success"}),s=t.createBadge({text:"New",style:"info"}),p=t.createListGroup({items:[{content:"List item 1",badge:e},{content:"List item 2",badge:n},{content:"List item 3",badge:s},{content:"List item 4"}]});return p.classList.add("body1-txt"),p}},B={render:()=>{const e=t.createListGroup({items:[{content:"List item 1"},{content:"List item 2"},{content:"List item 3"},{content:"List item 4"}],flush:!0});return e.classList.add("body1-txt"),e}},A={render:()=>{const e=t.createListGroup({items:[{content:"Action item 1",href:"#"},{content:"Action item 2",href:"#",active:!0},{content:"Action item 3",href:"#"},{content:"Action item 4",href:"#"}]});return e.classList.add("body1-txt"),e}},E={render:()=>{const e=t.createListGroup({items:[{content:"Button item 1",action:"button",onClick:()=>console.log("Button 1")},{content:"Button item 2",action:"button",active:!0,onClick:()=>console.log("Button 2")},{content:"Button item 3",action:"button",onClick:()=>console.log("Button 3")}]});return e.classList.add("body1-txt"),e}},z={render:()=>{const e=t.createListGroup({items:[{content:"Normal item"},{content:"Active item",active:!0},{content:"Disabled item",disabled:!0},{content:"Action item",href:"#"}]});return e.classList.add("body1-txt"),e}},I={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)";const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-sm)";const s=document.createElement("div");s.className="h6",s.textContent="Basic List",s.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(s);const p=t.createListGroup({items:[{content:"List item 1"},{content:"List item 2"},{content:"List item 3"}]});p.classList.add("body2-txt"),n.appendChild(p),e.appendChild(n);const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-sm)";const r=document.createElement("div");r.className="h6",r.textContent="Action List",r.style.marginBottom="var(--size-element-gap-sm)",i.appendChild(r);const b=t.createListGroup({items:[{content:"Action item 1",href:"#"},{content:"Action item 2",href:"#",active:!0},{content:"Action item 3",href:"#"}]});b.classList.add("body2-txt"),i.appendChild(b),e.appendChild(i);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-sm)";const l=document.createElement("div");l.className="h6",l.textContent="List with Badges",l.style.marginBottom="var(--size-element-gap-sm)",a.appendChild(l);const P=t.createBadge({text:"14",style:"primary"}),u=t.createBadge({text:"2",style:"success"}),y=t.createBadge({text:"New",style:"info"}),L=t.createListGroup({items:[{content:"List item 1",badge:P},{content:"List item 2",badge:u},{content:"List item 3",badge:y}]});L.classList.add("body2-txt"),a.appendChild(L),e.appendChild(a);const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.gap="var(--size-element-gap-sm)";const d=document.createElement("div");d.className="h6",d.textContent="List with Disabled Items",d.style.marginBottom="var(--size-element-gap-sm)",o.appendChild(d);const f=t.createListGroup({items:[{content:"List item 1"},{content:"List item 2",disabled:!0},{content:"List item 3"},{content:"List item 4",disabled:!0}]});f.classList.add("body2-txt"),o.appendChild(f),e.appendChild(o);const c=document.createElement("div");c.style.display="flex",c.style.flexDirection="column",c.style.gap="var(--size-element-gap-sm)";const m=document.createElement("div");m.className="h6",m.textContent="Flush List (No Borders)",m.style.marginBottom="var(--size-element-gap-sm)",c.appendChild(m);const h=t.createListGroup({items:[{content:"List item 1"},{content:"List item 2"},{content:"List item 3"}],flush:!0});return h.classList.add("body2-txt"),c.appendChild(h),e.appendChild(c),e}},w={render:e=>{const n=t.createListGroup(e);return n.classList.add("body1-txt"),n},argTypes:{items:{control:"object",description:"Array of list item configuration objects"},flush:{control:"boolean",description:"Whether to use flush variant (no borders)"},useListElement:{control:"boolean",description:"Whether to use <ul> (true) or <div> (false)"}},args:{items:[{content:"List item 1"},{content:"List item 2",active:!0},{content:"List item 3"}],flush:!1,useListElement:!0}},D={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)";const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-sm)";const s=document.createElement("div");s.className="h6",s.textContent="Primary Style",s.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(s);const p=t.createListGroup({items:[{content:"Primary item 1",href:"#",style:"primary"},{content:"Primary item 2",href:"#",style:"primary",active:!0},{content:"Primary item 3",href:"#",style:"primary"}]});p.classList.add("body2-txt"),n.appendChild(p),e.appendChild(n);const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-sm)";const r=document.createElement("div");r.className="h6",r.textContent="Secondary Style",r.style.marginBottom="var(--size-element-gap-sm)",i.appendChild(r);const b=t.createListGroup({items:[{content:"Secondary item 1",href:"#",style:"secondary"},{content:"Secondary item 2",href:"#",style:"secondary",active:!0},{content:"Secondary item 3",href:"#",style:"secondary"}]});b.classList.add("body2-txt"),i.appendChild(b),e.appendChild(i);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-sm)";const l=document.createElement("div");l.className="h6",l.textContent="Tertiary Style",l.style.marginBottom="var(--size-element-gap-sm)",a.appendChild(l);const P=t.createListGroup({items:[{content:"Tertiary item 1",href:"#",style:"tertiary"},{content:"Tertiary item 2",href:"#",style:"tertiary",active:!0},{content:"Tertiary item 3",href:"#",style:"tertiary"}]});P.classList.add("body2-txt"),a.appendChild(P),e.appendChild(a);const u=document.createElement("div");u.style.display="flex",u.style.flexDirection="column",u.style.gap="var(--size-element-gap-sm)";const y=document.createElement("div");y.className="h6",y.textContent="Success Style",y.style.marginBottom="var(--size-element-gap-sm)",u.appendChild(y);const L=t.createListGroup({items:[{content:"Success item 1",href:"#",style:"success"},{content:"Success item 2",href:"#",style:"success",active:!0},{content:"Success item 3",href:"#",style:"success"}]});L.classList.add("body2-txt"),u.appendChild(L),e.appendChild(u);const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.gap="var(--size-element-gap-sm)";const d=document.createElement("div");d.className="h6",d.textContent="Danger Style",d.style.marginBottom="var(--size-element-gap-sm)",o.appendChild(d);const f=t.createListGroup({items:[{content:"Danger item 1",href:"#",style:"danger"},{content:"Danger item 2",href:"#",style:"danger",active:!0},{content:"Danger item 3",href:"#",style:"danger"}]});f.classList.add("body2-txt"),o.appendChild(f),e.appendChild(o);const c=document.createElement("div");c.style.display="flex",c.style.flexDirection="column",c.style.gap="var(--size-element-gap-sm)";const m=document.createElement("div");m.className="h6",m.textContent="Warning Style",m.style.marginBottom="var(--size-element-gap-sm)",c.appendChild(m);const h=t.createListGroup({items:[{content:"Warning item 1",href:"#",style:"warning"},{content:"Warning item 2",href:"#",style:"warning",active:!0},{content:"Warning item 3",href:"#",style:"warning"}]});h.classList.add("body2-txt"),c.appendChild(h),e.appendChild(c);const g=document.createElement("div");g.style.display="flex",g.style.flexDirection="column",g.style.gap="var(--size-element-gap-sm)";const N=document.createElement("div");N.className="h6",N.textContent="Info Style",N.style.marginBottom="var(--size-element-gap-sm)",g.appendChild(N);const W=t.createListGroup({items:[{content:"Info item 1",href:"#",style:"info"},{content:"Info item 2",href:"#",style:"info",active:!0},{content:"Info item 3",href:"#",style:"info"}]});return W.classList.add("body2-txt"),g.appendChild(W),e.appendChild(g),e}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const badge14 = PlusInterface.createBadge({
      text: '14',
      style: 'primary'
    });
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'An item'
      }, {
        content: 'A second item',
        badge: badge14
      }, {
        content: 'A third item',
        badge: badge14
      }, {
        content: 'A fourth item',
        badge: badge14
      }, {
        content: 'And a fifth one',
        badge: badge14
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...v.parameters?.docs?.source},description:{story:`Basic List Group
Simple list with text items matching Figma design exactly`,...v.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'Action item 1',
        href: '#'
      }, {
        content: 'Action item 2',
        href: '#'
      }, {
        content: 'Action item 3',
        href: '#'
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...S.parameters?.docs?.source},description:{story:`Action List Group
Interactive list with clickable items`,...S.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => {
    const badge14 = PlusInterface.createBadge({
      text: '14',
      style: 'primary'
    });
    const activeBadge = PlusInterface.createBadge({
      text: '14',
      style: 'primary'
    });
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'An active item',
        active: true,
        badge: activeBadge
      }, {
        content: 'A second item',
        badge: badge14
      }, {
        content: 'A third item',
        badge: badge14
      }, {
        content: 'A fourth item',
        badge: badge14
      }, {
        content: 'And a fifth one',
        badge: badge14
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...x.parameters?.docs?.source},description:{story:`Active State
List with active/selected item matching Figma design exactly`,...x.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => {
    const badge14 = PlusInterface.createBadge({
      text: '14',
      style: 'primary'
    });
    const disabledBadge = PlusInterface.createBadge({
      text: '14',
      style: 'secondary'
    });
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'A disabled item',
        disabled: true,
        badge: disabledBadge
      }, {
        content: 'A second item',
        badge: badge14
      }, {
        content: 'A third item',
        badge: badge14
      }, {
        content: 'A fourth item',
        badge: badge14
      }, {
        content: 'And a fifth one',
        badge: badge14
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...C.parameters?.docs?.source},description:{story:`Disabled State
List with disabled items (38% opacity) matching Figma design exactly`,...C.parameters?.docs?.description}}};G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  render: () => {
    const badge1 = PlusInterface.createBadge({
      text: '14',
      style: 'primary'
    });
    const badge2 = PlusInterface.createBadge({
      text: '2',
      style: 'success'
    });
    const badge3 = PlusInterface.createBadge({
      text: 'New',
      style: 'info'
    });
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'List item 1',
        badge: badge1
      }, {
        content: 'List item 2',
        badge: badge2
      }, {
        content: 'List item 3',
        badge: badge3
      }, {
        content: 'List item 4'
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...G.parameters?.docs?.source},description:{story:`With Badges
List items with badge indicators`,...G.parameters?.docs?.description}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'List item 1'
      }, {
        content: 'List item 2'
      }, {
        content: 'List item 3'
      }, {
        content: 'List item 4'
      }],
      flush: true
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...B.parameters?.docs?.source},description:{story:`Flush Variant
List without borders or rounded corners`,...B.parameters?.docs?.description}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'Action item 1',
        href: '#'
      }, {
        content: 'Action item 2',
        href: '#',
        active: true
      }, {
        content: 'Action item 3',
        href: '#'
      }, {
        content: 'Action item 4',
        href: '#'
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...A.parameters?.docs?.source},description:{story:`Action with Active
Interactive list with active item`,...A.parameters?.docs?.description}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'Button item 1',
        action: 'button',
        onClick: () => console.log('Button 1')
      }, {
        content: 'Button item 2',
        action: 'button',
        active: true,
        onClick: () => console.log('Button 2')
      }, {
        content: 'Button item 3',
        action: 'button',
        onClick: () => console.log('Button 3')
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...E.parameters?.docs?.source},description:{story:`Button Actions
List items as buttons instead of links`,...E.parameters?.docs?.description}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [{
        content: 'Normal item'
      }, {
        content: 'Active item',
        active: true
      }, {
        content: 'Disabled item',
        disabled: true
      }, {
        content: 'Action item',
        href: '#'
      }]
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  }
}`,...z.parameters?.docs?.source},description:{story:`Mixed States
List with various states combined`,...z.parameters?.docs?.description}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // Basic list
    const basicSection = document.createElement('div');
    basicSection.style.display = 'flex';
    basicSection.style.flexDirection = 'column';
    basicSection.style.gap = 'var(--size-element-gap-sm)';
    const basicLabel = document.createElement('div');
    basicLabel.className = 'h6';
    basicLabel.textContent = 'Basic List';
    basicLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    basicSection.appendChild(basicLabel);
    const basicList = PlusInterface.createListGroup({
      items: [{
        content: 'List item 1'
      }, {
        content: 'List item 2'
      }, {
        content: 'List item 3'
      }]
    });
    basicList.classList.add('body2-txt');
    basicSection.appendChild(basicList);
    container.appendChild(basicSection);

    // Action list
    const actionSection = document.createElement('div');
    actionSection.style.display = 'flex';
    actionSection.style.flexDirection = 'column';
    actionSection.style.gap = 'var(--size-element-gap-sm)';
    const actionLabel = document.createElement('div');
    actionLabel.className = 'h6';
    actionLabel.textContent = 'Action List';
    actionLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    actionSection.appendChild(actionLabel);
    const actionList = PlusInterface.createListGroup({
      items: [{
        content: 'Action item 1',
        href: '#'
      }, {
        content: 'Action item 2',
        href: '#',
        active: true
      }, {
        content: 'Action item 3',
        href: '#'
      }]
    });
    actionList.classList.add('body2-txt');
    actionSection.appendChild(actionList);
    container.appendChild(actionSection);

    // With badges
    const badgeSection = document.createElement('div');
    badgeSection.style.display = 'flex';
    badgeSection.style.flexDirection = 'column';
    badgeSection.style.gap = 'var(--size-element-gap-sm)';
    const badgeLabel = document.createElement('div');
    badgeLabel.className = 'h6';
    badgeLabel.textContent = 'List with Badges';
    badgeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    badgeSection.appendChild(badgeLabel);
    const badge1 = PlusInterface.createBadge({
      text: '14',
      style: 'primary'
    });
    const badge2 = PlusInterface.createBadge({
      text: '2',
      style: 'success'
    });
    const badge3 = PlusInterface.createBadge({
      text: 'New',
      style: 'info'
    });
    const badgeList = PlusInterface.createListGroup({
      items: [{
        content: 'List item 1',
        badge: badge1
      }, {
        content: 'List item 2',
        badge: badge2
      }, {
        content: 'List item 3',
        badge: badge3
      }]
    });
    badgeList.classList.add('body2-txt');
    badgeSection.appendChild(badgeList);
    container.appendChild(badgeSection);

    // Disabled items
    const disabledSection = document.createElement('div');
    disabledSection.style.display = 'flex';
    disabledSection.style.flexDirection = 'column';
    disabledSection.style.gap = 'var(--size-element-gap-sm)';
    const disabledLabel = document.createElement('div');
    disabledLabel.className = 'h6';
    disabledLabel.textContent = 'List with Disabled Items';
    disabledLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    disabledSection.appendChild(disabledLabel);
    const disabledList = PlusInterface.createListGroup({
      items: [{
        content: 'List item 1'
      }, {
        content: 'List item 2',
        disabled: true
      }, {
        content: 'List item 3'
      }, {
        content: 'List item 4',
        disabled: true
      }]
    });
    disabledList.classList.add('body2-txt');
    disabledSection.appendChild(disabledList);
    container.appendChild(disabledSection);

    // Flush variant
    const flushSection = document.createElement('div');
    flushSection.style.display = 'flex';
    flushSection.style.flexDirection = 'column';
    flushSection.style.gap = 'var(--size-element-gap-sm)';
    const flushLabel = document.createElement('div');
    flushLabel.className = 'h6';
    flushLabel.textContent = 'Flush List (No Borders)';
    flushLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    flushSection.appendChild(flushLabel);
    const flushList = PlusInterface.createListGroup({
      items: [{
        content: 'List item 1'
      }, {
        content: 'List item 2'
      }, {
        content: 'List item 3'
      }],
      flush: true
    });
    flushList.classList.add('body2-txt');
    flushSection.appendChild(flushList);
    container.appendChild(flushSection);
    return container;
  }
}`,...I.parameters?.docs?.source},description:{story:`All Variants
Shows all list group combinations matching Figma design system`,...I.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: args => {
    const listGroup = PlusInterface.createListGroup(args);
    listGroup.classList.add('body1-txt');
    return listGroup;
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of list item configuration objects'
    },
    flush: {
      control: 'boolean',
      description: 'Whether to use flush variant (no borders)'
    },
    useListElement: {
      control: 'boolean',
      description: 'Whether to use <ul> (true) or <div> (false)'
    }
  },
  args: {
    items: [{
      content: 'List item 1'
    }, {
      content: 'List item 2',
      active: true
    }, {
      content: 'List item 3'
    }],
    flush: false,
    useListElement: true
  }
}`,...w.parameters?.docs?.source},description:{story:`Interactive List Group
Interactive playground for testing list group variations`,...w.parameters?.docs?.description}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // Primary Style (default)
    const primarySection = document.createElement('div');
    primarySection.style.display = 'flex';
    primarySection.style.flexDirection = 'column';
    primarySection.style.gap = 'var(--size-element-gap-sm)';
    const primaryLabel = document.createElement('div');
    primaryLabel.className = 'h6';
    primaryLabel.textContent = 'Primary Style';
    primaryLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    primarySection.appendChild(primaryLabel);
    const primaryList = PlusInterface.createListGroup({
      items: [{
        content: 'Primary item 1',
        href: '#',
        style: 'primary'
      }, {
        content: 'Primary item 2',
        href: '#',
        style: 'primary',
        active: true
      }, {
        content: 'Primary item 3',
        href: '#',
        style: 'primary'
      }]
    });
    primaryList.classList.add('body2-txt');
    primarySection.appendChild(primaryList);
    container.appendChild(primarySection);

    // Secondary Style
    const secondarySection = document.createElement('div');
    secondarySection.style.display = 'flex';
    secondarySection.style.flexDirection = 'column';
    secondarySection.style.gap = 'var(--size-element-gap-sm)';
    const secondaryLabel = document.createElement('div');
    secondaryLabel.className = 'h6';
    secondaryLabel.textContent = 'Secondary Style';
    secondaryLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    secondarySection.appendChild(secondaryLabel);
    const secondaryList = PlusInterface.createListGroup({
      items: [{
        content: 'Secondary item 1',
        href: '#',
        style: 'secondary'
      }, {
        content: 'Secondary item 2',
        href: '#',
        style: 'secondary',
        active: true
      }, {
        content: 'Secondary item 3',
        href: '#',
        style: 'secondary'
      }]
    });
    secondaryList.classList.add('body2-txt');
    secondarySection.appendChild(secondaryList);
    container.appendChild(secondarySection);

    // Tertiary Style
    const tertiarySection = document.createElement('div');
    tertiarySection.style.display = 'flex';
    tertiarySection.style.flexDirection = 'column';
    tertiarySection.style.gap = 'var(--size-element-gap-sm)';
    const tertiaryLabel = document.createElement('div');
    tertiaryLabel.className = 'h6';
    tertiaryLabel.textContent = 'Tertiary Style';
    tertiaryLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    tertiarySection.appendChild(tertiaryLabel);
    const tertiaryList = PlusInterface.createListGroup({
      items: [{
        content: 'Tertiary item 1',
        href: '#',
        style: 'tertiary'
      }, {
        content: 'Tertiary item 2',
        href: '#',
        style: 'tertiary',
        active: true
      }, {
        content: 'Tertiary item 3',
        href: '#',
        style: 'tertiary'
      }]
    });
    tertiaryList.classList.add('body2-txt');
    tertiarySection.appendChild(tertiaryList);
    container.appendChild(tertiarySection);

    // Success Style
    const successSection = document.createElement('div');
    successSection.style.display = 'flex';
    successSection.style.flexDirection = 'column';
    successSection.style.gap = 'var(--size-element-gap-sm)';
    const successLabel = document.createElement('div');
    successLabel.className = 'h6';
    successLabel.textContent = 'Success Style';
    successLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    successSection.appendChild(successLabel);
    const successList = PlusInterface.createListGroup({
      items: [{
        content: 'Success item 1',
        href: '#',
        style: 'success'
      }, {
        content: 'Success item 2',
        href: '#',
        style: 'success',
        active: true
      }, {
        content: 'Success item 3',
        href: '#',
        style: 'success'
      }]
    });
    successList.classList.add('body2-txt');
    successSection.appendChild(successList);
    container.appendChild(successSection);

    // Danger Style
    const dangerSection = document.createElement('div');
    dangerSection.style.display = 'flex';
    dangerSection.style.flexDirection = 'column';
    dangerSection.style.gap = 'var(--size-element-gap-sm)';
    const dangerLabel = document.createElement('div');
    dangerLabel.className = 'h6';
    dangerLabel.textContent = 'Danger Style';
    dangerLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    dangerSection.appendChild(dangerLabel);
    const dangerList = PlusInterface.createListGroup({
      items: [{
        content: 'Danger item 1',
        href: '#',
        style: 'danger'
      }, {
        content: 'Danger item 2',
        href: '#',
        style: 'danger',
        active: true
      }, {
        content: 'Danger item 3',
        href: '#',
        style: 'danger'
      }]
    });
    dangerList.classList.add('body2-txt');
    dangerSection.appendChild(dangerList);
    container.appendChild(dangerSection);

    // Warning Style
    const warningSection = document.createElement('div');
    warningSection.style.display = 'flex';
    warningSection.style.flexDirection = 'column';
    warningSection.style.gap = 'var(--size-element-gap-sm)';
    const warningLabel = document.createElement('div');
    warningLabel.className = 'h6';
    warningLabel.textContent = 'Warning Style';
    warningLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    warningSection.appendChild(warningLabel);
    const warningList = PlusInterface.createListGroup({
      items: [{
        content: 'Warning item 1',
        href: '#',
        style: 'warning'
      }, {
        content: 'Warning item 2',
        href: '#',
        style: 'warning',
        active: true
      }, {
        content: 'Warning item 3',
        href: '#',
        style: 'warning'
      }]
    });
    warningList.classList.add('body2-txt');
    warningSection.appendChild(warningList);
    container.appendChild(warningSection);

    // Info Style
    const infoSection = document.createElement('div');
    infoSection.style.display = 'flex';
    infoSection.style.flexDirection = 'column';
    infoSection.style.gap = 'var(--size-element-gap-sm)';
    const infoLabel = document.createElement('div');
    infoLabel.className = 'h6';
    infoLabel.textContent = 'Info Style';
    infoLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    infoSection.appendChild(infoLabel);
    const infoList = PlusInterface.createListGroup({
      items: [{
        content: 'Info item 1',
        href: '#',
        style: 'info'
      }, {
        content: 'Info item 2',
        href: '#',
        style: 'info',
        active: true
      }, {
        content: 'Info item 3',
        href: '#',
        style: 'info'
      }]
    });
    infoList.classList.add('body2-txt');
    infoSection.appendChild(infoList);
    container.appendChild(infoSection);
    return container;
  }
}`,...D.parameters?.docs?.source},description:{story:`Color Style Variants
List groups with different color token variants matching Figma design system

Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=5173-6149&t=XxnevshHwphhdAOI-4`,...D.parameters?.docs?.description}}};const J=["Basic","Action","Active","Disabled","WithBadges","Flush","ActionWithActive","ButtonActions","MixedStates","AllVariants","Interactive","ColorStyleVariants"];export{S as Action,A as ActionWithActive,x as Active,I as AllVariants,v as Basic,E as ButtonActions,D as ColorStyleVariants,C as Disabled,B as Flush,w as Interactive,z as MixedStates,G as WithBadges,J as __namedExportsOrder,_ as default};
