import{j as t}from"./jsx-runtime-u17CrQMm.js";import{r as c}from"./iframe-CwPMOv9C.js";import{P as r}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const s=({id:f,name:h,placeholder:T,value:l,defaultValue:q="",size:x="medium",readOnly:d=!1,disabled:u=!1,minHeight:y,toolbarButtons:S,className:k="",style:E,onChange:v,onFocus:b,onBlur:j,...I})=>{const n=c.useRef(null),a=c.useRef(null),[H,B]=c.useState({}),C=S||["bold","italic","underline","strikethrough","heading","list-ul","list-ol","link","image","code","quote","align-left","align-center","align-right","undo","redo"],L={bold:{icon:"bold",command:"bold",title:"Bold"},italic:{icon:"italic",command:"italic",title:"Italic"},underline:{icon:"underline",command:"underline",title:"Underline"},strikethrough:{icon:"strikethrough",command:"strikeThrough",title:"Strikethrough"},heading:{icon:"heading",command:"formatBlock",value:"h3",title:"Heading"},"list-ul":{icon:"list-ul",command:"insertUnorderedList",title:"Bullet List"},"list-ol":{icon:"list-ol",command:"insertOrderedList",title:"Numbered List"},link:{icon:"link",command:"createLink",title:"Insert Link"},image:{icon:"image",command:"insertImage",title:"Insert Image"},code:{icon:"code",command:"formatBlock",value:"pre",title:"Code Block"},quote:{icon:"quote-right",command:"formatBlock",value:"blockquote",title:"Quote"},"align-left":{icon:"align-left",command:"justifyLeft",title:"Align Left"},"align-center":{icon:"align-center",command:"justifyCenter",title:"Align Center"},"align-right":{icon:"align-right",command:"justifyRight",title:"Align Right"},undo:{icon:"undo",command:"undo",title:"Undo"},redo:{icon:"redo",command:"redo",title:"Redo"}},D=(e,i)=>{if(!(u||d)){if(e==="createLink"&&!i){const o=prompt("Enter URL:");o&&document.execCommand(e,!1,o)}else if(e==="insertImage"&&!i){const o=prompt("Enter image URL:");o&&document.execCommand(e,!1,o)}else document.execCommand(e,!1,i);n.current&&(n.current.focus(),R(),g())}},g=()=>{const e={};C.forEach(i=>{const o=L[i];o&&(e[i]=document.queryCommandState(o.command))}),B(e)},R=()=>{if(n.current){const e=n.current.innerHTML,i=e.trim().length>0||n.current.textContent.trim().length>0;a.current&&a.current.classList.toggle("plus-rich-text-editor-has-value",i),v&&v(e)}};c.useEffect(()=>{if(n.current){const e=l!==void 0?l:q;if(n.current.innerHTML!==e){n.current.innerHTML=e;const i=e.trim().length>0||n.current.textContent.trim().length>0;a.current&&a.current.classList.toggle("plus-rich-text-editor-has-value",i)}}},[]),c.useEffect(()=>{if(l!==void 0&&n.current&&n.current.innerHTML!==l&&document.activeElement!==n.current){n.current.innerHTML=l;const e=l.trim().length>0||n.current.textContent.trim().length>0;a.current&&a.current.classList.toggle("plus-rich-text-editor-has-value",e)}},[l]);const N=["plus-rich-text-editor",`plus-rich-text-editor-${x}`,d?"plus-rich-text-editor-readonly":"",u?"plus-rich-text-editor-disabled":"",k].filter(Boolean).join(" "),V=["plus-rich-text-editor-content",x==="small"?"body3-txt":x==="large"?"body1-txt":"body2-txt",d?"plus-rich-text-editor-readonly":"",u?"plus-rich-text-editor-disabled":""].filter(Boolean).join(" ");return t.jsxs("div",{id:f,ref:a,className:N,style:E,...I,children:[t.jsx("div",{className:"plus-rich-text-editor-toolbar",children:C.map(e=>{const i=L[e];return i?t.jsx("button",{type:"button",className:`plus-rich-text-editor-toolbar-button ${H[e]?"active":""}`,title:i.title,"aria-label":i.title,onClick:o=>{o.preventDefault(),D(i.command,i.value)},disabled:u||d,children:t.jsx("i",{className:`fas fa-${i.icon}`})},e):null})}),t.jsx("div",{ref:n,className:V,contentEditable:!d&&!u,"data-placeholder":T,style:{minHeight:y?`${y}px`:void 0},onInput:R,onFocus:e=>{g(),b&&b(e)},onBlur:e=>{j&&j(e)},onKeyUp:g,onMouseUp:g}),h&&t.jsx("input",{type:"hidden",name:h,value:l||n.current?.innerHTML||""})]})};s.propTypes={id:r.string,name:r.string,placeholder:r.string,value:r.string,defaultValue:r.string,size:r.oneOf(["small","medium","large"]),readOnly:r.bool,disabled:r.bool,minHeight:r.number,toolbarButtons:r.arrayOf(r.string),className:r.string,style:r.object,onChange:r.func,onFocus:r.func,onBlur:r.func};s.__docgenInfo={description:"",methods:[],displayName:"RichTextEditor",props:{defaultValue:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},size:{defaultValue:{value:"'medium'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'medium'",computed:!1},{value:"'large'",computed:!1}]},required:!1},readOnly:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},disabled:{defaultValue:{value:"false",computed:!1},description:"",type:{name:"bool"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},name:{description:"",type:{name:"string"},required:!1},placeholder:{description:"",type:{name:"string"},required:!1},value:{description:"",type:{name:"string"},required:!1},minHeight:{description:"",type:{name:"number"},required:!1},toolbarButtons:{description:"",type:{name:"arrayOf",value:{name:"string"}},required:!1},style:{description:"",type:{name:"object"},required:!1},onChange:{description:"",type:{name:"func"},required:!1},onFocus:{description:"",type:{name:"func"},required:!1},onBlur:{description:"",type:{name:"func"},required:!1}}};const U={title:"Components/RichTextEditor",component:s,tags:["autodocs"],parameters:{docs:{description:{component:"Rich text editor component with formatting toolbar. Supports bold, italic, lists, and more."}}},argTypes:{size:{control:"select",options:["small","medium","large"],description:"Editor size"},readOnly:{control:"boolean",description:"Read-only state"},disabled:{control:"boolean",description:"Disabled state"}}},m=()=>t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:[t.jsxs("section",{children:[t.jsx("h5",{children:"Default (Medium)"}),t.jsx(s,{placeholder:"Type something...",minHeight:150})]}),t.jsxs("section",{children:[t.jsx("h5",{children:"Sizes"}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[t.jsx(s,{size:"small",placeholder:"Small editor...",defaultValue:"<p>Small editor content</p>",minHeight:100}),t.jsx(s,{size:"large",placeholder:"Large editor...",defaultValue:"<p>Large editor content</p>",minHeight:200})]})]})]}),p=()=>{const[f,h]=c.useState("<p>Initial content...</p>");return t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:[t.jsx(s,{value:f,onChange:h,placeholder:"Interactive editor...",minHeight:200}),t.jsxs("div",{style:{padding:"16px",background:"#f5f5f5",borderRadius:"4px"},children:[t.jsx("h6",{children:"Current Content:"}),t.jsx("pre",{style:{whiteSpace:"pre-wrap"},children:f})]})]})};m.__docgenInfo={description:"",methods:[],displayName:"Overview"};p.__docgenInfo={description:"",methods:[],displayName:"Interactive"};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => {
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>
            <section>
                <h5>Default (Medium)</h5>
                <RichTextEditor placeholder="Type something..." minHeight={150} />
            </section>

            <section>
                <h5>Sizes</h5>
                <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
                    <RichTextEditor size="small" placeholder="Small editor..." defaultValue="<p>Small editor content</p>" minHeight={100} />
                    <RichTextEditor size="large" placeholder="Large editor..." defaultValue="<p>Large editor content</p>" minHeight={200} />
                </div>
            </section>
        </div>;
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`() => {
  const [content, setContent] = useState('<p>Initial content...</p>');
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>
            <RichTextEditor value={content} onChange={setContent} placeholder="Interactive editor..." minHeight={200} />

            <div style={{
      padding: '16px',
      background: '#f5f5f5',
      borderRadius: '4px'
    }}>
                <h6>Current Content:</h6>
                <pre style={{
        whiteSpace: 'pre-wrap'
      }}>{content}</pre>
            </div>
        </div>;
}`,...p.parameters?.docs?.source}}};const $=["Overview","Interactive"];export{p as Interactive,m as Overview,$ as __namedExportsOrder,U as default};
