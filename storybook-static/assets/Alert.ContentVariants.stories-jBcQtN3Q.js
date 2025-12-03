import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const f={title:"Components/Alert/Content Variants",tags:["autodocs"]},n={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const t=i.createAlert({style:"info",title:"Information",text:"This alert has a title and body text.",dismissable:!0});return e.appendChild(t),e}},r={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const t=i.createAlert({style:"info",text:"This alert does not have a title.",dismissable:!0});return e.appendChild(t),e}},s={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const t=i.createAlert({style:"warning",title:"Dismissable Alert",text:"You can dismiss this alert by clicking the X button.",dismissable:!0});return e.appendChild(t),e}},a={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const t=i.createAlert({style:"danger",title:"Non-Dismissable Alert",text:"This alert cannot be dismissed.",dismissable:!1});return e.appendChild(t),e}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    const alert = PlusInterface.createAlert({
      style: 'info',
      title: 'Information',
      text: 'This alert has a title and body text.',
      dismissable: true
    });
    container.appendChild(alert);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:"Alert with Title",...n.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    const alert = PlusInterface.createAlert({
      style: 'info',
      text: 'This alert does not have a title.',
      dismissable: true
    });
    container.appendChild(alert);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Alert without Title",...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    const alert = PlusInterface.createAlert({
      style: 'warning',
      title: 'Dismissable Alert',
      text: 'You can dismiss this alert by clicking the X button.',
      dismissable: true
    });
    container.appendChild(alert);
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:"Dismissable Alert",...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    const alert = PlusInterface.createAlert({
      style: 'danger',
      title: 'Non-Dismissable Alert',
      text: 'This alert cannot be dismissed.',
      dismissable: false
    });
    container.appendChild(alert);
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:"Non-Dismissable Alert",...a.parameters?.docs?.description}}};const h=["WithTitle","WithoutTitle","Dismissable","NonDismissable"];export{s as Dismissable,a as NonDismissable,n as WithTitle,r as WithoutTitle,h as __namedExportsOrder,f as default};
