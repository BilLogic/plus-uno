import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as C}from"./iframe-CwPMOv9C.js";import{P as t}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const s=({currentPage:a,totalPages:o,onPageChange:m,type:c="icon",size:x="default",maxVisible:g=5,prevText:h="Previous",nextText:v="Next",ariaLabel:y="Page navigation",id:j,className:b=""})=>{const l=(()=>{if(o<=g)return Array.from({length:o},(f,p)=>p+1);const n=Math.floor(g/2);let i=Math.max(1,a-n),r=Math.min(o,i+g-1);return r-i<g-1&&(i=Math.max(1,r-g+1)),Array.from({length:r-i+1},(f,p)=>i+p)})(),T=l.length>0&&l[0]>1,N=l.length>0&&l[l.length-1]<o,q=(n,i)=>{n.preventDefault(),m&&m(i)},z=["pagination","plus-pagination",x!=="default"?`plus-pagination-${x}`:"",c!=="icon"?`plus-pagination-${c}`:"",b].filter(Boolean).join(" "),P=(n,i,r,f)=>e.jsx("li",{className:`page-item ${i?"active":""} ${r?"disabled":""} ${c==="icon"&&typeof f!="string"?"page-item-icon":""}`,children:e.jsx("a",{className:"page-link",href:"#",onClick:p=>!r&&q(p,n),"aria-current":i?"page":void 0,"aria-disabled":r?"true":void 0,tabIndex:r?-1:void 0,children:f})},n);return e.jsx("nav",{"aria-label":y,id:j,children:e.jsxs("ul",{className:z,children:[P(a-1,!1,a===1,c==="icon"?e.jsx("i",{className:"fas fa-caret-left"}):h),T&&e.jsx("li",{className:"page-item disabled page-item-ellipsis",children:e.jsx("span",{className:"page-link","aria-disabled":"true",children:"..."})}),l.map(n=>P(n,n===a,!1,n)),N&&e.jsx("li",{className:"page-item disabled page-item-ellipsis",children:e.jsx("span",{className:"page-link","aria-disabled":"true",children:"..."})}),P(a+1,!1,a===o,c==="icon"?e.jsx("i",{className:"fas fa-caret-right"}):v)]})})};s.propTypes={currentPage:t.number.isRequired,totalPages:t.number.isRequired,onPageChange:t.func,type:t.oneOf(["icon","text"]),size:t.oneOf(["small","default","large"]),maxVisible:t.number,prevText:t.string,nextText:t.string,ariaLabel:t.string,id:t.string,className:t.string};s.__docgenInfo={description:"",methods:[],displayName:"Pagination",props:{type:{defaultValue:{value:"'icon'",computed:!1},description:"",type:{name:"enum",value:[{value:"'icon'",computed:!1},{value:"'text'",computed:!1}]},required:!1},size:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'default'",computed:!1},{value:"'large'",computed:!1}]},required:!1},maxVisible:{defaultValue:{value:"5",computed:!1},description:"",type:{name:"number"},required:!1},prevText:{defaultValue:{value:"'Previous'",computed:!1},description:"",type:{name:"string"},required:!1},nextText:{defaultValue:{value:"'Next'",computed:!1},description:"",type:{name:"string"},required:!1},ariaLabel:{defaultValue:{value:"'Page navigation'",computed:!1},description:"",type:{name:"string"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},currentPage:{description:"",type:{name:"number"},required:!0},totalPages:{description:"",type:{name:"number"},required:!0},onPageChange:{description:"",type:{name:"func"},required:!1},id:{description:"",type:{name:"string"},required:!1}}};const O={title:"Components/Pagination",component:s,tags:["autodocs"],parameters:{docs:{description:{component:"Pagination component for navigating through paginated content. Built on Bootstrap 4.6.2 with PLUS design token customizations."}}},argTypes:{type:{control:"select",options:["icon","text"],description:"Pagination type"},size:{control:"select",options:["small","default","large"],description:"Pagination size"},currentPage:{control:"number",description:"Current active page"},totalPages:{control:"number",description:"Total number of pages"}}},S=a=>{const[o,m]=C.useState(a.currentPage);return e.jsx(s,{...a,currentPage:o,onPageChange:m})},u=()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:[e.jsxs("section",{children:[e.jsx("h5",{children:"Icon Type (Default)"}),e.jsx(s,{currentPage:5,totalPages:10,type:"icon",onPageChange:a=>console.log("Page:",a)})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Text Type"}),e.jsx(s,{currentPage:5,totalPages:10,type:"text",prevText:"Previous",nextText:"Next",onPageChange:a=>console.log("Page:",a)})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Sizes"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(s,{currentPage:3,totalPages:5,size:"small"}),e.jsx(s,{currentPage:3,totalPages:5,size:"default"}),e.jsx(s,{currentPage:3,totalPages:5,size:"large"})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"States (First/Last Disabled)"}),e.jsx(s,{currentPage:1,totalPages:5,type:"icon"}),e.jsx("br",{}),e.jsx(s,{currentPage:5,totalPages:5,type:"icon"})]})]}),d=S.bind({});d.args={currentPage:5,totalPages:20,type:"icon",size:"default",maxVisible:5};u.__docgenInfo={description:"",methods:[],displayName:"Overview"};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '32px'
}}>
        <section>
            <h5>Icon Type (Default)</h5>
            <Pagination currentPage={5} totalPages={10} type="icon" onPageChange={p => console.log('Page:', p)} />
        </section>

        <section>
            <h5>Text Type</h5>
            <Pagination currentPage={5} totalPages={10} type="text" prevText="Previous" nextText="Next" onPageChange={p => console.log('Page:', p)} />
        </section>

        <section>
            <h5>Sizes</h5>
            <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
                <Pagination currentPage={3} totalPages={5} size="small" />
                <Pagination currentPage={3} totalPages={5} size="default" />
                <Pagination currentPage={3} totalPages={5} size="large" />
            </div>
        </section>

        <section>
            <h5>States (First/Last Disabled)</h5>
            <Pagination currentPage={1} totalPages={5} type="icon" />
            <br />
            <Pagination currentPage={5} totalPages={5} type="icon" />
        </section>
    </div>`,...u.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`args => {
  const [page, setPage] = useState(args.currentPage);
  return <Pagination {...args} currentPage={page} onPageChange={setPage} />;
}`,...d.parameters?.docs?.source}}};const k=["Overview","Interactive"];export{d as Interactive,u as Overview,k as __namedExportsOrder,O as default};
