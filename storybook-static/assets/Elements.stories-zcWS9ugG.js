const p={title:"Specs/Toolkit/Elements",tags:["autodocs"],parameters:{docs:{description:{component:"Individual form elements and UI components used in toolkit flows. See STRUCTURE.md for complete component list."}}}},r={render:()=>{const e=document.createElement("div");e.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",e.style.maxWidth="1200px",e.style.margin="0 auto";const o=document.createElement("h1");o.className="h1",o.textContent="Toolkit Elements",o.style.marginBottom="var(--size-section-pad-y-md)",e.appendChild(o);const s=document.createElement("p");s.className="body1-txt",s.textContent="Individual form elements and UI components used in toolkit flows. These components will be implemented and documented here. See STRUCTURE.md for the complete list of elements.",s.style.marginBottom="var(--size-card-gap-lg)",e.appendChild(s);const l=[{name:"Controls & Buttons",items:["Session Control Buttons","Reflection Control Buttons","Primary Buttons","Supervisor Sign-up Management Buttons","CTAs (Sign up related, tutor view, supervisor view, Call-offs)"]},{name:"Dropdowns",items:["Reflection Filter Dropdown","Students Dropdown","Sessions Dropdown","Call-off Form Dropdowns (Reason, Supervisor selection)","Attendance Dropdown"]},{name:"Ratings",items:["Student Rating","Self Rating","Session Rating","Form Rating"]},{name:"Badges",items:["Tutor/Student Type Badge","Headcount Status Badge","Session Status Badges","Call-off Status Badges","Reflection Status Badges","School Badge","Tutor Badges","Student Badges"]},{name:"Form Components",items:["Call-off Form Text Inputs","Consent Form Input Group Checkbox","Filters (timeframe, call-off type, site, days, capacity, completion)"]},{name:"Cards & Items",items:["Student Table Item","Student Card Item","Assignment Cards","Session Info Card"]},{name:"Actions & Feedback",items:["Copy Button","Session Actions","Toast/Reminder","Attendance List Items"]}],n=document.createElement("div");return n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)",l.forEach(m=>{const t=document.createElement("div");t.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",t.style.border="1px solid var(--color-outline-variant)",t.style.borderRadius="var(--size-card-radius-sm)",t.style.backgroundColor="var(--color-surface-container)";const a=document.createElement("h3");a.className="h4",a.textContent=m.name,a.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(a);const i=document.createElement("ul");i.className="body2-txt",i.style.paddingLeft="var(--size-section-pad-y-md)",m.items.forEach(c=>{const d=document.createElement("li");d.textContent=c,d.style.marginBottom="var(--size-element-gap-xs)",i.appendChild(d)}),t.appendChild(i),n.appendChild(t)}),e.appendChild(n),e}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Toolkit Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in toolkit flows. These components will be implemented and documented here. See STRUCTURE.md for the complete list of elements.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    const categories = [{
      name: 'Controls & Buttons',
      items: ['Session Control Buttons', 'Reflection Control Buttons', 'Primary Buttons', 'Supervisor Sign-up Management Buttons', 'CTAs (Sign up related, tutor view, supervisor view, Call-offs)']
    }, {
      name: 'Dropdowns',
      items: ['Reflection Filter Dropdown', 'Students Dropdown', 'Sessions Dropdown', 'Call-off Form Dropdowns (Reason, Supervisor selection)', 'Attendance Dropdown']
    }, {
      name: 'Ratings',
      items: ['Student Rating', 'Self Rating', 'Session Rating', 'Form Rating']
    }, {
      name: 'Badges',
      items: ['Tutor/Student Type Badge', 'Headcount Status Badge', 'Session Status Badges', 'Call-off Status Badges', 'Reflection Status Badges', 'School Badge', 'Tutor Badges', 'Student Badges']
    }, {
      name: 'Form Components',
      items: ['Call-off Form Text Inputs', 'Consent Form Input Group Checkbox', 'Filters (timeframe, call-off type, site, days, capacity, completion)']
    }, {
      name: 'Cards & Items',
      items: ['Student Table Item', 'Student Card Item', 'Assignment Cards', 'Session Info Card']
    }, {
      name: 'Actions & Feedback',
      items: ['Copy Button', 'Session Actions', 'Toast/Reminder', 'Attendance List Items']
    }];
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    categories.forEach(category => {
      const categoryCard = document.createElement('div');
      categoryCard.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      categoryCard.style.border = '1px solid var(--color-outline-variant)';
      categoryCard.style.borderRadius = 'var(--size-card-radius-sm)';
      categoryCard.style.backgroundColor = 'var(--color-surface-container)';
      const categoryName = document.createElement('h3');
      categoryName.className = 'h4';
      categoryName.textContent = category.name;
      categoryName.style.marginBottom = 'var(--size-element-gap-sm)';
      categoryCard.appendChild(categoryName);
      const itemsList = document.createElement('ul');
      itemsList.className = 'body2-txt';
      itemsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
      category.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.style.marginBottom = 'var(--size-element-gap-xs)';
        itemsList.appendChild(li);
      });
      categoryCard.appendChild(itemsList);
      componentsList.appendChild(categoryCard);
    });
    container.appendChild(componentsList);
    return container;
  }
}`,...r.parameters?.docs?.source}}};const u=["Overview"];export{r as Overview,u as __namedExportsOrder,p as default};
