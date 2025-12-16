import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as f}from"./iframe-CwPMOv9C.js";import{P as t}from"./index-D5YdkFue.js";import{C as p}from"./Card-DiqOTBM3.js";import{B as m}from"./Button-Cp7X3nYf.js";import"./Divider-DJsWaONf.js";import"./preload-helper-PPVm8Dsz.js";import"./constants-Duibr4cP.js";const l=({id:o,trigger:s,children:r,isOpen:n,defaultOpen:j=!1,onToggle:h,triggerTag:u="button",triggerClass:w="",contentClass:k="",icon:x,iconPosition:g="left",className:O="",...N})=>{const v=n!==void 0,[T,S]=f.useState(j),c=v?n:T,q=i=>{i&&i.preventDefault();const C=!c;v||S(C),h&&h(C)},b=o?`${o}-trigger`:void 0,y=o?`${o}-content`:void 0,B=["plus-collapse-trigger",c?"":"collapsed",w].filter(Boolean).join(" "),I=["collapse","plus-collapse-content",c?"show":"",k].filter(Boolean).join(" "),$=()=>{if(!x)return e.jsx("span",{className:"plus-collapse-trigger-content",children:s});const i=e.jsx("i",{className:`fas fa-${x} plus-collapse-icon`});return e.jsxs("span",{className:"plus-collapse-trigger-content",children:[g==="left"&&i,typeof s=="string"?g==="left"?` ${s}`:`${s} `:s,g==="right"&&i]})};return e.jsxs("div",{className:`plus-collapse-wrapper ${O}`,...N,children:[e.jsx(u,{id:b,className:B,onClick:q,"aria-expanded":c,"aria-controls":y,type:u==="button"?"button":void 0,href:u==="a"?"#":void 0,children:$()}),e.jsx("div",{id:y,className:I,"aria-labelledby":b,children:r})]})};l.propTypes={id:t.string,trigger:t.node.isRequired,children:t.node.isRequired,isOpen:t.bool,defaultOpen:t.bool,onToggle:t.func,triggerTag:t.elementType,triggerClass:t.string,contentClass:t.string,icon:t.string,iconPosition:t.oneOf(["left","right"]),className:t.string};l.__docgenInfo={description:"",methods:[],displayName:"Collapse",props:{defaultOpen:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},triggerTag:{defaultValue:{value:"'button'",computed:!1},description:"",type:{name:"elementType"},required:!1},triggerClass:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},contentClass:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},iconPosition:{defaultValue:{value:"'left'",computed:!1},description:"",type:{name:"enum",value:[{value:"'left'",computed:!1},{value:"'right'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},trigger:{description:"",type:{name:"node"},required:!0},children:{description:"",type:{name:"node"},required:!0},isOpen:{description:"",type:{name:"bool"},required:!1},onToggle:{description:"",type:{name:"func"},required:!1},icon:{description:"",type:{name:"string"},required:!1}}};const U={title:"Components/Collapse",component:l,tags:["autodocs"],parameters:{docs:{description:{component:"Collapse component for showing and hiding content. Supports controlled and uncontrolled modes, custom triggers, and icons."}}}},P=o=>e.jsx(l,{...o}),a=()=>{const[o,s]=f.useState(!1),[r,n]=f.useState(!1);return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"48px",maxWidth:"600px"},children:[e.jsxs("section",{children:[e.jsx("h5",{children:"Default (Uncontrolled)"}),e.jsx(l,{id:"default-example",trigger:"Toggle Content",triggerClass:"btn btn-primary",defaultOpen:!1,children:e.jsx(p,{body:"Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.",className:"mt-2",showBorder:!0})})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Controlled / Multiple Targets"}),e.jsxs("div",{style:{display:"flex",gap:"10px",marginBottom:"10px"},children:[e.jsx(m,{onClick:()=>s(!o),text:"Toggle First"}),e.jsx(m,{onClick:()=>n(!r),text:"Toggle Second"}),e.jsx(m,{onClick:()=>{s(!o),n(!r)},text:"Toggle Both"})]}),e.jsxs("div",{style:{display:"flex",gap:"16px"},children:[e.jsx("div",{style:{flex:1},children:e.jsx("div",{className:`collapse ${o?"show":""}`,children:e.jsx(p,{body:"First content block.",showBorder:!0})})}),e.jsx("div",{style:{flex:1},children:e.jsx("div",{className:`collapse ${r?"show":""}`,children:e.jsx(p,{body:"Second content block.",showBorder:!0})})})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Accordion Pattern"}),e.jsxs("div",{style:{border:"1px solid var(--color-outline-variant)",borderRadius:"4px"},children:[e.jsx(l,{trigger:"Accordion Item #1",triggerClass:"d-flex align-items-center w-100 p-3 bg-light border-0 text-primary text-left",className:"border-bottom",icon:"chevron-down",iconPosition:"right",children:e.jsx("div",{className:"p-3",children:"Some quick example text to build on the card title and make up the bulk of the card's content."})}),e.jsx(l,{trigger:"Accordion Item #2",triggerClass:"d-flex align-items-center w-100 p-3 bg-light border-0 text-primary text-left",icon:"chevron-down",iconPosition:"right",children:e.jsx("div",{className:"p-3",children:"Some quick example text to build on the card title and make up the bulk of the card's content."})})]})]})]})},d=P.bind({});d.args={trigger:"Toggle Collapse",children:e.jsx(p,{body:"Collapsible content goes here.",showBorder:!0}),triggerClass:"btn btn-primary",defaultOpen:!1,icon:"caret-down"};a.__docgenInfo={description:"",methods:[],displayName:"Overview"};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => {
  // Controlled state for "Multiple targets" example
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '48px',
    maxWidth: '600px'
  }}>
            {/* Default */}
            <section>
                <h5>Default (Uncontrolled)</h5>
                <Collapse id="default-example" trigger="Toggle Content" triggerClass="btn btn-primary" defaultOpen={false}>
                    <Card body="Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger." className="mt-2" showBorder />
                </Collapse>
            </section>

            {/* Multiple Targets (Controlled) */}
            <section>
                <h5>Controlled / Multiple Targets</h5>
                <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '10px'
      }}>
                    <Button onClick={() => setOpen1(!open1)} text="Toggle First" />
                    <Button onClick={() => setOpen2(!open2)} text="Toggle Second" />
                    <Button onClick={() => {
          setOpen1(!open1);
          setOpen2(!open2);
        }} text="Toggle Both" />
                </div>

                <div style={{
        display: 'flex',
        gap: '16px'
      }}>
                    <div style={{
          flex: 1
        }}>
                        <div className={\`collapse \${open1 ? 'show' : ''}\`}>
                            <Card body="First content block." showBorder />
                        </div>
                    </div>
                    <div style={{
          flex: 1
        }}>
                        <div className={\`collapse \${open2 ? 'show' : ''}\`}>
                            <Card body="Second content block." showBorder />
                        </div>
                    </div>
                </div>
            </section>

            {/* Accordion Example (Manual Implementation using Collapse) */}
            <section>
                <h5>Accordion Pattern</h5>
                <div style={{
        border: '1px solid var(--color-outline-variant)',
        borderRadius: '4px'
      }}>
                    <Collapse trigger="Accordion Item #1" triggerClass="d-flex align-items-center w-100 p-3 bg-light border-0 text-primary text-left" className="border-bottom" icon="chevron-down" iconPosition="right">
                        <div className="p-3">
                            Some quick example text to build on the card title and make up the bulk of the card's content.
                        </div>
                    </Collapse>
                    <Collapse trigger="Accordion Item #2" triggerClass="d-flex align-items-center w-100 p-3 bg-light border-0 text-primary text-left" icon="chevron-down" iconPosition="right">
                        <div className="p-3">
                            Some quick example text to build on the card title and make up the bulk of the card's content.
                        </div>
                    </Collapse>
                </div>
            </section>
        </div>;
}`,...a.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:"args => <Collapse {...args} />",...d.parameters?.docs?.source}}};const W=["Overview","Interactive"];export{d as Interactive,a as Overview,W as __namedExportsOrder,U as default};
