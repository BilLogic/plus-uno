import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as n}from"./iframe-CwPMOv9C.js";import{P as a}from"./index-D5YdkFue.js";import{c as g,u as v}from"./ThemeProvider-Bg-6AoBP.js";import{c as M,b as z,u as G}from"./useTimeout-tib8qvp7.js";import{F as J}from"./Fade-U9Hv2pZM.js";import{a as X}from"./useEventCallback-gy-vMt_7.js";import{B as K}from"./Button-Cp7X3nYf.js";import"./preload-helper-PPVm8Dsz.js";import"./index-C62oQ3_1.js";import"./index-B01aFtWa.js";import"./constants-Duibr4cP.js";const Q={"aria-label":a.string,onClick:a.func,variant:a.oneOf(["white"])},B=n.forwardRef(({className:t,variant:s,"aria-label":o="Close",...i},r)=>e.jsx("button",{ref:r,type:"button",className:g("btn-close",s&&`btn-close-${s}`,t),"aria-label":o,...i}));B.displayName="CloseButton";B.propTypes=Q;const U={[z]:"showing",[M]:"showing show"},k=n.forwardRef((t,s)=>e.jsx(J,{...t,ref:s,transitionClasses:U}));k.displayName="ToastFade";const V=n.createContext({onClose(){}}),O=n.forwardRef(({bsPrefix:t,closeLabel:s="Close",closeVariant:o,closeButton:i=!0,className:r,children:l,...c},d)=>{t=v(t,"toast-header");const p=n.useContext(V),m=X(f=>{p==null||p.onClose==null||p.onClose(f)});return e.jsxs("div",{ref:d,...c,className:g(t,r),children:[l,i&&e.jsx(B,{"aria-label":s,variant:o,onClick:m,"data-dismiss":"toast"})]})});O.displayName="ToastHeader";const H=n.forwardRef(({className:t,bsPrefix:s,as:o="div",...i},r)=>(s=v(s,"toast-body"),e.jsx(o,{ref:r,className:g(t,s),...i})));H.displayName="ToastBody";const F=n.forwardRef(({bsPrefix:t,className:s,transition:o=k,show:i=!0,animation:r=!0,delay:l=5e3,autohide:c=!1,onClose:d,onEntered:p,onExit:m,onExiting:f,onEnter:b,onEntering:x,onExited:N,bg:j,...C},L)=>{t=v(t,"toast");const S=n.useRef(l),w=n.useRef(d);n.useEffect(()=>{S.current=l,w.current=d},[l,d]);const q=G(),E=!!(c&&i),I=n.useCallback(()=>{E&&(w.current==null||w.current())},[E]);n.useEffect(()=>{q.set(I,S.current)},[q,I]);const A=n.useMemo(()=>({onClose:d}),[d]),_=!!(o&&r),$=e.jsx("div",{...C,ref:L,className:g(t,s,j&&`bg-${j}`,!_&&(i?"show":"hide")),role:"alert","aria-live":"assertive","aria-atomic":"true"});return e.jsx(V.Provider,{value:A,children:_&&o?e.jsx(o,{in:i,onEnter:b,onEntering:x,onEntered:p,onExit:m,onExiting:f,onExited:N,unmountOnExit:!0,children:$}):$})});F.displayName="Toast";const R=Object.assign(F,{Body:H,Header:O}),W={"top-start":"top-0 start-0","top-center":"top-0 start-50 translate-middle-x","top-end":"top-0 end-0","middle-start":"top-50 start-0 translate-middle-y","middle-center":"top-50 start-50 translate-middle","middle-end":"top-50 end-0 translate-middle-y","bottom-start":"bottom-0 start-0","bottom-center":"bottom-0 start-50 translate-middle-x","bottom-end":"bottom-0 end-0"},D=n.forwardRef(({bsPrefix:t,position:s,containerPosition:o,className:i,as:r="div",...l},c)=>(t=v(t,"toast-container"),e.jsx(r,{ref:c,...l,className:g(t,s&&W[s],o&&`position-${o}`,i)})));D.displayName="ToastContainer";const u=({id:t,style:s="default",title:o,children:i,dismissible:r=!0,show:l,onClose:c,delay:d=5e3,autohide:p=!0,className:m="",headerClass:f="",bodyClass:b="",timestamp:x,...N})=>{const C={danger:"fa-triangle-exclamation",success:"fa-circle-check",info:"fa-circle-info",warning:"fa-circle-exclamation",primary:"fa-circle",secondary:"fa-circle",default:"fa-circle"}[s]||"fa-circle";return e.jsxs(R,{id:t,className:`plus-toast ${s} ${m}`,show:l,onClose:c,delay:d,autohide:d>0&&p,role:"alert","aria-live":"assertive","aria-atomic":"true",...N,children:[e.jsxs(R.Header,{closeButton:r,className:`plus-toast-header ${f}`,children:[e.jsx("div",{className:"plus-toast-icon",children:e.jsx("i",{className:`fas ${C}`})}),e.jsx("strong",{className:"plus-toast-title me-auto",children:o}),x&&e.jsx("small",{className:"plus-toast-timestamp text-muted",children:x})]}),e.jsx("div",{className:"plus-toast-divider"}),e.jsx(R.Body,{className:`plus-toast-body ${b}`,children:i})]})};u.propTypes={id:a.string,style:a.oneOf(["default","success","danger","warning","info","primary","secondary"]),title:a.node.isRequired,children:a.node.isRequired,dismissible:a.bool,show:a.bool,onClose:a.func,delay:a.number,autohide:a.bool,className:a.string,headerClass:a.string,bodyClass:a.string,timestamp:a.node};const T=({position:t="top-end",className:s="",children:o,...i})=>{const r=l=>l==="top-right"?"top-end":l==="top-left"?"top-start":l==="bottom-right"?"bottom-end":l==="bottom-left"?"bottom-start":l;return e.jsx(D,{position:r(t),className:`plus-toast-container ${s}`,...i,children:o})};T.propTypes={position:a.string,className:a.string,children:a.node};u.__docgenInfo={description:"",methods:[],displayName:"Toast",props:{style:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'default'",computed:!1},{value:"'success'",computed:!1},{value:"'danger'",computed:!1},{value:"'warning'",computed:!1},{value:"'info'",computed:!1},{value:"'primary'",computed:!1},{value:"'secondary'",computed:!1}]},required:!1},dismissible:{defaultValue:{value:"true",computed:!1},description:"",type:{name:"bool"},required:!1},delay:{defaultValue:{value:"5000",computed:!1},description:"",type:{name:"number"},required:!1},autohide:{defaultValue:{value:"true",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},headerClass:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},bodyClass:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},title:{description:"",type:{name:"node"},required:!0},children:{description:"",type:{name:"node"},required:!0},show:{description:"",type:{name:"bool"},required:!1},onClose:{description:"",type:{name:"func"},required:!1},timestamp:{description:"",type:{name:"node"},required:!1}}};T.__docgenInfo={description:"",methods:[],displayName:"ToastContainer",props:{position:{defaultValue:{value:"'top-end'",computed:!1},description:"",type:{name:"string"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},children:{description:"",type:{name:"node"},required:!1}}};const de={title:"Components/Toast",component:u,tags:["autodocs"],parameters:{docs:{description:{component:"Toast component for displaying notifications. Based on react-bootstrap Toast."}}},argTypes:{style:{control:"select",options:["default","success","danger","warning","info"],description:"Toast style"},position:{control:"select",options:["top-right","top-left","bottom-right","bottom-left"],description:"Toast position (for container)"}}},h=()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsxs("section",{children:[e.jsx("h5",{children:"Static Examples"}),e.jsx("div",{style:{position:"relative",height:"300px",background:"#f8f9fa",border:"1px solid #dee2e6"},children:e.jsxs(T,{position:"top-start",className:"p-3",children:[e.jsx(u,{title:"Success Toast",style:"success",timestamp:"Just now",children:"Action completed successfully!"}),e.jsx(u,{title:"Danger Toast",style:"danger",timestamp:"2 mins ago",children:"Something went wrong."})]})})]})}),y=()=>{const[t,s]=n.useState(!1),[o,i]=n.useState("top-end");return e.jsxs("div",{style:{padding:"24px"},children:[e.jsxs("div",{style:{marginBottom:"24px",display:"flex",gap:"16px",alignItems:"center"},children:[e.jsx(K,{text:"Show Toast",onClick:()=>s(!0)}),e.jsxs("select",{value:o,onChange:r=>i(r.target.value),style:{padding:"8px",borderRadius:"4px"},children:[e.jsx("option",{value:"top-end",children:"Top Right"}),e.jsx("option",{value:"top-start",children:"Top Left"}),e.jsx("option",{value:"bottom-end",children:"Bottom Right"}),e.jsx("option",{value:"bottom-start",children:"Bottom Left"})]})]}),e.jsx(T,{position:o,className:"p-3",style:{zIndex:1055},children:e.jsx(u,{show:t,onClose:()=>s(!1),title:"Notification",style:"info",timestamp:"Now",delay:3e3,autohide:!0,children:"Hello! This is a dynamic toast message."})})]})};h.__docgenInfo={description:"",methods:[],displayName:"Overview"};y.__docgenInfo={description:"",methods:[],displayName:"Interactive"};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => {
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>
            <section>
                <h5>Static Examples</h5>
                <div style={{
        position: 'relative',
        height: '300px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6'
      }}>
                    <ToastContainer position="top-start" className="p-3">
                        <Toast title="Success Toast" style="success" timestamp="Just now">
                            Action completed successfully!
                        </Toast>
                        <Toast title="Danger Toast" style="danger" timestamp="2 mins ago">
                            Something went wrong.
                        </Toast>
                    </ToastContainer>
                </div>
            </section>
        </div>;
}`,...h.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`() => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState('top-end');
  return <div style={{
    padding: '24px'
  }}>
            <div style={{
      marginBottom: '24px',
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    }}>
                <Button text="Show Toast" onClick={() => setShow(true)} />
                <select value={position} onChange={e => setPosition(e.target.value)} style={{
        padding: '8px',
        borderRadius: '4px'
      }}>
                    <option value="top-end">Top Right</option>
                    <option value="top-start">Top Left</option>
                    <option value="bottom-end">Bottom Right</option>
                    <option value="bottom-start">Bottom Left</option>
                </select>
            </div>

            <ToastContainer position={position} className="p-3" style={{
      zIndex: 1055
    }}>
                <Toast show={show} onClose={() => setShow(false)} title="Notification" style="info" timestamp="Now" delay={3000} autohide>
                    Hello! This is a dynamic toast message.
                </Toast>
            </ToastContainer>
        </div>;
}`,...y.parameters?.docs?.source}}};const ce=["Overview","Interactive"];export{y as Interactive,h as Overview,ce as __namedExportsOrder,de as default};
