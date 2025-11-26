import{c as t,u as A}from"./index-BRIPf3Vz.js";const q={title:"Components/Progress",tags:["autodocs"],parameters:{docs:{description:{component:"Progress bar component for displaying task completion status. Built on Bootstrap 4.6.2 progress component pattern with PLUS design token customizations."}}}},m={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-lg)";const s=document.createElement("div");s.style.display="flex",s.style.flexDirection="column",s.style.gap="var(--size-element-gap-md)";const n=document.createElement("div");n.className="h6",n.textContent="Size Variants",n.style.marginBottom="var(--size-element-gap-sm)",s.appendChild(n);const r=t({value:50,size:"small",style:"primary"});s.appendChild(r);const l=t({value:50,size:"medium",style:"primary"});s.appendChild(l);const p=t({value:50,size:"large",style:"primary"});s.appendChild(p),e.appendChild(s);const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-md)";const c=document.createElement("div");c.className="h6",c.textContent="Style Variants",c.style.marginBottom="var(--size-element-gap-sm)",a.appendChild(c);const d=t({value:60,style:"primary"});a.appendChild(d);const b=t({value:60,style:"secondary"});a.appendChild(b);const C=t({value:60,style:"success"});a.appendChild(C);const z=t({value:60,style:"danger"});a.appendChild(z);const S=t({value:60,style:"warning"});a.appendChild(S);const L=t({value:60,style:"info"});a.appendChild(L),e.appendChild(a);const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.gap="var(--size-element-gap-md)";const h=document.createElement("div");h.className="h6",h.textContent="State Variants",h.style.marginBottom="var(--size-element-gap-sm)",o.appendChild(h);const f=t({value:75,style:"primary",showLabel:!0});o.appendChild(f);const E=t({value:50,style:"success",label:"Uploading..."});o.appendChild(E);const P=t({value:65,style:"primary",striped:!0});o.appendChild(P);const w=t({value:80,style:"primary",striped:!0,animated:!0});o.appendChild(w),e.appendChild(o);const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-md)";const x=document.createElement("div");x.className="h6",x.textContent="Value Examples",x.style.marginBottom="var(--size-element-gap-sm)",i.appendChild(x);const B=t({value:0,style:"primary"});i.appendChild(B);const T=t({value:25,style:"primary"});i.appendChild(T);const N=t({value:50,style:"primary"});i.appendChild(N);const V=t({value:75,style:"primary"});i.appendChild(V);const D=t({value:100,style:"success"});return i.appendChild(D),e.appendChild(i),e}},y={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-lg)";const s=t({value:50,size:"small",style:"primary"}),n=document.createElement("div");n.className="body2-txt",n.textContent="Small (4px)",n.style.marginBottom="var(--size-element-gap-xs)";const r=t({value:50,size:"medium",style:"primary"}),l=document.createElement("div");l.className="body2-txt",l.textContent="Medium (6px)",l.style.marginBottom="var(--size-element-gap-xs)";const p=t({value:50,size:"large",style:"primary"}),a=document.createElement("div");return a.className="body2-txt",a.textContent="Large (8px)",a.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(n),e.appendChild(s),e.appendChild(l),e.appendChild(r),e.appendChild(a),e.appendChild(p),e}},u={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-lg)",["primary","secondary","tertiary","success","danger","warning","info"].forEach(n=>{const r=document.createElement("div");r.className="body2-txt",r.textContent=n.charAt(0).toUpperCase()+n.slice(1),r.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(r);const l=t({value:60,style:n});e.appendChild(l)}),e}},g={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-lg)";const s=t({value:75,style:"primary",showLabel:!0}),n=document.createElement("div");n.className="body2-txt",n.textContent="With percentage label",n.style.marginBottom="var(--size-element-gap-xs)";const r=t({value:50,style:"success",label:"Uploading files..."}),l=document.createElement("div");l.className="body2-txt",l.textContent="With custom label",l.style.marginBottom="var(--size-element-gap-xs)";const p=t({value:65,style:"primary",striped:!0}),a=document.createElement("div");a.className="body2-txt",a.textContent="Striped",a.style.marginBottom="var(--size-element-gap-xs)";const c=t({value:80,style:"primary",striped:!0,animated:!0}),d=document.createElement("div");return d.className="body2-txt",d.textContent="Animated (striped)",d.style.marginBottom="var(--size-element-gap-xs)",e.appendChild(n),e.appendChild(s),e.appendChild(l),e.appendChild(r),e.appendChild(a),e.appendChild(p),e.appendChild(d),e.appendChild(c),e}},v={render:e=>{const s=document.createElement("div");s.style.display="flex",s.style.flexDirection="column",s.style.gap="var(--size-element-gap-md)";const n=t(e);s.appendChild(n);const r=document.createElement("div");r.style.display="flex",r.style.gap="var(--size-element-gap-sm)",r.style.marginTop="var(--size-element-gap-md)";const l=document.createElement("button");return l.className="btn btn-primary",l.textContent="Update to 75%",l.addEventListener("click",()=>{A(n,75,0,100,e.showLabel)}),r.appendChild(l),s.appendChild(r),s},argTypes:{value:{control:{type:"range",min:0,max:100,step:1},description:"Progress value (0-100)"},style:{control:"select",options:["primary","secondary","tertiary","success","danger","warning","info"],description:"Progress bar style"},size:{control:"select",options:["small","medium","large"],description:"Progress bar size"},striped:{control:"boolean",description:"Show striped pattern"},animated:{control:"boolean",description:"Animate stripes (requires striped)"},showLabel:{control:"boolean",description:"Show percentage label"},label:{control:"text",description:"Custom label text"}},args:{value:50,style:"primary",size:"medium",striped:!1,animated:!1,showLabel:!1,label:null}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // Size Variants
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-element-gap-md)';
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h6';
    sizesLabel.textContent = 'Size Variants';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesLabel);
    const small = createProgress({
      value: 50,
      size: 'small',
      style: 'primary'
    });
    sizesSection.appendChild(small);
    const medium = createProgress({
      value: 50,
      size: 'medium',
      style: 'primary'
    });
    sizesSection.appendChild(medium);
    const large = createProgress({
      value: 50,
      size: 'large',
      style: 'primary'
    });
    sizesSection.appendChild(large);
    container.appendChild(sizesSection);

    // Style Variants
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-element-gap-md)';
    const stylesLabel = document.createElement('div');
    stylesLabel.className = 'h6';
    stylesLabel.textContent = 'Style Variants';
    stylesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesLabel);
    const primary = createProgress({
      value: 60,
      style: 'primary'
    });
    stylesSection.appendChild(primary);
    const secondary = createProgress({
      value: 60,
      style: 'secondary'
    });
    stylesSection.appendChild(secondary);
    const success = createProgress({
      value: 60,
      style: 'success'
    });
    stylesSection.appendChild(success);
    const danger = createProgress({
      value: 60,
      style: 'danger'
    });
    stylesSection.appendChild(danger);
    const warning = createProgress({
      value: 60,
      style: 'warning'
    });
    stylesSection.appendChild(warning);
    const info = createProgress({
      value: 60,
      style: 'info'
    });
    stylesSection.appendChild(info);
    container.appendChild(stylesSection);

    // State Variants
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-element-gap-md)';
    const statesLabel = document.createElement('div');
    statesLabel.className = 'h6';
    statesLabel.textContent = 'State Variants';
    statesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesLabel);
    const withLabel = createProgress({
      value: 75,
      style: 'primary',
      showLabel: true
    });
    statesSection.appendChild(withLabel);
    const customLabel = createProgress({
      value: 50,
      style: 'success',
      label: 'Uploading...'
    });
    statesSection.appendChild(customLabel);
    const striped = createProgress({
      value: 65,
      style: 'primary',
      striped: true
    });
    statesSection.appendChild(striped);
    const animated = createProgress({
      value: 80,
      style: 'primary',
      striped: true,
      animated: true
    });
    statesSection.appendChild(animated);
    container.appendChild(statesSection);

    // Value Examples
    const valuesSection = document.createElement('div');
    valuesSection.style.display = 'flex';
    valuesSection.style.flexDirection = 'column';
    valuesSection.style.gap = 'var(--size-element-gap-md)';
    const valuesLabel = document.createElement('div');
    valuesLabel.className = 'h6';
    valuesLabel.textContent = 'Value Examples';
    valuesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    valuesSection.appendChild(valuesLabel);
    const zero = createProgress({
      value: 0,
      style: 'primary'
    });
    valuesSection.appendChild(zero);
    const quarter = createProgress({
      value: 25,
      style: 'primary'
    });
    valuesSection.appendChild(quarter);
    const half = createProgress({
      value: 50,
      style: 'primary'
    });
    valuesSection.appendChild(half);
    const threeQuarter = createProgress({
      value: 75,
      style: 'primary'
    });
    valuesSection.appendChild(threeQuarter);
    const full = createProgress({
      value: 100,
      style: 'success'
    });
    valuesSection.appendChild(full);
    container.appendChild(valuesSection);
    return container;
  }
}`,...m.parameters?.docs?.source},description:{story:`All Variants
Shows all progress bar combinations: sizes, styles, and states`,...m.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    const small = createProgress({
      value: 50,
      size: 'small',
      style: 'primary'
    });
    const smallLabel = document.createElement('div');
    smallLabel.className = 'body2-txt';
    smallLabel.textContent = 'Small (4px)';
    smallLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    const medium = createProgress({
      value: 50,
      size: 'medium',
      style: 'primary'
    });
    const mediumLabel = document.createElement('div');
    mediumLabel.className = 'body2-txt';
    mediumLabel.textContent = 'Medium (6px)';
    mediumLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    const large = createProgress({
      value: 50,
      size: 'large',
      style: 'primary'
    });
    const largeLabel = document.createElement('div');
    largeLabel.className = 'body2-txt';
    largeLabel.textContent = 'Large (8px)';
    largeLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    container.appendChild(smallLabel);
    container.appendChild(small);
    container.appendChild(mediumLabel);
    container.appendChild(medium);
    container.appendChild(largeLabel);
    container.appendChild(large);
    return container;
  }
}`,...y.parameters?.docs?.source},description:{story:`Size Variants
Shows different size options`,...y.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'];
    styles.forEach(style => {
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      container.appendChild(label);
      const progress = createProgress({
        value: 60,
        style: style
      });
      container.appendChild(progress);
    });
    return container;
  }
}`,...u.parameters?.docs?.source},description:{story:`Style Variants
Shows different color/style options`,...u.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    const withLabel = createProgress({
      value: 75,
      style: 'primary',
      showLabel: true
    });
    const withLabelText = document.createElement('div');
    withLabelText.className = 'body2-txt';
    withLabelText.textContent = 'With percentage label';
    withLabelText.style.marginBottom = 'var(--size-element-gap-xs)';
    const customLabel = createProgress({
      value: 50,
      style: 'success',
      label: 'Uploading files...'
    });
    const customLabelText = document.createElement('div');
    customLabelText.className = 'body2-txt';
    customLabelText.textContent = 'With custom label';
    customLabelText.style.marginBottom = 'var(--size-element-gap-xs)';
    const striped = createProgress({
      value: 65,
      style: 'primary',
      striped: true
    });
    const stripedText = document.createElement('div');
    stripedText.className = 'body2-txt';
    stripedText.textContent = 'Striped';
    stripedText.style.marginBottom = 'var(--size-element-gap-xs)';
    const animated = createProgress({
      value: 80,
      style: 'primary',
      striped: true,
      animated: true
    });
    const animatedText = document.createElement('div');
    animatedText.className = 'body2-txt';
    animatedText.textContent = 'Animated (striped)';
    animatedText.style.marginBottom = 'var(--size-element-gap-xs)';
    container.appendChild(withLabelText);
    container.appendChild(withLabel);
    container.appendChild(customLabelText);
    container.appendChild(customLabel);
    container.appendChild(stripedText);
    container.appendChild(striped);
    container.appendChild(animatedText);
    container.appendChild(animated);
    return container;
  }
}`,...g.parameters?.docs?.source},description:{story:`States
Shows different state variants`,...g.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    const progress = createProgress(args);
    container.appendChild(progress);

    // Add controls for interactive testing
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = 'var(--size-element-gap-sm)';
    controls.style.marginTop = 'var(--size-element-gap-md)';
    const updateButton = document.createElement('button');
    updateButton.className = 'btn btn-primary';
    updateButton.textContent = 'Update to 75%';
    updateButton.addEventListener('click', () => {
      updateProgress(progress, 75, 0, 100, args.showLabel);
    });
    controls.appendChild(updateButton);
    container.appendChild(controls);
    return container;
  },
  argTypes: {
    value: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
        step: 1
      },
      description: 'Progress value (0-100)'
    },
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'],
      description: 'Progress bar style'
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Progress bar size'
    },
    striped: {
      control: 'boolean',
      description: 'Show striped pattern'
    },
    animated: {
      control: 'boolean',
      description: 'Animate stripes (requires striped)'
    },
    showLabel: {
      control: 'boolean',
      description: 'Show percentage label'
    },
    label: {
      control: 'text',
      description: 'Custom label text'
    }
  },
  args: {
    value: 50,
    style: 'primary',
    size: 'medium',
    striped: false,
    animated: false,
    showLabel: false,
    label: null
  }
}`,...v.parameters?.docs?.source},description:{story:`Interactive Progress
Interactive playground for testing progress variations`,...v.parameters?.docs?.description}}};const k=["AllVariants","SizeVariants","StyleVariants","States","Interactive"];export{m as AllVariants,v as Interactive,y as SizeVariants,g as States,u as StyleVariants,k as __namedExportsOrder,q as default};
