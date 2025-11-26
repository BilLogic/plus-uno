const l={title:"Specs/Toolkit/Tables",tags:["autodocs"],parameters:{docs:{description:{component:"Table components used in toolkit contexts."}}}},i={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const s=document.createElement("h1");s.className="h1",s.textContent="Toolkit Tables",s.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(s);const o=document.createElement("p");o.className="body1-txt",o.textContent="Table components used in toolkit contexts. These components will be implemented and documented here.",o.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(o);const d=[{name:"MySessionsTable",description:"Table for my sessions with types: header/item, states: default/hover/pressed/focus/disabled"},{name:"CallOffsTable",description:"Table for call-offs with user types: tutors/supervisors, call-off states: pending/past"},{name:"SignUpsTable",description:"Table for sign-ups with user types: tutors/supervisors, session types: one-time/recurring"},{name:"ReflectionsTable",description:"Table for reflections with reflection states: complete/incomplete"},{name:"ScheduleRowEntry",description:"Schedule row entries with user types and states"},{name:"ScheduleRowEntryTutor",description:"Schedule row entries for tutors with tabs: shift sign-up/session fill-in"},{name:"StudentListItem",description:"Student list items with types: header/content, states: default/hover"}],n=document.createElement("div");return n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",d.forEach(c=>{const t=document.createElement("div");t.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",t.style.border="1px solid var(--color-outline-variant)",t.style.borderRadius="var(--size-card-radius-sm)",t.style.backgroundColor="var(--color-surface-container)";const a=document.createElement("h3");a.className="h4",a.textContent=c.name,a.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(a);const r=document.createElement("p");r.className="body2-txt",r.textContent=c.description,t.appendChild(r),n.appendChild(t)}),e.appendChild(n),e}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Toolkit Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components used in toolkit contexts. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const components = [{
      name: 'MySessionsTable',
      description: 'Table for my sessions with types: header/item, states: default/hover/pressed/focus/disabled'
    }, {
      name: 'CallOffsTable',
      description: 'Table for call-offs with user types: tutors/supervisors, call-off states: pending/past'
    }, {
      name: 'SignUpsTable',
      description: 'Table for sign-ups with user types: tutors/supervisors, session types: one-time/recurring'
    }, {
      name: 'ReflectionsTable',
      description: 'Table for reflections with reflection states: complete/incomplete'
    }, {
      name: 'ScheduleRowEntry',
      description: 'Schedule row entries with user types and states'
    }, {
      name: 'ScheduleRowEntryTutor',
      description: 'Schedule row entries for tutors with tabs: shift sign-up/session fill-in'
    }, {
      name: 'StudentListItem',
      description: 'Student list items with types: header/content, states: default/hover'
    }];
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    components.forEach(component => {
      const componentCard = document.createElement('div');
      componentCard.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      componentCard.style.border = '1px solid var(--color-outline-variant)';
      componentCard.style.borderRadius = 'var(--size-card-radius-sm)';
      componentCard.style.backgroundColor = 'var(--color-surface-container)';
      const componentName = document.createElement('h3');
      componentName.className = 'h4';
      componentName.textContent = component.name;
      componentName.style.marginBottom = 'var(--size-element-gap-sm)';
      componentCard.appendChild(componentName);
      const componentDesc = document.createElement('p');
      componentDesc.className = 'body2-txt';
      componentDesc.textContent = component.description;
      componentCard.appendChild(componentDesc);
      componentsList.appendChild(componentCard);
    });
    container.appendChild(componentsList);
    return container;
  }
}`,...i.parameters?.docs?.source}}};const p=["Overview"];export{i as Overview,p as __namedExportsOrder,l as default};
