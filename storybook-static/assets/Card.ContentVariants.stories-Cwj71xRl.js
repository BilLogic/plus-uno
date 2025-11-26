import{P as t}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const C={title:"Components/Card/Content Variants",tags:["autodocs"]},r={render:()=>{const e=document.createElement("div");return e.style.width="100%",e.style.height="200px",e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="center",e.style.backgroundColor="var(--color-surface-variant)",e.style.color="var(--color-on-surface-variant)",e.textContent="Image cap",t.createCard({image:e,title:"Card Title",subtitle:"Card Subtitle",body:"Some quick example text to build on the card title and make up the bulk of the card's content.",header:"Header",items:["Item #1","Item #2","Item #3"],footer:"Footer",links:[{text:"Link #1",href:"#",onClick:()=>alert("Link #1 clicked")},{text:"Link #2",href:"#",onClick:()=>alert("Link #2 clicked")}],actionButton:{text:"Action",onClick:()=>alert("Action button clicked"),style:"primary",fill:"filled",size:"default"}})}},n={render:()=>{const e=document.createElement("div");return e.style.width="100%",e.style.height="200px",e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="center",e.style.backgroundColor="var(--color-surface-variant)",e.style.color="var(--color-on-surface-variant)",e.textContent="Image cap",t.createCard({image:e,title:"Card Title",subtitle:"Card Subtitle",body:"Some quick example text to build on the card title and make up the bulk of the card's content."})}},a={render:()=>t.createCard({title:"Card Title",subtitle:"Card Subtitle",body:"Some quick example text to build on the card title and make up the bulk of the card's content."})},i={render:()=>t.createCard({title:"Card Title",body:"Some quick example text to build on the card title and make up the bulk of the card's content.",header:"Header",items:["Item #1","Item #2","Item #3"]})},o={render:()=>t.createCard({title:"Card Title",subtitle:"Card Subtitle",body:"Some quick example text to build on the card title and make up the bulk of the card's content.",links:[{text:"Card Links",href:"#",onClick:()=>alert("Link clicked")},{text:"Card Links",href:"#",onClick:()=>alert("Link clicked")}]})},l={render:()=>t.createCard({title:"Card Title",subtitle:"Card Subtitle",body:"Some quick example text to build on the card title and make up the bulk of the card's content.",footer:"Footer",links:[{text:"Link #1",href:"#",onClick:()=>alert("Link #1 clicked")},{text:"Link #2",href:"#",onClick:()=>alert("Link #2 clicked")}],actionButton:{text:"Action",onClick:()=>alert("Action button clicked"),style:"primary",fill:"filled",size:"default"}})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Create image placeholder
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.style.width = '100%';
    imagePlaceholder.style.height = '200px';
    imagePlaceholder.style.display = 'flex';
    imagePlaceholder.style.alignItems = 'center';
    imagePlaceholder.style.justifyContent = 'center';
    imagePlaceholder.style.backgroundColor = 'var(--color-surface-variant)';
    imagePlaceholder.style.color = 'var(--color-on-surface-variant)';
    imagePlaceholder.textContent = 'Image cap';
    return PlusInterface.createCard({
      image: imagePlaceholder,
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.',
      header: 'Header',
      items: ['Item #1', 'Item #2', 'Item #3'],
      footer: 'Footer',
      links: [{
        text: 'Link #1',
        href: '#',
        onClick: () => alert('Link #1 clicked')
      }, {
        text: 'Link #2',
        href: '#',
        onClick: () => alert('Link #2 clicked')
      }],
      actionButton: {
        text: 'Action',
        onClick: () => alert('Action button clicked'),
        style: 'primary',
        fill: 'filled',
        size: 'default'
      }
    });
  }
}`,...r.parameters?.docs?.source},description:{story:`Complete Card
Shows a card with all parts: image, title, subtitle, body, header, items, footer, links, and action button`,...r.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.style.width = '100%';
    imagePlaceholder.style.height = '200px';
    imagePlaceholder.style.display = 'flex';
    imagePlaceholder.style.alignItems = 'center';
    imagePlaceholder.style.justifyContent = 'center';
    imagePlaceholder.style.backgroundColor = 'var(--color-surface-variant)';
    imagePlaceholder.style.color = 'var(--color-on-surface-variant)';
    imagePlaceholder.textContent = 'Image cap';
    return PlusInterface.createCard({
      image: imagePlaceholder,
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    });
  }
}`,...n.parameters?.docs?.source},description:{story:`Card with Image
Card with image/media area at the top`,...n.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.'
    });
  }
}`,...a.parameters?.docs?.source},description:{story:`Card with Subtitle
Card with title and subtitle`,...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.',
      header: 'Header',
      items: ['Item #1', 'Item #2', 'Item #3']
    });
  }
}`,...i.parameters?.docs?.source},description:{story:`Card with Items
Card with header and list items`,...i.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.',
      links: [{
        text: 'Card Links',
        href: '#',
        onClick: () => alert('Link clicked')
      }, {
        text: 'Card Links',
        href: '#',
        onClick: () => alert('Link clicked')
      }]
    });
  }
}`,...o.parameters?.docs?.source},description:{story:`Card with Links
Card with footer links`,...o.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\\'s content.',
      footer: 'Footer',
      links: [{
        text: 'Link #1',
        href: '#',
        onClick: () => alert('Link #1 clicked')
      }, {
        text: 'Link #2',
        href: '#',
        onClick: () => alert('Link #2 clicked')
      }],
      actionButton: {
        text: 'Action',
        onClick: () => alert('Action button clicked'),
        style: 'primary',
        fill: 'filled',
        size: 'default'
      }
    });
  }
}`,...l.parameters?.docs?.source},description:{story:`Card with Action Button
Card with footer action button`,...l.parameters?.docs?.description}}};const b=["CompleteCard","WithImage","WithSubtitle","WithItems","WithLinks","WithActionButton"];export{r as CompleteCard,l as WithActionButton,n as WithImage,i as WithItems,o as WithLinks,a as WithSubtitle,b as __namedExportsOrder,C as default};
