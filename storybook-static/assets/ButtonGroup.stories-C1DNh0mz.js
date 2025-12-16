import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as t}from"./index-D5YdkFue.js";import{B as x}from"./Button-Cp7X3nYf.js";import"./preload-helper-PPVm8Dsz.js";import"./constants-Duibr4cP.js";const l=({buttons:n=[],size:i="default",style:r="primary",fill:y="filled",alignment:u="horizontal",className:c="",id:p,...d})=>{const m=["plus-button-group",u==="vertical"?"vertical":"",c].filter(Boolean).join(" ");return e.jsx("div",{id:p,className:m,role:"group",...d,children:n.map((a,f)=>e.jsx(x,{size:a.size||i,style:a.style||r,fill:a.fill||"tonal",...a},f))})};l.propTypes={buttons:t.arrayOf(t.shape({text:t.string,onClick:t.func,size:t.string,style:t.string,fill:t.string})),size:t.oneOf(["small","default","large"]),style:t.oneOf(["primary","secondary","tertiary","success","danger","warning","info"]),fill:t.oneOf(["filled","outline","tonal","ghost","link"]),alignment:t.oneOf(["horizontal","vertical"]),className:t.string,id:t.string};l.__docgenInfo={description:"",methods:[],displayName:"ButtonGroup",props:{buttons:{defaultValue:{value:"[]",computed:!1},description:"",type:{name:"arrayOf",value:{name:"shape",value:{text:{name:"string",required:!1},onClick:{name:"func",required:!1},size:{name:"string",required:!1},style:{name:"string",required:!1},fill:{name:"string",required:!1}}}},required:!1},size:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'default'",computed:!1},{value:"'large'",computed:!1}]},required:!1},style:{defaultValue:{value:"'primary'",computed:!1},description:"",type:{name:"enum",value:[{value:"'primary'",computed:!1},{value:"'secondary'",computed:!1},{value:"'tertiary'",computed:!1},{value:"'success'",computed:!1},{value:"'danger'",computed:!1},{value:"'warning'",computed:!1},{value:"'info'",computed:!1}]},required:!1},fill:{defaultValue:{value:"'filled'",computed:!1},description:"",type:{name:"enum",value:[{value:"'filled'",computed:!1},{value:"'outline'",computed:!1},{value:"'tonal'",computed:!1},{value:"'ghost'",computed:!1},{value:"'link'",computed:!1}]},required:!1},alignment:{defaultValue:{value:"'horizontal'",computed:!1},description:"",type:{name:"enum",value:[{value:"'horizontal'",computed:!1},{value:"'vertical'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},id:{description:"",type:{name:"string"},required:!1}}};const k={title:"Components/ButtonGroup",component:l,tags:["autodocs"],parameters:{docs:{description:{component:"Button Group component for grouping related buttons together. Supports horizontal and vertical layouts with multiple sizes and styles. Uses element-level tokens."}}},argTypes:{size:{control:"select",options:["small","default","large"],description:"Button size"},style:{control:"select",options:["primary","secondary","tertiary","success","danger","warning"],description:"Button style"},fill:{control:"select",options:["filled","outline","tonal","ghost"],description:"Button fill"},alignment:{control:"select",options:["horizontal","vertical"],description:"Layout alignment"}}},g=n=>e.jsx(l,{...n}),s=()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:[e.jsxs("section",{children:[e.jsx("h5",{children:"Orientations"}),e.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap",alignItems:"flex-start"},children:[e.jsx(l,{alignment:"horizontal",buttons:[{text:"Left",onClick:()=>console.log("Left clicked")},{text:"Right",onClick:()=>console.log("Right clicked")}]}),e.jsx(l,{alignment:"vertical",buttons:[{text:"Top",onClick:()=>console.log("Top clicked")},{text:"Bottom",onClick:()=>console.log("Bottom clicked")}]})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Sizes"}),e.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap",alignItems:"center"},children:[e.jsx(l,{size:"small",buttons:[{text:"Small"},{text:"Group"}]}),e.jsx(l,{size:"default",buttons:[{text:"Default"},{text:"Group"}]}),e.jsx(l,{size:"large",buttons:[{text:"Large"},{text:"Group"}]})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Styles"}),e.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap"},children:[e.jsx(l,{style:"primary",buttons:[{text:"Primary"},{text:"Action"}]}),e.jsx(l,{style:"secondary",buttons:[{text:"Secondary"},{text:"Action"}]}),e.jsx(l,{style:"success",buttons:[{text:"Success"},{text:"Action"}]}),e.jsx(l,{style:"danger",buttons:[{text:"Danger"},{text:"Action"}]})]})]})]}),o=g.bind({});o.args={buttons:[{text:"Button 1"},{text:"Button 2"},{text:"Button 3"}],size:"default",style:"primary",alignment:"horizontal",fill:"tonal"};s.__docgenInfo={description:"",methods:[],displayName:"Overview"};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '32px'
}}>
        <section>
            <h5>Orientations</h5>
            <div style={{
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      alignItems: 'flex-start'
    }}>
                <ButtonGroup alignment="horizontal" buttons={[{
        text: 'Left',
        onClick: () => console.log('Left clicked')
      }, {
        text: 'Right',
        onClick: () => console.log('Right clicked')
      }]} />
                <ButtonGroup alignment="vertical" buttons={[{
        text: 'Top',
        onClick: () => console.log('Top clicked')
      }, {
        text: 'Bottom',
        onClick: () => console.log('Bottom clicked')
      }]} />
            </div>
        </section>

        <section>
            <h5>Sizes</h5>
            <div style={{
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
                <ButtonGroup size="small" buttons={[{
        text: 'Small'
      }, {
        text: 'Group'
      }]} />
                <ButtonGroup size="default" buttons={[{
        text: 'Default'
      }, {
        text: 'Group'
      }]} />
                <ButtonGroup size="large" buttons={[{
        text: 'Large'
      }, {
        text: 'Group'
      }]} />
            </div>
        </section>

        <section>
            <h5>Styles</h5>
            <div style={{
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
                <ButtonGroup style="primary" buttons={[{
        text: 'Primary'
      }, {
        text: 'Action'
      }]} />
                <ButtonGroup style="secondary" buttons={[{
        text: 'Secondary'
      }, {
        text: 'Action'
      }]} />
                <ButtonGroup style="success" buttons={[{
        text: 'Success'
      }, {
        text: 'Action'
      }]} />
                <ButtonGroup style="danger" buttons={[{
        text: 'Danger'
      }, {
        text: 'Action'
      }]} />
            </div>
        </section>
    </div>`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"args => <ButtonGroup {...args} />",...o.parameters?.docs?.source}}};const G=["Overview","Interactive"];export{o as Interactive,s as Overview,G as __namedExportsOrder,k as default};
