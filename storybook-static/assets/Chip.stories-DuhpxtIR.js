import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const P={title:"Components/Chip",tags:["autodocs"],parameters:{docs:{description:{component:"Chip component for removable tags, filters, and selections. All chips are removable by default - this differentiates them from badges. Supports multiple styles and typography-based sizes. Uses element-level tokens and pill-shaped border radius."}}}},u={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexWrap="wrap",e.style.gap="var(--size-element-gap-sm)",e.style.alignItems="center",[{name:"default",style:"default"},{name:"primary",style:"primary"},{name:"secondary",style:"secondary"},{name:"info",style:"info"},{name:"warning",style:"warning"},{name:"error",style:"error"},{name:"success",style:"success"}].forEach(({name:a,style:l})=>{const i=o.createChip({text:"Badge",style:l,size:"b1",onRemove:()=>{console.log(`Removed: ${a}`)}});e.appendChild(i)}),e}},C={render:e=>{const s=document.createElement("div"),a=o.createChip(e);return s.appendChild(a),s},argTypes:{text:{control:"text",description:"Chip text"},style:{control:"select",options:["default","primary","secondary","info","warning","error","success"],description:"Chip style"},size:{control:"select",options:["h1","h2","h3","h4","h5","h6","b1","b2","b3"],description:"Chip size"}},args:{text:"Badge",style:"default",size:"b1"}},x={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="row",e.style.flexWrap="wrap",e.style.gap="var(--size-section-gap-md)",e.style.alignItems="flex-start",[{name:"default",classes:[]},{name:"hover",classes:["plus-chip-hover"]},{name:"focus",classes:["plus-chip-focus"]},{name:"pressed",classes:["plus-chip-pressed"]},{name:"disabled",classes:["plus-chip-disabled"]}].forEach(({name:a,classes:l})=>{const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-xs)",i.style.alignItems="flex-start";const n=document.createElement("div");n.className="body3-txt",n.style.color="var(--color-outline)",n.style.fontSize="12px",n.textContent=a,i.appendChild(n);const c=o.createChip({text:"Badge",style:"default",size:"b1",classes:l,onRemove:()=>{console.log(`Removed: ${a}`)}});i.appendChild(c),e.appendChild(i)}),e}},f={render:()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-section-gap-md)";const s=document.createElement("div");s.style.display="flex",s.style.flexDirection="column",s.style.gap="var(--size-element-gap-sm)";const a=document.createElement("div");a.className="h6",a.textContent="Filter Chips",a.style.marginBottom="var(--size-element-gap-xs)",s.appendChild(a);const l=document.createElement("div");l.style.display="flex",l.style.flexWrap="wrap",l.style.gap="var(--size-element-gap-sm)",[{text:"Active",style:"success"},{text:"Pending",style:"warning"},{text:"Completed",style:"primary"},{text:"Archived",style:"secondary"}].forEach(t=>{const r=o.createChip({text:t.text,style:t.style,size:"b2",onRemove:()=>{console.log(`Removed filter: ${t.text}`)}});l.appendChild(r)}),s.appendChild(l),e.appendChild(s);const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-element-gap-sm)";const c=document.createElement("div");c.className="h6",c.textContent="Selected Items",c.style.marginBottom="var(--size-element-gap-xs)",n.appendChild(c);const m=document.createElement("div");m.style.display="flex",m.style.flexWrap="wrap",m.style.gap="var(--size-element-gap-sm)",[{text:"Item 1",style:"primary"},{text:"Item 2",style:"primary"},{text:"Item 3",style:"primary"}].forEach(t=>{const r=o.createChip({text:t.text,style:t.style,size:"b2",onRemove:()=>{console.log(`Deselected: ${t.text}`)}});m.appendChild(r)}),n.appendChild(m),e.appendChild(n);const p=document.createElement("div");p.style.display="flex",p.style.flexDirection="column",p.style.gap="var(--size-element-gap-sm)";const g=document.createElement("div");g.className="h6",g.textContent="Input Chips (e.g., Email Addresses)",g.style.marginBottom="var(--size-element-gap-xs)",p.appendChild(g);const y=document.createElement("div");y.style.display="flex",y.style.flexWrap="wrap",y.style.gap="var(--size-element-gap-sm)",[{text:"user@example.com",style:"primary"},{text:"admin@example.com",style:"primary"},{text:"support@example.com",style:"primary"}].forEach(t=>{const r=o.createChip({text:t.text,style:t.style,size:"b2",onRemove:()=>{console.log(`Removed: ${t.text}`)}});y.appendChild(r)}),p.appendChild(y),e.appendChild(p);const d=document.createElement("div");d.style.display="flex",d.style.flexDirection="column",d.style.gap="var(--size-element-gap-sm)";const v=document.createElement("div");v.className="h6",v.textContent="Size Variants",v.style.marginBottom="var(--size-element-gap-xs)",d.appendChild(v);const h=document.createElement("div");return h.style.display="flex",h.style.flexDirection="column",h.style.gap="var(--size-element-gap-sm)",["h4","h5","h6","b1","b2","b3"].forEach(t=>{const r=o.createChip({text:`Size ${t.toUpperCase()}`,style:"primary",size:t,onRemove:()=>{console.log(`Removed size ${t} chip`)}});h.appendChild(r)}),d.appendChild(h),e.appendChild(d),e}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-element-gap-sm)';
    container.style.alignItems = 'center';
    const styles = [{
      name: 'default',
      style: 'default'
    }, {
      name: 'primary',
      style: 'primary'
    }, {
      name: 'secondary',
      style: 'secondary'
    }, {
      name: 'info',
      style: 'info'
    }, {
      name: 'warning',
      style: 'warning'
    }, {
      name: 'error',
      style: 'error'
    }, {
      name: 'success',
      style: 'success'
    }];
    styles.forEach(({
      name,
      style
    }) => {
      const chip = PlusInterface.createChip({
        text: 'Badge',
        style: style,
        size: 'b1',
        onRemove: () => {
          console.log(\`Removed: \${name}\`);
        }
      });
      container.appendChild(chip);
    });
    return container;
  }
}`,...u.parameters?.docs?.source},description:{story:`Style Variants
Shows all 7 chip style variants exactly as shown in Figma
Styles: default, primary, secondary, info, warning, error, success`,...u.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip(args);
    container.appendChild(chip);
    return container;
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Chip text'
    },
    style: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'info', 'warning', 'error', 'success'],
      description: 'Chip style'
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Chip size'
    }
  },
  args: {
    text: 'Badge',
    style: 'default',
    size: 'b1'
  }
}`,...C.parameters?.docs?.source},description:{story:`Interactive Chip
Interactive playground for testing chip variations`,...C.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.alignItems = 'flex-start';
    const states = [{
      name: 'default',
      classes: []
    }, {
      name: 'hover',
      classes: ['plus-chip-hover']
    }, {
      name: 'focus',
      classes: ['plus-chip-focus']
    }, {
      name: 'pressed',
      classes: ['plus-chip-pressed']
    }, {
      name: 'disabled',
      classes: ['plus-chip-disabled']
    }];
    states.forEach(({
      name,
      classes
    }) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      wrapper.style.alignItems = 'flex-start';
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.style.color = 'var(--color-outline)';
      label.style.fontSize = '12px';
      label.textContent = name;
      wrapper.appendChild(label);
      const chip = PlusInterface.createChip({
        text: 'Badge',
        style: 'default',
        size: 'b1',
        classes: classes,
        onRemove: () => {
          console.log(\`Removed: \${name}\`);
        }
      });
      wrapper.appendChild(chip);
      container.appendChild(wrapper);
    });
    return container;
  }
}`,...x.parameters?.docs?.source},description:{story:`States
Shows chip states: default, hover, focus, pressed, disabled`,...x.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';

    // Example 1: Filter chips
    const filterSection = document.createElement('div');
    filterSection.style.display = 'flex';
    filterSection.style.flexDirection = 'column';
    filterSection.style.gap = 'var(--size-element-gap-sm)';
    const filterLabel = document.createElement('div');
    filterLabel.className = 'h6';
    filterLabel.textContent = 'Filter Chips';
    filterLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    filterSection.appendChild(filterLabel);
    const filterChipsContainer = document.createElement('div');
    filterChipsContainer.style.display = 'flex';
    filterChipsContainer.style.flexWrap = 'wrap';
    filterChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    const filterChips = [{
      text: 'Active',
      style: 'success'
    }, {
      text: 'Pending',
      style: 'warning'
    }, {
      text: 'Completed',
      style: 'primary'
    }, {
      text: 'Archived',
      style: 'secondary'
    }];
    filterChips.forEach(chipData => {
      const chip = PlusInterface.createChip({
        text: chipData.text,
        style: chipData.style,
        size: 'b2',
        onRemove: () => {
          console.log(\`Removed filter: \${chipData.text}\`);
        }
      });
      filterChipsContainer.appendChild(chip);
    });
    filterSection.appendChild(filterChipsContainer);
    container.appendChild(filterSection);

    // Example 2: Selected items
    const selectedSection = document.createElement('div');
    selectedSection.style.display = 'flex';
    selectedSection.style.flexDirection = 'column';
    selectedSection.style.gap = 'var(--size-element-gap-sm)';
    const selectedLabel = document.createElement('div');
    selectedLabel.className = 'h6';
    selectedLabel.textContent = 'Selected Items';
    selectedLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    selectedSection.appendChild(selectedLabel);
    const selectedChipsContainer = document.createElement('div');
    selectedChipsContainer.style.display = 'flex';
    selectedChipsContainer.style.flexWrap = 'wrap';
    selectedChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    const selectedItems = [{
      text: 'Item 1',
      style: 'primary'
    }, {
      text: 'Item 2',
      style: 'primary'
    }, {
      text: 'Item 3',
      style: 'primary'
    }];
    selectedItems.forEach(item => {
      const chip = PlusInterface.createChip({
        text: item.text,
        style: item.style,
        size: 'b2',
        onRemove: () => {
          console.log(\`Deselected: \${item.text}\`);
        }
      });
      selectedChipsContainer.appendChild(chip);
    });
    selectedSection.appendChild(selectedChipsContainer);
    container.appendChild(selectedSection);

    // Example 3: Input chips (e.g., email addresses)
    const inputSection = document.createElement('div');
    inputSection.style.display = 'flex';
    inputSection.style.flexDirection = 'column';
    inputSection.style.gap = 'var(--size-element-gap-sm)';
    const inputLabel = document.createElement('div');
    inputLabel.className = 'h6';
    inputLabel.textContent = 'Input Chips (e.g., Email Addresses)';
    inputLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    inputSection.appendChild(inputLabel);
    const inputChipsContainer = document.createElement('div');
    inputChipsContainer.style.display = 'flex';
    inputChipsContainer.style.flexWrap = 'wrap';
    inputChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    const inputChips = [{
      text: 'user@example.com',
      style: 'primary'
    }, {
      text: 'admin@example.com',
      style: 'primary'
    }, {
      text: 'support@example.com',
      style: 'primary'
    }];
    inputChips.forEach(chipData => {
      const chip = PlusInterface.createChip({
        text: chipData.text,
        style: chipData.style,
        size: 'b2',
        onRemove: () => {
          console.log(\`Removed: \${chipData.text}\`);
        }
      });
      inputChipsContainer.appendChild(chip);
    });
    inputSection.appendChild(inputChipsContainer);
    container.appendChild(inputSection);

    // Example 4: Different sizes
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-element-gap-sm)';
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h6';
    sizesLabel.textContent = 'Size Variants';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    sizesSection.appendChild(sizesLabel);
    const sizesChipsContainer = document.createElement('div');
    sizesChipsContainer.style.display = 'flex';
    sizesChipsContainer.style.flexDirection = 'column';
    sizesChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    const sizeVariants = ['h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    sizeVariants.forEach(size => {
      const chip = PlusInterface.createChip({
        text: \`Size \${size.toUpperCase()}\`,
        style: 'primary',
        size: size,
        onRemove: () => {
          console.log(\`Removed size \${size} chip\`);
        }
      });
      sizesChipsContainer.appendChild(chip);
    });
    sizesSection.appendChild(sizesChipsContainer);
    container.appendChild(sizesSection);
    return container;
  }
}`,...f.parameters?.docs?.source},description:{story:`Usage Examples
Real-world examples showing chips in different contexts`,...f.parameters?.docs?.description}}};const N=["StyleVariants","Interactive","States","UsageExamples"];export{C as Interactive,x as States,u as StyleVariants,f as UsageExamples,N as __namedExportsOrder,P as default};
