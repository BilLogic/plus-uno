import{j as a}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as e}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const i=({label:t,name:l,value:n,id:s,checked:c=!1,disabled:d=!1,className:p="",onChange:u})=>{const m=["form-check","plus-radio-wrapper","body2-txt",d?"plus-radio-disabled":"",p].filter(Boolean).join(" ");return a.jsxs("div",{className:m,children:[a.jsx("input",{type:"radio",className:"form-check-input plus-radio",name:l,id:s,value:n,checked:c,disabled:d,onChange:u}),a.jsx("label",{className:"form-check-label plus-radio-label",htmlFor:s,children:t})]})};i.propTypes={label:e.string.isRequired,name:e.string.isRequired,value:e.string,id:e.string,checked:e.bool,disabled:e.bool,className:e.string,onChange:e.func};i.__docgenInfo={description:"",methods:[],displayName:"Radio",props:{checked:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},disabled:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},label:{description:"",type:{name:"string"},required:!0},name:{description:"",type:{name:"string"},required:!0},value:{description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},onChange:{description:"",type:{name:"func"},required:!1}}};const h={title:"Components/Radio",component:i,tags:["autodocs"],argTypes:{label:{control:"text",description:"Radio label"},checked:{control:"boolean",description:"Checked state"},disabled:{control:"boolean",description:"Disabled state"}}},r=()=>a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[a.jsx(i,{label:"Default Radio",name:"radio-group",id:"radio1"}),a.jsx(i,{label:"Checked Radio",name:"radio-group",id:"radio2",checked:!0}),a.jsx(i,{label:"Disabled Radio",name:"radio-group",id:"radio3",disabled:!0})]}),o={args:{label:"Interactive Radio",name:"interactive-radio",id:"interactive-radio",checked:!1,disabled:!1}};r.__docgenInfo={description:"",methods:[],displayName:"Overview"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}}>
        <Radio label="Default Radio" name="radio-group" id="radio1" />
        <Radio label="Checked Radio" name="radio-group" id="radio2" checked />
        <Radio label="Disabled Radio" name="radio-group" id="radio3" disabled />
    </div>`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Interactive Radio',
    name: 'interactive-radio',
    id: 'interactive-radio',
    checked: false,
    disabled: false
  }
}`,...o.parameters?.docs?.source}}};const x=["Overview","Interactive"];export{o as Interactive,r as Overview,x as __namedExportsOrder,h as default};
