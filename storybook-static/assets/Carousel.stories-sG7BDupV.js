import{P as S}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const q={title:"Components/Carousel",tags:["autodocs"],parameters:{docs:{description:{component:"Carousel component for displaying a rotating set of content slides. Built on Bootstrap 4.6.2 carousel with PLUS design token customizations."}}}},f={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-section-gap-lg)",n.style.padding="var(--size-section-pad-y-md)",n.style.backgroundColor="var(--color-surface, #f9f9fc)";const l=document.createElement("div");l.style.display="flex",l.style.flexDirection="column",l.style.gap="var(--size-section-gap-lg)",l.style.maxWidth="800px",l.style.margin="0 auto";const s=a=>{const r=document.createElement("div");r.style.display="flex",r.style.alignItems="center",r.style.justifyContent="center",r.style.height="350px",r.style.width="100%",r.style.position="relative";const c=document.createElement("p");c.style.fontFamily="var(--font-family-title, Lato)",c.style.fontSize="64px",c.style.fontWeight="400",c.style.lineHeight="1.5",c.style.color="var(--color-on-surface, #191c1e)",c.style.margin="0",c.style.whiteSpace="nowrap";const d=["First Slide","Second Slide","Third Slide"];return c.textContent=d[a-1],r.appendChild(c),r},o=(a,r,c)=>{const d=document.createElement("div");d.style.display="flex",d.style.flexDirection="column",d.style.gap="var(--size-element-gap-md)",d.style.alignItems="center";const p=document.createElement("div");p.style.fontFamily="var(--font-family-body, SF Pro Text)",p.style.fontSize="14px",p.style.fontWeight="400",p.style.color="var(--color-outline, #6f797a)",p.style.textAlign="center",p.textContent=c,d.appendChild(p);const m=document.createElement("div");m.style.display="flex",m.style.alignItems="center",m.style.justifyContent="center";const y=[{content:s(1),active:!0},{content:s(2)},{content:s(3)}];r==="with-captions"&&(y[0].title="First slide label",y[0].caption="Some representative placeholder content for the first slide.",y[1].title="Second slide label",y[1].caption="Some representative placeholder content for the second slide.",y[2].title="Third slide label",y[2].caption="Some representative placeholder content for the third slide.");const u=S.createCarousel({id:a,slides:y,showControls:r!=="slides-only",showIndicators:r==="with-indicators"||r==="with-captions",showCaptions:r==="with-captions",interval:0,ride:!1});r==="slides-only"?(u.style.width="600px",u.style.height="350px"):(u.style.width="680px",u.style.height="350px");const w=u.querySelector(".plus-carousel-inner");return w&&(w.style.height="100%"),u.querySelectorAll(".plus-carousel-item").forEach(I=>{I.style.height="100%"}),m.appendChild(u),d.appendChild(m),d},h=o("carousel-all-slides-only","slides-only","slides only");l.appendChild(h);const i=o("carousel-all-with-controls","with-controls","with controls");l.appendChild(i);const t=o("carousel-all-with-indicators","with-indicators","with indicators");l.appendChild(t);const e=o("carousel-all-with-captions","with-captions","with captions");return l.appendChild(e),n.appendChild(l),n}},v={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.padding="var(--size-section-pad-y-md)";const l=i=>{const t=document.createElement("div");t.style.display="flex",t.style.alignItems="center",t.style.justifyContent="center",t.style.height="350px",t.style.width="100%",t.style.position="relative";const e=document.createElement("p");e.style.fontFamily="var(--font-family-title, Lato)",e.style.fontSize="64px",e.style.fontWeight="400",e.style.lineHeight="1.5",e.style.color="var(--color-on-surface, #191c1e)",e.style.margin="0",e.style.whiteSpace="nowrap";const a=["First Slide","Second Slide","Third Slide"];return e.textContent=a[i-1],t.appendChild(e),t},s=S.createCarousel({id:"carousel-slides-only",slides:[{content:l(1),active:!0},{content:l(2)},{content:l(3)}],showControls:!1,showIndicators:!1,interval:0,ride:!1});s.style.width="600px",s.style.height="350px";const o=s.querySelector(".plus-carousel-inner");return o&&(o.style.height="100%"),s.querySelectorAll(".plus-carousel-item").forEach(i=>{i.style.height="100%"}),n.appendChild(s),n}},C={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.padding="var(--size-section-pad-y-md)";const l=i=>{const t=document.createElement("div");t.style.display="flex",t.style.alignItems="center",t.style.justifyContent="center",t.style.height="350px",t.style.width="100%",t.style.position="relative";const e=document.createElement("p");e.style.fontFamily="var(--font-family-title, Lato)",e.style.fontSize="64px",e.style.fontWeight="400",e.style.lineHeight="1.5",e.style.color="var(--color-on-surface, #191c1e)",e.style.margin="0",e.style.whiteSpace="nowrap";const a=["First Slide","Second Slide","Third Slide"];return e.textContent=a[i-1],t.appendChild(e),t},s=S.createCarousel({id:"carousel-with-controls",slides:[{content:l(1),active:!0},{content:l(2)},{content:l(3)}],showControls:!0,showIndicators:!1,interval:0,ride:!1});s.style.width="680px",s.style.height="350px";const o=s.querySelector(".plus-carousel-inner");return o&&(o.style.height="100%"),s.querySelectorAll(".plus-carousel-item").forEach(i=>{i.style.height="100%"}),n.appendChild(s),n}},g={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.padding="var(--size-section-pad-y-md)";const l=i=>{const t=document.createElement("div");t.style.display="flex",t.style.alignItems="center",t.style.justifyContent="center",t.style.height="350px",t.style.width="100%",t.style.position="relative";const e=document.createElement("p");e.style.fontFamily="var(--font-family-title, Lato)",e.style.fontSize="64px",e.style.fontWeight="400",e.style.lineHeight="1.5",e.style.color="var(--color-on-surface, #191c1e)",e.style.margin="0",e.style.whiteSpace="nowrap";const a=["First Slide","Second Slide","Third Slide"];return e.textContent=a[i-1],t.appendChild(e),t},s=S.createCarousel({id:"carousel-with-indicators",slides:[{content:l(1),active:!0},{content:l(2)},{content:l(3)}],showControls:!0,showIndicators:!0,interval:0,ride:!1});s.style.width="680px",s.style.height="350px";const o=s.querySelector(".plus-carousel-inner");return o&&(o.style.height="100%"),s.querySelectorAll(".plus-carousel-item").forEach(i=>{i.style.height="100%"}),n.appendChild(s),n}},x={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.padding="var(--size-section-pad-y-md)";const l=i=>{const t=document.createElement("div");t.style.display="flex",t.style.alignItems="center",t.style.justifyContent="center",t.style.height="350px",t.style.width="100%",t.style.position="relative";const e=document.createElement("p");e.style.fontFamily="var(--font-family-title, Lato)",e.style.fontSize="64px",e.style.fontWeight="400",e.style.lineHeight="1.5",e.style.color="var(--color-on-surface, #191c1e)",e.style.margin="0",e.style.whiteSpace="nowrap";const a=["First Slide","Second Slide","Third Slide"];return e.textContent=a[i-1],t.appendChild(e),t},s=S.createCarousel({id:"carousel-with-captions",slides:[{content:l(1),active:!0,title:"First slide label",caption:"Some representative placeholder content for the first slide."},{content:l(2),title:"Second slide label",caption:"Some representative placeholder content for the second slide."},{content:l(3),title:"Third slide label",caption:"Some representative placeholder content for the third slide."}],showControls:!0,showIndicators:!0,showCaptions:!0,interval:0,ride:!1});s.style.width="680px",s.style.height="350px";const o=s.querySelector(".plus-carousel-inner");return o&&(o.style.height="100%"),s.querySelectorAll(".plus-carousel-item").forEach(i=>{i.style.height="100%"}),n.appendChild(s),n}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    container.style.backgroundColor = 'var(--color-surface, #f9f9fc)';

    // Create single column container
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'flex';
    gridContainer.style.flexDirection = 'column';
    gridContainer.style.gap = 'var(--size-section-gap-lg)';
    gridContainer.style.maxWidth = '800px';
    gridContainer.style.margin = '0 auto';

    // Helper function to create slide content
    const createSlideContent = slideNumber => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px'; // Match carousel height
      slideDiv.style.width = '100%';
      slideDiv.style.position = 'relative';
      const slideText = document.createElement('p');
      slideText.style.fontFamily = 'var(--font-family-title, Lato)';
      slideText.style.fontSize = '64px';
      slideText.style.fontWeight = '400';
      slideText.style.lineHeight = '1.5';
      slideText.style.color = 'var(--color-on-surface, #191c1e)';
      slideText.style.margin = '0';
      slideText.style.whiteSpace = 'nowrap';
      const slideNames = ['First Slide', 'Second Slide', 'Third Slide'];
      slideText.textContent = slideNames[slideNumber - 1];
      slideDiv.appendChild(slideText);
      return slideDiv;
    };

    // Helper function to create carousel
    const createCarouselVariant = (id, type, label) => {
      const variantContainer = document.createElement('div');
      variantContainer.style.display = 'flex';
      variantContainer.style.flexDirection = 'column';
      variantContainer.style.gap = 'var(--size-element-gap-md)';
      variantContainer.style.alignItems = 'center';

      // Label
      const labelEl = document.createElement('div');
      labelEl.style.fontFamily = 'var(--font-family-body, SF Pro Text)';
      labelEl.style.fontSize = '14px';
      labelEl.style.fontWeight = '400';
      labelEl.style.color = 'var(--color-outline, #6f797a)';
      labelEl.style.textAlign = 'center';
      labelEl.textContent = label;
      variantContainer.appendChild(labelEl);

      // Carousel wrapper
      const carouselWrapper = document.createElement('div');
      carouselWrapper.style.display = 'flex';
      carouselWrapper.style.alignItems = 'center';
      carouselWrapper.style.justifyContent = 'center';

      // Create slides
      const slides = [{
        content: createSlideContent(1),
        active: true
      }, {
        content: createSlideContent(2)
      }, {
        content: createSlideContent(3)
      }];

      // Add captions for "with captions" type
      if (type === 'with-captions') {
        slides[0].title = 'First slide label';
        slides[0].caption = 'Some representative placeholder content for the first slide.';
        slides[1].title = 'Second slide label';
        slides[1].caption = 'Some representative placeholder content for the second slide.';
        slides[2].title = 'Third slide label';
        slides[2].caption = 'Some representative placeholder content for the third slide.';
      }

      // Create carousel based on type
      const carousel = PlusInterface.createCarousel({
        id: id,
        slides: slides,
        showControls: type !== 'slides-only',
        showIndicators: type === 'with-indicators' || type === 'with-captions',
        showCaptions: type === 'with-captions',
        interval: 0,
        // Disable auto-play for demo
        ride: false
      });

      // Apply width based on type
      if (type === 'slides-only') {
        carousel.style.width = '600px';
        carousel.style.height = '350px';
      } else {
        carousel.style.width = '680px';
        carousel.style.height = '350px';
      }

      // Ensure carousel inner has proper height
      const carouselInner = carousel.querySelector('.plus-carousel-inner');
      if (carouselInner) {
        carouselInner.style.height = '100%';
      }

      // Ensure carousel items have proper height
      const carouselItems = carousel.querySelectorAll('.plus-carousel-item');
      carouselItems.forEach(item => {
        item.style.height = '100%';
      });
      carouselWrapper.appendChild(carousel);
      variantContainer.appendChild(carouselWrapper);
      return variantContainer;
    };

    // Order: slides only, with controls, with indicators, with captions (single column)
    const slidesOnly = createCarouselVariant('carousel-all-slides-only', 'slides-only', 'slides only');
    gridContainer.appendChild(slidesOnly);
    const withControls = createCarouselVariant('carousel-all-with-controls', 'with-controls', 'with controls');
    gridContainer.appendChild(withControls);
    const withIndicators = createCarouselVariant('carousel-all-with-indicators', 'with-indicators', 'with indicators');
    gridContainer.appendChild(withIndicators);
    const withCaptions = createCarouselVariant('carousel-all-with-captions', 'with-captions', 'with captions');
    gridContainer.appendChild(withCaptions);
    container.appendChild(gridContainer);
    return container;
  }
}`,...f.parameters?.docs?.source},description:{story:`All Variants
Shows all carousel types in a 2x2 grid layout exactly as shown in Figma
Layout: 
  Top-Left: slides only
  Top-Right: with captions
  Bottom-Left: with controls
  Bottom-Right: with indicators`,...f.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const createSlideContent = slideNumber => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
      slideDiv.style.width = '100%';
      slideDiv.style.position = 'relative';
      const slideText = document.createElement('p');
      slideText.style.fontFamily = 'var(--font-family-title, Lato)';
      slideText.style.fontSize = '64px';
      slideText.style.fontWeight = '400';
      slideText.style.lineHeight = '1.5';
      slideText.style.color = 'var(--color-on-surface, #191c1e)';
      slideText.style.margin = '0';
      slideText.style.whiteSpace = 'nowrap';
      const slideNames = ['First Slide', 'Second Slide', 'Third Slide'];
      slideText.textContent = slideNames[slideNumber - 1];
      slideDiv.appendChild(slideText);
      return slideDiv;
    };
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-slides-only',
      slides: [{
        content: createSlideContent(1),
        active: true
      }, {
        content: createSlideContent(2)
      }, {
        content: createSlideContent(3)
      }],
      showControls: false,
      showIndicators: false,
      interval: 0,
      ride: false
    });
    carousel.style.width = '600px';
    carousel.style.height = '350px';

    // Ensure carousel inner and items have proper height
    const carouselInner = carousel.querySelector('.plus-carousel-inner');
    if (carouselInner) {
      carouselInner.style.height = '100%';
    }
    const carouselItems = carousel.querySelectorAll('.plus-carousel-item');
    carouselItems.forEach(item => {
      item.style.height = '100%';
    });
    container.appendChild(carousel);
    return container;
  }
}`,...v.parameters?.docs?.source},description:{story:`Slides Only
Carousel with just slides, no controls or indicators`,...v.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const createSlideContent = slideNumber => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
      slideDiv.style.width = '100%';
      slideDiv.style.position = 'relative';
      const slideText = document.createElement('p');
      slideText.style.fontFamily = 'var(--font-family-title, Lato)';
      slideText.style.fontSize = '64px';
      slideText.style.fontWeight = '400';
      slideText.style.lineHeight = '1.5';
      slideText.style.color = 'var(--color-on-surface, #191c1e)';
      slideText.style.margin = '0';
      slideText.style.whiteSpace = 'nowrap';
      const slideNames = ['First Slide', 'Second Slide', 'Third Slide'];
      slideText.textContent = slideNames[slideNumber - 1];
      slideDiv.appendChild(slideText);
      return slideDiv;
    };
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-with-controls',
      slides: [{
        content: createSlideContent(1),
        active: true
      }, {
        content: createSlideContent(2)
      }, {
        content: createSlideContent(3)
      }],
      showControls: true,
      showIndicators: false,
      interval: 0,
      ride: false
    });
    carousel.style.width = '680px';
    carousel.style.height = '350px';

    // Ensure carousel inner and items have proper height
    const carouselInner = carousel.querySelector('.plus-carousel-inner');
    if (carouselInner) {
      carouselInner.style.height = '100%';
    }
    const carouselItems = carousel.querySelectorAll('.plus-carousel-item');
    carouselItems.forEach(item => {
      item.style.height = '100%';
    });
    container.appendChild(carousel);
    return container;
  }
}`,...C.parameters?.docs?.source},description:{story:`With Controls
Carousel with navigation controls`,...C.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const createSlideContent = slideNumber => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
      slideDiv.style.width = '100%';
      slideDiv.style.position = 'relative';
      const slideText = document.createElement('p');
      slideText.style.fontFamily = 'var(--font-family-title, Lato)';
      slideText.style.fontSize = '64px';
      slideText.style.fontWeight = '400';
      slideText.style.lineHeight = '1.5';
      slideText.style.color = 'var(--color-on-surface, #191c1e)';
      slideText.style.margin = '0';
      slideText.style.whiteSpace = 'nowrap';
      const slideNames = ['First Slide', 'Second Slide', 'Third Slide'];
      slideText.textContent = slideNames[slideNumber - 1];
      slideDiv.appendChild(slideText);
      return slideDiv;
    };
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-with-indicators',
      slides: [{
        content: createSlideContent(1),
        active: true
      }, {
        content: createSlideContent(2)
      }, {
        content: createSlideContent(3)
      }],
      showControls: true,
      showIndicators: true,
      interval: 0,
      ride: false
    });
    carousel.style.width = '680px';
    carousel.style.height = '350px';

    // Ensure carousel inner and items have proper height
    const carouselInner = carousel.querySelector('.plus-carousel-inner');
    if (carouselInner) {
      carouselInner.style.height = '100%';
    }
    const carouselItems = carousel.querySelectorAll('.plus-carousel-item');
    carouselItems.forEach(item => {
      item.style.height = '100%';
    });
    container.appendChild(carousel);
    return container;
  }
}`,...g.parameters?.docs?.source},description:{story:`With Indicators
Carousel with controls and indicators`,...g.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = 'var(--size-section-pad-y-md)';
    const createSlideContent = slideNumber => {
      const slideDiv = document.createElement('div');
      slideDiv.style.display = 'flex';
      slideDiv.style.alignItems = 'center';
      slideDiv.style.justifyContent = 'center';
      slideDiv.style.height = '350px';
      slideDiv.style.width = '100%';
      slideDiv.style.position = 'relative';
      const slideText = document.createElement('p');
      slideText.style.fontFamily = 'var(--font-family-title, Lato)';
      slideText.style.fontSize = '64px';
      slideText.style.fontWeight = '400';
      slideText.style.lineHeight = '1.5';
      slideText.style.color = 'var(--color-on-surface, #191c1e)';
      slideText.style.margin = '0';
      slideText.style.whiteSpace = 'nowrap';
      const slideNames = ['First Slide', 'Second Slide', 'Third Slide'];
      slideText.textContent = slideNames[slideNumber - 1];
      slideDiv.appendChild(slideText);
      return slideDiv;
    };
    const carousel = PlusInterface.createCarousel({
      id: 'carousel-with-captions',
      slides: [{
        content: createSlideContent(1),
        active: true,
        title: 'First slide label',
        caption: 'Some representative placeholder content for the first slide.'
      }, {
        content: createSlideContent(2),
        title: 'Second slide label',
        caption: 'Some representative placeholder content for the second slide.'
      }, {
        content: createSlideContent(3),
        title: 'Third slide label',
        caption: 'Some representative placeholder content for the third slide.'
      }],
      showControls: true,
      showIndicators: true,
      showCaptions: true,
      interval: 0,
      ride: false
    });
    carousel.style.width = '680px';
    carousel.style.height = '350px';

    // Ensure carousel inner and items have proper height
    const carouselInner = carousel.querySelector('.plus-carousel-inner');
    if (carouselInner) {
      carouselInner.style.height = '100%';
    }
    const carouselItems = carousel.querySelectorAll('.plus-carousel-item');
    carouselItems.forEach(item => {
      item.style.height = '100%';
    });
    container.appendChild(carousel);
    return container;
  }
}`,...x.parameters?.docs?.source},description:{story:`With Captions
Carousel with controls, indicators, and captions`,...x.parameters?.docs?.description}}};const A=["AllVariants","SlidesOnly","WithControls","WithIndicators","WithCaptions"];export{f as AllVariants,v as SlidesOnly,x as WithCaptions,C as WithControls,g as WithIndicators,A as __namedExportsOrder,q as default};
