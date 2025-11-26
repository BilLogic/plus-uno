import{P as r}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const C={title:"Components/Alert",tags:["autodocs"],parameters:{docs:{description:{component:"Alert component for displaying important messages, notifications, or feedback. Supports multiple styles and content variants. Uses card-level tokens for spacing and layout."}}}},i={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const s=document.createElement("div");s.className="h6",s.textContent="All Styles (With Title, Dismissible)",s.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(s),["primary","secondary","success","danger","warning"].forEach(m=>{const p=r.createAlert({style:m,title:"Title",text:"You have a message here — come check it out!",dismissable:!0});e.appendChild(p)}),t.appendChild(e);const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)";const a=document.createElement("div");a.className="h6",a.textContent="Content Variants (Primary Style)",a.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(a);const o=r.createAlert({style:"primary",title:"Title",text:"Alert with title and message text.",dismissable:!0});n.appendChild(o);const c=r.createAlert({style:"primary",text:"Alert without title — message only.",dismissable:!0});n.appendChild(c);const d=r.createAlert({style:"primary",title:"Non-dismissible Alert",text:"This alert cannot be dismissed.",dismissable:!1});return n.appendChild(d),t.appendChild(n),t}},l={render:t=>{const e=document.createElement("div"),s=r.createAlert({...t,onDismiss:()=>{console.log("Alert dismissed!")}});return e.appendChild(s),e},argTypes:{style:{control:"select",options:["primary","secondary","success","danger","warning","info"],description:"Alert style"},title:{control:"text",description:"Alert title"},text:{control:"text",description:"Alert text"},dismissable:{control:"boolean",description:"Dismissable state"}},args:{style:"info",title:"Interactive Alert",text:"This is an interactive alert. Check the console when dismissing.",dismissable:!0}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // All Styles (with title, dismissible)
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-card-gap-md)';
    const stylesLabel = document.createElement('div');
    stylesLabel.className = 'h6';
    stylesLabel.textContent = 'All Styles (With Title, Dismissible)';
    stylesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesLabel);
    const styles = ['primary', 'secondary', 'success', 'danger', 'warning'];
    styles.forEach(style => {
      const alert = PlusInterface.createAlert({
        style: style,
        title: 'Title',
        text: 'You have a message here — come check it out!',
        dismissable: true
      });
      stylesSection.appendChild(alert);
    });
    container.appendChild(stylesSection);

    // Content Variants (primary style)
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    const contentLabel = document.createElement('div');
    contentLabel.className = 'h6';
    contentLabel.textContent = 'Content Variants (Primary Style)';
    contentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentLabel);

    // With title
    const withTitle = PlusInterface.createAlert({
      style: 'primary',
      title: 'Title',
      text: 'Alert with title and message text.',
      dismissable: true
    });
    contentSection.appendChild(withTitle);

    // Without title
    const withoutTitle = PlusInterface.createAlert({
      style: 'primary',
      text: 'Alert without title — message only.',
      dismissable: true
    });
    contentSection.appendChild(withoutTitle);

    // Non-dismissible
    const nonDismissible = PlusInterface.createAlert({
      style: 'primary',
      title: 'Non-dismissible Alert',
      text: 'This alert cannot be dismissed.',
      dismissable: false
    });
    contentSection.appendChild(nonDismissible);
    container.appendChild(contentSection);
    return container;
  }
}`,...i.parameters?.docs?.source},description:{story:`All Variants
Shows all alert variants: styles and content configurations for comprehensive reference`,...i.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      onDismiss: () => {
        console.log('Alert dismissed!');
      }
    });
    container.appendChild(alert);
    return container;
  },
  argTypes: {
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Alert style'
    },
    title: {
      control: 'text',
      description: 'Alert title'
    },
    text: {
      control: 'text',
      description: 'Alert text'
    },
    dismissable: {
      control: 'boolean',
      description: 'Dismissable state'
    }
  },
  args: {
    style: 'info',
    title: 'Interactive Alert',
    text: 'This is an interactive alert. Check the console when dismissing.',
    dismissable: true
  }
}`,...l.parameters?.docs?.source},description:{story:`Interactive Alert
Interactive playground for testing alert variations`,...l.parameters?.docs?.description}}};const S=["AllVariants","Interactive"];export{i as AllVariants,l as Interactive,S as __namedExportsOrder,C as default};
