import{j as a}from"./jsx-runtime-u17CrQMm.js";import{r as n}from"./iframe-CwPMOv9C.js";import{P as e}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const r=({label:p,name:u,value:b,id:o,className:h="",checked:m=!1,indeterminate:l=!1,disabled:d=!1,required:i=!1,onChange:f})=>{const t=n.useRef(null);n.useEffect(()=>{t.current&&(t.current.indeterminate=l)},[l]);const k=["form-check","body2-txt","plus-checkbox-wrapper",l?"plus-checkbox-indeterminate":"",d?"plus-checkbox-disabled":"",i?"plus-checkbox-required-wrapper":"",h].filter(Boolean).join(" ");return a.jsxs("div",{className:k,children:[a.jsx("input",{ref:t,type:"checkbox",className:"form-check-input plus-checkbox",name:u,id:o,value:b,checked:m,disabled:d,required:i,onChange:f}),a.jsxs("label",{className:"form-check-label plus-checkbox-label",htmlFor:o,children:[p,i&&a.jsx("span",{className:"plus-checkbox-required","aria-label":"required",children:"*"})]})]})};r.propTypes={label:e.string.isRequired,name:e.string,value:e.string,id:e.string,className:e.string,checked:e.bool,indeterminate:e.bool,disabled:e.bool,required:e.bool,onChange:e.func};r.__docgenInfo={description:"",methods:[],displayName:"Checkbox",props:{className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},checked:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},indeterminate:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},disabled:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},required:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},label:{description:"",type:{name:"string"},required:!0},name:{description:"",type:{name:"string"},required:!1},value:{description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},onChange:{description:"",type:{name:"func"},required:!1}}};const q={title:"Components/Checkbox",component:r,tags:["autodocs"],argTypes:{label:{control:"text",description:"Checkbox label"},checked:{control:"boolean",description:"Checked state"},indeterminate:{control:"boolean",description:"Indeterminate state"},disabled:{control:"boolean",description:"Disabled state"},required:{control:"boolean",description:"Required state"}}},s=()=>a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[a.jsx(r,{label:"Default Checkbox",id:"check1"}),a.jsx(r,{label:"Checked Checkbox",id:"check2",checked:!0}),a.jsx(r,{label:"Indeterminate Checkbox",id:"check3",indeterminate:!0}),a.jsx(r,{label:"Disabled Checkbox",id:"check4",disabled:!0}),a.jsx(r,{label:"Required Checkbox",id:"check5",required:!0})]}),c={args:{label:"Interactive Checkbox",id:"interactive-check",checked:!1,indeterminate:!1,disabled:!1,required:!1}};s.__docgenInfo={description:"",methods:[],displayName:"Overview"};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}}>
        <Checkbox label="Default Checkbox" id="check1" />
        <Checkbox label="Checked Checkbox" id="check2" checked />
        <Checkbox label="Indeterminate Checkbox" id="check3" indeterminate />
        <Checkbox label="Disabled Checkbox" id="check4" disabled />
        <Checkbox label="Required Checkbox" id="check5" required />
    </div>`,...s.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Interactive Checkbox',
    id: 'interactive-check',
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false
  }
}`,...c.parameters?.docs?.source}}};const y=["Overview","Interactive"];export{c as Interactive,s as Overview,y as __namedExportsOrder,q as default};
