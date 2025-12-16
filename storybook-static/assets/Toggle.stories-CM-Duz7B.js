import{j as l}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as e}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const s=({label:n,name:d,id:o,value:g="on",checked:i=!1,disabled:r=!1,className:p="",onChange:c})=>{const u=["custom-control","custom-switch","plus-switch-wrapper","body2-txt",r?"plus-switch-disabled":"",i?"plus-switch-checked":"",p].filter(Boolean).join(" "),m=f=>{c&&c(f.target.checked)};return l.jsxs("div",{className:u,children:[l.jsx("input",{type:"checkbox",className:"custom-control-input plus-switch-input",name:d,id:o,value:g,checked:i,disabled:r,onChange:m}),l.jsx("label",{className:"custom-control-label plus-switch-label",htmlFor:o,children:n})]})};s.propTypes={label:e.string.isRequired,name:e.string,id:e.string.isRequired,value:e.string,checked:e.bool,disabled:e.bool,className:e.string,onChange:e.func};s.__docgenInfo={description:"",methods:[],displayName:"Toggle",props:{value:{defaultValue:{value:"'on'",computed:!1},description:"",type:{name:"string"},required:!1},checked:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},disabled:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},label:{description:"",type:{name:"string"},required:!0},name:{description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!0},onChange:{description:"",type:{name:"func"},required:!1}}};const y={title:"Components/Toggle",component:s,tags:["autodocs"],argTypes:{label:{control:"text",description:"Toggle label"},checked:{control:"boolean",description:"Checked state"},disabled:{control:"boolean",description:"Disabled state"}}},t=()=>l.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[l.jsx(s,{label:"Default Toggle",id:"toggle1"}),l.jsx(s,{label:"Checked Toggle",id:"toggle2",checked:!0}),l.jsx(s,{label:"Disabled Toggle",id:"toggle3",disabled:!0})]}),a={args:{label:"Interactive Toggle",id:"interactive-toggle",checked:!1,disabled:!1}};t.__docgenInfo={description:"",methods:[],displayName:"Overview"};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}}>
        <Toggle label="Default Toggle" id="toggle1" />
        <Toggle label="Checked Toggle" id="toggle2" checked />
        <Toggle label="Disabled Toggle" id="toggle3" disabled />
    </div>`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Interactive Toggle',
    id: 'interactive-toggle',
    checked: false,
    disabled: false
  }
}`,...a.parameters?.docs?.source}}};const T=["Overview","Interactive"];export{a as Interactive,t as Overview,T as __namedExportsOrder,y as default};
