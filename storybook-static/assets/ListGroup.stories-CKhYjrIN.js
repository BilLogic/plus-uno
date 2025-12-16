import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as s}from"./index-D5YdkFue.js";import{B as I}from"./Badge-CN_AojVr.js";import"./preload-helper-PPVm8Dsz.js";const h=({children:a,active:p=!1,disabled:i=!1,href:o,action:m,style:u,onClick:n,className:d="",as:f="div",...L})=>{let r=f;o?r="a":n||m?r="button":f==="div"&&!m&&!n&&!o&&(r="div");const y={className:["list-group-item","plus-list-group-item",p?"active":"",i?"disabled":"",o||n||m?"list-group-item-action":"",u?`plus-list-group-item-${u}`:"","body1-txt",d].filter(Boolean).join(" "),onClick:i?void 0:n,href:i?void 0:o,disabled:r==="button"?i:void 0,"aria-disabled":i?"true":void 0,tabIndex:i&&(r==="a"||r==="button")?-1:void 0,type:r==="button"?"button":void 0,...L};return e.jsx(r,{...y,children:e.jsx("div",{className:"plus-list-group-item-content",children:a})})};h.propTypes={children:s.node,active:s.bool,disabled:s.bool,href:s.string,action:s.bool,style:s.oneOf(["primary","secondary","tertiary","success","danger","warning","info","light","dark"]),onClick:s.func,className:s.string,as:s.elementType};const t=({children:a,flush:p=!1,horizontal:i=!1,as:o="div",className:m="",...u})=>{const n=o,d=["list-group","plus-list-group",p?"list-group-flush":"",i?"list-group-horizontal":"",m].filter(Boolean).join(" ");return e.jsx(n,{className:d,...u,children:a})};t.propTypes={children:s.node,flush:s.bool,horizontal:s.bool,as:s.elementType,className:s.string};t.Item=h;h.__docgenInfo={description:"",methods:[],displayName:"ListGroupItem",props:{active:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},disabled:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},as:{defaultValue:{value:"'div'",computed:!1},description:"",type:{name:"elementType"},required:!1},children:{description:"",type:{name:"node"},required:!1},href:{description:"",type:{name:"string"},required:!1},action:{description:"",type:{name:"bool"},required:!1},style:{description:"",type:{name:"enum",value:[{value:"'primary'",computed:!1},{value:"'secondary'",computed:!1},{value:"'tertiary'",computed:!1},{value:"'success'",computed:!1},{value:"'danger'",computed:!1},{value:"'warning'",computed:!1},{value:"'info'",computed:!1},{value:"'light'",computed:!1},{value:"'dark'",computed:!1}]},required:!1},onClick:{description:"",type:{name:"func"},required:!1}}};t.__docgenInfo={description:"",methods:[{name:"Item",docblock:null,modifiers:["static"],params:[{name:`{
    children,
    active = false,
    disabled = false,
    href,
    action, // true if button/link behavior is desired without explicit href
    style, // color variant
    onClick,
    className = '',
    as = 'div', // 'div', 'a', 'button', 'li'
    ...props
}`,optional:!1,type:null}],returns:null}],displayName:"ListGroup",props:{flush:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},horizontal:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},as:{defaultValue:{value:"'div'",computed:!1},description:"",type:{name:"elementType"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},children:{description:"",type:{name:"node"},required:!1}}};const N={title:"Components/ListGroup",component:t,subcomponents:{ListGroupItem:t.Item},tags:["autodocs"],parameters:{docs:{description:{component:"List group component for displaying a series of content items. Built on Bootstrap list-group pattern with PLUS design token customizations."}}}},c=()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:[e.jsxs("section",{children:[e.jsx("h5",{children:"Content"}),e.jsxs(t,{children:[e.jsx(t.Item,{children:"List item 1"}),e.jsx(t.Item,{children:"List item 2"}),e.jsx(t.Item,{children:"List item 3"})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"States"}),e.jsxs(t,{children:[e.jsx(t.Item,{children:"Normal item"}),e.jsx(t.Item,{active:!0,children:"Active item"}),e.jsx(t.Item,{disabled:!0,children:"Disabled item"})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Colors"}),e.jsxs(t,{children:[e.jsx(t.Item,{style:"primary",children:"Primary item"}),e.jsx(t.Item,{style:"secondary",children:"Secondary item"}),e.jsx(t.Item,{style:"success",children:"Success item"}),e.jsx(t.Item,{style:"danger",children:"Danger item"}),e.jsx(t.Item,{style:"warning",children:"Warning item"}),e.jsx(t.Item,{style:"info",children:"Info item"})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Actionable (Links & Buttons)"}),e.jsxs(t,{children:[e.jsx(t.Item,{action:!0,href:"#",children:"Link item"}),e.jsx(t.Item,{action:!0,onClick:()=>console.log("clicked"),children:"Button item"})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Flush"}),e.jsxs(t,{flush:!0,children:[e.jsx(t.Item,{children:"Flush item 1"}),e.jsx(t.Item,{children:"Flush item 2"}),e.jsx(t.Item,{children:"Flush item 3"})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"With Badges"}),e.jsxs(t,{children:[e.jsxs(t.Item,{className:"d-flex justify-content-between align-items-center",children:["Item with badge",e.jsx(I,{text:"14",style:"primary",size:"b2"})]}),e.jsxs(t.Item,{className:"d-flex justify-content-between align-items-center",children:["Item with badge",e.jsx(I,{text:"2",style:"primary",size:"b2"})]})]})]})]}),l=a=>e.jsxs(t,{...a,children:[e.jsx(t.Item,{children:"Item 1"}),e.jsx(t.Item,{active:!0,children:"Item 2"}),e.jsx(t.Item,{children:"Item 3"})]});l.args={flush:!1,horizontal:!1};c.__docgenInfo={description:"",methods:[],displayName:"Overview"};l.__docgenInfo={description:"",methods:[],displayName:"Interactive"};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '32px'
}}>
        <section>
            <h5>Content</h5>
            <ListGroup>
                <ListGroup.Item>List item 1</ListGroup.Item>
                <ListGroup.Item>List item 2</ListGroup.Item>
                <ListGroup.Item>List item 3</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>States</h5>
            <ListGroup>
                <ListGroup.Item>Normal item</ListGroup.Item>
                <ListGroup.Item active>Active item</ListGroup.Item>
                <ListGroup.Item disabled>Disabled item</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>Colors</h5>
            <ListGroup>
                <ListGroup.Item style="primary">Primary item</ListGroup.Item>
                <ListGroup.Item style="secondary">Secondary item</ListGroup.Item>
                <ListGroup.Item style="success">Success item</ListGroup.Item>
                <ListGroup.Item style="danger">Danger item</ListGroup.Item>
                <ListGroup.Item style="warning">Warning item</ListGroup.Item>
                <ListGroup.Item style="info">Info item</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>Actionable (Links & Buttons)</h5>
            <ListGroup>
                <ListGroup.Item action href="#">Link item</ListGroup.Item>
                <ListGroup.Item action onClick={() => console.log('clicked')}>
                    Button item
                </ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>Flush</h5>
            <ListGroup flush>
                <ListGroup.Item>Flush item 1</ListGroup.Item>
                <ListGroup.Item>Flush item 2</ListGroup.Item>
                <ListGroup.Item>Flush item 3</ListGroup.Item>
            </ListGroup>
        </section>

        <section>
            <h5>With Badges</h5>
            <ListGroup>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    Item with badge
                    <Badge text="14" style="primary" size="b2" />
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    Item with badge
                    <Badge text="2" style="primary" size="b2" />
                </ListGroup.Item>
            </ListGroup>
        </section>
    </div>`,...c.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`args => <ListGroup {...args}>
        <ListGroup.Item>Item 1</ListGroup.Item>
        <ListGroup.Item active>Item 2</ListGroup.Item>
        <ListGroup.Item>Item 3</ListGroup.Item>
    </ListGroup>`,...l.parameters?.docs?.source}}};const w=["Overview","Interactive"];export{l as Interactive,c as Overview,w as __namedExportsOrder,N as default};
