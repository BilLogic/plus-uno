import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as h,R as j}from"./iframe-CwPMOv9C.js";import{P as s}from"./index-D5YdkFue.js";import{u as g,c as I}from"./ThemeProvider-Bg-6AoBP.js";import{a as G,F as i}from"./Form-CGGCUlyg.js";import{c as F,B as T}from"./InputGroupContext-73bDEekm.js";import"./preload-helper-PPVm8Dsz.js";import"./ElementChildren-DvS5LfxA.js";import"./warning-BF1MgRa0.js";import"./Button-Bfu7qxc4.js";const c=h.forwardRef(({className:r,bsPrefix:p,as:a="span",...l},n)=>(p=g(p,"input-group-text"),e.jsx(a,{ref:n,className:I(r,p),...l})));c.displayName="InputGroupText";const q=r=>e.jsx(c,{children:e.jsx(G,{type:"checkbox",...r})}),_=r=>e.jsx(c,{children:e.jsx(G,{type:"radio",...r})}),C=h.forwardRef(({bsPrefix:r,size:p,hasValidation:a,className:l,as:n="div",...m},x)=>{r=g(r,"input-group");const f=h.useMemo(()=>({}),[]);return e.jsx(F.Provider,{value:f,children:e.jsx(n,{ref:x,...m,className:I(l,r,p&&`${r}-${p}`,a&&"has-validation")})})});C.displayName="InputGroup";const d=Object.assign(C,{Text:c,Radio:_,Checkbox:q}),o=({id:r,children:p,prepend:a,append:l,size:n="default",className:m="",style:x,...f})=>{const N={small:"sm",medium:void 0,default:void 0,large:"lg"}[n]||n,R=n==="small"?"body3-txt":n==="large"?"body1-txt":"body2-txt",y=t=>t?typeof t=="string"?e.jsx(d.Text,{className:"plus-input-group-text",children:t}):(j.isValidElement(t),t):null,v=t=>Array.isArray(t)?t.map((B,b)=>e.jsx(j.Fragment,{children:y(B)},b)):y(t);return e.jsxs(d,{id:r,size:N,className:`plus-input-group ${R} ${m}`,style:x,...f,children:[v(a),p,v(l)]})};o.Text=d.Text;o.Checkbox=d.Checkbox;o.Radio=d.Radio;o.propTypes={id:s.string,children:s.node,prepend:s.node,append:s.node,size:s.oneOf(["small","medium","large","sm","lg","default"]),className:s.string,style:s.object};o.__docgenInfo={description:"",methods:[],displayName:"InputGroup",props:{size:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'medium'",computed:!1},{value:"'large'",computed:!1},{value:"'sm'",computed:!1},{value:"'lg'",computed:!1},{value:"'default'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},children:{description:"",type:{name:"node"},required:!1},prepend:{description:"",type:{name:"node"},required:!1},append:{description:"",type:{name:"node"},required:!1},style:{description:"",type:{name:"object"},required:!1}}};const S={title:"Components/InputGroup",component:o,tags:["autodocs"]},u=()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px",maxWidth:"400px"},children:[e.jsx(o,{prepend:"@",placeholder:"Username",children:e.jsx(i.Control,{placeholder:"Username"})}),e.jsx(o,{append:".com",children:e.jsx(i.Control,{placeholder:"Recipient's username"})}),e.jsx(o,{prepend:"$",append:".00",children:e.jsx(i.Control,{placeholder:"Amount"})}),e.jsx(o,{prepend:e.jsx(T,{variant:"outline-secondary",children:"Button"}),children:e.jsx(i.Control,{placeholder:"Button addon"})})]});u.__docgenInfo={description:"",methods:[],displayName:"Overview"};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxWidth: '400px'
}}>
        <InputGroup prepend="@" placeholder="Username">
            <Form.Control placeholder="Username" />
        </InputGroup>

        <InputGroup append=".com">
            <Form.Control placeholder="Recipient's username" />
        </InputGroup>

        <InputGroup prepend="$" append=".00">
            <Form.Control placeholder="Amount" />
        </InputGroup>

        <InputGroup prepend={<Button variant="outline-secondary">Button</Button>}>
            <Form.Control placeholder="Button addon" />
        </InputGroup>
    </div>`,...u.parameters?.docs?.source}}};const W=["Overview"];export{u as Overview,W as __namedExportsOrder,S as default};
