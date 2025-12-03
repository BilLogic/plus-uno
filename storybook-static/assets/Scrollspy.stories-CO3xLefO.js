import{P as a}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const v={title:"Components/Scrollspy",tags:["autodocs"],parameters:{docs:{description:{component:"Scrollspy component for automatically updating navigation based on scroll position. Features a navbar with pills navigation that highlights active items as users scroll."}}}},n={render:()=>{const e=document.createElement("div");e.style.backgroundColor="var(--color-surface)",e.style.display="flex",e.style.flexDirection="column",e.style.width="648px",e.style.maxHeight="600px";const i=a.createScrollspy({id:"scrollspy-nav-basic",brand:"Navbar",items:[{text:"@fat",href:"#fat",isDropdown:!1},{text:"@mdo",href:"#mdo",isDropdown:!1},{text:"Dropdown",href:"#one",isDropdown:!0}],activeIndex:0,contentId:"scrollspy-content-basic",offset:10});e.appendChild(i);const t=a.createScrollspyContent({id:"scrollspy-content-basic",navbarId:"scrollspy-nav-basic",sections:[{id:"fat",title:"@fat",content:"Placeholder content for the scrollspy example. You got the finest architecture. Passport stamps, she's cosmopolitan. Fine, fresh, fierce, we got it on lock. Never planned that one day I'd be losing you. She eats your heart out. Your kiss is cosmic, every move is magic. I mean the ones, I mean like she's the one. Greetings loved ones let's take a journey. Just own the night like the 4th of July! But you'd rather get wasted."},{id:"mdo",title:"@mdo",content:"Placeholder content for the scrollspy example. 'Cause she's the muse and the artist. (This is how we do) So you wanna play with magic. So just be sure before you give it all to me. I'm walking, I'm walking on air (tonight). Skip the talk, heard it all, time to walk the walk."},{id:"one",title:"one",content:"Placeholder content for the scrollspy example. Takes you miles high, so high, 'cause she's got that one international smile. There's a stranger in my bed, there's a pounding in my head. Oh, no. In another life I would make you stay. 'Cause I, I'm capable of anything. Suiting up for my crowning battle. Used to steal your parents' liquor and climb to the roof. Tone, tan fit and ready, turn it up cause its gettin' heavy. Her love is like a drug. I guess that I forgot I had a choice."}],offset:10});return t.style.height="500px",t.style.overflowY="auto",t.style.overflowX="hidden",t.querySelectorAll(".plus-scrollspy-section").forEach((r,l)=>{for(let s=0;s<8;s++){const o=document.createElement("p");o.className="body1-txt",o.style.marginTop="16px",o.textContent=`Additional content paragraph ${s+1} in section ${l+1}. This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically.`,r.appendChild(o)}}),e.appendChild(t),e}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.width = '648px';
    container.style.maxHeight = '600px';

    // Create scrollspy navbar
    const navbar = PlusInterface.createScrollspy({
      id: 'scrollspy-nav-basic',
      brand: 'Navbar',
      items: [{
        text: '@fat',
        href: '#fat',
        isDropdown: false
      }, {
        text: '@mdo',
        href: '#mdo',
        isDropdown: false
      }, {
        text: 'Dropdown',
        href: '#one',
        isDropdown: true
      }],
      activeIndex: 0,
      contentId: 'scrollspy-content-basic',
      offset: 10
    });
    container.appendChild(navbar);

    // Create scrollable content with enough height for scrolling
    const content = PlusInterface.createScrollspyContent({
      id: 'scrollspy-content-basic',
      navbarId: 'scrollspy-nav-basic',
      sections: [{
        id: 'fat',
        title: '@fat',
        content: "Placeholder content for the scrollspy example. You got the finest architecture. Passport stamps, she's cosmopolitan. Fine, fresh, fierce, we got it on lock. Never planned that one day I'd be losing you. She eats your heart out. Your kiss is cosmic, every move is magic. I mean the ones, I mean like she's the one. Greetings loved ones let's take a journey. Just own the night like the 4th of July! But you'd rather get wasted."
      }, {
        id: 'mdo',
        title: '@mdo',
        content: "Placeholder content for the scrollspy example. 'Cause she's the muse and the artist. (This is how we do) So you wanna play with magic. So just be sure before you give it all to me. I'm walking, I'm walking on air (tonight). Skip the talk, heard it all, time to walk the walk."
      }, {
        id: 'one',
        title: 'one',
        content: "Placeholder content for the scrollspy example. Takes you miles high, so high, 'cause she's got that one international smile. There's a stranger in my bed, there's a pounding in my head. Oh, no. In another life I would make you stay. 'Cause I, I'm capable of anything. Suiting up for my crowning battle. Used to steal your parents' liquor and climb to the roof. Tone, tan fit and ready, turn it up cause its gettin' heavy. Her love is like a drug. I guess that I forgot I had a choice."
      }],
      offset: 10
    });

    // Make content scrollable with fixed height
    content.style.height = '500px';
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';

    // Add more content to each section to ensure scrolling works
    const sections = content.querySelectorAll('.plus-scrollspy-section');
    sections.forEach((section, index) => {
      // Add multiple paragraphs to make sections tall enough
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('p');
        p.className = 'body1-txt';
        p.style.marginTop = '16px';
        p.textContent = \`Additional content paragraph \${i + 1} in section \${index + 1}. This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically.\`;
        section.appendChild(p);
      }
    });
    container.appendChild(content);
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:`Basic
Interactive scrollspy - scroll through the content to see the active nav item change`,...n.parameters?.docs?.description}}};const w=["Basic"];export{n as Basic,w as __namedExportsOrder,v as default};
