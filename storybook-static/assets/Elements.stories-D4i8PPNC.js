import{c as b,a as x}from"./index-B5pJPxK1.js";import{S as y}from"./constants-TbmyjgfL.js";function S({type:i,size:e="h1",id:o=null,classes:c=[]}){const h=i.replace(/\s+/g,"-").toLowerCase(),u={"socio-emotional":y.CA_SE_FULL,"mastering-content":y.CA_MC,advocacy:y.CA_ADV,relationships:y.CA_RELN,"technology-tools":y.CA_TT}[h]||y.CA_SE_FULL,v={"socio-emotional":{bg:"var(--color-social-emotional-state-08)",icon:"var(--color-social-emotional)",text:"var(--color-social-emotional-text)"},"mastering-content":{bg:"var(--color-mastering-content-state-08)",icon:"var(--color-mastering-content)",text:"var(--color-mastering-content-text)"},advocacy:{bg:"var(--color-advocacy-state-08)",icon:"var(--color-advocacy)",text:"var(--color-advocacy-text)"},relationships:{bg:"var(--color-relationship-state-08)",icon:"var(--color-relationship)",text:"var(--color-relationship-text)"},"technology-tools":{bg:"var(--color-technology-tools-state-08)",icon:"var(--color-technology-tools)",text:"var(--color-technology-tools-text)"}},m=v[h]||v["socio-emotional"],r=document.createElement("div");r.classList.add("plus-static-badge-smart",`plus-static-badge-smart-${h}`,`plus-static-badge-smart-${e}`),r.style.display="flex",r.style.alignItems="center",r.style.justifyContent="center",r.style.position="relative",o&&(r.id=o),c&&c.length>0&&r.classList.add(...c);const n=document.createElement("div");n.style.display="flex",n.style.alignItems="center",n.style.paddingTop="0",n.style.paddingBottom="0",n.style.position="relative",n.style.flexShrink="0",n.style.boxSizing="border-box",n.style.backgroundColor=m.bg,["h1","h2","h3"].includes(e)?(n.style.paddingLeft="var(--size-element-pad-x-lg)",n.style.paddingRight="var(--size-element-pad-x-lg)",n.style.borderRadius="999px"):["h4","h5"].includes(e)?(n.style.paddingLeft="var(--size-element-pad-x-md)",n.style.paddingRight="var(--size-element-pad-x-md)",n.style.borderRadius="999px"):e==="h6"?(n.style.paddingLeft="var(--size-element-pad-x-md)",n.style.paddingRight="var(--size-element-pad-x-md)",n.style.borderRadius="50px"):["b1","b2"].includes(e)?(n.style.paddingLeft="var(--size-element-pad-x-sm)",n.style.paddingRight="var(--size-element-pad-x-sm)",n.style.borderRadius="999px"):e==="b3"&&(n.style.paddingLeft="var(--size-element-pad-x-sm)",n.style.paddingRight="var(--size-element-pad-x-sm)",h==="technology-tools"?n.style.borderRadius="16px":n.style.borderRadius="999px");const s=document.createElement("div");s.style.display="flex",s.style.alignItems="center",s.style.justifyContent="center",s.style.position="relative",s.style.flexShrink="0",["h1","h2","h3"].includes(e)?s.style.gap="var(--size-element-gap-lg)":["h4","h5","h6"].includes(e)?s.style.gap="var(--size-element-gap-md)":["b1","b2","b3"].includes(e)&&(s.style.gap="var(--size-element-gap-sm)",e==="b1"?s.style.minWidth="20px":e==="b2"?s.style.minWidth="16px":e==="b3"&&(s.style.minWidth="12px"));const d=document.createElement("div");d.style.display="flex",d.style.alignItems="center",d.style.justifyContent="center",d.style.position="relative",d.style.flexShrink="0";const a=document.createElement("i");a.classList.add("fas","fa-circle-dot"),a.style.fontStyle="normal",a.style.textAlign="center",a.style.whiteSpace="nowrap",a.style.color=m.icon,e==="h1"?(a.style.fontSize="var(--font-size-fa-h1-solid)",a.style.lineHeight="var(--font-line-height-fa-h1-solid)"):e==="h2"?(a.style.fontSize="var(--font-size-fa-h2-solid)",a.style.lineHeight="var(--font-line-height-fa-h2-solid)"):e==="h3"?(a.style.fontSize="var(--font-size-fa-h3-solid)",a.style.lineHeight="var(--font-line-height-fa-h3-solid)"):e==="h4"?(a.style.fontSize="var(--font-size-fa-h4-solid)",a.style.lineHeight="var(--font-line-height-fa-h4-solid)"):e==="h5"?(a.style.fontSize="var(--font-size-fa-h5-solid)",a.style.lineHeight="var(--font-line-height-fa-h5-solid)"):e==="h6"||e==="b1"?(a.style.fontSize="var(--font-size-fa-h6-solid)",a.style.lineHeight="var(--font-line-height-fa-h6-solid)"):e==="b2"?(a.style.fontSize="var(--font-size-fa-body2-solid)",a.style.lineHeight="var(--font-line-height-fa-body2-solid)"):e==="b3"&&(a.style.fontSize="var(--font-size-fa-body3-solid)",a.style.lineHeight="var(--font-line-height-fa-body3-solid)"),d.appendChild(a),s.appendChild(d);const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.justifyContent="center",t.style.lineHeight="0",t.style.position="relative",t.style.flexShrink="0",t.style.textAlign="center",t.style.color=m.text,["h1","h2","h3"].includes(e)?(t.style.fontFamily="var(--font-family-header)",t.style.fontWeight="var(--font-weight-bold)",t.style.fontStyle="normal",t.style.whiteSpace="nowrap",e==="h1"?(t.style.fontSize="var(--font-size-h1)",t.style.lineHeight="var(--font-line-height-h1)"):e==="h2"?(t.style.fontSize="var(--font-size-h2)",t.style.lineHeight="var(--font-line-height-h2)"):e==="h3"&&(t.style.fontSize="var(--font-size-h3)",t.style.lineHeight="var(--font-line-height-h3)")):["h4","h5","h6"].includes(e)?(t.style.fontFamily="var(--font-family-header)",t.style.fontWeight="var(--font-weight-semibold-2)",t.style.fontStyle="normal",t.style.whiteSpace="nowrap",e==="h4"?(t.style.fontSize="var(--font-size-h4)",t.style.lineHeight="var(--font-line-height-h4)"):e==="h5"?(t.style.fontSize="var(--font-size-h5)",t.style.lineHeight="var(--font-line-height-h5)"):e==="h6"&&(t.style.fontSize="var(--font-size-h6)",t.style.lineHeight="var(--font-line-height-h6)")):["b1","b2","b3"].includes(e)&&(t.style.flex="1 0 0",t.style.fontFamily="var(--font-family-body)",t.style.fontWeight="var(--font-weight-normal)",t.style.minHeight="1px",t.style.minWidth="1px",e==="b1"?(t.style.fontSize="var(--font-size-body1)",t.style.lineHeight="var(--font-line-height-body1)"):e==="b2"?(t.style.fontSize="var(--font-size-body2)",t.style.lineHeight="var(--font-line-height-body2)"):e==="b3"&&(t.style.fontSize="var(--font-size-body3)",t.style.lineHeight="var(--font-line-height-body3)"));const l=document.createElement("p");return e==="h1"?l.style.lineHeight="1.6":["h2","h6"].includes(e)?l.style.lineHeight="1.5":e==="h3"?l.style.lineHeight="1.429":e==="h4"?l.style.lineHeight="1.333":e==="h5"?l.style.lineHeight="1.4":e==="b1"?(l.style.lineHeight="1.5",l.style.whiteSpace="pre-wrap"):e==="b2"?(l.style.lineHeight="1.571",l.style.whiteSpace="pre-wrap"):e==="b3"&&(l.style.lineHeight="1.667",l.style.whiteSpace="pre-wrap"),l.textContent=u,t.appendChild(l),s.appendChild(t),n.appendChild(s),r.appendChild(n),r}const H={title:"Specs/Universal/Elements",tags:["autodocs"],parameters:{docs:{description:{component:"Element-level components for universal organisms. These are reusable building blocks used in universal navigation and UI patterns."}}}},p={render:()=>{const i=document.createElement("div");return i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-md)",i.style.padding="var(--size-section-pad-y-lg)",i.style.maxWidth="300px",[{state:"enabled",text:"Tab Title"},{state:"hover",text:"Tab Title"},{state:"selected",text:"Tab Title"},{state:"disabled",text:"Tab Title"},{state:"focus",text:"Tab Title"}].forEach(({state:o,text:c})=>{const h=b({text:c,icon:"icons",state:o,leadingVisual:!0});i.appendChild(h)}),i}},f={render:()=>{const i=document.createElement("div");return i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-md)",i.style.padding="var(--size-section-pad-y-lg)",i.style.maxWidth="300px",[{name:"John Doe",firstChar:"J",counter:!0,counterValue:2},{name:"Jane Smith",firstChar:"J",counter:!0,counterValue:5},{name:"Bob Wilson",firstChar:"B",counter:!1}].forEach(o=>{const c=x({firstChar:o.firstChar,name:o.name,showName:!0,counter:o.counter,counterValue:o.counterValue});i.appendChild(c)}),i}},g={render:i=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-md)",e.style.padding="var(--size-section-pad-y-lg)",e.style.maxWidth="400px";const o=S({type:i.type,size:i.size});return e.appendChild(o),e},argTypes:{type:{control:"select",options:["socio-emotional","mastering-content","advocacy","relationships","technology-tools"],description:"SMART competency area type"},size:{control:"select",options:["h1","h2","h3","h4","h5","h6","b1","b2","b3"],description:"Badge size"}},args:{type:"socio-emotional",size:"h1"}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.maxWidth = '300px';
    const states = [{
      state: 'enabled',
      text: 'Tab Title'
    }, {
      state: 'hover',
      text: 'Tab Title'
    }, {
      state: 'selected',
      text: 'Tab Title'
    }, {
      state: 'disabled',
      text: 'Tab Title'
    }, {
      state: 'focus',
      text: 'Tab Title'
    }];
    states.forEach(({
      state,
      text
    }) => {
      const tab = createSidebarTab({
        text: text,
        icon: 'icons',
        state: state,
        leadingVisual: true
      });
      container.appendChild(tab);
    });
    return container;
  }
}`,...p.parameters?.docs?.source},description:{story:`Sidebar Tab - All States
Shows all sidebar tab states: enabled, hover, selected, disabled, focus`,...p.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.maxWidth = '300px';
    const variants = [{
      name: 'John Doe',
      firstChar: 'J',
      counter: true,
      counterValue: 2
    }, {
      name: 'Jane Smith',
      firstChar: 'J',
      counter: true,
      counterValue: 5
    }, {
      name: 'Bob Wilson',
      firstChar: 'B',
      counter: false
    }];
    variants.forEach(variant => {
      const avatar = createUserAvatar({
        firstChar: variant.firstChar,
        name: variant.name,
        showName: true,
        counter: variant.counter,
        counterValue: variant.counterValue
      });
      container.appendChild(avatar);
    });
    return container;
  }
}`,...f.parameters?.docs?.source},description:{story:`User Avatar - Variants
Shows user avatar with different configurations`,...f.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.maxWidth = '400px';
    const badge = createStaticBadgeSmart({
      type: args.type,
      size: args.size
    });
    container.appendChild(badge);
    return container;
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'],
      description: 'SMART competency area type'
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Badge size'
    }
  },
  args: {
    type: 'socio-emotional',
    size: 'h1'
  }
}`,...g.parameters?.docs?.source},description:{story:`Static Badge SMART
Interactive SMART competency area badge with type and size properties`,...g.parameters?.docs?.description}}};const E=["SidebarTabStates","UserAvatarVariants","StaticBadgeSmart"];export{p as SidebarTabStates,g as StaticBadgeSmart,f as UserAvatarVariants,E as __namedExportsOrder,H as default};
