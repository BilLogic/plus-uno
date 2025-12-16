import{j as s}from"./jsx-runtime-u17CrQMm.js";import{r as f}from"./iframe-CwPMOv9C.js";import{P as t}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const o=({text:e,style:n="default",size:c="b1",id:a,onRemove:p,className:d=""})=>{const u=["plus-chip",n,c,d].filter(Boolean).join(" ");return s.jsxs("span",{id:a,className:u,children:[s.jsx("span",{className:"plus-badge-text",children:e}),s.jsx("button",{type:"button",className:"plus-chip-remove","aria-label":"Remove",onClick:m=>{m.stopPropagation(),p&&p()},children:s.jsx("i",{className:"fas fa-xmark","aria-hidden":"true"})})]})};o.propTypes={text:t.string.isRequired,style:t.oneOf(["default","primary","secondary","info","warning","error","success"]),size:t.oneOf(["h1","h2","h3","h4","h5","h6","b1","b2","b3"]),id:t.string,onRemove:t.func,className:t.string};o.__docgenInfo={description:`Chip component for PLUS design system.
Similar to badges but always removable.`,methods:[],displayName:"Chip",props:{style:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'default'",computed:!1},{value:"'primary'",computed:!1},{value:"'secondary'",computed:!1},{value:"'info'",computed:!1},{value:"'warning'",computed:!1},{value:"'error'",computed:!1},{value:"'success'",computed:!1}]},required:!1},size:{defaultValue:{value:"'b1'",computed:!1},description:"",type:{name:"enum",value:[{value:"'h1'",computed:!1},{value:"'h2'",computed:!1},{value:"'h3'",computed:!1},{value:"'h4'",computed:!1},{value:"'h5'",computed:!1},{value:"'h6'",computed:!1},{value:"'b1'",computed:!1},{value:"'b2'",computed:!1},{value:"'b3'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},text:{description:"",type:{name:"string"},required:!0},id:{description:"",type:{name:"string"},required:!1},onRemove:{description:"",type:{name:"func"},required:!1}}};const g={title:"Components/Chip",component:o,tags:["autodocs"],argTypes:{text:{control:"text"},style:{control:"select",options:["default","primary","secondary","info","warning","error","success"]},size:{control:"select",options:["h1","h2","h3","h4","h5","h6","b1","b2","b3"]}}},r=e=>s.jsx(o,{...e});r.args={text:"Chip",style:"default",size:"b1",onRemove:()=>alert("Remove clicked")};const l=()=>s.jsx("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:["default","primary","secondary","info","warning","error","success"].map(e=>s.jsx(o,{text:e,style:e},e))}),i=()=>{const[e,n]=f.useState([{id:1,text:"React"},{id:2,text:"Vue"},{id:3,text:"Angular"}]),c=a=>{n(e.filter(p=>p.id!==a))};return s.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.map(a=>s.jsx(o,{text:a.text,style:"primary",onRemove:()=>c(a.id)},a.id)),e.length===0&&s.jsx("span",{children:"All chips removed! Refresh to reset."})]})};r.__docgenInfo={description:"",methods:[],displayName:"Default"};l.__docgenInfo={description:"",methods:[],displayName:"AllStyles"};i.__docgenInfo={description:"",methods:[],displayName:"InteractiveExample"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"args => <Chip {...args} />",...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
}}>
        {['default', 'primary', 'secondary', 'info', 'warning', 'error', 'success'].map(style => <Chip key={style} text={style} style={style} />)}
    </div>`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`() => {
  const [chips, setChips] = useState([{
    id: 1,
    text: 'React'
  }, {
    id: 2,
    text: 'Vue'
  }, {
    id: 3,
    text: 'Angular'
  }]);
  const handleRemove = id => {
    setChips(chips.filter(c => c.id !== id));
  };
  return <div style={{
    display: 'flex',
    gap: '8px'
  }}>
            {chips.map(chip => <Chip key={chip.id} text={chip.text} style="primary" onRemove={() => handleRemove(chip.id)} />)}
            {chips.length === 0 && <span>All chips removed! Refresh to reset.</span>}
        </div>;
}`,...i.parameters?.docs?.source}}};const b=["Default","AllStyles","InteractiveExample"];export{l as AllStyles,r as Default,i as InteractiveExample,b as __namedExportsOrder,g as default};
