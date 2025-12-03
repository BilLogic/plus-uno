import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const W={title:"Components/Collapse",tags:["autodocs"],parameters:{docs:{description:{component:"Collapse component for showing and hiding content through a clickable trigger. Built on Bootstrap 4.6.2 collapse functionality with PLUS design token customizations. Supports three types: default, multiple target, and accordion."}}}},v={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)",t.style.padding="var(--size-section-pad-x-md)",t.style.backgroundColor="var(--color-surface)",t.style.width="511px";const l=document.createElement("div");l.style.display="flex",l.style.flexDirection="column",l.style.gap="var(--size-element-gap-lg)";const n=document.createElement("div");n.style.display="flex",n.style.gap="var(--size-section-gap-md)",n.style.width="100%";const a=o.createButton({btnId:"default-link-button",btnText:"Link with href",btnStyle:"primary",btnFill:"filled",btnSize:"default",btnLink:"#default-collapse"});a.setAttribute("data-toggle","collapse"),a.setAttribute("data-target","#default-collapse"),a.setAttribute("aria-expanded","false"),a.setAttribute("aria-controls","default-collapse"),a.classList.add("collapsed"),n.appendChild(a);const e=o.createButton({btnId:"default-target-button",btnText:"Button with data-target",btnStyle:"primary",btnFill:"filled",btnSize:"default"});e.setAttribute("data-toggle","collapse"),e.setAttribute("data-target","#default-collapse"),e.setAttribute("aria-expanded","false"),e.setAttribute("aria-controls","default-collapse"),e.classList.add("collapsed"),n.appendChild(e),l.appendChild(n);const i=o.createCard({id:"default-collapse",body:"Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.",paddingSize:"md",gapSize:"md",radiusSize:"sm",borderSize:"sm",showBorder:!0,classes:["collapse"]});i.style.borderRadius="var(--size-modal-radius-lg)",l.appendChild(i),t.appendChild(l);const d=document.createElement("div");d.style.display="flex",d.style.flexDirection="column",d.style.gap="var(--size-element-gap-lg)";const r=document.createElement("div");r.style.display="flex",r.style.gap="var(--size-section-gap-md)",r.style.width="100%";const c=o.createButton({btnId:"multiple-first-button",btnText:"Toggle first element",btnStyle:"primary",btnFill:"filled",btnSize:"default"});c.setAttribute("data-toggle","collapse"),c.setAttribute("data-target","#multiple-collapse-1"),c.setAttribute("aria-expanded","false"),c.setAttribute("aria-controls","multiple-collapse-1"),c.classList.add("collapsed"),r.appendChild(c);const m=o.createButton({btnId:"multiple-second-button",btnText:"Toggle second element",btnStyle:"primary",btnFill:"filled",btnSize:"default"});m.setAttribute("data-toggle","collapse"),m.setAttribute("data-target","#multiple-collapse-2"),m.setAttribute("aria-expanded","false"),m.setAttribute("aria-controls","multiple-collapse-2"),m.classList.add("collapsed"),r.appendChild(m);const f=o.createButton({btnId:"multiple-both-button",btnText:"Toggle both element",btnStyle:"primary",btnFill:"filled",btnSize:"default"});f.setAttribute("data-toggle","collapse"),f.setAttribute("data-target","#multiple-collapse-1,#multiple-collapse-2"),f.setAttribute("aria-expanded","false"),f.classList.add("collapsed"),r.appendChild(f),d.appendChild(r);const h=document.createElement("div");h.style.display="flex",h.style.gap="var(--size-section-gap-md)",h.style.width="100%";const A=o.createCard({id:"multiple-collapse-1",body:"Some placeholder content for the first collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.",paddingSize:"md",gapSize:"md",radiusSize:"md",borderSize:"sm",showBorder:!0,classes:["collapse"],styles:{flex:"1 1 0",minWidth:0}});h.appendChild(A);const k=o.createCard({id:"multiple-collapse-2",body:"Some placeholder content for the second collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.",paddingSize:"md",gapSize:"md",radiusSize:"md",borderSize:"sm",showBorder:!0,classes:["collapse"],styles:{flex:"1 1 0",minWidth:0}});h.appendChild(k),d.appendChild(h),t.appendChild(d);const p=document.createElement("div");p.style.display="flex",p.style.flexDirection="column",p.style.width="100%";const z=[{id:"accordion-1",title:"Collapsible Group Item #1",content:"Some quick example text to build on the card title and make up the bulk of the card's content."},{id:"accordion-2",title:"Collapsible Group Item #2",content:"Some quick example text to build on the card title and make up the bulk of the card's content."},{id:"accordion-3",title:"Collapsible Group Item #3",content:"Some quick example text to build on the card title and make up the bulk of the card's content."}];return z.forEach((b,g)=>{const s=document.createElement("div");s.style.display="flex",s.style.alignItems="center",s.style.height="48px",s.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",s.style.backgroundColor="var(--color-surface-container-high)",s.style.cursor="pointer",s.setAttribute("data-toggle","collapse"),s.setAttribute("data-target",`#${b.id}-content`),s.setAttribute("aria-expanded",g===0?"true":"false"),s.setAttribute("aria-controls",`${b.id}-content`),g!==0&&s.classList.add("collapsed");const y=document.createElement("div");if(y.className="body1-txt",y.style.color="var(--color-primary)",y.style.fontWeight="var(--font-weight-normal)",y.textContent=b.title,s.appendChild(y),p.appendChild(s),g>0){const B=o.createDivider({size:"sm",style:"dark",opacity10:!0,width:"100%"});p.appendChild(B)}const u=document.createElement("div");u.id=`${b.id}-content`,u.classList.add("collapse"),g===0&&u.classList.add("show"),u.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",u.style.backgroundColor="var(--color-surface)",u.setAttribute("aria-labelledby",b.id);const x=document.createElement("div");if(x.className="body1-txt",x.style.color="var(--color-on-surface-variant)",x.style.fontWeight="var(--font-weight-normal)",x.textContent=b.content,u.appendChild(x),p.appendChild(u),g<z.length-1){const B=o.createDivider({size:"sm",style:"dark",opacity10:!0,width:"100%"});p.appendChild(B)}}),t.appendChild(p),t}},w={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-lg)",t.style.padding="var(--size-section-pad-x-md)",t.style.backgroundColor="var(--color-surface)",t.style.width="511px";const l=document.createElement("div");l.style.display="flex",l.style.gap="var(--size-section-gap-md)",l.style.width="100%";const n=o.createButton({btnId:"default-link",btnText:"Link with href",btnStyle:"primary",btnFill:"filled",btnSize:"default",btnLink:"#default-collapse-card"});n.setAttribute("data-toggle","collapse"),n.setAttribute("data-target","#default-collapse-card"),n.setAttribute("aria-expanded","false"),n.setAttribute("aria-controls","default-collapse-card"),n.classList.add("collapsed"),l.appendChild(n);const a=o.createButton({btnId:"default-target",btnText:"Button with data-target",btnStyle:"primary",btnFill:"filled",btnSize:"default"});a.setAttribute("data-toggle","collapse"),a.setAttribute("data-target","#default-collapse-card"),a.setAttribute("aria-expanded","false"),a.setAttribute("aria-controls","default-collapse-card"),a.classList.add("collapsed"),l.appendChild(a),t.appendChild(l);const e=o.createCard({id:"default-collapse-card",body:"Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.",paddingSize:"md",gapSize:"md",radiusSize:"sm",borderSize:"sm",showBorder:!0,classes:["collapse"]});return e.style.borderRadius="var(--size-modal-radius-lg)",t.appendChild(e),t}},C={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-lg)",t.style.padding="var(--size-section-pad-x-md)",t.style.backgroundColor="var(--color-surface)",t.style.width="511px";const l=document.createElement("div");l.style.display="flex",l.style.gap="var(--size-section-gap-md)",l.style.width="100%";const n=o.createButton({btnId:"multi-first",btnText:"Toggle first element",btnStyle:"primary",btnFill:"filled",btnSize:"default"});n.setAttribute("data-toggle","collapse"),n.setAttribute("data-target","#multi-collapse-1"),n.setAttribute("aria-expanded","false"),n.setAttribute("aria-controls","multi-collapse-1"),n.classList.add("collapsed"),l.appendChild(n);const a=o.createButton({btnId:"multi-second",btnText:"Toggle second element",btnStyle:"primary",btnFill:"filled",btnSize:"default"});a.setAttribute("data-toggle","collapse"),a.setAttribute("data-target","#multi-collapse-2"),a.setAttribute("aria-expanded","false"),a.setAttribute("aria-controls","multi-collapse-2"),a.classList.add("collapsed"),l.appendChild(a);const e=o.createButton({btnId:"multi-both",btnText:"Toggle both element",btnStyle:"primary",btnFill:"filled",btnSize:"default"});e.setAttribute("data-toggle","collapse"),e.setAttribute("data-target","#multi-collapse-1,#multi-collapse-2"),e.setAttribute("aria-expanded","false"),e.classList.add("collapsed"),l.appendChild(e),t.appendChild(l);const i=document.createElement("div");i.style.display="flex",i.style.gap="var(--size-section-gap-md)",i.style.width="100%";const d=o.createCard({id:"multi-collapse-1",body:"Some placeholder content for the first collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.",paddingSize:"md",gapSize:"md",radiusSize:"md",borderSize:"sm",showBorder:!0,classes:["collapse"],styles:{flex:"1 1 0",minWidth:0}});i.appendChild(d);const r=o.createCard({id:"multi-collapse-2",body:"Some placeholder content for the second collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.",paddingSize:"md",gapSize:"md",radiusSize:"md",borderSize:"sm",showBorder:!0,classes:["collapse"],styles:{flex:"1 1 0",minWidth:0}});return i.appendChild(r),t.appendChild(i),t}},S={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.width="511px",t.style.padding="var(--size-section-pad-x-md)",t.style.backgroundColor="var(--color-surface)";const l=[{id:"acc-1",title:"Collapsible Group Item #1",content:"Some quick example text to build on the card title and make up the bulk of the card's content."},{id:"acc-2",title:"Collapsible Group Item #2",content:"Some quick example text to build on the card title and make up the bulk of the card's content."},{id:"acc-3",title:"Collapsible Group Item #3",content:"Some quick example text to build on the card title and make up the bulk of the card's content."}];return l.forEach((n,a)=>{const e=document.createElement("div");e.style.display="flex",e.style.alignItems="center",e.style.height="48px",e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.backgroundColor="var(--color-surface-container-high)",e.style.cursor="pointer",e.setAttribute("data-toggle","collapse"),e.setAttribute("data-target",`#${n.id}-content`),e.setAttribute("aria-expanded",a===0?"true":"false"),e.setAttribute("aria-controls",`${n.id}-content`),a!==0&&e.classList.add("collapsed");const i=document.createElement("div");if(i.className="body1-txt",i.style.color="var(--color-primary)",i.style.fontWeight="var(--font-weight-normal)",i.textContent=n.title,e.appendChild(i),t.appendChild(e),a>0){const c=o.createDivider({size:"sm",style:"dark",opacity10:!0,width:"100%"});t.appendChild(c)}const d=document.createElement("div");d.id=`${n.id}-content`,d.classList.add("collapse"),a===0&&d.classList.add("show"),d.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",d.style.backgroundColor="var(--color-surface)",d.setAttribute("aria-labelledby",n.id);const r=document.createElement("div");if(r.className="body1-txt",r.style.color="var(--color-on-surface-variant)",r.style.fontWeight="var(--font-weight-normal)",r.textContent=n.content,d.appendChild(r),t.appendChild(d),a<l.length-1){const c=o.createDivider({size:"sm",style:"dark",opacity10:!0,width:"100%"});t.appendChild(c)}}),t}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = '511px';

    // ============================================
    // DEFAULT TYPE
    // ============================================
    const defaultSection = document.createElement('div');
    defaultSection.style.display = 'flex';
    defaultSection.style.flexDirection = 'column';
    defaultSection.style.gap = 'var(--size-element-gap-lg)'; // 12px gap between buttons and content

    // Button row
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = 'var(--size-section-gap-md)'; // 16px gap between buttons
    buttonRow.style.width = '100%';

    // Link with href button
    const linkButton = PlusInterface.createButton({
      btnId: 'default-link-button',
      btnText: 'Link with href',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      btnLink: '#default-collapse'
    });
    linkButton.setAttribute('data-toggle', 'collapse');
    linkButton.setAttribute('data-target', '#default-collapse');
    linkButton.setAttribute('aria-expanded', 'false');
    linkButton.setAttribute('aria-controls', 'default-collapse');
    linkButton.classList.add('collapsed');
    buttonRow.appendChild(linkButton);

    // Button with data-target
    const targetButton = PlusInterface.createButton({
      btnId: 'default-target-button',
      btnText: 'Button with data-target',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    targetButton.setAttribute('data-toggle', 'collapse');
    targetButton.setAttribute('data-target', '#default-collapse');
    targetButton.setAttribute('aria-expanded', 'false');
    targetButton.setAttribute('aria-controls', 'default-collapse');
    targetButton.classList.add('collapsed');
    buttonRow.appendChild(targetButton);
    defaultSection.appendChild(buttonRow);

    // Collapsible card content
    const defaultCard = PlusInterface.createCard({
      id: 'default-collapse',
      body: 'Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      // Will override with modal-radius-lg
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse']
    });
    // Override radius to use modal-radius-lg (12px) for default type
    defaultCard.style.borderRadius = 'var(--size-modal-radius-lg)';
    defaultSection.appendChild(defaultCard);
    container.appendChild(defaultSection);

    // ============================================
    // MULTIPLE TARGET TYPE
    // ============================================
    const multipleSection = document.createElement('div');
    multipleSection.style.display = 'flex';
    multipleSection.style.flexDirection = 'column';
    multipleSection.style.gap = 'var(--size-element-gap-lg)'; // 12px gap between buttons and content

    // Button row with three buttons
    const multipleButtonRow = document.createElement('div');
    multipleButtonRow.style.display = 'flex';
    multipleButtonRow.style.gap = 'var(--size-section-gap-md)'; // 16px gap between buttons
    multipleButtonRow.style.width = '100%';

    // Toggle first element button
    const firstButton = PlusInterface.createButton({
      btnId: 'multiple-first-button',
      btnText: 'Toggle first element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    firstButton.setAttribute('data-toggle', 'collapse');
    firstButton.setAttribute('data-target', '#multiple-collapse-1');
    firstButton.setAttribute('aria-expanded', 'false');
    firstButton.setAttribute('aria-controls', 'multiple-collapse-1');
    firstButton.classList.add('collapsed');
    multipleButtonRow.appendChild(firstButton);

    // Toggle second element button
    const secondButton = PlusInterface.createButton({
      btnId: 'multiple-second-button',
      btnText: 'Toggle second element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    secondButton.setAttribute('data-toggle', 'collapse');
    secondButton.setAttribute('data-target', '#multiple-collapse-2');
    secondButton.setAttribute('aria-expanded', 'false');
    secondButton.setAttribute('aria-controls', 'multiple-collapse-2');
    secondButton.classList.add('collapsed');
    multipleButtonRow.appendChild(secondButton);

    // Toggle both element button
    const bothButton = PlusInterface.createButton({
      btnId: 'multiple-both-button',
      btnText: 'Toggle both element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    bothButton.setAttribute('data-toggle', 'collapse');
    bothButton.setAttribute('data-target', '#multiple-collapse-1,#multiple-collapse-2');
    bothButton.setAttribute('aria-expanded', 'false');
    bothButton.classList.add('collapsed');
    multipleButtonRow.appendChild(bothButton);
    multipleSection.appendChild(multipleButtonRow);

    // Two cards side-by-side
    const cardRow = document.createElement('div');
    cardRow.style.display = 'flex';
    cardRow.style.gap = 'var(--size-section-gap-md)'; // 16px gap between cards
    cardRow.style.width = '100%';

    // First card
    const firstCard = PlusInterface.createCard({
      id: 'multiple-collapse-1',
      body: 'Some placeholder content for the first collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md',
      // 16px radius (card-radius-md)
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: {
        flex: '1 1 0',
        minWidth: 0
      }
    });
    cardRow.appendChild(firstCard);

    // Second card
    const secondCard = PlusInterface.createCard({
      id: 'multiple-collapse-2',
      body: 'Some placeholder content for the second collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md',
      // 16px radius (card-radius-md)
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: {
        flex: '1 1 0',
        minWidth: 0
      }
    });
    cardRow.appendChild(secondCard);
    multipleSection.appendChild(cardRow);
    container.appendChild(multipleSection);

    // ============================================
    // ACCORDION TYPE
    // ============================================
    const accordionSection = document.createElement('div');
    accordionSection.style.display = 'flex';
    accordionSection.style.flexDirection = 'column';
    accordionSection.style.width = '100%';
    const accordionItems = [{
      id: 'accordion-1',
      title: 'Collapsible Group Item #1',
      content: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    }, {
      id: 'accordion-2',
      title: 'Collapsible Group Item #2',
      content: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    }, {
      id: 'accordion-3',
      title: 'Collapsible Group Item #3',
      content: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    }];
    accordionItems.forEach((item, index) => {
      // Header (trigger)
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.height = '48px';
      header.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)'; // 12px vertical, 20px horizontal
      header.style.backgroundColor = 'var(--color-surface-container-high)';
      header.style.cursor = 'pointer';
      header.setAttribute('data-toggle', 'collapse');
      header.setAttribute('data-target', \`#\${item.id}-content\`);
      header.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
      header.setAttribute('aria-controls', \`\${item.id}-content\`);
      if (index !== 0) {
        header.classList.add('collapsed');
      }
      const headerText = document.createElement('div');
      headerText.className = 'body1-txt';
      headerText.style.color = 'var(--color-primary)';
      headerText.style.fontWeight = 'var(--font-weight-normal)';
      headerText.textContent = item.title;
      header.appendChild(headerText);
      accordionSection.appendChild(header);

      // Divider (only if not first item)
      if (index > 0) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        accordionSection.appendChild(divider);
      }

      // Content panel
      const contentPanel = document.createElement('div');
      contentPanel.id = \`\${item.id}-content\`;
      contentPanel.classList.add('collapse');
      if (index === 0) {
        contentPanel.classList.add('show');
      }
      contentPanel.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)'; // 12px vertical, 20px horizontal
      contentPanel.style.backgroundColor = 'var(--color-surface)';
      contentPanel.setAttribute('aria-labelledby', item.id);
      const contentText = document.createElement('div');
      contentText.className = 'body1-txt';
      contentText.style.color = 'var(--color-on-surface-variant)';
      contentText.style.fontWeight = 'var(--font-weight-normal)';
      contentText.textContent = item.content;
      contentPanel.appendChild(contentText);
      accordionSection.appendChild(contentPanel);

      // Divider after content (except last item)
      if (index < accordionItems.length - 1) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        accordionSection.appendChild(divider);
      }
    });
    container.appendChild(accordionSection);
    return container;
  }
}`,...v.parameters?.docs?.source},description:{story:`All Variants
Shows all three collapse types exactly as shown in Figma design system`,...v.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = '511px';

    // Button row
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = 'var(--size-section-gap-md)';
    buttonRow.style.width = '100%';
    const linkButton = PlusInterface.createButton({
      btnId: 'default-link',
      btnText: 'Link with href',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      btnLink: '#default-collapse-card'
    });
    linkButton.setAttribute('data-toggle', 'collapse');
    linkButton.setAttribute('data-target', '#default-collapse-card');
    linkButton.setAttribute('aria-expanded', 'false');
    linkButton.setAttribute('aria-controls', 'default-collapse-card');
    linkButton.classList.add('collapsed');
    buttonRow.appendChild(linkButton);
    const targetButton = PlusInterface.createButton({
      btnId: 'default-target',
      btnText: 'Button with data-target',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    targetButton.setAttribute('data-toggle', 'collapse');
    targetButton.setAttribute('data-target', '#default-collapse-card');
    targetButton.setAttribute('aria-expanded', 'false');
    targetButton.setAttribute('aria-controls', 'default-collapse-card');
    targetButton.classList.add('collapsed');
    buttonRow.appendChild(targetButton);
    container.appendChild(buttonRow);
    const card = PlusInterface.createCard({
      id: 'default-collapse-card',
      body: 'Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'sm',
      // Will override with modal-radius-lg
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse']
    });
    // Override radius to use modal-radius-lg (12px) for default type
    card.style.borderRadius = 'var(--size-modal-radius-lg)';
    container.appendChild(card);
    return container;
  }
}`,...w.parameters?.docs?.source},description:{story:`Default Type
Toggle button to show corresponding content. Only one content can be shown at a time.`,...w.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = '511px';
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = 'var(--size-section-gap-md)';
    buttonRow.style.width = '100%';
    const firstButton = PlusInterface.createButton({
      btnId: 'multi-first',
      btnText: 'Toggle first element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    firstButton.setAttribute('data-toggle', 'collapse');
    firstButton.setAttribute('data-target', '#multi-collapse-1');
    firstButton.setAttribute('aria-expanded', 'false');
    firstButton.setAttribute('aria-controls', 'multi-collapse-1');
    firstButton.classList.add('collapsed');
    buttonRow.appendChild(firstButton);
    const secondButton = PlusInterface.createButton({
      btnId: 'multi-second',
      btnText: 'Toggle second element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    secondButton.setAttribute('data-toggle', 'collapse');
    secondButton.setAttribute('data-target', '#multi-collapse-2');
    secondButton.setAttribute('aria-expanded', 'false');
    secondButton.setAttribute('aria-controls', 'multi-collapse-2');
    secondButton.classList.add('collapsed');
    buttonRow.appendChild(secondButton);
    const bothButton = PlusInterface.createButton({
      btnId: 'multi-both',
      btnText: 'Toggle both element',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    bothButton.setAttribute('data-toggle', 'collapse');
    bothButton.setAttribute('data-target', '#multi-collapse-1,#multi-collapse-2');
    bothButton.setAttribute('aria-expanded', 'false');
    bothButton.classList.add('collapsed');
    buttonRow.appendChild(bothButton);
    container.appendChild(buttonRow);
    const cardRow = document.createElement('div');
    cardRow.style.display = 'flex';
    cardRow.style.gap = 'var(--size-section-gap-md)';
    cardRow.style.width = '100%';
    const firstCard = PlusInterface.createCard({
      id: 'multi-collapse-1',
      body: 'Some placeholder content for the first collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md',
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: {
        flex: '1 1 0',
        minWidth: 0
      }
    });
    cardRow.appendChild(firstCard);
    const secondCard = PlusInterface.createCard({
      id: 'multi-collapse-2',
      body: 'Some placeholder content for the second collapse component of this multi-collapse example. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md',
      borderSize: 'sm',
      showBorder: true,
      classes: ['collapse'],
      styles: {
        flex: '1 1 0',
        minWidth: 0
      }
    });
    cardRow.appendChild(secondCard);
    container.appendChild(cardRow);
    return container;
  }
}`,...C.parameters?.docs?.source},description:{story:`Multiple Target Type
Each content takes up half of the container width. Both pieces of content can be toggled independently or together.`,...C.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.width = '511px';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    const items = [{
      id: 'acc-1',
      title: 'Collapsible Group Item #1',
      content: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    }, {
      id: 'acc-2',
      title: 'Collapsible Group Item #2',
      content: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    }, {
      id: 'acc-3',
      title: 'Collapsible Group Item #3',
      content: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    }];
    items.forEach((item, index) => {
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.height = '48px';
      header.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      header.style.backgroundColor = 'var(--color-surface-container-high)';
      header.style.cursor = 'pointer';
      header.setAttribute('data-toggle', 'collapse');
      header.setAttribute('data-target', \`#\${item.id}-content\`);
      header.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
      header.setAttribute('aria-controls', \`\${item.id}-content\`);
      if (index !== 0) {
        header.classList.add('collapsed');
      }
      const headerText = document.createElement('div');
      headerText.className = 'body1-txt';
      headerText.style.color = 'var(--color-primary)';
      headerText.style.fontWeight = 'var(--font-weight-normal)';
      headerText.textContent = item.title;
      header.appendChild(headerText);
      container.appendChild(header);
      if (index > 0) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        container.appendChild(divider);
      }
      const contentPanel = document.createElement('div');
      contentPanel.id = \`\${item.id}-content\`;
      contentPanel.classList.add('collapse');
      if (index === 0) {
        contentPanel.classList.add('show');
      }
      contentPanel.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      contentPanel.style.backgroundColor = 'var(--color-surface)';
      contentPanel.setAttribute('aria-labelledby', item.id);
      const contentText = document.createElement('div');
      contentText.className = 'body1-txt';
      contentText.style.color = 'var(--color-on-surface-variant)';
      contentText.style.fontWeight = 'var(--font-weight-normal)';
      contentText.textContent = item.content;
      contentPanel.appendChild(contentText);
      container.appendChild(contentPanel);
      if (index < items.length - 1) {
        const divider = PlusInterface.createDivider({
          size: 'sm',
          style: 'dark',
          opacity10: true,
          width: '100%'
        });
        container.appendChild(divider);
      }
    });
    return container;
  }
}`,...S.parameters?.docs?.source},description:{story:`Accordion Type
Toggle the item name to show/hide corresponding content. Only one content can be shown at a time.`,...S.parameters?.docs?.description}}};const G=["AllVariants","Default","MultipleTarget","Accordion"];export{S as Accordion,v as AllVariants,w as Default,C as MultipleTarget,G as __namedExportsOrder,W as default};
