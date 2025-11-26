const T={title:"Styles/Icons",tags:["autodocs"],parameters:{docs:{description:{component:"Icon system using Font Awesome 6 Free icon library. Icons use typography-based sizing tokens and support solid and regular styles."}}}};function v(e,i){const a=document.createElement("table");a.style.width="100%",a.style.borderCollapse="collapse",a.style.marginBottom="var(--size-section-pad-y-md)",a.style.border="1px solid var(--color-outline-variant, #bec8ca)";const o=document.createElement("thead"),l=document.createElement("tr");l.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",l.style.borderBottom="2px solid var(--color-outline, #6f797a)",e.forEach(n=>{const s=document.createElement("th");s.textContent=n,s.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)",s.style.textAlign="left",s.style.fontWeight="600",s.className="body2-txt",l.appendChild(s)}),o.appendChild(l),a.appendChild(o);const t=document.createElement("tbody");return i.forEach(n=>{const s=document.createElement("tr");s.style.borderBottom="1px solid var(--color-outline-variant, #bec8ca)";const r=document.createElement("td");r.style.padding="var(--size-table-cell-y) var(--size-table-cell-x)";const c=document.createElement("code");c.textContent=n.token,c.style.fontSize="0.875rem",r.appendChild(c),s.appendChild(r);const d=document.createElement("td");d.textContent=n.size,d.style.fontFamily="monospace",d.style.fontSize="0.875rem",s.appendChild(d);const m=document.createElement("td");m.textContent=n.lineHeight,m.style.fontFamily="monospace",m.style.fontSize="0.875rem",s.appendChild(m);const y=document.createElement("td");y.textContent=n.description,y.className="body2-txt",s.appendChild(y),t.appendChild(s)}),a.appendChild(t),a}const g={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="var(--size-section-pad-y-lg)";const i=document.createElement("div");i.style.marginBottom="var(--size-section-pad-y-md)";const a=document.createElement("h2");a.className="h3",a.textContent="Font Awesome Free Icon Library",i.appendChild(a);const o=document.createElement("p");o.className="body2-txt",o.style.marginTop="var(--size-element-gap-sm)",o.innerHTML=`
      PLUS Design System uses <strong>Font Awesome's free icon library</strong> for all icons.
      Font Awesome provides thousands of free icons that can be used with simple CSS classes.
      <br><br>
      <strong>Resources:</strong><br>
      • <a href="https://fontawesome.com/icons" target="_blank">Icon Library</a> - Browse and search all available icons<br>
      • <a href="https://fontawesome.com/docs" target="_blank">Documentation</a> - Complete Font Awesome documentation<br>
      • All icons with the "Free" badge are available for use in PLUS Design System
    `,i.appendChild(o),e.appendChild(i);const l=document.createElement("div");l.style.marginBottom="var(--size-section-pad-y-md)";const t=document.createElement("h3");t.className="h4",t.textContent="Icon Styles",l.appendChild(t);const n=document.createElement("ul");n.className="body2-txt",n.style.marginTop="var(--size-element-gap-sm)",n.style.paddingLeft="var(--size-element-pad-x-md)";const s=document.createElement("li");s.innerHTML="<strong>Solid (fas)</strong>: Filled icons for emphasis or primary actions",n.appendChild(s);const r=document.createElement("li");r.innerHTML="<strong>Regular (far)</strong>: Outlined icons for secondary actions or lighter emphasis",n.appendChild(r),l.appendChild(n),e.appendChild(l);const c=document.createElement("div");c.style.marginBottom="var(--size-section-pad-y-md)";const d=document.createElement("h3");d.className="h4",d.textContent="Usage Example",c.appendChild(d);const m=document.createElement("pre");return m.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",m.style.padding="var(--size-element-pad-y-md) var(--size-element-pad-x-md)",m.style.borderRadius="var(--size-element-radius-sm)",m.style.overflow="auto",m.style.marginTop="var(--size-element-gap-sm)",m.innerHTML=`<code class="body3-txt">&lt;i class="fas fa-star"&gt;&lt;/i&gt;
&lt;i class="far fa-star"&gt;&lt;/i&gt;</code>`,c.appendChild(m),e.appendChild(c),e}},h={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="var(--size-section-pad-y-lg)";const i=document.createElement("h2");i.className="h3",i.textContent="Font Awesome Solid Icon Tokens",i.style.marginBottom="var(--size-element-gap-md)",e.appendChild(i);const a=document.createElement("p");a.className="body2-txt",a.textContent="Font Awesome solid icons use specific sizing tokens that correspond to typography levels. Icons should match the text size they accompany.",a.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(a);const o=document.createElement("h3");o.className="h4",o.textContent="Headline Icons",o.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(o);const l=v(["Token","Size","Line Height","Description"],[{token:"--font-size-fa-h1-solid",size:"36px (2.25rem)",lineHeight:"177.8%",description:"H1 headline icon size"},{token:"--font-size-fa-h2-solid",size:"28px (1.75rem)",lineHeight:"171.4%",description:"H2 headline icon size"},{token:"--font-size-fa-h3-solid",size:"24px (1.5rem)",lineHeight:"166.7%",description:"H3 headline icon size"},{token:"--font-size-fa-h4-solid",size:"20px (1.25rem)",lineHeight:"160%",description:"H4 headline icon size"},{token:"--font-size-fa-h5-solid",size:"16px (1rem)",lineHeight:"175%",description:"H5 headline icon size"},{token:"--font-size-fa-h6-solid",size:"14px (0.875rem)",lineHeight:"171.4%",description:"H6 headline icon size"}]);e.appendChild(l);const t=document.createElement("h3");t.className="h4",t.textContent="Body Icons",t.style.marginTop="var(--size-section-pad-y-md)",t.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(t);const n=v(["Token","Size","Line Height","Description"],[{token:"--font-size-fa-body1-solid",size:"14px (0.875rem)",lineHeight:"171.4%",description:"Body 1 icon size"},{token:"--font-size-fa-body2-solid",size:"12px (0.75rem)",lineHeight:"183.3%",description:"Body 2 icon size (default)"},{token:"--font-size-fa-body3-solid",size:"10px (0.625rem)",lineHeight:"200%",description:"Body 3 icon size"}]);return e.appendChild(n),e}},f={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="var(--size-section-pad-y-lg)";const i=document.createElement("h2");i.className="h3",i.textContent="Font Awesome Regular Icon Tokens",i.style.marginBottom="var(--size-element-gap-md)",e.appendChild(i);const a=document.createElement("p");a.className="body2-txt",a.textContent="Font Awesome regular (outlined) icons use the same sizing tokens as solid icons, matching typography levels.",a.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(a);const o=document.createElement("h3");o.className="h4",o.textContent="Headline Icons",o.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(o);const l=v(["Token","Size","Line Height","Description"],[{token:"--font-size-fa-h1-regular",size:"36px (2.25rem)",lineHeight:"177.8%",description:"H1 headline icon size"},{token:"--font-size-fa-h2-regular",size:"28px (1.75rem)",lineHeight:"171.4%",description:"H2 headline icon size"},{token:"--font-size-fa-h3-regular",size:"24px (1.5rem)",lineHeight:"166.7%",description:"H3 headline icon size"},{token:"--font-size-fa-h4-regular",size:"20px (1.25rem)",lineHeight:"160%",description:"H4 headline icon size"},{token:"--font-size-fa-h5-regular",size:"16px (1rem)",lineHeight:"175%",description:"H5 headline icon size"},{token:"--font-size-fa-h6-regular",size:"14px (0.875rem)",lineHeight:"171.4%",description:"H6 headline icon size"}]);e.appendChild(l);const t=document.createElement("h3");t.className="h4",t.textContent="Body Icons",t.style.marginTop="var(--size-section-pad-y-md)",t.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(t);const n=v(["Token","Size","Line Height","Description"],[{token:"--font-size-fa-body1-regular",size:"14px (0.875rem)",lineHeight:"171.4%",description:"Body 1 icon size"},{token:"--font-size-fa-body2-regular",size:"12px (0.75rem)",lineHeight:"183.3%",description:"Body 2 icon size (default)"},{token:"--font-size-fa-body3-regular",size:"10px (0.625rem)",lineHeight:"200%",description:"Body 3 icon size"}]);return e.appendChild(n),e}},u={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="var(--size-section-pad-y-lg)";const i=document.createElement("h2");i.className="h3",i.textContent="Icon Examples",i.style.marginBottom="var(--size-element-gap-md)",e.appendChild(i);const a=[{class:"fas",label:"Solid"},{class:"far",label:"Regular"}],o=(t,n,s)=>({label:t,size:s,getSizeToken:r=>`--font-size-fa-${n}${r?"-solid":"-regular"}`,getLineHeightToken:r=>`--font-line-height-fa-${n}${r?"-solid":"-regular"}`}),l=[o("H1","h1","36px"),o("H2","h2","28px"),o("H3","h3","24px"),o("H4","h4","20px"),o("H5","h5","16px"),o("H6","h6","14px"),o("Body 1","body1","14px"),o("Body 2","body2","12px"),o("Body 3","body3","10px")];return a.forEach(t=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",n.style.marginBottom="var(--size-section-pad-y-md)";const s=document.createElement("div");s.className="h4",s.textContent=`${t.label} Style - All Sizes`,s.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(s);const r=document.createElement("div");r.style.display="flex",r.style.alignItems="center",r.style.gap="var(--size-section-gap-md)",r.style.flexWrap="wrap",l.forEach(c=>{const d=document.createElement("div");d.style.display="flex",d.style.flexDirection="column",d.style.alignItems="center",d.style.gap="var(--size-element-gap-sm)",d.style.padding="var(--size-element-pad-y-md)",d.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",d.style.borderRadius="var(--size-element-radius-sm)";const m=document.createElement("i"),y=t.class==="fas"?"fa-circle-check":"fa-circle";m.className=`${t.class} ${y}`;const x=t.class==="fas",C=c.getSizeToken(x),k=c.getLineHeightToken(x);m.style.fontSize=`var(${C})`,m.style.lineHeight=`var(${k})`,m.style.color="var(--color-on-surface-variant, #3f484a)",m.setAttribute("aria-hidden","true"),d.appendChild(m);const b=document.createElement("div");b.className="body3-txt",b.textContent=`${c.label} (${c.size})`,b.style.marginTop="var(--size-element-gap-xs)",d.appendChild(b);const p=document.createElement("div");p.className="body3-txt",p.style.fontFamily="monospace",p.style.fontSize="0.75rem",p.style.color="var(--color-on-surface-variant)",p.textContent=C,d.appendChild(p),r.appendChild(d)}),n.appendChild(r),e.appendChild(n)}),e}},z={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="var(--size-section-pad-y-lg)";const i=document.createElement("h2");i.className="h3",i.textContent="Common Icons",i.style.marginBottom="var(--size-element-gap-md)",e.appendChild(i);const a=document.createElement("p");a.className="body2-txt",a.textContent="Examples of commonly used Font Awesome free icons. Browse all available icons at https://fontawesome.com/icons",a.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(a);const o=[{name:"circle-check",label:"Check",class:"fas"},{name:"xmark",label:"Close",class:"fas"},{name:"user",label:"User",class:"far"},{name:"house",label:"Home",class:"fas"},{name:"gear",label:"Settings",class:"fas"},{name:"magnifying-glass",label:"Search",class:"fas"},{name:"bell",label:"Notification",class:"far"},{name:"envelope",label:"Message",class:"far"},{name:"heart",label:"Favorite",class:"far"},{name:"star",label:"Star",class:"fas"},{name:"arrow-right",label:"Arrow Right",class:"fas"},{name:"arrow-left",label:"Arrow Left",class:"fas"},{name:"chevron-down",label:"Chevron Down",class:"fas"},{name:"chevron-up",label:"Chevron Up",class:"fas"},{name:"plus",label:"Add",class:"fas"},{name:"minus",label:"Remove",class:"fas"},{name:"pen-to-square",label:"Edit",class:"far"},{name:"trash-can",label:"Delete",class:"far"},{name:"download",label:"Download",class:"fas"},{name:"upload",label:"Upload",class:"fas"}],l=document.createElement("div");return l.style.display="grid",l.style.gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))",l.style.gap="var(--size-element-gap-md)",o.forEach(t=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.alignItems="center",n.style.gap="var(--size-element-gap-sm)",n.style.padding="var(--size-element-pad-y-md)",n.style.backgroundColor="var(--color-surface-container-low, #f3f3f6)",n.style.borderRadius="var(--size-element-radius-sm)";const s=document.createElement("i");s.className=`${t.class} fa-${t.name}`,s.style.fontSize="var(--font-size-fa-body2-solid, 12px)",s.style.color="var(--color-on-surface-variant, #3f484a)",s.setAttribute("aria-hidden","true"),n.appendChild(s);const r=document.createElement("div");r.className="body3-txt",r.textContent=t.label,n.appendChild(r);const c=document.createElement("div");c.className="body3-txt",c.style.fontFamily="monospace",c.style.fontSize="0.75rem",c.style.color="var(--color-on-surface-variant)",c.textContent=`fa-${t.name}`,n.appendChild(c),l.appendChild(n)}),e.appendChild(l),e}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';

    // Introduction
    const intro = document.createElement('div');
    intro.style.marginBottom = 'var(--size-section-pad-y-md)';
    const introTitle = document.createElement('h2');
    introTitle.className = 'h3';
    introTitle.textContent = 'Font Awesome Free Icon Library';
    intro.appendChild(introTitle);
    const introText = document.createElement('p');
    introText.className = 'body2-txt';
    introText.style.marginTop = 'var(--size-element-gap-sm)';
    introText.innerHTML = \`
      PLUS Design System uses <strong>Font Awesome's free icon library</strong> for all icons.
      Font Awesome provides thousands of free icons that can be used with simple CSS classes.
      <br><br>
      <strong>Resources:</strong><br>
      • <a href="https://fontawesome.com/icons" target="_blank">Icon Library</a> - Browse and search all available icons<br>
      • <a href="https://fontawesome.com/docs" target="_blank">Documentation</a> - Complete Font Awesome documentation<br>
      • All icons with the "Free" badge are available for use in PLUS Design System
    \`;
    intro.appendChild(introText);
    container.appendChild(intro);

    // Icon Styles
    const stylesSection = document.createElement('div');
    stylesSection.style.marginBottom = 'var(--size-section-pad-y-md)';
    const stylesTitle = document.createElement('h3');
    stylesTitle.className = 'h4';
    stylesTitle.textContent = 'Icon Styles';
    stylesSection.appendChild(stylesTitle);
    const stylesList = document.createElement('ul');
    stylesList.className = 'body2-txt';
    stylesList.style.marginTop = 'var(--size-element-gap-sm)';
    stylesList.style.paddingLeft = 'var(--size-element-pad-x-md)';
    const solidItem = document.createElement('li');
    solidItem.innerHTML = '<strong>Solid (fas)</strong>: Filled icons for emphasis or primary actions';
    stylesList.appendChild(solidItem);
    const regularItem = document.createElement('li');
    regularItem.innerHTML = '<strong>Regular (far)</strong>: Outlined icons for secondary actions or lighter emphasis';
    stylesList.appendChild(regularItem);
    stylesSection.appendChild(stylesList);
    container.appendChild(stylesSection);

    // Usage Example
    const usageSection = document.createElement('div');
    usageSection.style.marginBottom = 'var(--size-section-pad-y-md)';
    const usageTitle = document.createElement('h3');
    usageTitle.className = 'h4';
    usageTitle.textContent = 'Usage Example';
    usageSection.appendChild(usageTitle);
    const codeBlock = document.createElement('pre');
    codeBlock.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    codeBlock.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    codeBlock.style.borderRadius = 'var(--size-element-radius-sm)';
    codeBlock.style.overflow = 'auto';
    codeBlock.style.marginTop = 'var(--size-element-gap-sm)';
    codeBlock.innerHTML = \`<code class="body3-txt">&lt;i class="fas fa-star"&gt;&lt;/i&gt;
&lt;i class="far fa-star"&gt;&lt;/i&gt;</code>\`;
    usageSection.appendChild(codeBlock);
    container.appendChild(usageSection);
    return container;
  }
}`,...g.parameters?.docs?.source},description:{story:`Overview
Complete icon token reference and usage guide`,...g.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Font Awesome Solid Icon Tokens';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body2-txt';
    description.textContent = 'Font Awesome solid icons use specific sizing tokens that correspond to typography levels. Icons should match the text size they accompany.';
    description.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(description);

    // Headline Icons
    const headlineTitle = document.createElement('h3');
    headlineTitle.className = 'h4';
    headlineTitle.textContent = 'Headline Icons';
    headlineTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(headlineTitle);
    const headlineTable = createIconTokenTable(['Token', 'Size', 'Line Height', 'Description'], [{
      token: '--font-size-fa-h1-solid',
      size: '36px (2.25rem)',
      lineHeight: '177.8%',
      description: 'H1 headline icon size'
    }, {
      token: '--font-size-fa-h2-solid',
      size: '28px (1.75rem)',
      lineHeight: '171.4%',
      description: 'H2 headline icon size'
    }, {
      token: '--font-size-fa-h3-solid',
      size: '24px (1.5rem)',
      lineHeight: '166.7%',
      description: 'H3 headline icon size'
    }, {
      token: '--font-size-fa-h4-solid',
      size: '20px (1.25rem)',
      lineHeight: '160%',
      description: 'H4 headline icon size'
    }, {
      token: '--font-size-fa-h5-solid',
      size: '16px (1rem)',
      lineHeight: '175%',
      description: 'H5 headline icon size'
    }, {
      token: '--font-size-fa-h6-solid',
      size: '14px (0.875rem)',
      lineHeight: '171.4%',
      description: 'H6 headline icon size'
    }]);
    container.appendChild(headlineTable);

    // Body Icons
    const bodyTitle = document.createElement('h3');
    bodyTitle.className = 'h4';
    bodyTitle.textContent = 'Body Icons';
    bodyTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    bodyTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(bodyTitle);
    const bodyTable = createIconTokenTable(['Token', 'Size', 'Line Height', 'Description'], [{
      token: '--font-size-fa-body1-solid',
      size: '14px (0.875rem)',
      lineHeight: '171.4%',
      description: 'Body 1 icon size'
    }, {
      token: '--font-size-fa-body2-solid',
      size: '12px (0.75rem)',
      lineHeight: '183.3%',
      description: 'Body 2 icon size (default)'
    }, {
      token: '--font-size-fa-body3-solid',
      size: '10px (0.625rem)',
      lineHeight: '200%',
      description: 'Body 3 icon size'
    }]);
    container.appendChild(bodyTable);
    return container;
  }
}`,...h.parameters?.docs?.source},description:{story:`Icon Size Tokens - Solid
Font Awesome Solid icon sizing tokens`,...h.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Font Awesome Regular Icon Tokens';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body2-txt';
    description.textContent = 'Font Awesome regular (outlined) icons use the same sizing tokens as solid icons, matching typography levels.';
    description.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(description);

    // Headline Icons
    const headlineTitle = document.createElement('h3');
    headlineTitle.className = 'h4';
    headlineTitle.textContent = 'Headline Icons';
    headlineTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(headlineTitle);
    const headlineTable = createIconTokenTable(['Token', 'Size', 'Line Height', 'Description'], [{
      token: '--font-size-fa-h1-regular',
      size: '36px (2.25rem)',
      lineHeight: '177.8%',
      description: 'H1 headline icon size'
    }, {
      token: '--font-size-fa-h2-regular',
      size: '28px (1.75rem)',
      lineHeight: '171.4%',
      description: 'H2 headline icon size'
    }, {
      token: '--font-size-fa-h3-regular',
      size: '24px (1.5rem)',
      lineHeight: '166.7%',
      description: 'H3 headline icon size'
    }, {
      token: '--font-size-fa-h4-regular',
      size: '20px (1.25rem)',
      lineHeight: '160%',
      description: 'H4 headline icon size'
    }, {
      token: '--font-size-fa-h5-regular',
      size: '16px (1rem)',
      lineHeight: '175%',
      description: 'H5 headline icon size'
    }, {
      token: '--font-size-fa-h6-regular',
      size: '14px (0.875rem)',
      lineHeight: '171.4%',
      description: 'H6 headline icon size'
    }]);
    container.appendChild(headlineTable);

    // Body Icons
    const bodyTitle = document.createElement('h3');
    bodyTitle.className = 'h4';
    bodyTitle.textContent = 'Body Icons';
    bodyTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    bodyTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(bodyTitle);
    const bodyTable = createIconTokenTable(['Token', 'Size', 'Line Height', 'Description'], [{
      token: '--font-size-fa-body1-regular',
      size: '14px (0.875rem)',
      lineHeight: '171.4%',
      description: 'Body 1 icon size'
    }, {
      token: '--font-size-fa-body2-regular',
      size: '12px (0.75rem)',
      lineHeight: '183.3%',
      description: 'Body 2 icon size (default)'
    }, {
      token: '--font-size-fa-body3-regular',
      size: '10px (0.625rem)',
      lineHeight: '200%',
      description: 'Body 3 icon size'
    }]);
    container.appendChild(bodyTable);
    return container;
  }
}`,...f.parameters?.docs?.source},description:{story:`Icon Size Tokens - Regular
Font Awesome Regular icon sizing tokens`,...f.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Icon Examples';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    const styles = [{
      class: 'fas',
      label: 'Solid'
    }, {
      class: 'far',
      label: 'Regular'
    }];

    // Define sizes with proper token names for both solid and regular
    const getSizeConfig = (displayLabel, baseName, sizePx) => {
      return {
        label: displayLabel,
        size: sizePx,
        getSizeToken: isSolid => \`--font-size-fa-\${baseName}\${isSolid ? '-solid' : '-regular'}\`,
        getLineHeightToken: isSolid => \`--font-line-height-fa-\${baseName}\${isSolid ? '-solid' : '-regular'}\`
      };
    };
    const sizes = [getSizeConfig('H1', 'h1', '36px'), getSizeConfig('H2', 'h2', '28px'), getSizeConfig('H3', 'h3', '24px'), getSizeConfig('H4', 'h4', '20px'), getSizeConfig('H5', 'h5', '16px'), getSizeConfig('H6', 'h6', '14px'), getSizeConfig('Body 1', 'body1', '14px'), getSizeConfig('Body 2', 'body2', '12px'), getSizeConfig('Body 3', 'body3', '10px')];

    // Organize by visual style - each style shows all sizes
    styles.forEach(style => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      styleSection.style.marginBottom = 'var(--size-section-pad-y-md)';
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h4';
      styleLabel.textContent = \`\${style.label} Style - All Sizes\`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      const sizesContainer = document.createElement('div');
      sizesContainer.style.display = 'flex';
      sizesContainer.style.alignItems = 'center';
      sizesContainer.style.gap = 'var(--size-section-gap-md)';
      sizesContainer.style.flexWrap = 'wrap';
      sizes.forEach(size => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = 'var(--size-element-gap-sm)';
        wrapper.style.padding = 'var(--size-element-pad-y-md)';
        wrapper.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
        wrapper.style.borderRadius = 'var(--size-element-radius-sm)';
        const icon = document.createElement('i');
        // Font Awesome 6 uses: fas/far for style, fa-{icon-name} for icon
        // Using fa-circle-check as a reliable test icon (exists in both solid and regular)
        const iconName = style.class === 'fas' ? 'fa-circle-check' : 'fa-circle';
        icon.className = \`\${style.class} \${iconName}\`;
        // Apply Font Awesome size token directly - don't use typography classes as they override font-family
        const isSolid = style.class === 'fas';
        const sizeToken = size.getSizeToken(isSolid);
        const lineHeightToken = size.getLineHeightToken(isSolid);
        icon.style.fontSize = \`var(\${sizeToken})\`;
        icon.style.lineHeight = \`var(\${lineHeightToken})\`;
        icon.style.color = 'var(--color-on-surface-variant, #3f484a)';
        icon.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(icon);
        const label = document.createElement('div');
        label.className = 'body3-txt';
        label.textContent = \`\${size.label} (\${size.size})\`;
        label.style.marginTop = 'var(--size-element-gap-xs)';
        wrapper.appendChild(label);
        const tokenLabel = document.createElement('div');
        tokenLabel.className = 'body3-txt';
        tokenLabel.style.fontFamily = 'monospace';
        tokenLabel.style.fontSize = '0.75rem';
        tokenLabel.style.color = 'var(--color-on-surface-variant)';
        // Show the actual token being used
        tokenLabel.textContent = sizeToken;
        wrapper.appendChild(tokenLabel);
        sizesContainer.appendChild(wrapper);
      });
      styleSection.appendChild(sizesContainer);
      container.appendChild(styleSection);
    });
    return container;
  }
}`,...u.parameters?.docs?.source},description:{story:`Icon Examples
Visual examples of icons with different sizes and styles`,...u.parameters?.docs?.description}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Common Icons';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body2-txt';
    description.textContent = 'Examples of commonly used Font Awesome free icons. Browse all available icons at https://fontawesome.com/icons';
    description.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(description);
    const commonIcons = [{
      name: 'circle-check',
      label: 'Check',
      class: 'fas'
    }, {
      name: 'xmark',
      label: 'Close',
      class: 'fas'
    }, {
      name: 'user',
      label: 'User',
      class: 'far'
    }, {
      name: 'house',
      label: 'Home',
      class: 'fas'
    }, {
      name: 'gear',
      label: 'Settings',
      class: 'fas'
    }, {
      name: 'magnifying-glass',
      label: 'Search',
      class: 'fas'
    }, {
      name: 'bell',
      label: 'Notification',
      class: 'far'
    }, {
      name: 'envelope',
      label: 'Message',
      class: 'far'
    }, {
      name: 'heart',
      label: 'Favorite',
      class: 'far'
    }, {
      name: 'star',
      label: 'Star',
      class: 'fas'
    }, {
      name: 'arrow-right',
      label: 'Arrow Right',
      class: 'fas'
    }, {
      name: 'arrow-left',
      label: 'Arrow Left',
      class: 'fas'
    }, {
      name: 'chevron-down',
      label: 'Chevron Down',
      class: 'fas'
    }, {
      name: 'chevron-up',
      label: 'Chevron Up',
      class: 'fas'
    }, {
      name: 'plus',
      label: 'Add',
      class: 'fas'
    }, {
      name: 'minus',
      label: 'Remove',
      class: 'fas'
    }, {
      name: 'pen-to-square',
      label: 'Edit',
      class: 'far'
    }, {
      name: 'trash-can',
      label: 'Delete',
      class: 'far'
    }, {
      name: 'download',
      label: 'Download',
      class: 'fas'
    }, {
      name: 'upload',
      label: 'Upload',
      class: 'fas'
    }];
    const iconsGrid = document.createElement('div');
    iconsGrid.style.display = 'grid';
    iconsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
    iconsGrid.style.gap = 'var(--size-element-gap-md)';
    commonIcons.forEach(iconData => {
      const iconWrapper = document.createElement('div');
      iconWrapper.style.display = 'flex';
      iconWrapper.style.flexDirection = 'column';
      iconWrapper.style.alignItems = 'center';
      iconWrapper.style.gap = 'var(--size-element-gap-sm)';
      iconWrapper.style.padding = 'var(--size-element-pad-y-md)';
      iconWrapper.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
      iconWrapper.style.borderRadius = 'var(--size-element-radius-sm)';
      const icon = document.createElement('i');
      // Don't use typography classes on icons - they override FontAwesome's font-family
      icon.className = \`\${iconData.class} fa-\${iconData.name}\`;
      // Apply size using FontAwesome token if needed, or let it inherit
      icon.style.fontSize = 'var(--font-size-fa-body2-solid, 12px)';
      icon.style.color = 'var(--color-on-surface-variant, #3f484a)';
      icon.setAttribute('aria-hidden', 'true');
      iconWrapper.appendChild(icon);
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = iconData.label;
      iconWrapper.appendChild(label);
      const codeLabel = document.createElement('div');
      codeLabel.className = 'body3-txt';
      codeLabel.style.fontFamily = 'monospace';
      codeLabel.style.fontSize = '0.75rem';
      codeLabel.style.color = 'var(--color-on-surface-variant)';
      codeLabel.textContent = \`fa-\${iconData.name}\`;
      iconWrapper.appendChild(codeLabel);
      iconsGrid.appendChild(iconWrapper);
    });
    container.appendChild(iconsGrid);
    return container;
  }
}`,...z.parameters?.docs?.source},description:{story:`Common Icons
Examples of commonly used Font Awesome free icons`,...z.parameters?.docs?.description}}};const E=["Overview","IconSizeTokensSolid","IconSizeTokensRegular","IconExamples","CommonIcons"];export{z as CommonIcons,u as IconExamples,f as IconSizeTokensRegular,h as IconSizeTokensSolid,g as Overview,E as __namedExportsOrder,T as default};
