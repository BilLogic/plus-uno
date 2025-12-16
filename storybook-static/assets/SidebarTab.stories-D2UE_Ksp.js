import"./iframe-CwPMOv9C.js";import{j as o}from"./jsx-runtime-u17CrQMm.js";import{P as r}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const d=({text:u,icon:p,state:a="enabled",leadingVisual:m=!0,trailingVisual:f=!1,id:g,onClick:b,className:v="",style:y})=>{const x=["plus-sidebar-tab",`plus-sidebar-tab-${a}`,v].filter(Boolean).join(" "),h=()=>{const e={display:"flex",gap:"var(--size-element-gap-md)",alignItems:"center",padding:"var(--size-element-pad-y-md) var(--size-element-pad-x-md)",borderRadius:"var(--size-modal-radius-md)",width:"184px",boxSizing:"border-box",position:"relative",...y};return a==="hover"?(e.backgroundColor="var(--color-primary-state-12)",e.cursor="pointer",e.border="none"):a==="selected"?e.backgroundColor="var(--color-primary-state-16)":a==="focus"?(e.backgroundColor="var(--color-primary-state-12)",e.border="1.5px solid var(--color-inverse-primary)",e.borderStyle="solid"):a==="disabled"&&(e.opacity="0.38"),e},S=()=>{const e={fontSize:"var(--font-size-fa-body2-solid)",lineHeight:"var(--font-line-height-fa-body2-solid)",fontStyle:"normal",textAlign:"center",whiteSpace:"nowrap"};return a==="selected"||a==="hover"||a==="focus"?e.color="var(--color-primary)":(a==="disabled"&&(e.opacity="0.38"),e.color="var(--color-on-surface-variant)"),e},j=()=>{const e={fontWeight:"var(--font-weight-light)",fontSize:"var(--font-size-body2)",lineHeight:"var(--font-line-height-body2)",flex:"1 0 0",minHeight:"1px",minWidth:"1px",position:"relative",flexShrink:"0"};return a==="selected"||a==="hover"||a==="focus"?e.color="var(--color-primary-text)":a==="disabled"?(e.opacity="0.38",e.color="var(--color-on-surface-variant)"):e.color="var(--color-on-surface)",e};return o.jsxs("div",{id:g,className:x,style:h(),onClick:a!=="disabled"?b:void 0,role:"button",tabIndex:a==="disabled"?-1:0,children:[m&&p&&o.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",width:"11px",flexShrink:"0",position:"relative"},children:o.jsx("i",{className:`fas fa-${p}`,style:S(),"aria-hidden":"true"})}),o.jsx("div",{className:"body2-txt",style:j(),children:u}),f&&o.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0",position:"relative"},children:o.jsx("i",{className:"fas fa-icons",style:{fontSize:"var(--font-size-fa-body2-solid)",lineHeight:"var(--font-line-height-fa-body2-solid)",color:"var(--color-on-surface-variant)"},"aria-hidden":"true"})})]})};d.propTypes={text:r.string.isRequired,icon:r.string,state:r.oneOf(["enabled","hover","selected","disabled","focus"]),leadingVisual:r.bool,trailingVisual:r.bool,id:r.string,onClick:r.func,className:r.string,style:r.object};d.__docgenInfo={description:`SidebarTab component for PLUS design system.
Universal element component for sidebar navigation tabs.
Matches Figma design system specifications.`,methods:[],displayName:"SidebarTab",props:{state:{defaultValue:{value:"'enabled'",computed:!1},description:"",type:{name:"enum",value:[{value:"'enabled'",computed:!1},{value:"'hover'",computed:!1},{value:"'selected'",computed:!1},{value:"'disabled'",computed:!1},{value:"'focus'",computed:!1}]},required:!1},leadingVisual:{defaultValue:{value:"true",computed:!1},description:"",type:{name:"bool"},required:!1},trailingVisual:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},text:{description:"",type:{name:"string"},required:!0},icon:{description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},onClick:{description:"",type:{name:"func"},required:!1},style:{description:"",type:{name:"object"},required:!1}}};const q={title:"Components/Navigation/SidebarTab",component:d,tags:["autodocs"],argTypes:{state:{control:{type:"select"},options:["enabled","hover","selected","disabled","focus"]},icon:{control:"text"}}},t={args:{text:"Dashboard",icon:"home",state:"enabled"}},s={args:{text:"Dashboard",icon:"home",state:"selected"}},i={args:{text:"Reports",icon:"chart-bar",state:"hover"}},n={args:{text:"Settings",icon:"cog",state:"disabled"}},l={args:{text:"Log Out",leadingVisual:!1}},c={args:{text:"External Link",icon:"external-link-alt",trailingVisual:!0}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'Dashboard',
    icon: 'home',
    state: 'enabled'
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'Dashboard',
    icon: 'home',
    state: 'selected'
  }
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'Reports',
    icon: 'chart-bar',
    state: 'hover'
  }
}`,...i.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'Settings',
    icon: 'cog',
    state: 'disabled'
  }
}`,...n.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'Log Out',
    leadingVisual: false
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'External Link',
    icon: 'external-link-alt',
    trailingVisual: true
  }
}`,...c.parameters?.docs?.source}}};const I=["Default","Selected","Hover","Disabled","NoIcon","WithTrailingIcon"];export{t as Default,n as Disabled,i as Hover,l as NoIcon,s as Selected,c as WithTrailingIcon,I as __namedExportsOrder,q as default};
