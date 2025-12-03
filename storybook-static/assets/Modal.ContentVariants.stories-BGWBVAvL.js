import{P as s}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const g={title:"Components/Modal/Content Variants",tags:["autodocs"]},n=()=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)";const e=s.createModal({title:"Modal title",body:"Modal body text goes here.",type:"default",showBottomButtons:!0,primaryButton:{text:"Primary",style:"primary",fill:"filled",size:"default",onClick:()=>console.log("Primary clicked")},secondaryButton:{text:"Secondary",style:"secondary",fill:"tonal",size:"default",onClick:()=>console.log("Secondary clicked")}});return t.appendChild(e),t},o=()=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)";const e=s.createModal({title:"Modal title",body:"Modal body text goes here.",type:"default",showBottomButtons:!1});return t.appendChild(e),t},a=()=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)";const e=s.createModal({title:"Modal title",body:"Modal body text goes here.",type:"scrollable",showBottomButtons:!0,primaryButton:{text:"Primary",style:"primary",fill:"filled",size:"default",onClick:()=>console.log("Primary clicked")},secondaryButton:{text:"Secondary",style:"secondary",fill:"tonal",size:"default",onClick:()=>console.log("Secondary clicked")}});return t.appendChild(e),t},l=()=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)";const e=s.createModal({title:"Modal title",body:"Modal body text goes here.",type:"scrollable",showBottomButtons:!1});return t.appendChild(e),t},r=()=>{const t=document.createElement("div");t.style.display="flex",t.style.justifyContent="center",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)";const e=document.createElement("div");e.classList.add("body1-txt"),e.innerHTML=`
    <p>This is a longer modal body text that demonstrates how the scrollable modal type handles content that exceeds the available space.</p>
    <p>When content is longer than the modal body height, a scrollbar appears on the right side to allow users to scroll through all the content.</p>
    <p>The scrollbar includes up and down arrow icons to help users navigate through the content.</p>
    <p>This is useful for displaying terms and conditions, detailed information, or any content that requires more space than a standard modal.</p>
  `;const c=s.createModal({title:"Modal title",body:e,type:"scrollable",showBottomButtons:!0,primaryButton:{text:"Accept",style:"primary",fill:"filled",size:"default",onClick:()=>console.log("Accepted")},secondaryButton:{text:"Cancel",style:"secondary",fill:"tonal",size:"default",onClick:()=>console.log("Cancelled")}});return t.appendChild(c),t};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'default',
    showBottomButtons: true,
    primaryButton: {
      text: 'Primary',
      style: 'primary',
      fill: 'filled',
      size: 'default',
      onClick: () => console.log('Primary clicked')
    },
    secondaryButton: {
      text: 'Secondary',
      style: 'secondary',
      fill: 'tonal',
      size: 'default',
      onClick: () => console.log('Secondary clicked')
    }
  });
  container.appendChild(modal);
  return container;
}`,...n.parameters?.docs?.source},description:{story:`Default Type with Buttons
Standard modal with default type and action buttons`,...n.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'default',
    showBottomButtons: false
  });
  container.appendChild(modal);
  return container;
}`,...o.parameters?.docs?.source},description:{story:`Default Type without Buttons
Standard modal with default type and no action buttons`,...o.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'scrollable',
    showBottomButtons: true,
    primaryButton: {
      text: 'Primary',
      style: 'primary',
      fill: 'filled',
      size: 'default',
      onClick: () => console.log('Primary clicked')
    },
    secondaryButton: {
      text: 'Secondary',
      style: 'secondary',
      fill: 'tonal',
      size: 'default',
      onClick: () => console.log('Secondary clicked')
    }
  });
  container.appendChild(modal);
  return container;
}`,...a.parameters?.docs?.source},description:{story:`Scrollable Type with Buttons
Modal with scrollable body and action buttons`,...a.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'scrollable',
    showBottomButtons: false
  });
  container.appendChild(modal);
  return container;
}`,...l.parameters?.docs?.source},description:{story:`Scrollable Type without Buttons
Modal with scrollable body and no action buttons`,...l.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  const longContent = document.createElement('div');
  longContent.classList.add('body1-txt');
  longContent.innerHTML = \`
    <p>This is a longer modal body text that demonstrates how the scrollable modal type handles content that exceeds the available space.</p>
    <p>When content is longer than the modal body height, a scrollbar appears on the right side to allow users to scroll through all the content.</p>
    <p>The scrollbar includes up and down arrow icons to help users navigate through the content.</p>
    <p>This is useful for displaying terms and conditions, detailed information, or any content that requires more space than a standard modal.</p>
  \`;
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: longContent,
    type: 'scrollable',
    showBottomButtons: true,
    primaryButton: {
      text: 'Accept',
      style: 'primary',
      fill: 'filled',
      size: 'default',
      onClick: () => console.log('Accepted')
    },
    secondaryButton: {
      text: 'Cancel',
      style: 'secondary',
      fill: 'tonal',
      size: 'default',
      onClick: () => console.log('Cancelled')
    }
  });
  container.appendChild(modal);
  return container;
}`,...r.parameters?.docs?.source},description:{story:`With Long Content
Modal with scrollable body containing long content`,...r.parameters?.docs?.description}}};const b=["DefaultWithButtons","DefaultWithoutButtons","ScrollableWithButtons","ScrollableWithoutButtons","WithLongContent"];export{n as DefaultWithButtons,o as DefaultWithoutButtons,a as ScrollableWithButtons,l as ScrollableWithoutButtons,r as WithLongContent,b as __namedExportsOrder,g as default};
