import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as b,R as I}from"./iframe-CwPMOv9C.js";import{P as t}from"./index-D5YdkFue.js";import{B as r}from"./Button-Cp7X3nYf.js";import{O as B,B as u}from"./OverlayTrigger-COoJNlw8.js";import"./preload-helper-PPVm8Dsz.js";import"./constants-Duibr4cP.js";import"./useIsomorphicEffect-CguU98Db.js";import"./useEventCallback-gy-vMt_7.js";import"./useEventCallback-Be-6LYtV.js";import"./warning-BF1MgRa0.js";import"./useTimeout-tib8qvp7.js";import"./index-C62oQ3_1.js";import"./index-B01aFtWa.js";import"./Fade-U9Hv2pZM.js";import"./ThemeProvider-Bg-6AoBP.js";const y=b.forwardRef(({title:n,children:p,className:c="",style:d,...s},g)=>e.jsxs(u,{ref:g,className:`plus-popover ${c}`,style:d,...s,children:[n&&e.jsx(u.Header,{className:"plus-popover-title",children:n}),e.jsx(u.Body,{className:"plus-popover-body",children:p})]}));y.displayName="PopoverContent";const o=({trigger:n,children:p,title:c,placement:d="top",triggerType:s="click",defaultShow:g=!1,show:m,onToggle:v,container:f,offset:h=[0,8],className:x="",id:P,...T})=>{const i={placement:d,overlay:e.jsx(y,{title:c,className:x,id:P,...T,children:p}),defaultShow:g,container:f,offset:h};s==="manual"?(i.trigger=[],i.show=m):i.trigger=s,m!==void 0&&s!=="manual"&&(i.show=m),v&&(i.onToggle=v);const j=I.isValidElement(n)?n:e.jsx("span",{className:"d-inline-block",tabIndex:"0",children:n});return e.jsx(B,{...i,children:j})};o.propTypes={trigger:t.node.isRequired,children:t.node.isRequired,title:t.node,placement:t.oneOf(["auto","top","bottom","left","right","top-start","top-end","bottom-start","bottom-end","right-start","right-end","left-start","left-end"]),triggerType:t.oneOfType([t.string,t.arrayOf(t.string)]),defaultShow:t.bool,show:t.bool,onToggle:t.func,container:t.any,offset:t.array,className:t.string,id:t.string};o.__docgenInfo={description:"",methods:[],displayName:"Popover",props:{placement:{defaultValue:{value:"'top'",computed:!1},description:"",type:{name:"enum",value:[{value:"'auto'",computed:!1},{value:"'top'",computed:!1},{value:"'bottom'",computed:!1},{value:"'left'",computed:!1},{value:"'right'",computed:!1},{value:"'top-start'",computed:!1},{value:"'top-end'",computed:!1},{value:"'bottom-start'",computed:!1},{value:"'bottom-end'",computed:!1},{value:"'right-start'",computed:!1},{value:"'right-end'",computed:!1},{value:"'left-start'",computed:!1},{value:"'left-end'",computed:!1}]},required:!1},triggerType:{defaultValue:{value:"'click'",computed:!1},description:"",type:{name:"union",value:[{name:"string"},{name:"arrayOf",value:{name:"string"}}]},required:!1},defaultShow:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},offset:{defaultValue:{value:"[0, 8]",computed:!1},description:"",type:{name:"array"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},trigger:{description:"",type:{name:"node"},required:!0},children:{description:"",type:{name:"node"},required:!0},title:{description:"",type:{name:"node"},required:!1},show:{description:"",type:{name:"bool"},required:!1},onToggle:{description:"",type:{name:"func"},required:!1},container:{description:"",type:{name:"any"},required:!1},id:{description:"",type:{name:"string"},required:!1}}};const W={title:"Components/Popover",component:o,tags:["autodocs"],parameters:{docs:{description:{component:"Popover component for displaying additional information. Built using react-bootstrap OverlayTrigger and Popover."}}},argTypes:{placement:{control:"select",options:["top","bottom","left","right"],description:"Popover placement"},triggerType:{control:"select",options:["click","hover","focus",["hover","focus"]],description:"Trigger behavior"}}},R=n=>e.jsx(o,{...n}),a=()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"64px",padding:"48px",alignItems:"center"},children:[e.jsxs("section",{style:{display:"flex",gap:"32px",flexWrap:"wrap",justifyContent:"center"},children:[e.jsx(o,{trigger:e.jsx(r,{text:"Popover on Top",style:"secondary"}),placement:"top",title:"Popover Title",children:"And here's some amazing content. It's very engaging. Right?"}),e.jsx(o,{trigger:e.jsx(r,{text:"Popover on Bottom",style:"secondary"}),placement:"bottom",title:"Popover Title",children:"And here's some amazing content. It's very engaging. Right?"}),e.jsx(o,{trigger:e.jsx(r,{text:"Popover on Left",style:"secondary"}),placement:"left",title:"Popover Title",children:"And here's some amazing content. It's very engaging. Right?"}),e.jsx(o,{trigger:e.jsx(r,{text:"Popover on Right",style:"secondary"}),placement:"right",title:"Popover Title",children:"And here's some amazing content. It's very engaging. Right?"})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"No Title (Content Only)"}),e.jsx(o,{trigger:e.jsx(r,{text:"Content Only",style:"primary"}),placement:"right",children:"This popover has no title, only body content."})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Trigger Types"}),e.jsxs("div",{style:{display:"flex",gap:"16px"},children:[e.jsx(o,{trigger:e.jsx(r,{text:"Click (Default)",style:"info"}),triggerType:"click",children:"Clicked to toggle."}),e.jsx(o,{trigger:e.jsx(r,{text:"Hover",style:"info"}),triggerType:"hover",children:"Hovered to show."}),e.jsx(o,{trigger:e.jsx(r,{text:"Focus",style:"info"}),triggerType:"focus",children:"Focus to show (tab to this button)."})]})]})]}),l=R.bind({});l.args={trigger:e.jsx(r,{text:"Interactive Trigger"}),title:"Interactive Popover",children:"Change my placement or title in the controls.",placement:"top",triggerType:"click"};a.__docgenInfo={description:"",methods:[],displayName:"Overview"};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '64px',
  padding: '48px',
  alignItems: 'center'
}}>
        <section style={{
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  }}>
            <Popover trigger={<Button text="Popover on Top" style="secondary" />} placement="top" title="Popover Title">
                And here's some amazing content. It's very engaging. Right?
            </Popover>

            <Popover trigger={<Button text="Popover on Bottom" style="secondary" />} placement="bottom" title="Popover Title">
                And here's some amazing content. It's very engaging. Right?
            </Popover>

            <Popover trigger={<Button text="Popover on Left" style="secondary" />} placement="left" title="Popover Title">
                And here's some amazing content. It's very engaging. Right?
            </Popover>

            <Popover trigger={<Button text="Popover on Right" style="secondary" />} placement="right" title="Popover Title">
                And here's some amazing content. It's very engaging. Right?
            </Popover>
        </section>

        <section>
            <h5>No Title (Content Only)</h5>
            <Popover trigger={<Button text="Content Only" style="primary" />} placement="right">
                This popover has no title, only body content.
            </Popover>
        </section>

        <section>
            <h5>Trigger Types</h5>
            <div style={{
      display: 'flex',
      gap: '16px'
    }}>
                <Popover trigger={<Button text="Click (Default)" style="info" />} triggerType="click">
                    Clicked to toggle.
                </Popover>

                <Popover trigger={<Button text="Hover" style="info" />} triggerType="hover">
                    Hovered to show.
                </Popover>

                <Popover trigger={<Button text="Focus" style="info" />} triggerType="focus">
                    Focus to show (tab to this button).
                </Popover>
            </div>
        </section>
    </div>`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:"args => <Popover {...args} />",...l.parameters?.docs?.source}}};const $=["Overview","Interactive"];export{l as Interactive,a as Overview,$ as __namedExportsOrder,W as default};
