import{j as t}from"./jsx-runtime-u17CrQMm.js";import{r as k}from"./iframe-CwPMOv9C.js";import{P as e}from"./index-D5YdkFue.js";import{F as w}from"./Form-CGGCUlyg.js";import"./preload-helper-PPVm8Dsz.js";import"./ThemeProvider-Bg-6AoBP.js";import"./ElementChildren-DvS5LfxA.js";import"./warning-BF1MgRa0.js";const s=({id:d,label:r,name:c,checked:o,defaultChecked:p,value:u="on",disabled:l=!1,onChange:h,className:m="",style:f,...b})=>{const n=o!==void 0;return t.jsx("div",{className:`plus-switch-wrapper body2-txt ${l?"plus-switch-disabled":""} ${m}`,style:f,children:t.jsx(w.Check,{type:"switch",id:d||c,label:r,name:c,checked:n?o:void 0,defaultChecked:n?void 0:p,value:u,disabled:l,onChange:h,className:"plus-switch-input",custom:!0,...b})})};s.propTypes={id:e.string,label:e.node,name:e.string,checked:e.bool,defaultChecked:e.bool,value:e.oneOfType([e.string,e.number]),disabled:e.bool,onChange:e.func,className:e.string,style:e.object};s.__docgenInfo={description:"",methods:[],displayName:"Switch",props:{value:{defaultValue:{value:"'on'",computed:!1},description:"",type:{name:"union",value:[{name:"string"},{name:"number"}]},required:!1},disabled:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},label:{description:"",type:{name:"node"},required:!1},name:{description:"",type:{name:"string"},required:!1},checked:{description:"",type:{name:"bool"},required:!1},defaultChecked:{description:"",type:{name:"bool"},required:!1},onChange:{description:"",type:{name:"func"},required:!1},style:{description:"",type:{name:"object"},required:!1}}};const q={title:"Components/Switch",component:s,tags:["autodocs"],parameters:{docs:{description:{component:'Switch component for toggling between two states. Wrapper around Bootstrap Form.Check type="switch".'}}},argTypes:{checked:{control:"boolean",description:"Checked state (controlled)"},disabled:{control:"boolean",description:"Disabled state"}}},i=()=>t.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:t.jsxs("section",{children:[t.jsx("h5",{children:"States"}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[t.jsx(s,{label:"Checked",defaultChecked:!0,id:"switch-checked"}),t.jsx(s,{label:"Unchecked",defaultChecked:!1,id:"switch-unchecked"}),t.jsx(s,{label:"Disabled",disabled:!0,id:"switch-disabled"}),t.jsx(s,{label:"Disabled & Checked",disabled:!0,defaultChecked:!0,id:"switch-disabled-checked"})]})]})}),a=()=>{const[d,r]=k.useState(!1);return t.jsx(s,{label:d?"On":"Off",checked:d,onChange:c=>r(c.target.checked),id:"switch-interactive"})};i.__docgenInfo={description:"",methods:[],displayName:"Overview"};a.__docgenInfo={description:"",methods:[],displayName:"Interactive"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`() => {
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>
            <section>
                <h5>States</h5>
                <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
                    <Switch label="Checked" defaultChecked={true} id="switch-checked" />
                    <Switch label="Unchecked" defaultChecked={false} id="switch-unchecked" />
                    <Switch label="Disabled" disabled id="switch-disabled" />
                    <Switch label="Disabled & Checked" disabled defaultChecked id="switch-disabled-checked" />
                </div>
            </section>
        </div>;
}`,...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => {
  const [isOn, setIsOn] = useState(false);
  return <Switch label={isOn ? "On" : "Off"} checked={isOn} onChange={e => setIsOn(e.target.checked)} id="switch-interactive" />;
}`,...a.parameters?.docs?.source}}};const D=["Overview","Interactive"];export{a as Interactive,i as Overview,D as __namedExportsOrder,q as default};
