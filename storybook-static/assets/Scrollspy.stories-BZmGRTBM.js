import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as w}from"./iframe-CwPMOv9C.js";import{P as s}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const g=({id:m,children:a,className:n="",style:l,height:i,...p})=>{const u={...l,position:"relative",overflowY:"auto",height:i||"100%"};return e.jsx("div",{id:m,className:`plus-scrollspy-content ${n}`,style:u,...p,children:a})};g.propTypes={id:s.string.isRequired,children:s.node,className:s.string,style:s.object,height:s.string};const v=({id:m,brand:a="Navbar",items:n=[],contentId:l,offset:i=10,activeId:p,onActivate:u,className:j="",style:q,...I})=>{const[S,C]=w.useState(n[0]?.href.replace("#","")||""),x=p!==void 0?p:S;w.useEffect(()=>{if(!l)return;const t=document.getElementById(l);if(!t)return;const c=()=>{const h=t.scrollTop+i,o=n.map(f=>f.href.replace("#",""));let r=o[0];for(let f=o.length-1;f>=0;f--){const N=o[f],b=document.getElementById(N);if(b&&b.offsetTop<=h){r=N;break}}r!==x&&(p===void 0&&C(r),u&&u(r))};return t.addEventListener("scroll",c),c(),()=>{t.removeEventListener("scroll",c)}},[l,n,i,x,p,u]);const D=(t,c)=>{t.preventDefault();const h=c.replace("#",""),o=document.getElementById(h),r=document.getElementById(l);o&&r&&r.scrollTo({top:o.offsetTop,behavior:"smooth"})};return e.jsxs("nav",{id:m,className:`plus-scrollspy-navbar ${j}`,role:"navigation","aria-label":"Scrollspy navigation",style:q,...I,children:[e.jsx("div",{className:"plus-scrollspy-brand",children:e.jsx("p",{className:"body-lead-txt",children:a})}),e.jsx("div",{className:"plus-scrollspy-spacer"}),e.jsx("div",{className:"plus-nav-list plus-nav-pills",children:n.map((t,c)=>{const h=t.href.replace("#",""),o=x===h;return e.jsx("div",{className:`plus-nav-item ${o?"plus-nav-item-selected":""} ${t.isDropdown?"plus-nav-item-dropdown":""}`,children:e.jsxs("a",{href:t.href,className:`plus-nav-link ${o?"active":""}`,onClick:r=>D(r,t.href),children:[e.jsx("span",{className:"plus-nav-text body1-txt",children:t.text}),t.isDropdown&&e.jsx("i",{className:"fas fa-caret-down plus-nav-dropdown-icon"})]})},c)})})]})};v.propTypes={id:s.string,brand:s.node,items:s.arrayOf(s.shape({text:s.string.isRequired,href:s.string.isRequired,isDropdown:s.bool})).isRequired,contentId:s.string,offset:s.number,activeId:s.string,onActivate:s.func,className:s.string,style:s.object};g.__docgenInfo={description:"",methods:[],displayName:"ScrollspyContent",props:{className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!0},children:{description:"",type:{name:"node"},required:!1},style:{description:"",type:{name:"object"},required:!1},height:{description:"",type:{name:"string"},required:!1}}};v.__docgenInfo={description:"",methods:[],displayName:"Scrollspy",props:{brand:{defaultValue:{value:"'Navbar'",computed:!1},description:"",type:{name:"node"},required:!1},items:{defaultValue:{value:"[]",computed:!1},description:"",type:{name:"arrayOf",value:{name:"shape",value:{text:{name:"string",required:!0},href:{name:"string",required:!0},isDropdown:{name:"bool",required:!1}}}},required:!1},offset:{defaultValue:{value:"10",computed:!1},description:"",type:{name:"number"},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1},contentId:{description:"",type:{name:"string"},required:!1},activeId:{description:"",type:{name:"string"},required:!1},onActivate:{description:"",type:{name:"func"},required:!1},style:{description:"",type:{name:"object"},required:!1}}};const P={title:"Components/Scrollspy",component:v,tags:["autodocs"],parameters:{docs:{description:{component:"Scrollspy component for automatically updating navigation based on scroll position."}}}},d=()=>{const m=[{text:"@fat",href:"#fat",isDropdown:!1},{text:"@mdo",href:"#mdo",isDropdown:!1},{text:"Dropdown",href:"#one",isDropdown:!0}],a=n=>Array(n).fill(0).map((l,i)=>e.jsxs("p",{className:"body1-txt",style:{marginTop:"16px"},children:["Additional content paragraph ",i+1,". This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically."]},i));return e.jsxs("div",{style:{backgroundColor:"var(--color-surface)",display:"flex",flexDirection:"column",width:"100%",maxWidth:"648px",maxHeight:"600px",border:"1px solid var(--color-outline-variant)"},children:[e.jsx(v,{id:"scrollspy-nav-overview",brand:"Navbar",items:m,contentId:"scrollspy-content-overview",offset:10}),e.jsxs(g,{id:"scrollspy-content-overview",height:"500px",children:[e.jsxs("section",{id:"fat",className:"plus-scrollspy-section",children:[e.jsx("h4",{className:"h4",children:"@fat"}),e.jsx("p",{className:"body1-txt",children:"Placeholder content for the scrollspy example. You got the finest architecture. Passport stamps, she's cosmopolitan."}),a(5)]}),e.jsxs("section",{id:"mdo",className:"plus-scrollspy-section",children:[e.jsx("h4",{className:"h4",children:"@mdo"}),e.jsx("p",{className:"body1-txt",children:"Placeholder content for the scrollspy example. 'Cause she's the muse and the artist."}),a(5)]}),e.jsxs("section",{id:"one",className:"plus-scrollspy-section",children:[e.jsx("h4",{className:"h4",children:"one"}),e.jsx("p",{className:"body1-txt",children:"Placeholder content for the scrollspy example. Takes you miles high, so high."}),a(5)]})]})]})},y=()=>e.jsx(d,{});d.__docgenInfo={description:"",methods:[],displayName:"Overview"};y.__docgenInfo={description:"",methods:[],displayName:"Interactive"};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => {
  const items = [{
    text: '@fat',
    href: '#fat',
    isDropdown: false
  }, {
    text: '@mdo',
    href: '#mdo',
    isDropdown: false
  }, {
    text: 'Dropdown',
    href: '#one',
    isDropdown: true
  }];
  const generateContent = count => {
    return Array(count).fill(0).map((_, i) => <p key={i} className="body1-txt" style={{
      marginTop: '16px'
    }}>
                Additional content paragraph {i + 1}. This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically.
            </p>);
  };
  return <div style={{
    backgroundColor: 'var(--color-surface)',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '648px',
    maxHeight: '600px',
    border: '1px solid var(--color-outline-variant)'
  }}>
            <Scrollspy id="scrollspy-nav-overview" brand="Navbar" items={items} contentId="scrollspy-content-overview" offset={10} />

            <ScrollspyContent id="scrollspy-content-overview" height="500px">
                <section id="fat" className="plus-scrollspy-section">
                    <h4 className="h4">@fat</h4>
                    <p className="body1-txt">Placeholder content for the scrollspy example. You got the finest architecture. Passport stamps, she's cosmopolitan.</p>
                    {generateContent(5)}
                </section>

                <section id="mdo" className="plus-scrollspy-section">
                    <h4 className="h4">@mdo</h4>
                    <p className="body1-txt">Placeholder content for the scrollspy example. 'Cause she's the muse and the artist.</p>
                    {generateContent(5)}
                </section>

                <section id="one" className="plus-scrollspy-section">
                    <h4 className="h4">one</h4>
                    <p className="body1-txt">Placeholder content for the scrollspy example. Takes you miles high, so high.</p>
                    {generateContent(5)}
                </section>
            </ScrollspyContent>
        </div>;
}`,...d.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`() => {
  // Same as overview but can be played with controls if needed, 
  // simply duplicating for now as the component relies on specific DOM structure
  return <Overview />;
}`,...y.parameters?.docs?.source}}};const O=["Overview","Interactive"];export{y as Interactive,d as Overview,O as __namedExportsOrder,P as default};
