const c={title:"Specs/Toolkit/Modals",tags:["autodocs"],parameters:{docs:{description:{component:"Modal dialogs used in toolkit flows."}}}},d={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const o=document.createElement("h1");o.className="h1",o.textContent="Toolkit Modals",o.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(o);const a=document.createElement("p");a.className="body1-txt",a.textContent="Modal dialogs used in toolkit flows. These components will be implemented and documented here.",a.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(a);const l=[{name:"ViewTutorsModal",description:"Modal for viewing tutors (User View: Tutor, Lead Tutor)"},{name:"SessionSignUpModal",description:"Modal for session sign-up"},{name:"AddTutorStudentModal",description:"Modal for adding tutor/student (type: add tutor, add student)"},{name:"CallOffDetailsModal",description:"Modals for call-off details (Tutors/Supervisors, multiple stages and tabs)"},{name:"SessionDetailsModal",description:"Modals for session details (All users, multiple tabs)"},{name:"FillInModal",description:"Modals for fill-in (user: tutor/supervisor, multiple tabs)"},{name:"TutorStudentAssignmentModal",description:"Modal for tutor student assignment (tab: attendance/assignment, state: loading/initial/loaded)"},{name:"WelcomeBanner",description:"Welcome banner modal"},{name:"Calendar",description:"Calendar modal"}],t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-md)",l.forEach(r=>{const n=document.createElement("div");n.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",n.style.border="1px solid var(--color-outline-variant)",n.style.borderRadius="var(--size-card-radius-sm)",n.style.backgroundColor="var(--color-surface-container)";const s=document.createElement("h3");s.className="h4",s.textContent=r.name,s.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(s);const i=document.createElement("p");i.className="body2-txt",i.textContent=r.description,n.appendChild(i),t.appendChild(n)}),e.appendChild(t),e}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Toolkit Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs used in toolkit flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const components = [{
      name: 'ViewTutorsModal',
      description: 'Modal for viewing tutors (User View: Tutor, Lead Tutor)'
    }, {
      name: 'SessionSignUpModal',
      description: 'Modal for session sign-up'
    }, {
      name: 'AddTutorStudentModal',
      description: 'Modal for adding tutor/student (type: add tutor, add student)'
    }, {
      name: 'CallOffDetailsModal',
      description: 'Modals for call-off details (Tutors/Supervisors, multiple stages and tabs)'
    }, {
      name: 'SessionDetailsModal',
      description: 'Modals for session details (All users, multiple tabs)'
    }, {
      name: 'FillInModal',
      description: 'Modals for fill-in (user: tutor/supervisor, multiple tabs)'
    }, {
      name: 'TutorStudentAssignmentModal',
      description: 'Modal for tutor student assignment (tab: attendance/assignment, state: loading/initial/loaded)'
    }, {
      name: 'WelcomeBanner',
      description: 'Welcome banner modal'
    }, {
      name: 'Calendar',
      description: 'Calendar modal'
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
}`,...d.parameters?.docs?.source}}};const m=["Overview"];export{d as Overview,m as __namedExportsOrder,c as default};
