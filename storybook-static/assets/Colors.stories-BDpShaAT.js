import{P as M}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const K={title:"Styles/Colors",tags:["autodocs"],parameters:{docs:{description:{component:"Color system following Material Design 3 color roles. Includes accent colors (Primary, Secondary, Tertiary, Success, Danger, Warning, Info), SMART Framework colors, neutral colors, and state layers for interactive elements."}}}};function f(e,t){const n=document.createElement("table");n.style.width="100%",n.style.borderCollapse="collapse",n.style.marginBottom="var(--size-section-pad-y-md)",n.style.border="1px solid var(--color-outline-variant, #bec8ca)";const a=document.createElement("thead"),c=document.createElement("tr");c.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",c.style.borderBottom="2px solid var(--color-outline, #6f797a)",e.forEach(o=>{const l=document.createElement("th");l.textContent=o,l.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",l.style.textAlign="left",l.style.fontWeight="600",l.className="body2-txt",c.appendChild(l)}),a.appendChild(c),n.appendChild(a);const d=document.createElement("tbody");return t.forEach(o=>{const l=document.createElement("tr");l.style.borderBottom="1px solid var(--color-outline-variant, #bec8ca)";const p=document.createElement("td");p.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)";const m=document.createElement("code");m.textContent=o.token,m.style.fontSize="0.875rem",p.appendChild(m),l.appendChild(p);const r=document.createElement("td");if(r.style.fontFamily="monospace",r.style.fontSize="0.875rem",r.textContent=o.value,r.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",l.appendChild(r),e.length===4&&e.includes("Border / Stroke")){const s=document.createElement("td");s.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",s.className="body2-txt",s.textContent=o.border||"",l.appendChild(s);const i=document.createElement("td");i.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",i.className="body2-txt",i.textContent=o.opacity||"",l.appendChild(i)}else{if(e.includes("Color")){const i=document.createElement("td");i.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)";const u=document.createElement("div");u.style.width="60px",u.style.height="40px",u.style.backgroundColor=o.value,u.style.border="1px solid var(--color-outline-variant, #bec8ca)",u.style.borderRadius="4px",i.appendChild(u),l.appendChild(i)}const s=document.createElement("td");s.textContent=o.description||"",s.className="body2-txt",s.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",l.appendChild(s)}d.appendChild(l)}),n.appendChild(d),n}const B={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h1");t.className="h1",t.textContent="Colors",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=document.createElement("p");return n.className="body1-txt",n.textContent="PLUS follows Material Design 3 color guidance. All colors follow Material Design 3 roles and are sourced from Figma design system variables. The color system includes accent colors, SMART Framework colors, neutral colors, and state layers for interactive elements.",n.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(n),e}},U={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Primary Colors",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=f(["Token","Value","Color","Description"],[{token:"--color-primary",value:"#0472a8",description:"Main primary color - for borders/backgrounds"},{token:"--color-primary-text",value:"#00547e",description:"Primary text color - for text"},{token:"--color-on-primary",value:"#ffffff",description:"Content color on primary"},{token:"--color-primary-container",value:"#61b5cf",description:"Primary container background"},{token:"--color-on-primary-container",value:"#001e2e",description:"Content color on primary container"},{token:"--color-inverse-primary",value:"#84cfff",description:"Inverse primary color"}]);e.appendChild(n);const a=document.createElement("h3");a.className="h3",a.textContent="Primary State Layers",a.style.marginTop="var(--size-section-pad-y-md)",a.style.marginBottom="var(--size-element-gap-md)",e.appendChild(a);const c=f(["Token","Value","Description"],[{token:"--color-primary-state-08",value:"rgba(0, 101, 142, 0.08)",description:"8% opacity state layer"},{token:"--color-primary-state-12",value:"rgba(0, 101, 142, 0.12)",description:"12% opacity state layer"},{token:"--color-primary-state-16",value:"rgba(0, 101, 142, 0.16)",description:"16% opacity state layer"},{token:"--color-primary-container-state-08",value:"rgba(199, 231, 255, 0.08)",description:"Container 8% opacity"},{token:"--color-primary-container-state-12",value:"rgba(199, 231, 255, 0.12)",description:"Container 12% opacity"},{token:"--color-primary-container-state-16",value:"rgba(199, 231, 255, 0.16)",description:"Container 16% opacity"}]);return e.appendChild(c),e}},P={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Secondary Colors",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=f(["Token","Value","Color","Description"],[{token:"--color-secondary",value:"#445c6a",description:"Main secondary color - for borders/backgrounds"},{token:"--color-secondary-text",value:"#3b525f",description:"Secondary text color - for text"},{token:"--color-on-secondary",value:"#ffffff",description:"Content color on secondary"},{token:"--color-secondary-container",value:"#5e849b",description:"Secondary container background"},{token:"--color-on-secondary-container",value:"#09171f",description:"Content color on secondary container"}]);return e.appendChild(n),e}},F={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Tertiary Colors",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=f(["Token","Value","Color","Description"],[{token:"--color-tertiary",value:"#0e8175",description:"Main tertiary color"},{token:"--color-tertiary-text",value:"#005a50",description:"Tertiary text color - for text"},{token:"--color-on-tertiary",value:"#ffffff",description:"Content color on tertiary"},{token:"--color-tertiary-container",value:"#85ecd5",description:"Tertiary container background"},{token:"--color-on-tertiary-container",value:"#005a50",description:"Content color on tertiary container"}]);e.appendChild(n);const a=document.createElement("p");return a.className="body2-txt",a.style.marginTop="var(--size-section-pad-y-md)",a.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",a.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",a.style.borderRadius="var(--size-card-radius-sm, 12px)",a.innerHTML="<strong>Note:</strong> Info colors alias to Tertiary using <code>var()</code> references. Use <code>--color-info</code> which references <code>--color-tertiary</code>.",e.appendChild(a),e}},w={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Accent Colors",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=document.createElement("p");n.className="body1-txt",n.textContent="Accent colors provide primary, secondary, and tertiary emphasis in the UI. Use primary for main actions, secondary for supporting actions, and tertiary (also used for Info) for contextual emphasis.",n.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(n),e.appendChild(U.render());const a=P.render();a.style.marginTop="var(--size-section-pad-y-lg)",e.appendChild(a);const c=F.render();c.style.marginTop="var(--size-section-pad-y-lg)",e.appendChild(c);const d=document.createElement("h3");d.className="h3",d.textContent="Button Examples",d.style.marginTop="var(--size-section-pad-y-lg)",d.style.marginBottom="var(--size-element-gap-md)",e.appendChild(d);const o=document.createElement("p");o.className="body2-txt",o.textContent="Accent colors are used in buttons with different fill variants. Below are examples showing filled, outline, and tonal buttons for each accent color.",o.style.marginBottom="var(--size-card-gap-md)",e.appendChild(o);const l=["primary","secondary","tertiary"],p=["filled","outline","tonal"];return l.forEach(m=>{const r=document.createElement("div");r.style.marginBottom="var(--size-section-pad-y-md)";const s=document.createElement("h4");s.className="h4",s.textContent=`${m.charAt(0).toUpperCase()+m.slice(1)} Style`,s.style.marginBottom="var(--size-element-gap-sm)",r.appendChild(s);const i=document.createElement("div");i.style.display="flex",i.style.flexWrap="wrap",i.style.gap="var(--size-element-gap-md)",i.style.alignItems="center",p.forEach(u=>{const v=M.createButton({btnText:`${m.charAt(0).toUpperCase()+m.slice(1)} ${u.charAt(0).toUpperCase()+u.slice(1)}`,btnStyle:m,btnFill:u,btnSize:"default"});i.appendChild(v)}),r.appendChild(i),e.appendChild(r)}),e}},S={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Status Colors",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=document.createElement("h3");n.className="h3",n.textContent="Success",n.style.marginTop="var(--size-section-pad-y-md)",n.style.marginBottom="var(--size-element-gap-md)",e.appendChild(n);const a=f(["Token","Value","Color","Description"],[{token:"--color-success",value:"#3e691a",description:"Main success color - for borders/backgrounds"},{token:"--color-success-text",value:"#2c5609",description:"Success text color - for text"},{token:"--color-on-success",value:"#ffffff",description:"Content color on success"},{token:"--color-success-container",value:"#a1eb83",description:"Success container background"},{token:"--color-on-success-container",value:"#0c2000",description:"Content color on success container"}]);e.appendChild(a);const c=document.createElement("h3");c.className="h3",c.textContent="Danger",c.style.marginTop="var(--size-section-pad-y-md)",c.style.marginBottom="var(--size-element-gap-md)",e.appendChild(c);const d=f(["Token","Value","Color","Description"],[{token:"--color-danger",value:"#ba1a1a",description:"Main danger color - for borders/backgrounds"},{token:"--color-danger-text",value:"#9b0606",description:"Danger text color - for text"},{token:"--color-on-danger",value:"#ffffff",description:"Content color on danger"},{token:"--color-danger-container",value:"#ffdad6",description:"Danger container background"},{token:"--color-on-danger-container",value:"#410002",description:"Content color on danger container"}]);e.appendChild(d);const o=document.createElement("h3");o.className="h3",o.textContent="Warning",o.style.marginTop="var(--size-section-pad-y-md)",o.style.marginBottom="var(--size-element-gap-md)",e.appendChild(o);const l=f(["Token","Value","Color","Description"],[{token:"--color-warning",value:"#9f8205",description:"Main warning color - for borders/backgrounds"},{token:"--color-warning-text",value:"#5b4a00",description:"Warning text color - for text"},{token:"--color-on-warning",value:"#ffffff",description:"Content color on warning"},{token:"--color-warning-container",value:"#ffe17a",description:"Warning container background"},{token:"--color-on-warning-container",value:"#231b00",description:"Content color on warning container"}]);e.appendChild(l);const p=document.createElement("h3");p.className="h3",p.textContent="Alert Component Examples",p.style.marginTop="var(--size-section-pad-y-lg)",p.style.marginBottom="var(--size-element-gap-md)",e.appendChild(p);const m=document.createElement("p");m.className="body2-txt",m.textContent="Status colors are used in Alert components to provide contextual feedback. Below are examples showing how each status color is applied in context.",m.style.marginBottom="var(--size-card-gap-md)",e.appendChild(m);const r=document.createElement("div");return r.style.display="flex",r.style.flexDirection="column",r.style.gap="var(--size-card-gap-md)",[{style:"success",title:"Success Alert",text:"This is a success alert demonstrating the success color tokens."},{style:"danger",title:"Danger Alert",text:"This is a danger alert demonstrating the danger color tokens."},{style:"warning",title:"Warning Alert",text:"This is a warning alert demonstrating the warning color tokens."}].forEach(i=>{const u=M.createAlert({style:i.style,title:i.title,text:i.text,dismissable:!1});r.appendChild(u)}),e.appendChild(r),e}},D={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Neutral Colors",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=document.createElement("h3");n.className="h3",n.textContent="Neutral Font Colors",n.style.marginTop="var(--size-section-pad-y-md)",n.style.marginBottom="var(--size-element-gap-md)",e.appendChild(n);const a=f(["Token","Value","Color","Description"],[{token:"--color-on-surface",value:"#191c1e",description:"Primary text color. Use for headings and primary content."},{token:"--color-on-surface-variant",value:"#3f484a",description:"Secondary text color. Use for subtitles, metadata, and timestamps."}]);e.appendChild(a);const c=document.createElement("h3");c.className="h3",c.textContent="Outline Colors",c.style.marginTop="var(--size-section-pad-y-md)",c.style.marginBottom="var(--size-element-gap-md)",e.appendChild(c);const d=f(["Token","Value","Color","Description"],[{token:"--color-outline",value:"#6f797a",description:"Outer borders. Use for component perimeters (e.g., card borders)."},{token:"--color-outline-variant",value:"#bec8ca",description:"Inner dividers. Use for internal separators and lines."}]);e.appendChild(d);const o=document.createElement("h3");o.className="h3",o.textContent="Disabled State",o.style.marginTop="var(--size-section-pad-y-md)",o.style.marginBottom="var(--size-element-gap-md)",e.appendChild(o);const l=f(["Token","Value","Color","Description"],[{token:"--color-on-surface-state-08",value:"rgba(25, 28, 30, 0.08)",description:"Overlay for disabled state. Combine with 38% overall component opacity."}]);e.appendChild(l);const p=document.createElement("h3");p.className="h3",p.textContent="Examples",p.style.marginTop="var(--size-section-pad-y-lg)",p.style.marginBottom="var(--size-element-gap-md)",e.appendChild(p);const m=document.createElement("h4");m.className="h4",m.textContent="Font Colors",m.style.marginTop="var(--size-section-pad-y-md)",m.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(m);const r=document.createElement("div");r.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",r.style.backgroundColor="var(--color-surface-container-lowest)",r.style.borderRadius="var(--size-card-radius-sm)",r.style.border="1px solid var(--color-outline-variant)",r.style.maxWidth="400px";const s=document.createElement("label");s.className="body2-txt",s.textContent="Primary Text (on-surface)",s.style.display="block",s.style.marginBottom="var(--size-element-gap-xs)",s.style.color="var(--color-on-surface)",r.appendChild(s);const i=document.createElement("input");i.type="text",i.className="plus-text-field body2-txt",i.value="Example input text",i.style.marginBottom="var(--size-element-gap-md)",r.appendChild(i);const u=document.createElement("label");u.className="body2-txt",u.textContent="Secondary Text (on-surface-variant)",u.style.display="block",u.style.marginBottom="var(--size-element-gap-xs)",u.style.color="var(--color-on-surface-variant)",r.appendChild(u);const v=document.createElement("div");v.className="body2-txt",v.textContent="Last updated: 2 hours ago",v.style.color="var(--color-on-surface-variant)",r.appendChild(v),e.appendChild(r);const x=document.createElement("h4");x.className="h4",x.textContent="Outline Colors",x.style.marginTop="var(--size-section-pad-y-md)",x.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(x);const y=document.createElement("div");y.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",y.style.backgroundColor="var(--color-surface-container-lowest)",y.style.borderRadius="var(--size-card-radius-sm)",y.style.border="1px solid var(--color-outline)",y.style.maxWidth="400px";const g=document.createElement("div");g.className="h4",g.textContent="Card with Outer Border",g.style.marginBottom="var(--size-element-gap-sm)",y.appendChild(g);const h=document.createElement("div");h.style.height="1px",h.style.backgroundColor="var(--color-outline-variant)",h.style.margin="var(--size-element-gap-md) 0",y.appendChild(h);const b=document.createElement("div");b.className="body2-txt",b.textContent="This divider uses outline-variant (inner divider).",y.appendChild(b),e.appendChild(y);const C=document.createElement("h4");C.className="h4",C.textContent="Disabled State",C.style.marginTop="var(--size-section-pad-y-md)",C.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(C);const T=M.createButton({btnText:"Disabled Button",btnStyle:"primary",btnFill:"filled",btnSize:"default",enabled:!1});return e.appendChild(T),e}},A={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Surface Colors & Elevation",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=document.createElement("p");n.className="body1-txt",n.textContent="Choose surface tokens based on component type and elevation. Elevation implies visual layering; interaction overlays are always additive on top of these base fills.",n.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(n);const a=document.createElement("h3");a.className="h3",a.textContent="Element – Default / Read State",a.style.marginTop="var(--size-section-pad-y-md)",a.style.marginBottom="var(--size-element-gap-md)",e.appendChild(a);const c=document.createElement("p");c.className="body2-txt",c.innerHTML="<strong>Token:</strong> <code>--color-surface</code> | <strong>Elevation:</strong> 0 on top of surface",c.style.marginBottom="var(--size-element-gap-md)",e.appendChild(c);const d=document.createElement("div");d.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",d.style.backgroundColor="var(--color-surface)",d.style.borderRadius="var(--size-card-radius-sm)",d.style.border="1px solid var(--color-outline-variant)",d.style.maxWidth="400px",d.innerHTML='<div class="body2-txt">Default element using --color-surface</div>',e.appendChild(d);const o=document.createElement("h3");o.className="h3",o.textContent="Element – Active",o.style.marginTop="var(--size-section-pad-y-md)",o.style.marginBottom="var(--size-element-gap-md)",e.appendChild(o);const l=document.createElement("p");l.className="body2-txt",l.innerHTML="<strong>Token:</strong> <code>--color-surface-container-highest</code> | <strong>Elevation:</strong> Used for active states layered above container",l.style.marginBottom="var(--size-element-gap-md)",e.appendChild(l);const p=document.createElement("div");p.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",p.style.backgroundColor="var(--color-surface-container-highest)",p.style.borderRadius="var(--size-card-radius-sm)",p.style.border="1px solid var(--color-outline-variant)",p.style.maxWidth="400px",p.innerHTML='<div class="body2-txt">Active element using --color-surface-container-highest</div>',e.appendChild(p);const m=document.createElement("h3");m.className="h3",m.textContent="Table – Default",m.style.marginTop="var(--size-section-pad-y-md)",m.style.marginBottom="var(--size-element-gap-md)",e.appendChild(m);const r=document.createElement("p");r.className="body2-txt",r.innerHTML="<strong>Token:</strong> <code>no-fill</code> | <strong>Elevation:</strong> 0",r.style.marginBottom="var(--size-element-gap-md)",e.appendChild(r);const s=document.createElement("table");s.style.width="100%",s.style.borderCollapse="collapse",s.style.border="1px solid var(--color-outline-variant)",s.style.maxWidth="400px";const i=document.createElement("tr"),u=document.createElement("td");u.className="body2-txt",u.textContent="Cell 1",u.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)";const v=document.createElement("td");v.className="body2-txt",v.textContent="Cell 2",v.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",i.appendChild(u),i.appendChild(v),s.appendChild(i),e.appendChild(s);const x=document.createElement("h3");x.className="h3",x.textContent="Section – Default",x.style.marginTop="var(--size-section-pad-y-md)",x.style.marginBottom="var(--size-element-gap-md)",e.appendChild(x);const y=document.createElement("p");y.className="body2-txt",y.innerHTML="<strong>Token:</strong> <code>--color-surface-container-low</code> (or no-fill) | <strong>Elevation:</strong> 0",y.style.marginBottom="var(--size-element-gap-md)",e.appendChild(y);const g=document.createElement("div");g.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",g.style.backgroundColor="var(--color-surface-container-low)",g.style.borderRadius="var(--size-section-radius-md)",g.style.border="1px solid var(--color-outline-variant)",g.style.maxWidth="400px",g.innerHTML='<div class="body2-txt">Section container using --color-surface-container-low</div>',e.appendChild(g);const h=document.createElement("h3");h.className="h3",h.textContent="Modal – Default",h.style.marginTop="var(--size-section-pad-y-md)",h.style.marginBottom="var(--size-element-gap-md)",e.appendChild(h);const b=document.createElement("p");b.className="body2-txt",b.innerHTML="<strong>Token:</strong> <code>--color-surface-container-high</code> | <strong>Elevation:</strong> <code>--elevation-light-3</code>",b.style.marginBottom="var(--size-element-gap-md)",e.appendChild(b);const C=M.createModal({modalId:"surface-color-modal-example",modalTitle:"Modal Example",modalBody:"This modal uses --color-surface-container-high with elevation token --elevation-light-3.",showCloseButton:!0});C.style.maxWidth="400px",C.style.position="relative",C.style.margin="0",e.appendChild(C);const T=document.createElement("h3");T.className="h3",T.textContent="Card – Default",T.style.marginTop="var(--size-section-pad-y-md)",T.style.marginBottom="var(--size-element-gap-md)",e.appendChild(T);const W=document.createElement("p");W.className="body2-txt",W.innerHTML="<strong>Token:</strong> <code>--color-surface-container-lowest</code> | <strong>Elevation:</strong> <code>--elevation-light-1</code>",W.style.marginBottom="var(--size-element-gap-md)",e.appendChild(W);const H=M.createCard({cardTitle:"Card Example",cardBody:"This card uses --color-surface-container-lowest with elevation token --elevation-light-1."});H.style.maxWidth="400px",e.appendChild(H);const k=document.createElement("h3");k.className="h3",k.textContent="Surface Container – General Wrapper",k.style.marginTop="var(--size-section-pad-y-md)",k.style.marginBottom="var(--size-element-gap-md)",e.appendChild(k);const L=document.createElement("p");L.className="body2-txt",L.innerHTML="<strong>Token:</strong> <code>--color-surface-container</code> | <strong>Elevation:</strong> 0",L.style.marginBottom="var(--size-element-gap-md)",e.appendChild(L);const E=document.createElement("div");E.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",E.style.backgroundColor="var(--color-surface-container)",E.style.borderRadius="var(--size-card-radius-sm)",E.style.border="1px solid var(--color-outline-variant)",E.style.maxWidth="400px",E.innerHTML='<div class="body2-txt">General wrapper using --color-surface-container</div>',e.appendChild(E);const N=document.createElement("h3");N.className="h3",N.textContent="Surface – Base Background",N.style.marginTop="var(--size-section-pad-y-md)",N.style.marginBottom="var(--size-element-gap-md)",e.appendChild(N);const R=document.createElement("p");R.className="body2-txt",R.innerHTML="<strong>Token:</strong> <code>--color-surface</code> | <strong>Elevation:</strong> 0",R.style.marginBottom="var(--size-element-gap-md)",e.appendChild(R);const z=document.createElement("div");return z.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",z.style.backgroundColor="var(--color-surface)",z.style.borderRadius="var(--size-card-radius-sm)",z.style.border="1px solid var(--color-outline-variant)",z.style.maxWidth="400px",z.innerHTML='<div class="body2-txt">Base background using --color-surface</div>',e.appendChild(z),e}},I={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const t=document.createElement("h2");t.className="h2",t.textContent="Universal Interaction Logic",t.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(t);const n=document.createElement("p");n.className="body1-txt",n.textContent="Interaction states are implemented as additive overlays on top of the base surface token. Do not replace the base fill token – apply on-surface state layers above it.",n.style.marginBottom="var(--size-card-gap-md)",e.appendChild(n);const a=document.createElement("ul");a.className="body2-txt",["Hover: Apply on-surface @ 8% opacity on top of the base surface.","Pressed: Apply on-surface @ 16% opacity on top of the base surface.","Focus: Apply on-surface @ 12% opacity and change border to inverse primary.","Disabled: Apply on-surface @ 8% opacity and set total component opacity to 38%."].forEach(o=>{const l=document.createElement("li");l.textContent=o,a.appendChild(l)}),e.appendChild(a);const c=f(["State","Overlay Token","Border / Stroke","Opacity Rule"],[{token:"Default",value:"transparent",border:"No stroke",opacity:"100% opacity"},{token:"Hover",value:"--color-on-surface-state-08",border:"No border change",opacity:"Component remains at 100% opacity"},{token:"Pressed",value:"--color-on-surface-state-16",border:"No border change",opacity:"Component remains at 100% opacity"},{token:"Focus",value:"--color-on-surface-state-12",border:"Border switches to --color-inverse-primary (typically 2px)",opacity:"Component remains at 100% opacity"},{token:"Disabled",value:"--color-on-surface-state-08",border:"No border change",opacity:"Set total component opacity to 38%"}]);e.appendChild(c);const d=document.createElement("p");return d.className="body2-txt",d.style.marginTop="var(--size-section-pad-y-md)",d.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",d.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",d.style.borderRadius="var(--size-card-radius-sm, 12px)",d.innerHTML="<strong>Note:</strong> Table buttons and interactive elements follow the same universal interaction logic shown above.",e.appendChild(d),e}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'PLUS follows Material Design 3 color guidance. All colors follow Material Design 3 roles and are sourced from Figma design system variables. The color system includes accent colors, SMART Framework colors, neutral colors, and state layers for interactive elements.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    return container;
  }
}`,...B.parameters?.docs?.source},description:{story:"Color Overview",...B.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Accent Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Accent colors provide primary, secondary, and tertiary emphasis in the UI. Use primary for main actions, secondary for supporting actions, and tertiary (also used for Info) for contextual emphasis.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);

    // Primary section
    container.appendChild(AccentPrimarySection.render());

    // Secondary section
    const secondarySection = AccentSecondarySection.render();
    secondarySection.style.marginTop = 'var(--size-section-pad-y-lg)';
    container.appendChild(secondarySection);

    // Tertiary section
    const tertiarySection = AccentTertiarySection.render();
    tertiarySection.style.marginTop = 'var(--size-section-pad-y-lg)';
    container.appendChild(tertiarySection);

    // Button Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.className = 'h3';
    examplesTitle.textContent = 'Button Examples';
    examplesTitle.style.marginTop = 'var(--size-section-pad-y-lg)';
    examplesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(examplesTitle);
    const examplesDescription = document.createElement('p');
    examplesDescription.className = 'body2-txt';
    examplesDescription.textContent = 'Accent colors are used in buttons with different fill variants. Below are examples showing filled, outline, and tonal buttons for each accent color.';
    examplesDescription.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(examplesDescription);
    const styles = ['primary', 'secondary', 'tertiary'];
    const fills = ['filled', 'outline', 'tonal'];
    styles.forEach(style => {
      const styleSection = document.createElement('div');
      styleSection.style.marginBottom = 'var(--size-section-pad-y-md)';
      const styleLabel = document.createElement('h4');
      styleLabel.className = 'h4';
      styleLabel.textContent = \`\${style.charAt(0).toUpperCase() + style.slice(1)} Style\`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      const buttonRow = document.createElement('div');
      buttonRow.style.display = 'flex';
      buttonRow.style.flexWrap = 'wrap';
      buttonRow.style.gap = 'var(--size-element-gap-md)';
      buttonRow.style.alignItems = 'center';
      fills.forEach(fill => {
        const button = PlusInterface.createButton({
          btnText: \`\${style.charAt(0).toUpperCase() + style.slice(1)} \${fill.charAt(0).toUpperCase() + fill.slice(1)}\`,
          btnStyle: style,
          btnFill: fill,
          btnSize: 'default'
        });
        buttonRow.appendChild(button);
      });
      styleSection.appendChild(buttonRow);
      container.appendChild(styleSection);
    });
    return container;
  }
}`,...w.parameters?.docs?.source},description:{story:"Combined Accent Colors story",...w.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Status Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const successTitle = document.createElement('h3');
    successTitle.className = 'h3';
    successTitle.textContent = 'Success';
    successTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    successTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(successTitle);
    const successTable = createColorTable(['Token', 'Value', 'Color', 'Description'], [{
      token: '--color-success',
      value: '#3e691a',
      description: 'Main success color - for borders/backgrounds'
    }, {
      token: '--color-success-text',
      value: '#2c5609',
      description: 'Success text color - for text'
    }, {
      token: '--color-on-success',
      value: '#ffffff',
      description: 'Content color on success'
    }, {
      token: '--color-success-container',
      value: '#a1eb83',
      description: 'Success container background'
    }, {
      token: '--color-on-success-container',
      value: '#0c2000',
      description: 'Content color on success container'
    }]);
    container.appendChild(successTable);
    const dangerTitle = document.createElement('h3');
    dangerTitle.className = 'h3';
    dangerTitle.textContent = 'Danger';
    dangerTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    dangerTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(dangerTitle);
    const dangerTable = createColorTable(['Token', 'Value', 'Color', 'Description'], [{
      token: '--color-danger',
      value: '#ba1a1a',
      description: 'Main danger color - for borders/backgrounds'
    }, {
      token: '--color-danger-text',
      value: '#9b0606',
      description: 'Danger text color - for text'
    }, {
      token: '--color-on-danger',
      value: '#ffffff',
      description: 'Content color on danger'
    }, {
      token: '--color-danger-container',
      value: '#ffdad6',
      description: 'Danger container background'
    }, {
      token: '--color-on-danger-container',
      value: '#410002',
      description: 'Content color on danger container'
    }]);
    container.appendChild(dangerTable);
    const warningTitle = document.createElement('h3');
    warningTitle.className = 'h3';
    warningTitle.textContent = 'Warning';
    warningTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    warningTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(warningTitle);
    const warningTable = createColorTable(['Token', 'Value', 'Color', 'Description'], [{
      token: '--color-warning',
      value: '#9f8205',
      description: 'Main warning color - for borders/backgrounds'
    }, {
      token: '--color-warning-text',
      value: '#5b4a00',
      description: 'Warning text color - for text'
    }, {
      token: '--color-on-warning',
      value: '#ffffff',
      description: 'Content color on warning'
    }, {
      token: '--color-warning-container',
      value: '#ffe17a',
      description: 'Warning container background'
    }, {
      token: '--color-on-warning-container',
      value: '#231b00',
      description: 'Content color on warning container'
    }]);
    container.appendChild(warningTable);

    // Alert Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.className = 'h3';
    examplesTitle.textContent = 'Alert Component Examples';
    examplesTitle.style.marginTop = 'var(--size-section-pad-y-lg)';
    examplesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(examplesTitle);
    const examplesDescription = document.createElement('p');
    examplesDescription.className = 'body2-txt';
    examplesDescription.textContent = 'Status colors are used in Alert components to provide contextual feedback. Below are examples showing how each status color is applied in context.';
    examplesDescription.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(examplesDescription);
    const alertExamples = document.createElement('div');
    alertExamples.style.display = 'flex';
    alertExamples.style.flexDirection = 'column';
    alertExamples.style.gap = 'var(--size-card-gap-md)';
    const statusAlerts = [{
      style: 'success',
      title: 'Success Alert',
      text: 'This is a success alert demonstrating the success color tokens.'
    }, {
      style: 'danger',
      title: 'Danger Alert',
      text: 'This is a danger alert demonstrating the danger color tokens.'
    }, {
      style: 'warning',
      title: 'Warning Alert',
      text: 'This is a warning alert demonstrating the warning color tokens.'
    }];
    statusAlerts.forEach(alertData => {
      const alert = PlusInterface.createAlert({
        style: alertData.style,
        title: alertData.title,
        text: alertData.text,
        dismissable: false
      });
      alertExamples.appendChild(alert);
    });
    container.appendChild(alertExamples);
    return container;
  }
}`,...S.parameters?.docs?.source},description:{story:"Status Colors - Success, Danger, Warning",...S.parameters?.docs?.description}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Neutral Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const textTitle = document.createElement('h3');
    textTitle.className = 'h3';
    textTitle.textContent = 'Neutral Font Colors';
    textTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    textTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(textTitle);
    const textTable = createColorTable(['Token', 'Value', 'Color', 'Description'], [{
      token: '--color-on-surface',
      value: '#191c1e',
      description: 'Primary text color. Use for headings and primary content.'
    }, {
      token: '--color-on-surface-variant',
      value: '#3f484a',
      description: 'Secondary text color. Use for subtitles, metadata, and timestamps.'
    }]);
    container.appendChild(textTable);
    const outlineTitle = document.createElement('h3');
    outlineTitle.className = 'h3';
    outlineTitle.textContent = 'Outline Colors';
    outlineTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    outlineTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(outlineTitle);
    const outlineTable = createColorTable(['Token', 'Value', 'Color', 'Description'], [{
      token: '--color-outline',
      value: '#6f797a',
      description: 'Outer borders. Use for component perimeters (e.g., card borders).'
    }, {
      token: '--color-outline-variant',
      value: '#bec8ca',
      description: 'Inner dividers. Use for internal separators and lines.'
    }]);
    container.appendChild(outlineTable);
    const disabledTitle = document.createElement('h3');
    disabledTitle.className = 'h3';
    disabledTitle.textContent = 'Disabled State';
    disabledTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    disabledTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(disabledTitle);
    const disabledTable = createColorTable(['Token', 'Value', 'Color', 'Description'], [{
      token: '--color-on-surface-state-08',
      value: 'rgba(25, 28, 30, 0.08)',
      description: 'Overlay for disabled state. Combine with 38% overall component opacity.'
    }]);
    container.appendChild(disabledTable);

    // Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.className = 'h3';
    examplesTitle.textContent = 'Examples';
    examplesTitle.style.marginTop = 'var(--size-section-pad-y-lg)';
    examplesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(examplesTitle);

    // Font Colors Example
    const fontExampleTitle = document.createElement('h4');
    fontExampleTitle.className = 'h4';
    fontExampleTitle.textContent = 'Font Colors';
    fontExampleTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    fontExampleTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(fontExampleTitle);
    const formExample = document.createElement('div');
    formExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    formExample.style.backgroundColor = 'var(--color-surface-container-lowest)';
    formExample.style.borderRadius = 'var(--size-card-radius-sm)';
    formExample.style.border = '1px solid var(--color-outline-variant)';
    formExample.style.maxWidth = '400px';
    const label1 = document.createElement('label');
    label1.className = 'body2-txt';
    label1.textContent = 'Primary Text (on-surface)';
    label1.style.display = 'block';
    label1.style.marginBottom = 'var(--size-element-gap-xs)';
    label1.style.color = 'var(--color-on-surface)';
    formExample.appendChild(label1);
    const input1 = document.createElement('input');
    input1.type = 'text';
    input1.className = 'plus-text-field body2-txt';
    input1.value = 'Example input text';
    input1.style.marginBottom = 'var(--size-element-gap-md)';
    formExample.appendChild(input1);
    const label2 = document.createElement('label');
    label2.className = 'body2-txt';
    label2.textContent = 'Secondary Text (on-surface-variant)';
    label2.style.display = 'block';
    label2.style.marginBottom = 'var(--size-element-gap-xs)';
    label2.style.color = 'var(--color-on-surface-variant)';
    formExample.appendChild(label2);
    const metadata = document.createElement('div');
    metadata.className = 'body2-txt';
    metadata.textContent = 'Last updated: 2 hours ago';
    metadata.style.color = 'var(--color-on-surface-variant)';
    formExample.appendChild(metadata);
    container.appendChild(formExample);

    // Outline Colors Example
    const outlineExampleTitle = document.createElement('h4');
    outlineExampleTitle.className = 'h4';
    outlineExampleTitle.textContent = 'Outline Colors';
    outlineExampleTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    outlineExampleTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(outlineExampleTitle);
    const cardExample = document.createElement('div');
    cardExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    cardExample.style.backgroundColor = 'var(--color-surface-container-lowest)';
    cardExample.style.borderRadius = 'var(--size-card-radius-sm)';
    cardExample.style.border = '1px solid var(--color-outline)';
    cardExample.style.maxWidth = '400px';
    const cardTitle = document.createElement('div');
    cardTitle.className = 'h4';
    cardTitle.textContent = 'Card with Outer Border';
    cardTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    cardExample.appendChild(cardTitle);
    const divider = document.createElement('div');
    divider.style.height = '1px';
    divider.style.backgroundColor = 'var(--color-outline-variant)';
    divider.style.margin = 'var(--size-element-gap-md) 0';
    cardExample.appendChild(divider);
    const cardText = document.createElement('div');
    cardText.className = 'body2-txt';
    cardText.textContent = 'This divider uses outline-variant (inner divider).';
    cardExample.appendChild(cardText);
    container.appendChild(cardExample);

    // Disabled State Example
    const disabledExampleTitle = document.createElement('h4');
    disabledExampleTitle.className = 'h4';
    disabledExampleTitle.textContent = 'Disabled State';
    disabledExampleTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    disabledExampleTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(disabledExampleTitle);
    const disabledButton = PlusInterface.createButton({
      btnText: 'Disabled Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false
    });
    container.appendChild(disabledButton);
    return container;
  }
}`,...D.parameters?.docs?.source},description:{story:"Neutral Colors",...D.parameters?.docs?.description}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Surface Colors & Elevation';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Choose surface tokens based on component type and elevation. Elevation implies visual layering; interaction overlays are always additive on top of these base fills.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);

    // Element – Default / Read State
    const elementDefaultTitle = document.createElement('h3');
    elementDefaultTitle.className = 'h3';
    elementDefaultTitle.textContent = 'Element – Default / Read State';
    elementDefaultTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    elementDefaultTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementDefaultTitle);
    const elementDefaultInfo = document.createElement('p');
    elementDefaultInfo.className = 'body2-txt';
    elementDefaultInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface</code> | <strong>Elevation:</strong> 0 on top of surface';
    elementDefaultInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementDefaultInfo);
    const elementDefaultExample = document.createElement('div');
    elementDefaultExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    elementDefaultExample.style.backgroundColor = 'var(--color-surface)';
    elementDefaultExample.style.borderRadius = 'var(--size-card-radius-sm)';
    elementDefaultExample.style.border = '1px solid var(--color-outline-variant)';
    elementDefaultExample.style.maxWidth = '400px';
    elementDefaultExample.innerHTML = '<div class="body2-txt">Default element using --color-surface</div>';
    container.appendChild(elementDefaultExample);

    // Element – Active
    const elementActiveTitle = document.createElement('h3');
    elementActiveTitle.className = 'h3';
    elementActiveTitle.textContent = 'Element – Active';
    elementActiveTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    elementActiveTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementActiveTitle);
    const elementActiveInfo = document.createElement('p');
    elementActiveInfo.className = 'body2-txt';
    elementActiveInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-highest</code> | <strong>Elevation:</strong> Used for active states layered above container';
    elementActiveInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementActiveInfo);
    const elementActiveExample = document.createElement('div');
    elementActiveExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    elementActiveExample.style.backgroundColor = 'var(--color-surface-container-highest)';
    elementActiveExample.style.borderRadius = 'var(--size-card-radius-sm)';
    elementActiveExample.style.border = '1px solid var(--color-outline-variant)';
    elementActiveExample.style.maxWidth = '400px';
    elementActiveExample.innerHTML = '<div class="body2-txt">Active element using --color-surface-container-highest</div>';
    container.appendChild(elementActiveExample);

    // Table – Default
    const tableTitle = document.createElement('h3');
    tableTitle.className = 'h3';
    tableTitle.textContent = 'Table – Default';
    tableTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    tableTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(tableTitle);
    const tableInfo = document.createElement('p');
    tableInfo.className = 'body2-txt';
    tableInfo.innerHTML = '<strong>Token:</strong> <code>no-fill</code> | <strong>Elevation:</strong> 0';
    tableInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(tableInfo);
    const tableExample = document.createElement('table');
    tableExample.style.width = '100%';
    tableExample.style.borderCollapse = 'collapse';
    tableExample.style.border = '1px solid var(--color-outline-variant)';
    tableExample.style.maxWidth = '400px';
    const tableRow = document.createElement('tr');
    const tableCell1 = document.createElement('td');
    tableCell1.className = 'body2-txt';
    tableCell1.textContent = 'Cell 1';
    tableCell1.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    const tableCell2 = document.createElement('td');
    tableCell2.className = 'body2-txt';
    tableCell2.textContent = 'Cell 2';
    tableCell2.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    tableRow.appendChild(tableCell1);
    tableRow.appendChild(tableCell2);
    tableExample.appendChild(tableRow);
    container.appendChild(tableExample);

    // Section – Default
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'h3';
    sectionTitle.textContent = 'Section – Default';
    sectionTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    sectionTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(sectionTitle);
    const sectionInfo = document.createElement('p');
    sectionInfo.className = 'body2-txt';
    sectionInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-low</code> (or no-fill) | <strong>Elevation:</strong> 0';
    sectionInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(sectionInfo);
    const sectionExample = document.createElement('div');
    sectionExample.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    sectionExample.style.backgroundColor = 'var(--color-surface-container-low)';
    sectionExample.style.borderRadius = 'var(--size-section-radius-md)';
    sectionExample.style.border = '1px solid var(--color-outline-variant)';
    sectionExample.style.maxWidth = '400px';
    sectionExample.innerHTML = '<div class="body2-txt">Section container using --color-surface-container-low</div>';
    container.appendChild(sectionExample);

    // Modal – Default
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'h3';
    modalTitle.textContent = 'Modal – Default';
    modalTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    modalTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(modalTitle);
    const modalInfo = document.createElement('p');
    modalInfo.className = 'body2-txt';
    modalInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-high</code> | <strong>Elevation:</strong> <code>--elevation-light-3</code>';
    modalInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(modalInfo);
    const modalExample = PlusInterface.createModal({
      modalId: 'surface-color-modal-example',
      modalTitle: 'Modal Example',
      modalBody: 'This modal uses --color-surface-container-high with elevation token --elevation-light-3.',
      showCloseButton: true
    });
    modalExample.style.maxWidth = '400px';
    modalExample.style.position = 'relative';
    modalExample.style.margin = '0';
    container.appendChild(modalExample);

    // Card – Default
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'h3';
    cardTitle.textContent = 'Card – Default';
    cardTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    cardTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(cardTitle);
    const cardInfo = document.createElement('p');
    cardInfo.className = 'body2-txt';
    cardInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-lowest</code> | <strong>Elevation:</strong> <code>--elevation-light-1</code>';
    cardInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(cardInfo);
    const cardExample = PlusInterface.createCard({
      cardTitle: 'Card Example',
      cardBody: 'This card uses --color-surface-container-lowest with elevation token --elevation-light-1.'
    });
    cardExample.style.maxWidth = '400px';
    container.appendChild(cardExample);

    // Surface Container – General Wrapper
    const surfaceContainerTitle = document.createElement('h3');
    surfaceContainerTitle.className = 'h3';
    surfaceContainerTitle.textContent = 'Surface Container – General Wrapper';
    surfaceContainerTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    surfaceContainerTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceContainerTitle);
    const surfaceContainerInfo = document.createElement('p');
    surfaceContainerInfo.className = 'body2-txt';
    surfaceContainerInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container</code> | <strong>Elevation:</strong> 0';
    surfaceContainerInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceContainerInfo);
    const surfaceContainerExample = document.createElement('div');
    surfaceContainerExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    surfaceContainerExample.style.backgroundColor = 'var(--color-surface-container)';
    surfaceContainerExample.style.borderRadius = 'var(--size-card-radius-sm)';
    surfaceContainerExample.style.border = '1px solid var(--color-outline-variant)';
    surfaceContainerExample.style.maxWidth = '400px';
    surfaceContainerExample.innerHTML = '<div class="body2-txt">General wrapper using --color-surface-container</div>';
    container.appendChild(surfaceContainerExample);

    // Surface – Base Background
    const surfaceTitle = document.createElement('h3');
    surfaceTitle.className = 'h3';
    surfaceTitle.textContent = 'Surface – Base Background';
    surfaceTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    surfaceTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceTitle);
    const surfaceInfo = document.createElement('p');
    surfaceInfo.className = 'body2-txt';
    surfaceInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface</code> | <strong>Elevation:</strong> 0';
    surfaceInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceInfo);
    const surfaceExample = document.createElement('div');
    surfaceExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    surfaceExample.style.backgroundColor = 'var(--color-surface)';
    surfaceExample.style.borderRadius = 'var(--size-card-radius-sm)';
    surfaceExample.style.border = '1px solid var(--color-outline-variant)';
    surfaceExample.style.maxWidth = '400px';
    surfaceExample.innerHTML = '<div class="body2-txt">Base background using --color-surface</div>';
    container.appendChild(surfaceExample);
    return container;
  }
}`,...A.parameters?.docs?.source},description:{story:"Surface Colors & Elevation Context",...A.parameters?.docs?.description}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Universal Interaction Logic';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Interaction states are implemented as additive overlays on top of the base surface token. Do not replace the base fill token – apply on-surface state layers above it.';
    description.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(description);
    const logicList = document.createElement('ul');
    logicList.className = 'body2-txt';
    ['Hover: Apply on-surface @ 8% opacity on top of the base surface.', 'Pressed: Apply on-surface @ 16% opacity on top of the base surface.', 'Focus: Apply on-surface @ 12% opacity and change border to inverse primary.', 'Disabled: Apply on-surface @ 8% opacity and set total component opacity to 38%.'].forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      logicList.appendChild(li);
    });
    container.appendChild(logicList);
    const stateTable = createColorTable(['State', 'Overlay Token', 'Border / Stroke', 'Opacity Rule'], [{
      token: 'Default',
      value: 'transparent',
      border: 'No stroke',
      opacity: '100% opacity'
    }, {
      token: 'Hover',
      value: '--color-on-surface-state-08',
      border: 'No border change',
      opacity: 'Component remains at 100% opacity'
    }, {
      token: 'Pressed',
      value: '--color-on-surface-state-16',
      border: 'No border change',
      opacity: 'Component remains at 100% opacity'
    }, {
      token: 'Focus',
      value: '--color-on-surface-state-12',
      border: 'Border switches to --color-inverse-primary (typically 2px)',
      opacity: 'Component remains at 100% opacity'
    }, {
      token: 'Disabled',
      value: '--color-on-surface-state-08',
      border: 'No border change',
      opacity: 'Set total component opacity to 38%'
    }]);
    container.appendChild(stateTable);
    const tableNote = document.createElement('p');
    tableNote.className = 'body2-txt';
    tableNote.style.marginTop = 'var(--size-section-pad-y-md)';
    tableNote.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    tableNote.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    tableNote.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
    tableNote.innerHTML = '<strong>Note:</strong> Table buttons and interactive elements follow the same universal interaction logic shown above.';
    container.appendChild(tableNote);
    return container;
  }
}`,...I.parameters?.docs?.source},description:{story:"Universal Interaction Logic",...I.parameters?.docs?.description}}};const Q=["Overview","AccentColors","StatusColors","NeutralColors","SurfaceColors","InteractionStates"];export{w as AccentColors,I as InteractionStates,D as NeutralColors,B as Overview,S as StatusColors,A as SurfaceColors,Q as __namedExportsOrder,K as default};
