import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as r}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const s=({size:t="default",label:l="Loading...",id:n,className:o=""})=>{const p=["spinner-border","plus-spinner",`plus-spinner-${t}`,o].filter(Boolean).join(" ");return e.jsx("div",{id:n,className:p,role:"status","aria-label":l,children:e.jsx("span",{className:"sr-only",children:l})})};s.propTypes={size:r.oneOf(["small","default","large"]),label:r.string,id:r.string,className:r.string};s.__docgenInfo={description:"",methods:[],displayName:"Spinner",props:{size:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'default'",computed:!1},{value:"'large'",computed:!1}]},required:!1},label:{defaultValue:{value:"'Loading...'",computed:!1},description:"",type:{name:"string"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1}}};const f={title:"Components/Spinner",component:s,tags:["autodocs"],argTypes:{size:{control:"select",options:["small","default","large"],description:"Spinner size"},label:{control:"text",description:"Accessibility label"}}},a=()=>e.jsxs("div",{style:{display:"flex",gap:"16px",alignItems:"center"},children:[e.jsx(s,{size:"small"}),e.jsx(s,{size:"default"}),e.jsx(s,{size:"large"})]}),i={args:{size:"default",label:"Loading..."}};a.__docgenInfo={description:"",methods:[],displayName:"Overview"};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  gap: '16px',
  alignItems: 'center'
}}>
        <Spinner size="small" />
        <Spinner size="default" />
        <Spinner size="large" />
    </div>`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'default',
    label: 'Loading...'
  }
}`,...i.parameters?.docs?.source}}};const g=["Overview","Interactive"];export{i as Interactive,a as Overview,g as __namedExportsOrder,f as default};
