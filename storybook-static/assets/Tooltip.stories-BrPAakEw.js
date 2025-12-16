import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as t}from"./index-D5YdkFue.js";import{O as f,a as T}from"./OverlayTrigger-COoJNlw8.js";import{B as i}from"./Button-Cp7X3nYf.js";import"./preload-helper-PPVm8Dsz.js";import"./useIsomorphicEffect-CguU98Db.js";import"./useEventCallback-gy-vMt_7.js";import"./useEventCallback-Be-6LYtV.js";import"./warning-BF1MgRa0.js";import"./useTimeout-tib8qvp7.js";import"./index-C62oQ3_1.js";import"./index-B01aFtWa.js";import"./Fade-U9Hv2pZM.js";import"./ThemeProvider-Bg-6AoBP.js";import"./constants-Duibr4cP.js";const o=({text:l,placement:a="top",trigger:n=["hover","focus"],size:s="default",children:d,id:m,className:c=""})=>{const u=x=>e.jsx(T,{id:m||`tooltip-${a}`,...x,className:`plus-tooltip-${s} ${c}`,"data-tooltip-size":s,children:l});return e.jsx(f,{placement:a,delay:{show:250,hide:400},overlay:u,trigger:n,children:d})};o.propTypes={text:t.node.isRequired,placement:t.oneOf(["top","bottom","left","right"]),trigger:t.oneOfType([t.string,t.arrayOf(t.string)]),size:t.oneOf(["small","default","large"]),children:t.node.isRequired,id:t.string,className:t.string};o.__docgenInfo={description:"",methods:[],displayName:"Tooltip",props:{placement:{defaultValue:{value:"'top'",computed:!1},description:"",type:{name:"enum",value:[{value:"'top'",computed:!1},{value:"'bottom'",computed:!1},{value:"'left'",computed:!1},{value:"'right'",computed:!1}]},required:!1},trigger:{defaultValue:{value:"['hover', 'focus']",computed:!1},description:"",type:{name:"union",value:[{name:"string"},{name:"arrayOf",value:{name:"string"}}]},required:!1},size:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'default'",computed:!1},{value:"'large'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},text:{description:"",type:{name:"node"},required:!0},children:{description:"",type:{name:"node"},required:!0},id:{description:"",type:{name:"string"},required:!1}}};const S={title:"Components/Tooltip",component:o,tags:["autodocs"],argTypes:{text:{control:"text",description:"Tooltip text"},placement:{control:"select",options:["top","bottom","left","right"],description:"Tooltip placement"},size:{control:"select",options:["small","default","large"],description:"Tooltip size"}}},r=()=>e.jsxs("div",{style:{display:"flex",gap:"16px",padding:"50px"},children:[e.jsx(o,{text:"Tooltip on top",placement:"top",children:e.jsx(i,{btnText:"Top"})}),e.jsx(o,{text:"Tooltip on bottom",placement:"bottom",children:e.jsx(i,{btnText:"Bottom"})}),e.jsx(o,{text:"Tooltip on left",placement:"left",children:e.jsx(i,{btnText:"Left"})}),e.jsx(o,{text:"Tooltip on right",placement:"right",children:e.jsx(i,{btnText:"Right"})})]}),p={args:{text:"Tooltip text",placement:"top",size:"default"},render:l=>e.jsx("div",{style:{padding:"50px"},children:e.jsx(o,{...l,children:e.jsx(i,{btnText:"Hover me"})})})};r.__docgenInfo={description:"",methods:[],displayName:"Overview"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  gap: '16px',
  padding: '50px'
}}>
        <Tooltip text="Tooltip on top" placement="top">
            <Button btnText="Top" />
        </Tooltip>
        <Tooltip text="Tooltip on bottom" placement="bottom">
            <Button btnText="Bottom" />
        </Tooltip>
        <Tooltip text="Tooltip on left" placement="left">
            <Button btnText="Left" />
        </Tooltip>
        <Tooltip text="Tooltip on right" placement="right">
            <Button btnText="Right" />
        </Tooltip>
    </div>`,...r.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'Tooltip text',
    placement: 'top',
    size: 'default'
  },
  render: args => <div style={{
    padding: '50px'
  }}>
            <Tooltip {...args}>
                <Button btnText="Hover me" />
            </Tooltip>
        </div>
}`,...p.parameters?.docs?.source}}};const $=["Overview","Interactive"];export{p as Interactive,r as Overview,$ as __namedExportsOrder,S as default};
