import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import{P as a}from"./index-D5YdkFue.js";import"./preload-helper-PPVm8Dsz.js";const i=({media:t,heading:l,children:p,alignment:r="left",mediaSize:c="default",className:g="",onClick:m,...u})=>{const o=r.startsWith("right"),f=r.includes("center")?"plus-media-center":r.includes("bottom")?"plus-media-bottom":"",x=["media","plus-media",o?"plus-media-right":"",f,c?`plus-media-${c}`:"",g].filter(Boolean).join(" "),h=()=>{const v="plus-media-object"+(typeof t=="string"?" plus-media-image":" plus-media-icon");return e.jsx("div",{className:v,children:typeof t=="string"?e.jsx("img",{src:t,alt:typeof l=="string"?l:"Media"}):t})},j=m?{cursor:"pointer"}:{};return e.jsxs("div",{className:x,onClick:m,style:{...j,...u.style},...u,children:[!o&&h(),e.jsxs("div",{className:"media-body plus-media-body",children:[l&&e.jsx("h6",{className:"mt-0 plus-media-heading",children:l}),e.jsx("div",{className:"plus-media-content body1-txt",children:p})]}),o&&h()]})};i.propTypes={media:a.oneOfType([a.string,a.node]).isRequired,heading:a.node,children:a.node.isRequired,alignment:a.oneOf(["left","left-center","left-bottom","right","right-center","right-bottom"]),mediaSize:a.oneOf(["small","default","large"]),className:a.string,onClick:a.func,style:a.object};i.__docgenInfo={description:"",methods:[],displayName:"MediaObject",props:{alignment:{defaultValue:{value:"'left'",computed:!1},description:"",type:{name:"enum",value:[{value:"'left'",computed:!1},{value:"'left-center'",computed:!1},{value:"'left-bottom'",computed:!1},{value:"'right'",computed:!1},{value:"'right-center'",computed:!1},{value:"'right-bottom'",computed:!1}]},required:!1},mediaSize:{defaultValue:{value:"'default'",computed:!1},description:"",type:{name:"enum",value:[{value:"'small'",computed:!1},{value:"'default'",computed:!1},{value:"'large'",computed:!1}]},required:!1},className:{defaultValue:{value:"''",computed:!1},description:"",type:{name:"string"},required:!1},media:{description:"",type:{name:"union",value:[{name:"string"},{name:"node"}]},required:!0},heading:{description:"",type:{name:"node"},required:!1},children:{description:"",type:{name:"node"},required:!0},onClick:{description:"",type:{name:"func"},required:!1},style:{description:"",type:{name:"object"},required:!1}}};const z={title:"Components/MediaObject",component:i,tags:["autodocs"],parameters:{docs:{description:{component:"Media Object component for creating media objects with image/icon and content. Built on Bootstrap 4.6.2 media object pattern with PLUS design token customizations."}}},argTypes:{alignment:{control:"select",options:["left","left-center","left-bottom","right","right-center","right-bottom"],description:"Media alignment"},mediaSize:{control:"select",options:["small","default","large"],description:"Media size"},onClick:{action:"clicked"}}},s=({size:t="64px",text:l="64"})=>e.jsx("div",{style:{width:t,height:t,borderRadius:"var(--size-element-radius-sm)",backgroundColor:"var(--color-surface-variant)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--color-on-surface-variant)"},children:l}),d=()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:[e.jsxs("section",{children:[e.jsx("h5",{children:"Left Alignment (Default)"}),e.jsx(i,{media:e.jsx(s,{}),heading:"Media heading",children:"Will you do the same for me? It's time to face the music."})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Right Alignment"}),e.jsx(i,{media:e.jsx(s,{}),heading:"Media heading",alignment:"right",children:"Will you do the same for me? It's time to face the music."})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Center Vertical Alignment"}),e.jsx(i,{media:e.jsx(s,{}),heading:"Center Aligned",alignment:"left-center",children:"Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis. Fusce condimentum nunc ac nisi vulputate fringilla. Donec lacinia congue felis in faucibus."})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Media Sizes"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(i,{media:e.jsx(s,{size:"48px",text:"48"}),heading:"Small Media",mediaSize:"small",children:"Small media size."}),e.jsx(i,{media:e.jsx(s,{size:"64px",text:"64"}),heading:"Default Media",mediaSize:"default",children:"Default media size."}),e.jsx(i,{media:e.jsx(s,{size:"96px",text:"96"}),heading:"Large Media",mediaSize:"large",children:"Large media size."})]})]}),e.jsxs("section",{children:[e.jsx("h5",{children:"Nested Media"}),e.jsxs(i,{media:e.jsx(s,{}),heading:"Parent Media",children:["Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin.",e.jsx(i,{media:e.jsx(s,{size:"48px",text:"48"}),heading:"Nested Media",className:"mt-3",mediaSize:"small",children:"Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin."})]})]})]}),n=t=>e.jsx(i,{...t,children:"will you do the same for me? It's time to face the music I'm no longer your muse. Heard it's beautiful, be the judge and my girls gonna take a vote."});n.args={media:e.jsx(s,{}),heading:"Media Heading",alignment:"left",mediaSize:"default"};d.__docgenInfo={description:"",methods:[],displayName:"Overview"};n.__docgenInfo={description:"",methods:[],displayName:"Interactive"};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '32px'
}}>
        <section>
            <h5>Left Alignment (Default)</h5>
            <MediaObject media={<PlaceholderMedia />} heading="Media heading">
                Will you do the same for me? It's time to face the music.
            </MediaObject>
        </section>

        <section>
            <h5>Right Alignment</h5>
            <MediaObject media={<PlaceholderMedia />} heading="Media heading" alignment="right">
                Will you do the same for me? It's time to face the music.
            </MediaObject>
        </section>

        <section>
            <h5>Center Vertical Alignment</h5>
            <MediaObject media={<PlaceholderMedia />} heading="Center Aligned" alignment="left-center">
                Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin. Cras purus odio, vestibulum in vulputate at, tempus viverra turpis. Fusce condimentum nunc ac nisi vulputate fringilla. Donec lacinia congue felis in faucibus.
            </MediaObject>
        </section>

        <section>
            <h5>Media Sizes</h5>
            <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
                <MediaObject media={<PlaceholderMedia size="48px" text="48" />} heading="Small Media" mediaSize="small">
                    Small media size.
                </MediaObject>
                <MediaObject media={<PlaceholderMedia size="64px" text="64" />} heading="Default Media" mediaSize="default">
                    Default media size.
                </MediaObject>
                <MediaObject media={<PlaceholderMedia size="96px" text="96" />} heading="Large Media" mediaSize="large">
                    Large media size.
                </MediaObject>
            </div>
        </section>

        <section>
            <h5>Nested Media</h5>
            <MediaObject media={<PlaceholderMedia />} heading="Parent Media">
                Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin.
                <MediaObject media={<PlaceholderMedia size="48px" text="48" />} heading="Nested Media" className="mt-3" mediaSize="small">
                    Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin.
                </MediaObject>
            </MediaObject>
        </section>
    </div>`,...d.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`args => <MediaObject {...args}>
        will you do the same for me? It's time to face the music I'm no longer your muse. Heard it's beautiful, be the judge and my girls gonna take a vote.
    </MediaObject>`,...n.parameters?.docs?.source}}};const N=["Overview","Interactive"];export{n as Interactive,d as Overview,N as __namedExportsOrder,z as default};
