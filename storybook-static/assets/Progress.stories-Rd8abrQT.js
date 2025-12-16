import{j as s}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as e}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const a=({value:o=0,min:t=0,max:i=100,style:d="primary",size:p="medium",striped:n=!1,animated:m=!1,label:c,showLabel:f=!1,id:g,className:v=""})=>{const u=Math.min(Math.max((o-t)/(i-t)*100,0),100),y=["progress","plus-progress",`plus-progress-${p}`,v].filter(Boolean).join(" "),b=["progress-bar","plus-progress-bar",`plus-progress-bar-${d}`,n?"progress-bar-striped":"",m&&n?"progress-bar-animated":""].filter(Boolean).join(" ");return s.jsx("div",{id:g,className:y,children:s.jsx("div",{className:b,role:"progressbar","aria-valuenow":o,"aria-valuemin":t,"aria-valuemax":i,style:{width:`${u}%`},children:c||(f?`${Math.round(u)}%`:null)})})};a.propTypes={value:e.number,min:e.number,max:e.number,style:e.string,size:e.oneOf(["small","medium","large"]),striped:e.bool,animated:e.bool,label:e.string,showLabel:e.bool,id:e.string,className:e.string};a.__docgenInfo={description:"",methods:[],displayName:"Progress",props:{value:{defaultValue:{value:"0",computed:!1},description:"",type:{name:"number"},required:!1},min:{defaultValue:{value:"0",computed:!1},description:"",type:{name:"number"},required:!1},max:{defaultValue:{value:"100",computed:!1},description:"",type:{name:"number"},required:!1},style:{defaultValue:{value:"'primary'",computed:!1},description:"",type:{name:"string"},required:!1},size:{defaultValue:{value:"'medium'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'medium'",computed:!1},{value:"'large'",computed:!1}]},required:!1},striped:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},animated:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},showLabel:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},label:{description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1}}};const j={title:"Components/Progress",component:a,tags:["autodocs"],argTypes:{value:{control:{type:"range",min:0,max:100},description:"Progress value"},style:{control:"select",options:["primary","secondary","success","info","warning","danger","light","dark"],description:"Progress bar style"},size:{control:"select",options:["small","medium","large"],description:"Progress bar size"},striped:{control:"boolean",description:"Striped effect"},animated:{control:"boolean",description:"Animated stripes"},showLabel:{control:"boolean",description:"Show percentage label"}}},r=()=>s.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[s.jsx(a,{value:25}),s.jsx(a,{value:50,style:"success"}),s.jsx(a,{value:75,style:"info",striped:!0}),s.jsx(a,{value:100,style:"warning",striped:!0,animated:!0}),s.jsx(a,{value:60,size:"small"}),s.jsx(a,{value:60,size:"large"})]}),l={args:{value:50,style:"primary",size:"medium",striped:!1,animated:!1,showLabel:!0}};r.__docgenInfo={description:"",methods:[],displayName:"Overview"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}}>
        <Progress value={25} />
        <Progress value={50} style="success" />
        <Progress value={75} style="info" striped />
        <Progress value={100} style="warning" striped animated />
        <Progress value={60} size="small" />
        <Progress value={60} size="large" />
    </div>`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    value: 50,
    style: 'primary',
    size: 'medium',
    striped: false,
    animated: false,
    showLabel: true
  }
}`,...l.parameters?.docs?.source}}};const q=["Overview","Interactive"];export{l as Interactive,r as Overview,q as __namedExportsOrder,j as default};
