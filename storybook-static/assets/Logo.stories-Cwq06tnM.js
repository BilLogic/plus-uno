import{P as u}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const T={title:"Assets/Logo",tags:["autodocs"],parameters:{docs:{description:{component:"PLUS brand logo component with multiple styles (colored, filled, outlined), sizes (XS, S, M, L, XL), and optional text wordmark. Matches Figma design system specifications exactly."}}}},c={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1400px",t.style.margin="0 auto";const n=document.createElement("h2");n.className="h2",n.textContent="All Logo Variants",n.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(n);const d=["colored","filled","outlined"],y=["XS","S","M","L","XL"],o=[!1,!0];return d.forEach(r=>{const a=document.createElement("div");a.style.marginBottom="var(--size-section-pad-y-lg)";const i=document.createElement("h3");i.className="h3",i.textContent=`${r.charAt(0).toUpperCase()+r.slice(1)} Style`,i.style.marginBottom="var(--size-card-gap-md)",a.appendChild(i);const e=document.createElement("div");e.style.display="grid",e.style.gridTemplateColumns="repeat(auto-fit, minmax(96px, 1fr))",e.style.gap="var(--size-card-gap-md)",e.style.alignItems="center",e.style.justifyItems="center",e.style.padding="var(--size-card-pad-y-md)",e.style.backgroundColor="var(--color-surface-container-low)",e.style.borderRadius="var(--size-card-radius-sm)",y.forEach(l=>{o.forEach(s=>{const g=u.createLogo({style:r,size:l,text:s});e.appendChild(g)})}),a.appendChild(e),t.appendChild(a)}),t}},m={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1400px",t.style.margin="0 auto";const n=document.createElement("h2");n.className="h2",n.textContent="Style Variants",n.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(n);const d=["XS","S","M","L","XL"];return[!1,!0].forEach(o=>{const r=document.createElement("div");r.style.marginBottom="var(--size-section-pad-y-lg)";const a=document.createElement("h3");a.className="h3",a.textContent=o?"With Text":"Without Text",a.style.marginBottom="var(--size-card-gap-md)",r.appendChild(a),d.forEach(i=>{const e=document.createElement("div");e.style.marginBottom="var(--size-card-gap-lg)";const l=document.createElement("h4");l.className="h4",l.textContent=`Size ${i}`,l.style.marginBottom="var(--size-element-gap-md)",e.appendChild(l);const s=document.createElement("div");s.style.display="flex",s.style.gap="var(--size-card-gap-lg)",s.style.alignItems="center",s.style.flexWrap="wrap",s.style.padding="var(--size-card-pad-y-md)",s.style.backgroundColor="var(--color-surface-container-low)",s.style.borderRadius="var(--size-card-radius-sm)",["colored","filled","outlined"].forEach(g=>{const h=u.createLogo({style:g,size:i,text:o});s.appendChild(h)}),e.appendChild(s),r.appendChild(e)}),t.appendChild(r)}),t}},p={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1400px",t.style.margin="0 auto";const n=document.createElement("h2");n.className="h2",n.textContent="Size Variants",n.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(n);const d=["colored","filled","outlined"],y=[!1,!0];return d.forEach(o=>{y.forEach(r=>{const a=document.createElement("div");a.style.marginBottom="var(--size-section-pad-y-lg)";const i=document.createElement("h3");i.className="h3",i.textContent=`${o.charAt(0).toUpperCase()+o.slice(1)} Style - ${r?"With Text":"Without Text"}`,i.style.marginBottom="var(--size-card-gap-md)",a.appendChild(i);const e=document.createElement("div");e.style.display="flex",e.style.gap="var(--size-card-gap-lg)",e.style.alignItems="center",e.style.flexWrap="wrap",e.style.padding="var(--size-card-pad-y-md)",e.style.backgroundColor="var(--color-surface-container-low)",e.style.borderRadius="var(--size-card-radius-sm)",["XS","S","M","L","XL"].forEach(l=>{const s=u.createLogo({style:o,size:l,text:r});e.appendChild(s)}),a.appendChild(e),t.appendChild(a)})}),t}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'All Logo Variants';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const styles = ['colored', 'filled', 'outlined'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const textStates = [false, true];
    styles.forEach(style => {
      const styleSection = document.createElement('div');
      styleSection.style.marginBottom = 'var(--size-section-pad-y-lg)';
      const styleTitle = document.createElement('h3');
      styleTitle.className = 'h3';
      styleTitle.textContent = \`\${style.charAt(0).toUpperCase() + style.slice(1)} Style\`;
      styleTitle.style.marginBottom = 'var(--size-card-gap-md)';
      styleSection.appendChild(styleTitle);
      const styleGrid = document.createElement('div');
      styleGrid.style.display = 'grid';
      // Use auto-fit grid so that each style renders in 2–3 rows at common widths
      styleGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(96px, 1fr))';
      styleGrid.style.gap = 'var(--size-card-gap-md)';
      styleGrid.style.alignItems = 'center';
      styleGrid.style.justifyItems = 'center';
      styleGrid.style.padding = 'var(--size-card-pad-y-md)';
      styleGrid.style.backgroundColor = 'var(--color-surface-container-low)';
      styleGrid.style.borderRadius = 'var(--size-card-radius-sm)';
      sizes.forEach(size => {
        textStates.forEach(text => {
          const logo = PlusInterface.createLogo({
            style: style,
            size: size,
            text: text
          });
          styleGrid.appendChild(logo);
        });
      });
      styleSection.appendChild(styleGrid);
      container.appendChild(styleSection);
    });
    return container;
  }
}`,...c.parameters?.docs?.source},description:{story:`All Variants
Shows all logo combinations: 3 styles × 5 sizes × 2 text states = 30 variants`,...c.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Style Variants';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const textStates = [false, true];
    textStates.forEach(text => {
      const textSection = document.createElement('div');
      textSection.style.marginBottom = 'var(--size-section-pad-y-lg)';
      const textTitle = document.createElement('h3');
      textTitle.className = 'h3';
      textTitle.textContent = text ? 'With Text' : 'Without Text';
      textTitle.style.marginBottom = 'var(--size-card-gap-md)';
      textSection.appendChild(textTitle);
      sizes.forEach(size => {
        const sizeSection = document.createElement('div');
        sizeSection.style.marginBottom = 'var(--size-card-gap-lg)';
        const sizeTitle = document.createElement('h4');
        sizeTitle.className = 'h4';
        sizeTitle.textContent = \`Size \${size}\`;
        sizeTitle.style.marginBottom = 'var(--size-element-gap-md)';
        sizeSection.appendChild(sizeTitle);
        const styleGrid = document.createElement('div');
        styleGrid.style.display = 'flex';
        styleGrid.style.gap = 'var(--size-card-gap-lg)';
        styleGrid.style.alignItems = 'center';
        styleGrid.style.flexWrap = 'wrap';
        styleGrid.style.padding = 'var(--size-card-pad-y-md)';
        styleGrid.style.backgroundColor = 'var(--color-surface-container-low)';
        styleGrid.style.borderRadius = 'var(--size-card-radius-sm)';
        ['colored', 'filled', 'outlined'].forEach(style => {
          const logo = PlusInterface.createLogo({
            style: style,
            size: size,
            text: text
          });
          styleGrid.appendChild(logo);
        });
        sizeSection.appendChild(styleGrid);
        textSection.appendChild(sizeSection);
      });
      container.appendChild(textSection);
    });
    return container;
  }
}`,...m.parameters?.docs?.source},description:{story:`Style Variants
Shows all 3 styles side-by-side for each size`,...m.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Size Variants';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const styles = ['colored', 'filled', 'outlined'];
    const textStates = [false, true];
    styles.forEach(style => {
      textStates.forEach(text => {
        const variantSection = document.createElement('div');
        variantSection.style.marginBottom = 'var(--size-section-pad-y-lg)';
        const variantTitle = document.createElement('h3');
        variantTitle.className = 'h3';
        variantTitle.textContent = \`\${style.charAt(0).toUpperCase() + style.slice(1)} Style - \${text ? 'With Text' : 'Without Text'}\`;
        variantTitle.style.marginBottom = 'var(--size-card-gap-md)';
        variantSection.appendChild(variantTitle);
        const sizeGrid = document.createElement('div');
        sizeGrid.style.display = 'flex';
        sizeGrid.style.gap = 'var(--size-card-gap-lg)';
        sizeGrid.style.alignItems = 'center';
        sizeGrid.style.flexWrap = 'wrap';
        sizeGrid.style.padding = 'var(--size-card-pad-y-md)';
        sizeGrid.style.backgroundColor = 'var(--color-surface-container-low)';
        sizeGrid.style.borderRadius = 'var(--size-card-radius-sm)';
        ['XS', 'S', 'M', 'L', 'XL'].forEach(size => {
          const logo = PlusInterface.createLogo({
            style: style,
            size: size,
            text: text
          });
          sizeGrid.appendChild(logo);
        });
        variantSection.appendChild(sizeGrid);
        container.appendChild(variantSection);
      });
    });
    return container;
  }
}`,...p.parameters?.docs?.source},description:{story:`Size Variants
Shows all 5 sizes for each style`,...p.parameters?.docs?.description}}};const L=["AllVariants","StyleVariants","SizeVariants"];export{c as AllVariants,p as SizeVariants,m as StyleVariants,L as __namedExportsOrder,T as default};
