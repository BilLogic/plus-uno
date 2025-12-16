import{j as t}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{B as e}from"./Button-Cp7X3nYf.js";import"./preload-helper-PPVm8Dsz.js";import"./index-D5YdkFue.js";import"./constants-Duibr4cP.js";const u={title:"Components/Button",component:e,tags:["autodocs"],argTypes:{btnText:{control:"text",description:"Button text"},btnStyle:{control:"select",options:["primary","secondary","tertiary","success","info","warning","error","default"],description:"Button style"},btnFill:{control:"select",options:["filled","outline","tonal","text"],description:"Button fill variant"},btnSize:{control:"select",options:["small","default","large"],description:"Button size"},icon:{control:"text",description:"Leading icon name (without fa- prefix)"},trailingIcon:{control:"text",description:"Trailing icon name (without fa- prefix)"},enabled:{control:"boolean",description:"Enabled state"},verticalLayout:{control:"boolean",description:"Vertical layout"}}},n=()=>t.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap"},children:[t.jsx(e,{btnText:"Primary",btnStyle:"primary"}),t.jsx(e,{btnText:"Secondary",btnStyle:"secondary"}),t.jsx(e,{btnText:"Outline",btnFill:"outline",btnStyle:"primary"}),t.jsx(e,{btnText:"Text",btnFill:"text",btnStyle:"primary"})]}),s={args:{btnText:"Click Me",btnStyle:"primary",btnFill:"filled",btnSize:"default",enabled:!0}},r=()=>t.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:["filled","outline","tonal","text"].map(c=>t.jsxs("div",{children:[t.jsx("h3",{style:{marginBottom:"16px",textTransform:"capitalize"},children:c}),t.jsx("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap"},children:["primary","secondary","tertiary","success","warning","error","info","default"].map(o=>t.jsx(e,{btnText:o.charAt(0).toUpperCase()+o.slice(1),btnStyle:o,btnFill:c},o))})]},c))}),i=()=>t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[t.jsx(e,{btnText:"Small",btnSize:"small",btnStyle:"primary"}),t.jsx(e,{btnText:"Default",btnSize:"default",btnStyle:"primary"}),t.jsx(e,{btnText:"Large",btnSize:"large",btnStyle:"primary"})]}),a=()=>t.jsxs("div",{style:{display:"flex",gap:"16px"},children:[t.jsx(e,{btnText:"Leading Icon",icon:"star",btnStyle:"primary"}),t.jsx(e,{btnText:"Trailing Icon",trailingIcon:"arrow-right",btnStyle:"secondary"}),t.jsx(e,{btnText:"Both Icons",icon:"check",trailingIcon:"chevron-right",btnStyle:"success"}),t.jsx(e,{icon:"trash",btnStyle:"error",tooltip:"Delete"})]}),l=()=>t.jsx("div",{style:{display:"flex",gap:"16px"},children:t.jsx(e,{btnText:"Vertical",icon:"upload",verticalLayout:!0,btnFill:"outline",btnStyle:"primary",style:{height:"100px",width:"100px"}})});n.__docgenInfo={description:"",methods:[],displayName:"Overview"};r.__docgenInfo={description:"",methods:[],displayName:"AllStyles"};i.__docgenInfo={description:"",methods:[],displayName:"Sizes"};a.__docgenInfo={description:"",methods:[],displayName:"WithIcons"};l.__docgenInfo={description:"",methods:[],displayName:"Vertical"};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap'
}}>
        <Button btnText="Primary" btnStyle="primary" />
        <Button btnText="Secondary" btnStyle="secondary" />
        <Button btnText="Outline" btnFill="outline" btnStyle="primary" />
        <Button btnText="Text" btnFill="text" btnStyle="primary" />
    </div>`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    btnText: 'Click Me',
    btnStyle: 'primary',
    btnFill: 'filled',
    btnSize: 'default',
    enabled: true
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
}}>
        {['filled', 'outline', 'tonal', 'text'].map(fill => <div key={fill}>
                <h3 style={{
      marginBottom: '16px',
      textTransform: 'capitalize'
    }}>{fill}</h3>
                <div style={{
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
                    {['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'info', 'default'].map(style => <Button key={style} btnText={style.charAt(0).toUpperCase() + style.slice(1)} btnStyle={style} btnFill={fill} />)}
                </div>
            </div>)}
    </div>`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
        <Button btnText="Small" btnSize="small" btnStyle="primary" />
        <Button btnText="Default" btnSize="default" btnStyle="primary" />
        <Button btnText="Large" btnSize="large" btnStyle="primary" />
    </div>`,...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  gap: '16px'
}}>
        <Button btnText="Leading Icon" icon="star" btnStyle="primary" />
        <Button btnText="Trailing Icon" trailingIcon="arrow-right" btnStyle="secondary" />
        <Button btnText="Both Icons" icon="check" trailingIcon="chevron-right" btnStyle="success" />
        <Button icon="trash" btnStyle="error" tooltip="Delete" />
    </div>`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  gap: '16px'
}}>
        <Button btnText="Vertical" icon="upload" verticalLayout btnFill="outline" btnStyle="primary" style={{
    height: '100px',
    width: '100px'
  }} />
    </div>`,...l.parameters?.docs?.source}}};const g=["Overview","Interactive","AllStyles","Sizes","WithIcons","Vertical"];export{r as AllStyles,s as Interactive,n as Overview,i as Sizes,l as Vertical,a as WithIcons,g as __namedExportsOrder,u as default};
