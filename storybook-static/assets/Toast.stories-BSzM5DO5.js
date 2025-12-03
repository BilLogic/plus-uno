import{createStaticToast as o}from"./index-DwbqM05R.js";const g={title:"Components/Toast",tags:["autodocs"],parameters:{docs:{description:{component:"Toast component for displaying brief, non-intrusive notifications. Supports multiple styles, positions, and content variants. Uses modal-level tokens for spacing and layout. Auto-dismisses after a configurable delay."}},layout:"padded"}},l={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)",t.style.padding="20px";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");return n.className="h6",n.textContent="All Styles",n.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(n),[{value:"default",label:"Default"},{value:"danger",label:"Danger"},{value:"success",label:"Success"},{value:"info",label:"Info"},{value:"warning",label:"Warning"}].forEach(a=>{const s=o({style:a.value,title:"Title",text:"Hello, world! This is a toast message.",dismissable:!0});e.appendChild(s)}),t.appendChild(e),t}},c={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)",t.style.padding="20px";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");n.className="h6",n.textContent="Content Variants",n.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(n);const i=o({style:"success",title:"Title",text:"Hello, world! This is a toast message.",dismissable:!0});e.appendChild(i);const a=o({style:"info",title:"Title",text:"Hello, world! This is a toast message.",dismissable:!1});return e.appendChild(a),t.appendChild(e),t}},r={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)",t.style.padding="20px";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");return n.className="h6",n.textContent="Position Variants",n.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(n),[{label:"Top Right",value:"top-right"},{label:"Top Left",value:"top-left"},{label:"Bottom Right",value:"bottom-right"},{label:"Bottom Left",value:"bottom-left"}].forEach(a=>{const s=document.createElement("div");s.className="body2-txt",s.style.marginBottom="var(--size-element-gap-xs)",s.textContent=`${a.label}:`,e.appendChild(s);const y=o({style:"default",title:"Title",text:"Hello, world! This is a toast message.",dismissable:!0});e.appendChild(y)}),t.appendChild(e),t}},d={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)",t.style.padding="20px";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");return n.className="h6",n.textContent="Auto-dismiss Delay Options",n.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(n),[{label:"2 seconds",value:2e3},{label:"5 seconds (default)",value:5e3},{label:"10 seconds",value:1e4},{label:"No auto-dismiss",value:0}].forEach(a=>{const s=document.createElement("div");s.className="body2-txt",s.style.marginBottom="var(--size-element-gap-xs)",s.textContent=`${a.label}:`,e.appendChild(s);const y=o({style:"info",title:"Title",text:`This toast would ${a.value===0?"not auto-dismiss":`auto-dismiss in ${a.label}`}.`,dismissable:!0});e.appendChild(y)}),t.appendChild(e),t}},p={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)",t.style.padding="20px";const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-card-gap-md)";const n=document.createElement("div");n.className="h6",n.textContent="Stacked Toasts",n.style.marginBottom="var(--size-element-gap-sm)",e.appendChild(n);const i=o({style:"success",title:"Title",text:"Hello, world! This is a toast message.",dismissable:!0});e.appendChild(i);const a=o({style:"info",title:"Title",text:"Hello, world! This is a toast message.",dismissable:!0});e.appendChild(a);const s=o({style:"warning",title:"Title",text:"Hello, world! This is a toast message.",dismissable:!0});return e.appendChild(s),t.appendChild(e),t}},m={render:t=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)",e.style.padding="20px";const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-md)";const i=document.createElement("div");i.className="h6",i.textContent="Interactive Toast",i.style.marginBottom="var(--size-element-gap-sm)",n.appendChild(i);const a=o({style:t.style||"info",title:t.title||void 0,text:t.text||"This is an interactive toast.",dismissable:t.dismissable!==!1});n.appendChild(a),e.appendChild(n);const s=document.createElement("p");return s.className="body2-txt",s.textContent="Use the controls below to customize the toast appearance.",e.appendChild(s),e},argTypes:{style:{control:"select",options:["primary","secondary","success","danger","warning","info"],description:"Toast style"},title:{control:"text",description:"Toast title"},text:{control:"text",description:"Toast text"},dismissable:{control:"boolean",description:"Dismissable state"},delay:{control:"number",description:"Auto-dismiss delay in milliseconds (0 to disable)"},position:{control:"select",options:["top-right","top-left","bottom-right","bottom-left"],description:"Toast position"}},args:{style:"info",title:"Interactive Toast",text:"This is an interactive toast. Check the console for callbacks.",dismissable:!0,delay:5e3,position:"top-right"}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-card-gap-md)';
    const stylesLabel = document.createElement('div');
    stylesLabel.className = 'h6';
    stylesLabel.textContent = 'All Styles';
    stylesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesLabel);

    // Show all style variants directly (matching Figma order)
    const styles = [{
      value: 'default',
      label: 'Default'
    }, {
      value: 'danger',
      label: 'Danger'
    }, {
      value: 'success',
      label: 'Success'
    }, {
      value: 'info',
      label: 'Info'
    }, {
      value: 'warning',
      label: 'Warning'
    }];
    styles.forEach(style => {
      const toast = createStaticToast({
        style: style.value,
        title: 'Title',
        text: 'Hello, world! This is a toast message.',
        dismissable: true
      });
      stylesSection.appendChild(toast);
    });
    container.appendChild(stylesSection);
    return container;
  }
}`,...l.parameters?.docs?.source},description:{story:`All Style Variants
Shows all toast style variants with title and dismissible`,...l.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    const contentLabel = document.createElement('div');
    contentLabel.className = 'h6';
    contentLabel.textContent = 'Content Variants';
    contentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentLabel);

    // With title and dismissible
    const withTitle = createStaticToast({
      style: 'success',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true
    });
    contentSection.appendChild(withTitle);

    // Non-dismissible (no close button)
    const nonDismissible = createStaticToast({
      style: 'info',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: false
    });
    contentSection.appendChild(nonDismissible);
    container.appendChild(contentSection);
    return container;
  }
}`,...c.parameters?.docs?.source},description:{story:`Content Variants
Shows different content configurations`,...c.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    const positionSection = document.createElement('div');
    positionSection.style.display = 'flex';
    positionSection.style.flexDirection = 'column';
    positionSection.style.gap = 'var(--size-card-gap-md)';
    const positionLabel = document.createElement('div');
    positionLabel.className = 'h6';
    positionLabel.textContent = 'Position Variants';
    positionLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    positionSection.appendChild(positionLabel);

    // Show toasts with position labels
    const positions = [{
      label: 'Top Right',
      value: 'top-right'
    }, {
      label: 'Top Left',
      value: 'top-left'
    }, {
      label: 'Bottom Right',
      value: 'bottom-right'
    }, {
      label: 'Bottom Left',
      value: 'bottom-left'
    }];
    positions.forEach(pos => {
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      label.textContent = \`\${pos.label}:\`;
      positionSection.appendChild(label);
      const toast = createStaticToast({
        style: 'default',
        title: 'Title',
        text: 'Hello, world! This is a toast message.',
        dismissable: true
      });
      positionSection.appendChild(toast);
    });
    container.appendChild(positionSection);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:`Position Variants
Shows toasts with position labels (static display)`,...r.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    const delaySection = document.createElement('div');
    delaySection.style.display = 'flex';
    delaySection.style.flexDirection = 'column';
    delaySection.style.gap = 'var(--size-card-gap-md)';
    const delayLabel = document.createElement('div');
    delayLabel.className = 'h6';
    delayLabel.textContent = 'Auto-dismiss Delay Options';
    delayLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    delaySection.appendChild(delayLabel);

    // Show toasts with different delay configurations
    const delays = [{
      label: '2 seconds',
      value: 2000
    }, {
      label: '5 seconds (default)',
      value: 5000
    }, {
      label: '10 seconds',
      value: 10000
    }, {
      label: 'No auto-dismiss',
      value: 0
    }];
    delays.forEach(delay => {
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      label.textContent = \`\${delay.label}:\`;
      delaySection.appendChild(label);
      const toast = createStaticToast({
        style: 'info',
        title: 'Title',
        text: \`This toast would \${delay.value === 0 ? 'not auto-dismiss' : \`auto-dismiss in \${delay.label}\`}.\`,
        dismissable: true
      });
      delaySection.appendChild(toast);
    });
    container.appendChild(delaySection);
    return container;
  }
}`,...d.parameters?.docs?.source},description:{story:`Auto-dismiss Delay
Shows toasts with different auto-dismiss delay configurations`,...d.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    const stackSection = document.createElement('div');
    stackSection.style.display = 'flex';
    stackSection.style.flexDirection = 'column';
    stackSection.style.gap = 'var(--size-card-gap-md)';
    const stackLabel = document.createElement('div');
    stackLabel.className = 'h6';
    stackLabel.textContent = 'Stacked Toasts';
    stackLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stackSection.appendChild(stackLabel);

    // Show multiple toasts stacked
    const firstToast = createStaticToast({
      style: 'success',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true
    });
    stackSection.appendChild(firstToast);
    const secondToast = createStaticToast({
      style: 'info',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true
    });
    stackSection.appendChild(secondToast);
    const thirdToast = createStaticToast({
      style: 'warning',
      title: 'Title',
      text: 'Hello, world! This is a toast message.',
      dismissable: true
    });
    stackSection.appendChild(thirdToast);
    container.appendChild(stackSection);
    return container;
  }
}`,...p.parameters?.docs?.source},description:{story:`Stacked Toasts
Shows multiple toasts stacked together`,...p.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '20px';
    const interactiveSection = document.createElement('div');
    interactiveSection.style.display = 'flex';
    interactiveSection.style.flexDirection = 'column';
    interactiveSection.style.gap = 'var(--size-card-gap-md)';
    const interactiveLabel = document.createElement('div');
    interactiveLabel.className = 'h6';
    interactiveLabel.textContent = 'Interactive Toast';
    interactiveLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    interactiveSection.appendChild(interactiveLabel);

    // Show toast directly based on args
    const toast = createStaticToast({
      style: args.style || 'info',
      title: args.title || undefined,
      text: args.text || 'This is an interactive toast.',
      dismissable: args.dismissable !== false
    });
    interactiveSection.appendChild(toast);
    container.appendChild(interactiveSection);
    const info = document.createElement('p');
    info.className = 'body2-txt';
    info.textContent = 'Use the controls below to customize the toast appearance.';
    container.appendChild(info);
    return container;
  },
  argTypes: {
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Toast style'
    },
    title: {
      control: 'text',
      description: 'Toast title'
    },
    text: {
      control: 'text',
      description: 'Toast text'
    },
    dismissable: {
      control: 'boolean',
      description: 'Dismissable state'
    },
    delay: {
      control: 'number',
      description: 'Auto-dismiss delay in milliseconds (0 to disable)'
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description: 'Toast position'
    }
  },
  args: {
    style: 'info',
    title: 'Interactive Toast',
    text: 'This is an interactive toast. Check the console for callbacks.',
    dismissable: true,
    delay: 5000,
    position: 'top-right'
  }
}`,...m.parameters?.docs?.source},description:{story:`Interactive Toast
Interactive playground for testing toast variations`,...m.parameters?.docs?.description}}};const b=["AllStyles","ContentVariants","PositionVariants","AutoDismissDelay","StackedToasts","Interactive"];export{l as AllStyles,d as AutoDismissDelay,c as ContentVariants,m as Interactive,r as PositionVariants,p as StackedToasts,b as __namedExportsOrder,g as default};
