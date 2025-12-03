import{a as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const S={title:"Components/StatusIndicator/Status Types",tags:["autodocs"]},t={render:()=>o.createStatusIcon("assigned")},e={render:()=>o.createStatusIcon("started")},r={render:()=>o.createStatusIcon("not started")},s={render:()=>o.createStatusIcon("complete")};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusSmartComponents.createStatusIcon('assigned');
  }
}`,...t.parameters?.docs?.source},description:{story:"Assigned Status",...t.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusSmartComponents.createStatusIcon('started');
  }
}`,...e.parameters?.docs?.source},description:{story:"Started Status",...e.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusSmartComponents.createStatusIcon('not started');
  }
}`,...r.parameters?.docs?.source},description:{story:"Not Started Status",...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusSmartComponents.createStatusIcon('complete');
  }
}`,...s.parameters?.docs?.source},description:{story:"Complete Status",...s.parameters?.docs?.description}}};const l=["Assigned","Started","NotStarted","Complete"];export{t as Assigned,s as Complete,r as NotStarted,e as Started,l as __namedExportsOrder,S as default};
