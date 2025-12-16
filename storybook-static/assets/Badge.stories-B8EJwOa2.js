import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{B as s,C as o}from"./Badge-CN_AojVr.js";import"./preload-helper-PPVm8Dsz.js";import"./index-D5YdkFue.js";const p={title:"Components/Badge",component:s,tags:["autodocs"],argTypes:{text:{control:"text",description:"Badge text"},style:{control:"select",options:["primary","secondary","tertiary","success","warning","error","info","default"],description:"Badge style"},size:{control:"select",options:["b1","b2","b3"],description:"Badge size"}}},r=()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("div",{children:[e.jsx("h3",{children:"Badges"}),e.jsxs("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:[e.jsx(s,{text:"Primary",style:"primary"}),e.jsx(s,{text:"Secondary",style:"secondary"}),e.jsx(s,{text:"Success",style:"success"}),e.jsx(s,{text:"Warning",style:"warning"}),e.jsx(s,{text:"Error",style:"error"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{children:"Chips"}),e.jsxs("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:[e.jsx(o,{text:"Chip 1",onRemove:()=>console.log("Remove 1")}),e.jsx(o,{text:"Chip 2",style:"secondary",onRemove:()=>console.log("Remove 2")})]})]})]}),t={args:{text:"Badge",style:"primary",size:"b2"}};r.__docgenInfo={description:"",methods:[],displayName:"Overview"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
}}>
        <div>
            <h3>Badges</h3>
            <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }}>
                <Badge text="Primary" style="primary" />
                <Badge text="Secondary" style="secondary" />
                <Badge text="Success" style="success" />
                <Badge text="Warning" style="warning" />
                <Badge text="Error" style="error" />
            </div>
        </div>

        <div>
            <h3>Chips</h3>
            <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }}>
                <Chip text="Chip 1" onRemove={() => console.log('Remove 1')} />
                <Chip text="Chip 2" style="secondary" onRemove={() => console.log('Remove 2')} />
            </div>
        </div>
    </div>`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'Badge',
    style: 'primary',
    size: 'b2'
  }
}`,...t.parameters?.docs?.source}}};const c=["Overview","Interactive"];export{t as Interactive,r as Overview,c as __namedExportsOrder,p as default};
