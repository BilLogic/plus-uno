import"./iframe-CwPMOv9C.js";import{j as t}from"./jsx-runtime-u17CrQMm.js";import{P as s}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const g=({items:e=[],type:r="horizontal",alignment:a="left",id:l,className:n="",style:o})=>{const c=["plus-nav",`plus-nav-${r}`,`plus-nav-align-${a}`,n].filter(Boolean).join(" ");return t.jsxs("nav",{id:l,className:c,style:o,role:"navigation","aria-label":"Navigation",children:[t.jsx("div",{className:"plus-nav-list",children:e.map((b,h)=>t.jsx(y,{item:b,type:r,index:h},h))}),(r==="horizontal"||r==="tabs")&&t.jsx("div",{className:"plus-nav-divider"})]})},y=({item:e,type:r,index:a})=>{const l=["plus-nav-item",e.selected?"plus-nav-item-selected":"",e.disabled?"plus-nav-item-disabled":"",e.dropdownItems&&e.dropdownItems.length>0?"plus-nav-item-dropdown":""].filter(Boolean).join(" "),n=["plus-nav-link"].filter(Boolean).join(" "),o=e.href&&!e.disabled?"a":"button";return t.jsxs("div",{className:l,children:[t.jsx("div",{className:"plus-nav-item-content",children:t.jsxs(o,{type:o==="button"?"button":void 0,href:o==="a"?e.href:void 0,className:n,disabled:o==="button"&&e.disabled,onClick:c=>{e.onClick&&!e.disabled&&(e.href||c.preventDefault(),e.onClick(c,e,a))},children:[t.jsx("span",{className:"plus-nav-text body1-txt",children:e.text}),e.dropdownItems&&e.dropdownItems.length>0&&t.jsx("i",{className:"fas fa-caret-down plus-nav-dropdown-icon"})]})}),e.dropdownItems&&e.dropdownItems.length>0&&t.jsx(x,{items:e.dropdownItems,type:r})]})},x=({items:e,type:r})=>t.jsx("div",{className:"plus-nav-dropdown dropdown-menu",role:"menu",children:e.map((a,l)=>t.jsx("a",{className:"dropdown-item plus-nav-dropdown-item",href:a.href||"#",role:"menuitem",onClick:n=>{a.onClick&&((!a.href||a.href==="#")&&n.preventDefault(),a.onClick(n,a))},children:a.text},l))});g.propTypes={items:s.arrayOf(s.shape({text:s.string.isRequired,href:s.string,onClick:s.func,selected:s.bool,disabled:s.bool,dropdownItems:s.arrayOf(s.object)})).isRequired,type:s.oneOf(["horizontal","vertical","tabs","pills"]),alignment:s.oneOf(["left","center","right"]),id:s.string,className:s.string,style:s.object};g.__docgenInfo={description:`Navigation component for PLUS design system.
Universal navigation component supporting horizontal/vertical layouts, tabs/pills, and dropdowns.`,methods:[],displayName:"Navigation",props:{items:{defaultValue:{value:"[]",computed:!1},description:"",type:{name:"arrayOf",value:{name:"shape",value:{text:{name:"string",required:!0},href:{name:"string",required:!1},onClick:{name:"func",required:!1},selected:{name:"bool",required:!1},disabled:{name:"bool",required:!1},dropdownItems:{name:"arrayOf",value:{name:"object"},required:!1}}}},required:!1},type:{defaultValue:{value:"'horizontal'",computed:!1},description:"",type:{name:"enum",value:[{value:"'horizontal'",computed:!1},{value:"'vertical'",computed:!1},{value:"'tabs'",computed:!1},{value:"'pills'",computed:!1}]},required:!1},alignment:{defaultValue:{value:"'left'",computed:!1},description:"",type:{name:"enum",value:[{value:"'left'",computed:!1},{value:"'center'",computed:!1},{value:"'right'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},style:{description:"",type:{name:"object"},required:!1}}};const z={title:"Components/Navigation/Navigation",component:g,tags:["autodocs"],argTypes:{type:{control:{type:"select"},options:["horizontal","vertical","tabs","pills"]},alignment:{control:{type:"select"},options:["left","center","right"]}}},i=[{text:"Home",href:"#",selected:!0},{text:"Profile",href:"#"},{text:"Settings",href:"#"},{text:"Disabled",disabled:!0}],j=[{text:"Action",href:"#"},{text:"Another action",href:"#"},{text:"Something else here",href:"#"}],N=[{text:"Active",href:"#",selected:!0},{text:"Link",href:"#"},{text:"Dropdown",dropdownItems:j},{text:"Disabled",disabled:!0}],d={args:{type:"horizontal",items:i}},p={args:{type:"tabs",items:i}},u={args:{type:"pills",items:i}},m={args:{type:"vertical",items:i,style:{width:"200px"}}},f={args:{type:"tabs",items:N}},v={args:{type:"pills",alignment:"center",items:i}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'horizontal',
    items: items
  }
}`,...d.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'tabs',
    items: items
  }
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'pills',
    items: items
  }
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'vertical',
    items: items,
    style: {
      width: '200px'
    }
  }
}`,...m.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'tabs',
    items: complexItems
  }
}`,...f.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'pills',
    alignment: 'center',
    items: items
  }
}`,...v.parameters?.docs?.source}}};const S=["Horizontal","Tabs","Pills","Vertical","WithDropdowns","Centered"];export{v as Centered,d as Horizontal,u as Pills,p as Tabs,m as Vertical,f as WithDropdowns,S as __namedExportsOrder,z as default};
