import{P as o}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const C={title:"Components/Jumbotron",tags:["autodocs"],parameters:{docs:{description:{component:"Jumbotron component for creating large hero sections on marketing/landing pages. Supports multiple content configurations, size variants, and fluid layout. Uses section-level tokens for spacing and layout."}}}},l={render:t=>{const e={title:t.title||"Hello, world!",subtitle:t.subtitle||null,body:t.body||"This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.",fluid:t.fluid||!1,paddingSize:t.paddingSize||"md",gapSize:t.gapSize||"md",radiusSize:t.radiusSize||"md"};return t.showSubtitle&&(e.subtitle=t.subtitle||"It uses utility classes for typography and spacing to space content out within the larger container."),t.showPrimaryButton&&(e.primaryButton={text:t.primaryButtonText||"Learn more",style:t.primaryButtonStyle||"primary",fill:t.primaryButtonFill||"filled",size:t.primaryButtonSize||"default",onClick:()=>alert("Primary button clicked")}),t.showSecondaryButton&&(e.secondaryButton={text:t.secondaryButtonText||"Get started",style:t.secondaryButtonStyle||"secondary",fill:t.secondaryButtonFill||"outline",size:t.secondaryButtonSize||"default",onClick:()=>alert("Secondary button clicked")}),o.createJumbotron(e)},argTypes:{title:{control:"text",description:"Jumbotron title/heading"},showSubtitle:{control:"boolean",description:"Show subtitle"},subtitle:{control:"text",description:"Jumbotron subtitle",if:{arg:"showSubtitle",eq:!0}},body:{control:"text",description:"Jumbotron body text"},showPrimaryButton:{control:"boolean",description:"Show primary action button"},primaryButtonText:{control:"text",description:"Primary button text",if:{arg:"showPrimaryButton",eq:!0}},primaryButtonStyle:{control:"select",options:["primary","secondary","tertiary","success","info","warning","error","default"],description:"Primary button style",if:{arg:"showPrimaryButton",eq:!0}},primaryButtonFill:{control:"select",options:["filled","outline","tonal","text"],description:"Primary button fill variant",if:{arg:"showPrimaryButton",eq:!0}},primaryButtonSize:{control:"select",options:["small","default","large"],description:"Primary button size",if:{arg:"showPrimaryButton",eq:!0}},showSecondaryButton:{control:"boolean",description:"Show secondary action button"},secondaryButtonText:{control:"text",description:"Secondary button text",if:{arg:"showSecondaryButton",eq:!0}},secondaryButtonStyle:{control:"select",options:["primary","secondary","tertiary","success","info","warning","error","default"],description:"Secondary button style",if:{arg:"showSecondaryButton",eq:!0}},secondaryButtonFill:{control:"select",options:["filled","outline","tonal","text"],description:"Secondary button fill variant",if:{arg:"showSecondaryButton",eq:!0}},secondaryButtonSize:{control:"select",options:["small","default","large"],description:"Secondary button size",if:{arg:"showSecondaryButton",eq:!0}},fluid:{control:"boolean",description:"Make jumbotron fluid (full width, no border-radius)"},paddingSize:{control:"select",options:["sm","md","lg"],description:"Jumbotron padding size"},gapSize:{control:"select",options:["sm","md","lg"],description:"Jumbotron gap size"},radiusSize:{control:"select",options:["sm","md","lg"],description:"Jumbotron border radius size"}},args:{title:"Hello, world!",showSubtitle:!1,subtitle:"It uses utility classes for typography and spacing to space content out within the larger container.",body:"This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.",showPrimaryButton:!0,primaryButtonText:"Learn more",primaryButtonStyle:"primary",primaryButtonFill:"filled",primaryButtonSize:"default",showSecondaryButton:!1,secondaryButtonText:"Get started",secondaryButtonStyle:"secondary",secondaryButtonFill:"outline",secondaryButtonSize:"default",fluid:!1,paddingSize:"md",gapSize:"md",radiusSize:"md"}};l.storyName="Interactive";const s={render:()=>o.createJumbotron({title:"Hello, world!",body:"This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.",primaryButton:{text:"Learn more",style:"primary",fill:"filled",size:"default",onClick:()=>alert("Learn more clicked")}})};s.storyName="Default";const d={render:()=>o.createJumbotron({title:"Hello, world!",subtitle:"It uses utility classes for typography and spacing to space content out within the larger container.",body:"This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.",primaryButton:{text:"Learn more",style:"primary",fill:"filled",size:"default",onClick:()=>alert("Learn more clicked")},secondaryButton:{text:"Get started",style:"secondary",fill:"outline",size:"default",onClick:()=>alert("Get started clicked")}})};d.storyName="With Subtitle";const c={render:()=>o.createJumbotron({title:"Fluid Jumbotron",body:"This is a fluid jumbotron that spans the full width of its container with no border-radius.",fluid:!0,primaryButton:{text:"Learn more",style:"primary",fill:"filled",size:"default",onClick:()=>alert("Learn more clicked")}})};c.storyName="Fluid";const u={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)";const e=["sm","md","lg"],r={sm:"sm",md:"md",lg:"lg"};return e.forEach(n=>{const i=document.createElement("div");i.className="h6",i.textContent=`Size: ${n.toUpperCase()} - Padding: ${n}, Gap: ${n}, Radius: ${r[n]}`,i.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(i);const a=o.createJumbotron({title:`Jumbotron ${n.toUpperCase()}`,body:`This is a ${n} size jumbotron with ${n} padding, ${n} gap, and ${r[n]} radius. The radius matches the padding size tier for visual consistency.`,paddingSize:n,gapSize:n,radiusSize:r[n],primaryButton:{text:"Action",style:"primary",fill:"filled",size:"default",onClick:()=>{}}});t.appendChild(a)}),t}};u.storyName="Size Variants";const m={render:()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-section-gap-lg)";const e=document.createElement("div");e.className="h6",e.textContent="Title Only",e.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(e);const r=o.createJumbotron({title:"Title Only Jumbotron"});t.appendChild(r);const n=document.createElement("div");n.className="h6",n.textContent="Title + Body",n.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(n);const i=o.createJumbotron({title:"Title + Body",body:"This jumbotron has a title and body text."});t.appendChild(i);const a=document.createElement("div");a.className="h6",a.textContent="Title + Subtitle + Body",a.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(a);const y=o.createJumbotron({title:"Full Content",subtitle:"Subtitle text here",body:"This jumbotron has title, subtitle, and body text."});t.appendChild(y);const p=document.createElement("div");p.className="h6",p.textContent="With Action Buttons",p.style.marginBottom="var(--size-element-gap-sm)",t.appendChild(p);const b=o.createJumbotron({title:"With Buttons",body:"This jumbotron includes action buttons.",primaryButton:{text:"Primary",style:"primary",fill:"filled",size:"default",onClick:()=>{}},secondaryButton:{text:"Secondary",style:"secondary",fill:"outline",size:"default",onClick:()=>{}}});return t.appendChild(b),t}};m.storyName="Content Variants";l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: args => {
    // Build jumbotron options based on args
    const jumbotronOptions = {
      title: args.title || 'Hello, world!',
      subtitle: args.subtitle || null,
      body: args.body || 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      fluid: args.fluid || false,
      paddingSize: args.paddingSize || 'md',
      gapSize: args.gapSize || 'md',
      radiusSize: args.radiusSize || 'md'
    };

    // Add subtitle if enabled
    if (args.showSubtitle) {
      jumbotronOptions.subtitle = args.subtitle || 'It uses utility classes for typography and spacing to space content out within the larger container.';
    }

    // Add primary button if enabled
    if (args.showPrimaryButton) {
      jumbotronOptions.primaryButton = {
        text: args.primaryButtonText || 'Learn more',
        style: args.primaryButtonStyle || 'primary',
        fill: args.primaryButtonFill || 'filled',
        size: args.primaryButtonSize || 'default',
        onClick: () => alert('Primary button clicked')
      };
    }

    // Add secondary button if enabled
    if (args.showSecondaryButton) {
      jumbotronOptions.secondaryButton = {
        text: args.secondaryButtonText || 'Get started',
        style: args.secondaryButtonStyle || 'secondary',
        fill: args.secondaryButtonFill || 'outline',
        size: args.secondaryButtonSize || 'default',
        onClick: () => alert('Secondary button clicked')
      };
    }
    const jumbotron = PlusInterface.createJumbotron(jumbotronOptions);
    return jumbotron;
  },
  argTypes: {
    // Content controls
    title: {
      control: 'text',
      description: 'Jumbotron title/heading'
    },
    showSubtitle: {
      control: 'boolean',
      description: 'Show subtitle'
    },
    subtitle: {
      control: 'text',
      description: 'Jumbotron subtitle',
      if: {
        arg: 'showSubtitle',
        eq: true
      }
    },
    body: {
      control: 'text',
      description: 'Jumbotron body text'
    },
    showPrimaryButton: {
      control: 'boolean',
      description: 'Show primary action button'
    },
    primaryButtonText: {
      control: 'text',
      description: 'Primary button text',
      if: {
        arg: 'showPrimaryButton',
        eq: true
      }
    },
    primaryButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Primary button style',
      if: {
        arg: 'showPrimaryButton',
        eq: true
      }
    },
    primaryButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Primary button fill variant',
      if: {
        arg: 'showPrimaryButton',
        eq: true
      }
    },
    primaryButtonSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Primary button size',
      if: {
        arg: 'showPrimaryButton',
        eq: true
      }
    },
    showSecondaryButton: {
      control: 'boolean',
      description: 'Show secondary action button'
    },
    secondaryButtonText: {
      control: 'text',
      description: 'Secondary button text',
      if: {
        arg: 'showSecondaryButton',
        eq: true
      }
    },
    secondaryButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Secondary button style',
      if: {
        arg: 'showSecondaryButton',
        eq: true
      }
    },
    secondaryButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Secondary button fill variant',
      if: {
        arg: 'showSecondaryButton',
        eq: true
      }
    },
    secondaryButtonSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Secondary button size',
      if: {
        arg: 'showSecondaryButton',
        eq: true
      }
    },
    // Styling controls
    fluid: {
      control: 'boolean',
      description: 'Make jumbotron fluid (full width, no border-radius)'
    },
    paddingSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Jumbotron padding size'
    },
    gapSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Jumbotron gap size'
    },
    radiusSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Jumbotron border radius size'
    }
  },
  args: {
    // Content defaults
    title: 'Hello, world!',
    showSubtitle: false,
    subtitle: 'It uses utility classes for typography and spacing to space content out within the larger container.',
    body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
    showPrimaryButton: true,
    primaryButtonText: 'Learn more',
    primaryButtonStyle: 'primary',
    primaryButtonFill: 'filled',
    primaryButtonSize: 'default',
    showSecondaryButton: false,
    secondaryButtonText: 'Get started',
    secondaryButtonStyle: 'secondary',
    secondaryButtonFill: 'outline',
    secondaryButtonSize: 'default',
    // Styling defaults
    fluid: false,
    paddingSize: 'md',
    gapSize: 'md',
    radiusSize: 'md'
  }
}`,...l.parameters?.docs?.source},description:{story:`Interactive
Interactive playground with Storybook controls`,...l.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      }
    });
  }
}`,...s.parameters?.docs?.source},description:{story:`Default
Standard jumbotron with title, body, and primary button`,...s.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      subtitle: 'It uses utility classes for typography and spacing to space content out within the larger container.',
      body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      },
      secondaryButton: {
        text: 'Get started',
        style: 'secondary',
        fill: 'outline',
        size: 'default',
        onClick: () => alert('Get started clicked')
      }
    });
  }
}`,...d.parameters?.docs?.source},description:{story:`With Subtitle
Jumbotron with title, subtitle, body, and buttons`,...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Fluid Jumbotron',
      body: 'This is a fluid jumbotron that spans the full width of its container with no border-radius.',
      fluid: true,
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      }
    });
  }
}`,...c.parameters?.docs?.source},description:{story:`Fluid
Full-width jumbotron with no border-radius`,...c.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    const sizes = ['sm', 'md', 'lg'];
    const radiusMap = {
      sm: 'sm',
      md: 'md',
      lg: 'lg'
    };
    sizes.forEach(size => {
      const label = document.createElement('div');
      label.className = 'h6';
      label.textContent = \`Size: \${size.toUpperCase()} - Padding: \${size}, Gap: \${size}, Radius: \${radiusMap[size]}\`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      container.appendChild(label);
      const jumbotron = PlusInterface.createJumbotron({
        title: \`Jumbotron \${size.toUpperCase()}\`,
        body: \`This is a \${size} size jumbotron with \${size} padding, \${size} gap, and \${radiusMap[size]} radius. The radius matches the padding size tier for visual consistency.\`,
        paddingSize: size,
        gapSize: size,
        radiusSize: radiusMap[size],
        primaryButton: {
          text: 'Action',
          style: 'primary',
          fill: 'filled',
          size: 'default',
          onClick: () => {}
        }
      });
      container.appendChild(jumbotron);
    });
    return container;
  }
}`,...u.parameters?.docs?.source},description:{story:"Size Variants\nShows all padding and gap size variants with corresponding radius sizes\n\n**Radius-Padding Relationship**: Match radius size to padding size tier\n- **Small (sm)**: `section-pad-sm` (16px) → `section-radius-sm` (8px) - Compact sections\n- **Medium (md)**: `section-pad-md` (24px) → `section-radius-md` (8px) - Standard sections\n- **Large (lg)**: `section-pad-lg` (36px) → `section-radius-lg` (16px) - Spacious sections",...u.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';

    // Title only
    const titleOnlyLabel = document.createElement('div');
    titleOnlyLabel.className = 'h6';
    titleOnlyLabel.textContent = 'Title Only';
    titleOnlyLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(titleOnlyLabel);
    const titleOnly = PlusInterface.createJumbotron({
      title: 'Title Only Jumbotron'
    });
    container.appendChild(titleOnly);

    // Title + Body
    const titleBodyLabel = document.createElement('div');
    titleBodyLabel.className = 'h6';
    titleBodyLabel.textContent = 'Title + Body';
    titleBodyLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(titleBodyLabel);
    const titleBody = PlusInterface.createJumbotron({
      title: 'Title + Body',
      body: 'This jumbotron has a title and body text.'
    });
    container.appendChild(titleBody);

    // Title + Subtitle + Body
    const fullLabel = document.createElement('div');
    fullLabel.className = 'h6';
    fullLabel.textContent = 'Title + Subtitle + Body';
    fullLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(fullLabel);
    const full = PlusInterface.createJumbotron({
      title: 'Full Content',
      subtitle: 'Subtitle text here',
      body: 'This jumbotron has title, subtitle, and body text.'
    });
    container.appendChild(full);

    // With buttons
    const withButtonsLabel = document.createElement('div');
    withButtonsLabel.className = 'h6';
    withButtonsLabel.textContent = 'With Action Buttons';
    withButtonsLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(withButtonsLabel);
    const withButtons = PlusInterface.createJumbotron({
      title: 'With Buttons',
      body: 'This jumbotron includes action buttons.',
      primaryButton: {
        text: 'Primary',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => {}
      },
      secondaryButton: {
        text: 'Secondary',
        style: 'secondary',
        fill: 'outline',
        size: 'default',
        onClick: () => {}
      }
    });
    container.appendChild(withButtons);
    return container;
  }
}`,...m.parameters?.docs?.source},description:{story:`Content Variants
Shows different content configurations`,...m.parameters?.docs?.description}}};const T=["Interactive","Default","WithSubtitle","Fluid","SizeVariants","ContentVariants"];export{m as ContentVariants,s as Default,c as Fluid,l as Interactive,u as SizeVariants,d as WithSubtitle,T as __namedExportsOrder,C as default};
