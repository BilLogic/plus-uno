import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const v={title:"Components/Alert/Visual Style Variants",tags:["autodocs"]},n={render:t=>{const e=document.createElement("div"),r=i.createAlert({...t,style:"primary"});return e.appendChild(r),e},args:{style:"primary",title:"Title",text:"You have a message here — come check it out!",dismissable:!0}},s={render:t=>{const e=document.createElement("div"),r=i.createAlert({...t,style:"secondary"});return e.appendChild(r),e},args:{style:"secondary",title:"Title",text:"You have a message here — come check it out!",dismissable:!0}},a={render:t=>{const e=document.createElement("div"),r=i.createAlert({...t,style:"success"});return e.appendChild(r),e},args:{style:"success",title:"Title",text:"You have a message here — come check it out!",dismissable:!0}},c={render:t=>{const e=document.createElement("div"),r=i.createAlert({...t,style:"danger"});return e.appendChild(r),e},args:{style:"danger",title:"Title",text:"You have a message here — come check it out!",dismissable:!0}},o={render:t=>{const e=document.createElement("div"),r=i.createAlert({...t,style:"warning"});return e.appendChild(r),e},args:{style:"warning",title:"Title",text:"You have a message here — come check it out!",dismissable:!0}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'primary'
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'primary',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true
  }
}`,...n.parameters?.docs?.source},description:{story:"Primary Alert",...n.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'secondary'
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'secondary',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true
  }
}`,...s.parameters?.docs?.source},description:{story:"Secondary Alert",...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'success'
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'success',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true
  }
}`,...a.parameters?.docs?.source},description:{story:"Success Alert",...a.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'danger'
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'danger',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true
  }
}`,...c.parameters?.docs?.source},description:{story:"Danger Alert",...c.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'warning'
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'warning',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true
  }
}`,...o.parameters?.docs?.source},description:{story:"Warning Alert",...o.parameters?.docs?.description}}};const A=["Primary","Secondary","Success","Danger","Warning"];export{c as Danger,n as Primary,s as Secondary,a as Success,o as Warning,A as __namedExportsOrder,v as default};
