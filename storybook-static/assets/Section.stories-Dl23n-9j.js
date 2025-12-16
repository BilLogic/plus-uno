import{j as a}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as e}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const o=({children:d,title:c,id:l,padding:i="md",background:r="transparent",className:p="",style:u})=>{const m=["plus-section",i?`plus-section-pad-${i}`:"",r&&r!=="transparent"?`plus-section-bg-${r}`:"",p].filter(Boolean).join(" ");return a.jsxs("section",{id:l,className:m,style:u,children:[c&&a.jsx("h2",{className:"plus-section-title h3",children:c}),a.jsx("div",{className:"plus-section-content",children:d})]})};o.propTypes={children:e.node,title:e.string,id:e.string,padding:e.oneOf(["none","sm","md","lg","xl"]),background:e.oneOf(["transparent","surface","surface-alt"]),className:e.string,style:e.object};o.__docgenInfo={description:`Section component for PLUS design system.
A simple container component for page sections with standard padding and spacing.`,methods:[],displayName:"Section",props:{padding:{defaultValue:{value:"'md'",computed:!1},description:"",type:{name:"enum",value:[{value:"'none'",computed:!1},{value:"'sm'",computed:!1},{value:"'md'",computed:!1},{value:"'lg'",computed:!1},{value:"'xl'",computed:!1}]},required:!1},background:{defaultValue:{value:"'transparent'",computed:!1},description:"",type:{name:"enum",value:[{value:"'transparent'",computed:!1},{value:"'surface'",computed:!1},{value:"'surface-alt'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},children:{description:"",type:{name:"node"},required:!1},title:{description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},style:{description:"",type:{name:"object"},required:!1}}};const y={title:"Components/Structure/Section",component:o,tags:["autodocs"],argTypes:{padding:{control:{type:"select"},options:["none","sm","md","lg","xl"]},background:{control:{type:"select"},options:["transparent","surface","surface-alt"]}}},s={args:{title:"Section Title",children:a.jsx("p",{children:"This is a standard section with default padding and transparent background."})}},n={args:{title:"Background Section",background:"surface-alt",children:a.jsx("p",{children:"This section has a surface-alt background color."})}},t={args:{title:"Large Padding",padding:"xl",background:"surface",children:a.jsx("p",{children:"This section has extra large padding."})}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Section Title',
    children: <p>This is a standard section with default padding and transparent background.</p>
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Background Section',
    background: 'surface-alt',
    children: <p>This section has a surface-alt background color.</p>
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Large Padding',
    padding: 'xl',
    background: 'surface',
    children: <p>This section has extra large padding.</p>
  }
}`,...t.parameters?.docs?.source}}};const v=["Default","WithBackground","LargePadding"];export{s as Default,t as LargePadding,n as WithBackground,v as __namedExportsOrder,y as default};
