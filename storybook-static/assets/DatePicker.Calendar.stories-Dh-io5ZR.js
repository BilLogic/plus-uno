import{P as d}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const f={title:"Components/DatePicker/Calendar",tags:["autodocs"],parameters:{docs:{description:{component:"Calendar widget component used within the date picker. Shows month view with navigation, weekday headers, and selectable dates. Can be used standalone for reference."}}}},l={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.alignItems="center",e.style.backgroundColor="var(--color-surface)",e.style.minHeight="500px";const a=document.createElement("div");a.className="h6",a.textContent="Calendar Widget (Standalone View)",a.style.marginBottom="var(--size-element-gap-md)",a.style.color="var(--color-on-surface-variant)",e.appendChild(a);const i=d.createDatePicker({id:"calendar-demo",placeholder:"Select date",size:"medium",value:"2025-11-19"}),t=i.querySelector(".plus-date-picker-calendar");t&&(t.style.display="block",t.style.position="relative",t.style.top="auto",t.style.left="auto",t.style.margin="0 auto",t.style.width="280px");const r=i.querySelector(".plus-date-picker-input-wrapper");return r&&(r.style.maxWidth="300px",r.style.marginBottom="var(--size-section-gap-md)"),e.appendChild(i),setTimeout(()=>{i.querySelector(".plus-date-picker-icon-button")&&t&&(t.style.display="block",t.style.position="relative",t.style.top="auto",t.style.left="auto",t.style.margin="0 auto")},100),e}},o={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.alignItems="center",e.style.backgroundColor="var(--color-surface)",e.style.minHeight="500px";const a=document.createElement("div");a.className="h6",a.textContent="Calendar with Selected Date (Nov 19, 2025)",a.style.marginBottom="var(--size-element-gap-md)",a.style.color="var(--color-on-surface-variant)",e.appendChild(a);const i=d.createDatePicker({id:"calendar-selected-demo",placeholder:"Select date",size:"medium",value:"2025-11-19"}),t=i.querySelector(".plus-date-picker-calendar");t&&(t.style.display="block",t.style.position="relative",t.style.top="auto",t.style.left="auto",t.style.margin="0 auto",t.style.width="280px");const r=i.querySelector(".plus-date-picker-input-wrapper");return r&&(r.style.maxWidth="300px",r.style.marginBottom="var(--size-section-gap-md)"),e.appendChild(i),setTimeout(()=>{t&&(t.style.display="block",t.style.position="relative",t.style.top="auto",t.style.left="auto",t.style.margin="0 auto")},100),e}},s={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.alignItems="center",e.style.backgroundColor="var(--color-surface)",e.style.minHeight="500px";const a=document.createElement("div");a.className="h6",a.textContent="Calendar with Date Range (Next 7 days)",a.style.marginBottom="var(--size-element-gap-md)",a.style.color="var(--color-on-surface-variant)",e.appendChild(a);const i=new Date,t=new Date;t.setDate(t.getDate()+7);const r=d.createDatePicker({id:"calendar-range-demo",placeholder:"Select date",size:"medium",minDate:i,maxDate:t}),n=r.querySelector(".plus-date-picker-calendar");n&&(n.style.display="block",n.style.position="relative",n.style.top="auto",n.style.left="auto",n.style.margin="0 auto",n.style.width="280px");const c=r.querySelector(".plus-date-picker-input-wrapper");return c&&(c.style.maxWidth="300px",c.style.marginBottom="var(--size-section-gap-md)"),e.appendChild(r),setTimeout(()=>{n&&(n.style.display="block",n.style.position="relative",n.style.top="auto",n.style.left="auto",n.style.margin="0 auto")},100),e}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.alignItems = 'center';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.minHeight = '500px';
    const label = document.createElement('div');
    label.className = 'h6';
    label.textContent = 'Calendar Widget (Standalone View)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);

    // Create a date picker and programmatically open its calendar
    const datePicker = PlusInterface.createDatePicker({
      id: 'calendar-demo',
      placeholder: 'Select date',
      size: 'medium',
      value: '2025-11-19'
    });

    // Find the calendar container and make it visible and positioned
    const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      calendarContainer.style.position = 'relative';
      calendarContainer.style.top = 'auto';
      calendarContainer.style.left = 'auto';
      calendarContainer.style.margin = '0 auto';
      calendarContainer.style.width = '280px';
    }

    // Also show the input for context
    const inputWrapper = datePicker.querySelector('.plus-date-picker-input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.maxWidth = '300px';
      inputWrapper.style.marginBottom = 'var(--size-section-gap-md)';
    }
    container.appendChild(datePicker);

    // Programmatically open the calendar after a short delay to ensure DOM is ready
    setTimeout(() => {
      const iconButton = datePicker.querySelector('.plus-date-picker-icon-button');
      if (iconButton && calendarContainer) {
        calendarContainer.style.display = 'block';
        calendarContainer.style.position = 'relative';
        calendarContainer.style.top = 'auto';
        calendarContainer.style.left = 'auto';
        calendarContainer.style.margin = '0 auto';
      }
    }, 100);
    return container;
  }
}`,...l.parameters?.docs?.source},description:{story:`Calendar Widget
Shows the calendar widget as it appears in the date picker popup`,...l.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.alignItems = 'center';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.minHeight = '500px';
    const label = document.createElement('div');
    label.className = 'h6';
    label.textContent = 'Calendar with Selected Date (Nov 19, 2025)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);
    const datePicker = PlusInterface.createDatePicker({
      id: 'calendar-selected-demo',
      placeholder: 'Select date',
      size: 'medium',
      value: '2025-11-19'
    });
    const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      calendarContainer.style.position = 'relative';
      calendarContainer.style.top = 'auto';
      calendarContainer.style.left = 'auto';
      calendarContainer.style.margin = '0 auto';
      calendarContainer.style.width = '280px';
    }
    const inputWrapper = datePicker.querySelector('.plus-date-picker-input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.maxWidth = '300px';
      inputWrapper.style.marginBottom = 'var(--size-section-gap-md)';
    }
    container.appendChild(datePicker);

    // Open calendar after DOM is ready
    setTimeout(() => {
      if (calendarContainer) {
        calendarContainer.style.display = 'block';
        calendarContainer.style.position = 'relative';
        calendarContainer.style.top = 'auto';
        calendarContainer.style.left = 'auto';
        calendarContainer.style.margin = '0 auto';
      }
    }, 100);
    return container;
  }
}`,...o.parameters?.docs?.source},description:{story:`Calendar with Selected Date
Shows calendar with a date selected (November 19, 2025)`,...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.alignItems = 'center';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.minHeight = '500px';
    const label = document.createElement('div');
    label.className = 'h6';
    label.textContent = 'Calendar with Date Range (Next 7 days)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const datePicker = PlusInterface.createDatePicker({
      id: 'calendar-range-demo',
      placeholder: 'Select date',
      size: 'medium',
      minDate: today,
      maxDate: maxDate
    });
    const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      calendarContainer.style.position = 'relative';
      calendarContainer.style.top = 'auto';
      calendarContainer.style.left = 'auto';
      calendarContainer.style.margin = '0 auto';
      calendarContainer.style.width = '280px';
    }
    const inputWrapper = datePicker.querySelector('.plus-date-picker-input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.maxWidth = '300px';
      inputWrapper.style.marginBottom = 'var(--size-section-gap-md)';
    }
    container.appendChild(datePicker);

    // Open calendar after DOM is ready
    setTimeout(() => {
      if (calendarContainer) {
        calendarContainer.style.display = 'block';
        calendarContainer.style.position = 'relative';
        calendarContainer.style.top = 'auto';
        calendarContainer.style.left = 'auto';
        calendarContainer.style.margin = '0 auto';
      }
    }, 100);
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:`Calendar with Date Range
Shows calendar with min/max date constraints`,...s.parameters?.docs?.description}}};const k=["CalendarWidget","CalendarWithSelectedDate","CalendarWithDateRange"];export{l as CalendarWidget,s as CalendarWithDateRange,o as CalendarWithSelectedDate,k as __namedExportsOrder,f as default};
