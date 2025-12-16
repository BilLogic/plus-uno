import{j as r}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as c}from"./index-D5YdkFue.js";import{S as e}from"./constants-Duibr4cP.js";import"./preload-helper-PPVm8Dsz.js";const a=({competencyArea:o,abbreviate:l=!1,className:A=""})=>{const i=p=>{switch(p){case e.CA_SE:return e.CA_SE_ABBR;case e.CA_MC:return e.CA_MC_ABBR;case e.CA_ADV:return e.CA_ADV_ABBR;case e.CA_RELN:return e.CA_RELN_ABBR;case e.CA_TT:return e.CA_TT_ABBR;default:return null}},C=p=>{const n=i(p);return n?"color-smartClr"+n.charAt(0).toUpperCase()+n.slice(1):""},m=i(o),S=["supercomp-pill","bg-"+C(o).replace("color-","")+(l?"-08-hex":"-alt"),A].filter(Boolean).join(" ");return r.jsx("div",{className:S,children:r.jsx("span",{className:"supercomp-pill-text",children:l?m?.toUpperCase():o})})};a.propTypes={competencyArea:c.string.isRequired,abbreviate:c.bool,className:c.string};a.__docgenInfo={description:"",methods:[],displayName:"SuperCompPill",props:{abbreviate:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},competencyArea:{description:"",type:{name:"string"},required:!0}}};const N={title:"Components/SuperCompPill",component:a,tags:["autodocs"],argTypes:{competencyArea:{control:"select",options:[e.CA_SE,e.CA_MC,e.CA_ADV,e.CA_RELN,e.CA_TT],description:"Competency Area"},abbreviate:{control:"boolean",description:"Abbreviate text"}}},t=()=>r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[r.jsxs("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:[r.jsx(a,{competencyArea:e.CA_SE}),r.jsx(a,{competencyArea:e.CA_MC}),r.jsx(a,{competencyArea:e.CA_ADV}),r.jsx(a,{competencyArea:e.CA_RELN}),r.jsx(a,{competencyArea:e.CA_TT})]}),r.jsxs("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:[r.jsx(a,{competencyArea:e.CA_SE,abbreviate:!0}),r.jsx(a,{competencyArea:e.CA_MC,abbreviate:!0}),r.jsx(a,{competencyArea:e.CA_ADV,abbreviate:!0}),r.jsx(a,{competencyArea:e.CA_RELN,abbreviate:!0}),r.jsx(a,{competencyArea:e.CA_TT,abbreviate:!0})]})]}),s={args:{competencyArea:e.CA_SE,abbreviate:!1}};t.__docgenInfo={description:"",methods:[],displayName:"Overview"};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}}>
        <div style={{
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  }}>
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_SE} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_MC} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_ADV} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_RELN} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_TT} />
        </div>
        <div style={{
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  }}>
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_SE} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_MC} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_ADV} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_RELN} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_TT} abbreviate />
        </div>
    </div>`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    competencyArea: SMART_CONSTANTS.CA_SE,
    abbreviate: false
  }
}`,...s.parameters?.docs?.source}}};const v=["Overview","Interactive"];export{s as Interactive,t as Overview,v as __namedExportsOrder,N as default};
