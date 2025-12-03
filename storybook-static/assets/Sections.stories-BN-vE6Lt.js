import{c as u,a as H}from"./index-B5pJPxK1.js";import{c as I,a as V}from"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";function w({user:e="tutor",logoContainerUrl:o=null,logoTextUrl:c=null,id:m=null,onHomeClick:h=null,onTabClick:t=null,classes:l=[]}){const r=document.createElement("div");r.classList.add("plus-sidebar"),m&&(r.id=m),l&&l.length>0&&r.classList.add(...l);const a=document.createElement("div");if(a.classList.add("plus-sidebar-logo"),o||c){const i=document.createElement("div");if(i.classList.add("plus-sidebar-logo-container"),o){const d=document.createElement("img");d.src=o,d.alt="Logo",d.style.width="40px",d.style.height="40px",i.appendChild(d)}if(c){const d=document.createElement("div");d.classList.add("plus-sidebar-logo-text");const p=document.createElement("img");p.src=c,p.alt="PLUS",p.style.height="40px",p.style.width="auto",d.appendChild(p),i.appendChild(d)}a.appendChild(i)}r.appendChild(a);const s=u({text:"Home",icon:"house",state:"selected",onClick:h});r.appendChild(s);const n=document.createElement("div");n.classList.add("plus-sidebar-section");const g=document.createElement("div");g.classList.add("plus-sidebar-section-title");const C=document.createElement("p");C.classList.add("body2-txt"),C.style.fontWeight="var(--font-weight-normal)",C.textContent="Training",g.appendChild(C),n.appendChild(g);const y=u({text:"Lessons",icon:"book-open",state:"enabled",onClick:()=>t&&t("lessons")});n.appendChild(y);const f=u({text:"Onboarding",icon:"clipboard",state:"enabled",onClick:()=>t&&t("onboarding")});n.appendChild(f),r.appendChild(n);const v=document.createElement("div");v.classList.add("plus-sidebar-section");const x=document.createElement("div");x.classList.add("plus-sidebar-section-title");const b=document.createElement("p");b.classList.add("body2-txt"),b.style.fontWeight="var(--font-weight-normal)",b.textContent="Toolkit",x.appendChild(b),v.appendChild(x);const U=u({text:"Sessions",icon:"calendar-alt",state:"enabled",onClick:()=>t&&t("sessions")});v.appendChild(U);const z=u({text:"Slack",icon:"arrow-up-right-from-square",state:"enabled",onClick:()=>t&&t("slack")});if(v.appendChild(z),r.appendChild(v),e==="supervisor"){const i=document.createElement("div");i.classList.add("plus-sidebar-section");const d=document.createElement("div");d.classList.add("plus-sidebar-section-title");const p=document.createElement("p");p.classList.add("body2-txt"),p.style.fontWeight="var(--font-weight-normal)",p.textContent="Admin",d.appendChild(p),i.appendChild(d);const F=u({text:"Tutors",icon:"chart-pie",state:"enabled",onClick:()=>t&&t("tutors")});i.appendChild(F);const J=u({text:"Sessions",icon:"calendar-week",state:"enabled",onClick:()=>t&&t("admin-sessions")});i.appendChild(J);const N=u({text:"Students",icon:"users",state:"enabled",onClick:()=>t&&t("students")});i.appendChild(N);const D=u({text:"Groups",icon:"users-rectangle",state:"enabled",onClick:()=>t&&t("groups")});i.appendChild(D),r.appendChild(i)}return r}function B({mode:e="expanded",breadcrumbItems:o=[{text:"Strategies"}],userName:c="John Doe",userFirstChar:m="J",counterValue:h=2,onSidebarToggle:t=null,onUserClick:l=null,id:r=null,classes:a=[]}){const s=document.createElement("div");s.classList.add("plus-topbar",`plus-topbar-${e}`),r&&(s.id=r),a&&a.length>0&&s.classList.add(...a);const n=document.createElement("div");n.classList.add("flex","flex-row","items-center","self-stretch");const g=document.createElement("div");g.classList.add("plus-topbar-sidebar-control");const C=I({btnText:"",btnStyle:"default",btnFill:"tonal",btnSize:"default",icon:e==="expanded"?"angles-left":"bars",buttonOnClick:t,classes:["plus-topbar-toggle-button"]});g.appendChild(C),n.appendChild(g),s.appendChild(n);const y=document.createElement("div");y.classList.add("plus-topbar-page-control");const f=V({items:o});f.classList.add("plus-topbar-breadcrumb"),f.querySelectorAll(".plus-breadcrumb-current, .plus-breadcrumb-link").forEach(b=>{b.classList.add("body1-txt"),b.style.fontWeight="var(--font-weight-light)"}),y.appendChild(f),s.appendChild(y);const x=H({firstChar:m,name:c,showName:!0,counter:!0,counterValue:h,type:"default",onClick:l,classes:["plus-topbar-user-avatar"]});return s.appendChild(x),s}function W({version:e="v5.2.0",copyright:o="Copyright © Carnegie Mellon University 2024",termsText:c="Terms of Use",termsUrl:m=null,id:h=null,classes:t=[]}){const l=document.createElement("footer");l.classList.add("plus-footer"),h&&(l.id=h),t&&t.length>0&&l.classList.add(...t);const r=document.createElement("div");r.classList.add("plus-footer-footnote");const a=document.createElement("div");a.classList.add("plus-footer-footnote-content");const s=[e,o];if(m){const n=document.createElement("a");n.href=m,n.textContent=c,n.classList.add("plus-footer-link","body3-txt"),n.style.fontWeight="var(--font-weight-light)",n.style.textDecoration="none",n.style.color="var(--color-on-surface)",a.appendChild(document.createTextNode(s.join(" | ")+" | ")),a.appendChild(n)}else{s.push(c);const n=document.createElement("p");n.classList.add("body3-txt"),n.style.fontWeight="var(--font-weight-light)",n.textContent=s.join(" | "),a.appendChild(n)}return r.appendChild(a),l.appendChild(r),l}const _={title:"Specs/Universal/Sections",tags:["autodocs"],parameters:{docs:{description:{component:"Section-level components for universal organisms. These are larger container components used across multiple product pillars."}}}},S={render:()=>{const e=document.createElement("div");e.style.width="250px",e.style.backgroundColor="var(--color-surface-container)",e.style.padding="var(--size-section-pad-y-md)";const o=w({user:"tutor",onHomeClick:()=>console.log("Home clicked"),onTabClick:c=>console.log("Tab clicked:",c)});return e.appendChild(o),e}},k={render:()=>{const e=document.createElement("div");e.style.width="250px",e.style.backgroundColor="var(--color-surface-container)",e.style.padding="var(--size-section-pad-y-md)";const o=w({user:"supervisor",onHomeClick:()=>console.log("Home clicked"),onTabClick:c=>console.log("Tab clicked:",c)});return e.appendChild(o),e}},E={render:()=>{const e=document.createElement("div");e.style.width="100%",e.style.backgroundColor="var(--color-surface-container)",e.style.padding="var(--size-section-pad-y-sm)";const o=B({mode:"expanded",breadcrumbItems:[{text:"Strategies"}],userName:"John Doe",userFirstChar:"J",counterValue:2,onSidebarToggle:()=>console.log("Sidebar toggle clicked"),onUserClick:()=>console.log("User avatar clicked")});return e.appendChild(o),e}},T={render:()=>{const e=document.createElement("div");e.style.width="100%",e.style.backgroundColor="var(--color-surface-container)",e.style.padding="var(--size-section-pad-y-sm)";const o=B({mode:"collapsed",breadcrumbItems:[{text:"Strategies"}],userName:"John Doe",userFirstChar:"J",counterValue:2,onSidebarToggle:()=>console.log("Sidebar toggle clicked"),onUserClick:()=>console.log("User avatar clicked")});return e.appendChild(o),e}},L={render:()=>{const e=document.createElement("div");e.style.width="100%",e.style.backgroundColor="var(--color-surface-container)",e.style.padding="var(--size-section-pad-y-md)";const o=W({version:"v5.2.0",copyright:"Copyright © Carnegie Mellon University 2024",termsText:"Terms of Use",termsUrl:"#"});return e.appendChild(o),e}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.width = '250px';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const sidebar = createSidebar({
      user: 'tutor',
      onHomeClick: () => console.log('Home clicked'),
      onTabClick: tabName => console.log('Tab clicked:', tabName)
    });
    container.appendChild(sidebar);
    return container;
  }
}`,...S.parameters?.docs?.source},description:{story:`Sidebar - Tutor Variant
Shows sidebar for tutor user type`,...S.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.width = '250px';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const sidebar = createSidebar({
      user: 'supervisor',
      onHomeClick: () => console.log('Home clicked'),
      onTabClick: tabName => console.log('Tab clicked:', tabName)
    });
    container.appendChild(sidebar);
    return container;
  }
}`,...k.parameters?.docs?.source},description:{story:`Sidebar - Supervisor Variant
Shows sidebar for supervisor user type (includes Admin section)`,...k.parameters?.docs?.description}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-sm)';
    const topBar = createTopBar({
      mode: 'expanded',
      breadcrumbItems: [{
        text: 'Strategies'
      }],
      userName: 'John Doe',
      userFirstChar: 'J',
      counterValue: 2,
      onSidebarToggle: () => console.log('Sidebar toggle clicked'),
      onUserClick: () => console.log('User avatar clicked')
    });
    container.appendChild(topBar);
    return container;
  }
}`,...E.parameters?.docs?.source},description:{story:`Top Bar - Expanded Mode
Shows top bar in expanded mode with sidebar toggle, breadcrumb, and user avatar`,...E.parameters?.docs?.description}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-sm)';
    const topBar = createTopBar({
      mode: 'collapsed',
      breadcrumbItems: [{
        text: 'Strategies'
      }],
      userName: 'John Doe',
      userFirstChar: 'J',
      counterValue: 2,
      onSidebarToggle: () => console.log('Sidebar toggle clicked'),
      onUserClick: () => console.log('User avatar clicked')
    });
    container.appendChild(topBar);
    return container;
  }
}`,...T.parameters?.docs?.source},description:{story:`Top Bar - Collapsed Mode
Shows top bar in collapsed mode`,...T.parameters?.docs?.description}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const footer = createFooter({
      version: 'v5.2.0',
      copyright: 'Copyright © Carnegie Mellon University 2024',
      termsText: 'Terms of Use',
      termsUrl: '#'
    });
    container.appendChild(footer);
    return container;
  }
}`,...L.parameters?.docs?.source},description:{story:`Footer - Default
Shows footer with version, copyright, and terms of use`,...L.parameters?.docs?.description}}};const j=["SidebarTutor","SidebarSupervisor","TopBarExpanded","TopBarCollapsed","FooterDefault"];export{L as FooterDefault,k as SidebarSupervisor,S as SidebarTutor,T as TopBarCollapsed,E as TopBarExpanded,j as __namedExportsOrder,_ as default};
