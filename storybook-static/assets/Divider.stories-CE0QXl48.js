import{j as i}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{D as e}from"./Divider-DJsWaONf.js";import"./preload-helper-PPVm8Dsz.js";import"./index-D5YdkFue.js";const n={title:"Components/Divider",component:e,tags:["autodocs"],argTypes:{size:{control:"select",options:["sm","md","lg","xl","1px","1.5px","2px","2.5px"],description:"Divider thickness"},style:{control:"select",options:["light","dark"],description:"Divider style"},opacity10:{control:"boolean",description:"10% opacity"},width:{control:"text",description:"Divider width"}}},r=()=>i.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px",width:"100%"},children:[i.jsxs("div",{children:[i.jsx("h3",{children:"Default Divider"}),i.jsx(e,{})]}),i.jsxs("div",{children:[i.jsx("h3",{children:"Thick Divider"}),i.jsx(e,{size:"xl"})]}),i.jsxs("div",{children:[i.jsx("h3",{children:"Dark Divider"}),i.jsx(e,{style:"dark"})]}),i.jsxs("div",{children:[i.jsx("h3",{children:"Opacity 10%"}),i.jsx(e,{opacity10:!0})]})]}),s={args:{size:"md",style:"light",opacity10:!1,width:"100%"}};r.__docgenInfo={description:"",methods:[],displayName:"Overview"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  width: '100%'
}}>
        <div>
            <h3>Default Divider</h3>
            <Divider />
        </div>
        <div>
            <h3>Thick Divider</h3>
            <Divider size="xl" />
        </div>
        <div>
            <h3>Dark Divider</h3>
            <Divider style="dark" />
        </div>
        <div>
            <h3>Opacity 10%</h3>
            <Divider opacity10 />
        </div>
    </div>`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    style: 'light',
    opacity10: false,
    width: '100%'
  }
}`,...s.parameters?.docs?.source}}};const l=["Overview","Interactive"];export{s as Interactive,r as Overview,l as __namedExportsOrder,n as default};
