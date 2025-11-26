import{a as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const S={title:"Components/StatusTag/Status Types",tags:["autodocs"]},n={render:()=>{const t=document.createElement("div"),e=o.createContentStatusTag("assigned");return t.appendChild(e),t}},r={render:()=>{const t=document.createElement("div"),e=o.createContentStatusTag("started");return t.appendChild(e),t}},a={render:()=>{const t=document.createElement("div"),e=o.createContentStatusTag("not started");return t.appendChild(e),t}},s={render:()=>{const t=document.createElement("div"),e=o.createContentStatusTag("complete");return t.appendChild(e),t}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('assigned');
    container.appendChild(statusTag);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:"Assigned Status",...n.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('started');
    container.appendChild(statusTag);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:"Started Status",...r.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('not started');
    container.appendChild(statusTag);
    return container;
  }
}`,...a.parameters?.docs?.source},description:{story:"Not Started Status",...a.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('complete');
    container.appendChild(statusTag);
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:"Complete Status",...s.parameters?.docs?.description}}};const C=["Assigned","Started","NotStarted","Complete"];export{n as Assigned,s as Complete,a as NotStarted,r as Started,C as __namedExportsOrder,S as default};
