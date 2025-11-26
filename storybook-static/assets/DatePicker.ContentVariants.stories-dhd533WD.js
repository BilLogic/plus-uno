import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const z={title:"Components/DatePicker/Content Variants",tags:["autodocs"]},d={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.maxWidth="600px";const r=document.createElement("div");r.style.display="flex",r.style.flexDirection="column",r.style.gap="var(--size-element-gap-xs)";const n=document.createElement("label");n.className="body2-txt",n.textContent="With Minimum Date (Today)",n.setAttribute("for","datepicker-min"),r.appendChild(n);const l=o.createDatePicker({id:"datepicker-min",placeholder:"Select date",size:"medium",minDate:new Date});r.appendChild(l),e.appendChild(r);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const t=document.createElement("label");t.className="body2-txt",t.textContent="With Maximum Date (30 days from today)",t.setAttribute("for","datepicker-max"),a.appendChild(t);const i=new Date;i.setDate(i.getDate()+30);const u=o.createDatePicker({id:"datepicker-max",placeholder:"Select date",size:"medium",maxDate:i});a.appendChild(u),e.appendChild(a);const c=document.createElement("div");c.style.display="flex",c.style.flexDirection="column",c.style.gap="var(--size-element-gap-xs)";const m=document.createElement("label");m.className="body2-txt",m.textContent="With Date Range (Next 7 days)",m.setAttribute("for","datepicker-range"),c.appendChild(m);const g=new Date,x=new Date;x.setDate(x.getDate()+7);const y=o.createDatePicker({id:"datepicker-range",placeholder:"Select date",size:"medium",minDate:g,maxDate:x});return c.appendChild(y),e.appendChild(c),e}},s={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.maxWidth="600px",[{value:"left",label:"Left Aligned"},{value:"center",label:"Center Aligned"},{value:"right",label:"Right Aligned"}].forEach((n,l)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const t=document.createElement("label");t.className="body2-txt",t.textContent=n.label,t.setAttribute("for",`datepicker-align-${l}`),a.appendChild(t);const i=o.createDatePicker({id:`datepicker-align-${l}`,placeholder:"Select date",size:"medium",calendarAlign:n.value});a.appendChild(i),e.appendChild(a)}),e}},p={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)",e.style.padding="var(--size-section-pad-y-md) var(--size-section-pad-x-md)",e.style.maxWidth="600px",[{placeholder:"Select date",label:"Default placeholder"},{placeholder:"Choose appointment date",label:"Custom placeholder"},{placeholder:"MM/DD/YYYY",label:"Format hint placeholder"}].forEach((n,l)=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)";const t=document.createElement("label");t.className="body2-txt",t.textContent=n.label,t.setAttribute("for",`datepicker-placeholder-${l}`),a.appendChild(t);const i=o.createDatePicker({id:`datepicker-placeholder-${l}`,placeholder:n.placeholder,size:"medium"});a.appendChild(i),e.appendChild(a)}),e}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';

    // Min date example
    const minWrapper = document.createElement('div');
    minWrapper.style.display = 'flex';
    minWrapper.style.flexDirection = 'column';
    minWrapper.style.gap = 'var(--size-element-gap-xs)';
    const minLabel = document.createElement('label');
    minLabel.className = 'body2-txt';
    minLabel.textContent = 'With Minimum Date (Today)';
    minLabel.setAttribute('for', 'datepicker-min');
    minWrapper.appendChild(minLabel);
    const minPicker = PlusInterface.createDatePicker({
      id: 'datepicker-min',
      placeholder: 'Select date',
      size: 'medium',
      minDate: new Date()
    });
    minWrapper.appendChild(minPicker);
    container.appendChild(minWrapper);

    // Max date example
    const maxWrapper = document.createElement('div');
    maxWrapper.style.display = 'flex';
    maxWrapper.style.flexDirection = 'column';
    maxWrapper.style.gap = 'var(--size-element-gap-xs)';
    const maxLabel = document.createElement('label');
    maxLabel.className = 'body2-txt';
    maxLabel.textContent = 'With Maximum Date (30 days from today)';
    maxLabel.setAttribute('for', 'datepicker-max');
    maxWrapper.appendChild(maxLabel);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxPicker = PlusInterface.createDatePicker({
      id: 'datepicker-max',
      placeholder: 'Select date',
      size: 'medium',
      maxDate: maxDate
    });
    maxWrapper.appendChild(maxPicker);
    container.appendChild(maxWrapper);

    // Min and max date example
    const rangeWrapper = document.createElement('div');
    rangeWrapper.style.display = 'flex';
    rangeWrapper.style.flexDirection = 'column';
    rangeWrapper.style.gap = 'var(--size-element-gap-xs)';
    const rangeLabel = document.createElement('label');
    rangeLabel.className = 'body2-txt';
    rangeLabel.textContent = 'With Date Range (Next 7 days)';
    rangeLabel.setAttribute('for', 'datepicker-range');
    rangeWrapper.appendChild(rangeLabel);
    const rangeMin = new Date();
    const rangeMax = new Date();
    rangeMax.setDate(rangeMax.getDate() + 7);
    const rangePicker = PlusInterface.createDatePicker({
      id: 'datepicker-range',
      placeholder: 'Select date',
      size: 'medium',
      minDate: rangeMin,
      maxDate: rangeMax
    });
    rangeWrapper.appendChild(rangePicker);
    container.appendChild(rangeWrapper);
    return container;
  }
}`,...d.parameters?.docs?.source},description:{story:`With Min/Max Date Constraints
Shows date picker with minimum and maximum date constraints`,...d.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    const alignments = [{
      value: 'left',
      label: 'Left Aligned'
    }, {
      value: 'center',
      label: 'Center Aligned'
    }, {
      value: 'right',
      label: 'Right Aligned'
    }];
    alignments.forEach((alignment, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      const label = document.createElement('label');
      label.className = 'body2-txt';
      label.textContent = alignment.label;
      label.setAttribute('for', \`datepicker-align-\${index}\`);
      wrapper.appendChild(label);
      const picker = PlusInterface.createDatePicker({
        id: \`datepicker-align-\${index}\`,
        placeholder: 'Select date',
        size: 'medium',
        calendarAlign: alignment.value
      });
      wrapper.appendChild(picker);
      container.appendChild(wrapper);
    });
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:`Calendar Alignment
Shows date picker with different calendar alignment options`,...s.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    const examples = [{
      placeholder: 'Select date',
      label: 'Default placeholder'
    }, {
      placeholder: 'Choose appointment date',
      label: 'Custom placeholder'
    }, {
      placeholder: 'MM/DD/YYYY',
      label: 'Format hint placeholder'
    }];
    examples.forEach((example, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      const label = document.createElement('label');
      label.className = 'body2-txt';
      label.textContent = example.label;
      label.setAttribute('for', \`datepicker-placeholder-\${index}\`);
      wrapper.appendChild(label);
      const picker = PlusInterface.createDatePicker({
        id: \`datepicker-placeholder-\${index}\`,
        placeholder: example.placeholder,
        size: 'medium'
      });
      wrapper.appendChild(picker);
      container.appendChild(wrapper);
    });
    return container;
  }
}`,...p.parameters?.docs?.source},description:{story:`With Custom Placeholder
Shows date picker with custom placeholder text`,...p.parameters?.docs?.description}}};const E=["WithDateConstraints","CalendarAlignment","WithCustomPlaceholder"];export{s as CalendarAlignment,p as WithCustomPlaceholder,d as WithDateConstraints,E as __namedExportsOrder,z as default};
