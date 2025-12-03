import{P as l}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const h={title:"Components/Modal",tags:["autodocs"],parameters:{docs:{description:{component:"Modal components are dialog windows that overlay the main content for lightboxes, user notifications, or completely custom content. Modals support two types (default and scrollable) and can optionally include action buttons in the footer."}}}},e=()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="24px",t.style.padding="24px",t.style.backgroundColor="var(--color-surface)";const o=l.createModal({title:"Modal title",body:"Modal body text goes here.",type:"default",showBottomButtons:!0,primaryButton:{text:"Primary",style:"primary",fill:"filled",size:"default",onClick:()=>console.log("Primary clicked")},secondaryButton:{text:"Secondary",style:"secondary",fill:"tonal",size:"default",onClick:()=>console.log("Secondary clicked")}}),a=l.createModal({title:"Modal title",body:"Modal body text goes here.",type:"default",showBottomButtons:!1}),r=l.createModal({title:"Modal title",body:"Modal body text goes here.",type:"scrollable",showBottomButtons:!0,primaryButton:{text:"Primary",style:"primary",fill:"filled",size:"default",onClick:()=>console.log("Primary clicked")},secondaryButton:{text:"Secondary",style:"secondary",fill:"tonal",size:"default",onClick:()=>console.log("Secondary clicked")}}),s=l.createModal({title:"Modal title",body:"Modal body text goes here.",type:"scrollable",showBottomButtons:!1});return t.appendChild(o),t.appendChild(a),t.appendChild(r),t.appendChild(s),t},n={render:t=>{const o=document.createElement("div");o.style.display="flex",o.style.justifyContent="center",o.style.padding="24px",o.style.backgroundColor="var(--color-surface)";const a=l.createModal({id:"interactive-modal",title:"Modal title",body:"Modal body text goes here.",type:t.type,showBottomButtons:t.showBottomButtons,primaryButton:t.showBottomButtons?{text:"Primary",style:"primary",fill:"filled",size:"default",onClick:()=>console.log("Primary clicked")}:null,secondaryButton:t.showBottomButtons?{text:"Secondary",style:"secondary",fill:"tonal",size:"default",onClick:()=>console.log("Secondary clicked")}:null,onClose:()=>console.log("Close clicked")});return o.appendChild(a),o},args:{type:"default",showBottomButtons:!0},argTypes:{type:{control:"select",options:["default","scrollable"],description:"The modal component has 2 types: default and scrollable"},showBottomButtons:{control:"boolean",description:"Toggle the bottom button switch to add/remove the buttons at the bottom of the modal"}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';

  // Default type with buttons
  const modal1 = PlusInterface.createModal({
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

  // Default type without buttons
  const modal2 = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'default',
    showBottomButtons: false
  });

  // Scrollable type with buttons
  const modal3 = PlusInterface.createModal({
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

  // Scrollable type without buttons
  const modal4 = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'scrollable',
    showBottomButtons: false
  });
  container.appendChild(modal1);
  container.appendChild(modal2);
  container.appendChild(modal3);
  container.appendChild(modal4);
  return container;
}`,...e.parameters?.docs?.source},description:{story:`All Variants
Shows all combinations of type × button variants`,...e.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    const modal = PlusInterface.createModal({
      id: 'interactive-modal',
      title: 'Modal title',
      body: 'Modal body text goes here.',
      type: args.type,
      showBottomButtons: args.showBottomButtons,
      primaryButton: args.showBottomButtons ? {
        text: 'Primary',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => console.log('Primary clicked')
      } : null,
      secondaryButton: args.showBottomButtons ? {
        text: 'Secondary',
        style: 'secondary',
        fill: 'tonal',
        size: 'default',
        onClick: () => console.log('Secondary clicked')
      } : null,
      onClose: () => console.log('Close clicked')
    });
    container.appendChild(modal);
    return container;
  },
  args: {
    type: 'default',
    showBottomButtons: true
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['default', 'scrollable'],
      description: 'The modal component has 2 types: default and scrollable'
    },
    showBottomButtons: {
      control: 'boolean',
      description: 'Toggle the bottom button switch to add/remove the buttons at the bottom of the modal'
    }
  }
}`,...n.parameters?.docs?.source},description:{story:`Interactive
Interactive playground with Storybook controls
Based on Figma Properties: Type and Bottom Button`,...n.parameters?.docs?.description}}};const B=["AllVariants","Interactive"];export{e as AllVariants,n as Interactive,B as __namedExportsOrder,h as default};
