import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const h={title:"Components/Card",tags:["autodocs"],parameters:{docs:{description:{component:"Card components are self-contained containers that display related information and help users quickly scan, compare, and interact with content. Cards are modular - each part (image, title, subtitle, body, header, items, footer, links, button) can be added or removed independently."}}}},o={render:t=>{const e={paddingSize:t.paddingSize||"md",gapSize:t.gapSize||"md",radiusSize:t.radiusSize||"sm",borderSize:t.borderSize||"sm",showBorder:t.showBorder!==!1};if(t.showImage){const n=document.createElement("div");n.style.width="100%",n.style.height="200px",n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.backgroundColor="var(--color-surface-variant)",n.style.color="var(--color-on-surface-variant)",n.textContent=t.imageText||"Image cap",e.image=n}return t.showTitle&&(e.title=t.title||"Card Title"),t.showSubtitle&&(e.subtitle=t.subtitle||"Card Subtitle"),t.showBody&&(e.body=t.body||"Some quick example text to build on the card title and make up the bulk of the card's content."),t.showHeader&&(e.header=t.header||"Header"),t.showItems&&(e.items=t.items?t.items.split(",").map(n=>n.trim()):["Item #1","Item #2","Item #3"]),t.showFooter&&(e.footer=t.footer||"Footer"),t.showLinks&&(e.links=[{text:t.link1Text||"Link #1",href:"#",onClick:()=>alert("Link #1 clicked")},{text:t.link2Text||"Link #2",href:"#",onClick:()=>alert("Link #2 clicked")}]),t.showActionButton&&(e.actionButton={text:t.actionButtonText||"Action",style:t.actionButtonStyle||"primary",fill:t.actionButtonFill||"filled",size:t.actionButtonSize||"default",onClick:()=>alert("Action button clicked")}),t.cardClickable&&(e.onClick=()=>{alert("Card clicked!")}),i.createCard(e)},argTypes:{showImage:{control:"boolean",description:"Show image/media area at top of card"},imageText:{control:"text",description:"Image placeholder text",if:{arg:"showImage",eq:!0}},showTitle:{control:"boolean",description:"Show card title"},title:{control:"text",description:"Card title text",if:{arg:"showTitle",eq:!0}},showSubtitle:{control:"boolean",description:"Show card subtitle"},subtitle:{control:"text",description:"Card subtitle text",if:{arg:"showSubtitle",eq:!0}},showBody:{control:"boolean",description:"Show card body content"},body:{control:"text",description:"Card body text",if:{arg:"showBody",eq:!0}},showHeader:{control:"boolean",description:"Show header section"},header:{control:"text",description:"Header section text",if:{arg:"showHeader",eq:!0}},showItems:{control:"boolean",description:"Show list items"},items:{control:"text",description:'Comma-separated list of items (e.g., "Item #1, Item #2, Item #3")',if:{arg:"showItems",eq:!0}},showFooter:{control:"boolean",description:"Show footer section text"},footer:{control:"text",description:"Footer section text",if:{arg:"showFooter",eq:!0}},showLinks:{control:"boolean",description:"Show footer links"},link1Text:{control:"text",description:"First link text",if:{arg:"showLinks",eq:!0}},link2Text:{control:"text",description:"Second link text",if:{arg:"showLinks",eq:!0}},showActionButton:{control:"boolean",description:"Show action button"},actionButtonText:{control:"text",description:"Action button text",if:{arg:"showActionButton",eq:!0}},actionButtonStyle:{control:"select",options:["primary","secondary","tertiary","success","info","warning","error","default"],description:"Action button style",if:{arg:"showActionButton",eq:!0}},actionButtonFill:{control:"select",options:["filled","outline","tonal","text"],description:"Action button fill variant",if:{arg:"showActionButton",eq:!0}},actionButtonSize:{control:"select",options:["small","default","large"],description:"Action button size",if:{arg:"showActionButton",eq:!0}},paddingSize:{control:"select",options:["sm","md","lg"],description:"Card padding size"},gapSize:{control:"select",options:["sm","md","lg"],description:"Card gap size"},radiusSize:{control:"select",options:["sm","md"],description:"Card border radius size"},borderSize:{control:"select",options:["sm","md","lg"],description:"Card border size"},showBorder:{control:"boolean",description:"Show card border"},cardClickable:{control:"boolean",description:"Make entire card clickable"}},args:{showImage:!1,imageText:"Image cap",showTitle:!0,title:"Card Title",showSubtitle:!1,subtitle:"Card Subtitle",showBody:!0,body:"Some quick example text to build on the card title and make up the bulk of the card's content.",showHeader:!1,header:"Header",showItems:!1,items:"Item #1, Item #2, Item #3",showFooter:!1,footer:"Footer",showLinks:!1,link1Text:"Link #1",link2Text:"Link #2",showActionButton:!1,actionButtonText:"Action",actionButtonStyle:"primary",actionButtonFill:"filled",actionButtonSize:"default",paddingSize:"md",gapSize:"md",radiusSize:"sm",borderSize:"sm",showBorder:!0,cardClickable:!1}};o.storyName="Interactive";o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: args => {
    // Build card options based on args
    const cardOptions = {
      paddingSize: args.paddingSize || 'md',
      gapSize: args.gapSize || 'md',
      radiusSize: args.radiusSize || 'sm',
      borderSize: args.borderSize || 'sm',
      showBorder: args.showBorder !== false
    };

    // Add image if enabled
    if (args.showImage) {
      const imagePlaceholder = document.createElement('div');
      imagePlaceholder.style.width = '100%';
      imagePlaceholder.style.height = '200px';
      imagePlaceholder.style.display = 'flex';
      imagePlaceholder.style.alignItems = 'center';
      imagePlaceholder.style.justifyContent = 'center';
      imagePlaceholder.style.backgroundColor = 'var(--color-surface-variant)';
      imagePlaceholder.style.color = 'var(--color-on-surface-variant)';
      imagePlaceholder.textContent = args.imageText || 'Image cap';
      cardOptions.image = imagePlaceholder;
    }

    // Add title if enabled
    if (args.showTitle) {
      cardOptions.title = args.title || 'Card Title';
    }

    // Add subtitle if enabled
    if (args.showSubtitle) {
      cardOptions.subtitle = args.subtitle || 'Card Subtitle';
    }

    // Add body if enabled
    if (args.showBody) {
      cardOptions.body = args.body || 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.';
    }

    // Add header if enabled
    if (args.showHeader) {
      cardOptions.header = args.header || 'Header';
    }

    // Add items if enabled
    if (args.showItems) {
      cardOptions.items = args.items ? args.items.split(',').map(item => item.trim()) : ['Item #1', 'Item #2', 'Item #3'];
    }

    // Add footer text if enabled
    if (args.showFooter) {
      cardOptions.footer = args.footer || 'Footer';
    }

    // Add links if enabled
    if (args.showLinks) {
      cardOptions.links = [{
        text: args.link1Text || 'Link #1',
        href: '#',
        onClick: () => alert('Link #1 clicked')
      }, {
        text: args.link2Text || 'Link #2',
        href: '#',
        onClick: () => alert('Link #2 clicked')
      }];
    }

    // Add action button if enabled
    if (args.showActionButton) {
      cardOptions.actionButton = {
        text: args.actionButtonText || 'Action',
        style: args.actionButtonStyle || 'primary',
        fill: args.actionButtonFill || 'filled',
        size: args.actionButtonSize || 'default',
        onClick: () => alert('Action button clicked')
      };
    }

    // Add card click handler if enabled
    if (args.cardClickable) {
      cardOptions.onClick = () => {
        alert('Card clicked!');
      };
    }
    const card = PlusInterface.createCard(cardOptions);
    return card;
  },
  argTypes: {
    // Content visibility controls
    showImage: {
      control: 'boolean',
      description: 'Show image/media area at top of card'
    },
    imageText: {
      control: 'text',
      description: 'Image placeholder text',
      if: {
        arg: 'showImage',
        eq: true
      }
    },
    showTitle: {
      control: 'boolean',
      description: 'Show card title'
    },
    title: {
      control: 'text',
      description: 'Card title text',
      if: {
        arg: 'showTitle',
        eq: true
      }
    },
    showSubtitle: {
      control: 'boolean',
      description: 'Show card subtitle'
    },
    subtitle: {
      control: 'text',
      description: 'Card subtitle text',
      if: {
        arg: 'showSubtitle',
        eq: true
      }
    },
    showBody: {
      control: 'boolean',
      description: 'Show card body content'
    },
    body: {
      control: 'text',
      description: 'Card body text',
      if: {
        arg: 'showBody',
        eq: true
      }
    },
    showHeader: {
      control: 'boolean',
      description: 'Show header section'
    },
    header: {
      control: 'text',
      description: 'Header section text',
      if: {
        arg: 'showHeader',
        eq: true
      }
    },
    showItems: {
      control: 'boolean',
      description: 'Show list items'
    },
    items: {
      control: 'text',
      description: 'Comma-separated list of items (e.g., "Item #1, Item #2, Item #3")',
      if: {
        arg: 'showItems',
        eq: true
      }
    },
    showFooter: {
      control: 'boolean',
      description: 'Show footer section text'
    },
    footer: {
      control: 'text',
      description: 'Footer section text',
      if: {
        arg: 'showFooter',
        eq: true
      }
    },
    showLinks: {
      control: 'boolean',
      description: 'Show footer links'
    },
    link1Text: {
      control: 'text',
      description: 'First link text',
      if: {
        arg: 'showLinks',
        eq: true
      }
    },
    link2Text: {
      control: 'text',
      description: 'Second link text',
      if: {
        arg: 'showLinks',
        eq: true
      }
    },
    showActionButton: {
      control: 'boolean',
      description: 'Show action button'
    },
    actionButtonText: {
      control: 'text',
      description: 'Action button text',
      if: {
        arg: 'showActionButton',
        eq: true
      }
    },
    actionButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Action button style',
      if: {
        arg: 'showActionButton',
        eq: true
      }
    },
    actionButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Action button fill variant',
      if: {
        arg: 'showActionButton',
        eq: true
      }
    },
    actionButtonSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Action button size',
      if: {
        arg: 'showActionButton',
        eq: true
      }
    },
    // Card styling controls
    paddingSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card padding size'
    },
    gapSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card gap size'
    },
    radiusSize: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Card border radius size'
    },
    borderSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card border size'
    },
    showBorder: {
      control: 'boolean',
      description: 'Show card border'
    },
    cardClickable: {
      control: 'boolean',
      description: 'Make entire card clickable'
    }
  },
  args: {
    // Content visibility defaults
    showImage: false,
    imageText: 'Image cap',
    showTitle: true,
    title: 'Card Title',
    showSubtitle: false,
    subtitle: 'Card Subtitle',
    showBody: true,
    body: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.',
    showHeader: false,
    header: 'Header',
    showItems: false,
    items: 'Item #1, Item #2, Item #3',
    showFooter: false,
    footer: 'Footer',
    showLinks: false,
    link1Text: 'Link #1',
    link2Text: 'Link #2',
    showActionButton: false,
    actionButtonText: 'Action',
    actionButtonStyle: 'primary',
    actionButtonFill: 'filled',
    actionButtonSize: 'default',
    // Card styling defaults
    paddingSize: 'md',
    gapSize: 'md',
    radiusSize: 'sm',
    borderSize: 'sm',
    showBorder: true,
    cardClickable: false
  }
}`,...o.parameters?.docs?.source},description:{story:`Interactive
Interactive playground with Storybook controls`,...o.parameters?.docs?.description}}};const f=["Interactive"];export{o as Interactive,f as __namedExportsOrder,h as default};
