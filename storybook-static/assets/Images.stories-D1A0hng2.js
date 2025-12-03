const g={title:"Assets/Images",tags:["autodocs"],parameters:{docs:{description:{component:`Assets / Images Stories
Documents static image assets such as auth provider logos.`}}}},i={render:()=>{const t=document.createElement("div");t.style.padding="var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)",t.style.maxWidth="1200px",t.style.margin="0 auto",t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-card-gap-lg)";const o=document.createElement("h2");o.className="h2",o.textContent="Auth Provider Images",o.style.marginBottom="var(--size-section-pad-y-md)",t.appendChild(o);const d=document.createElement("p");d.className="body1-txt",d.textContent="Static image assets for authentication providers. These are used in login flows and related UI.",d.style.marginBottom="var(--size-card-gap-md)",t.appendChild(d);const a=document.createElement("div");return a.style.display="grid",a.style.gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))",a.style.gap="var(--size-card-gap-md)",[{name:"Google Icon",file:"/assets/images/auth-providers/google-icon.svg",description:"Google auth provider logo used for Google sign-in buttons."},{name:"Clever Image",file:"/assets/images/auth-providers/clever-image.png",description:"Clever auth provider image used for Clever sign-in buttons."}].forEach(s=>{const e=document.createElement("div");e.style.backgroundColor="var(--color-surface-container-lowest)",e.style.borderRadius="var(--size-card-radius-sm)",e.style.padding="var(--size-card-pad-y-md) var(--size-card-pad-x-md)",e.style.border="1px solid var(--color-outline-variant)",e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)",e.style.alignItems="flex-start";const n=document.createElement("div");n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="center",n.style.width="80px",n.style.height="80px",n.style.backgroundColor="var(--color-surface)",n.style.borderRadius="8px",n.style.border="1px solid var(--color-outline-variant)";const r=document.createElement("img");r.src=s.file,r.alt=s.name,r.style.maxWidth="100%",r.style.maxHeight="100%",n.appendChild(r);const l=document.createElement("div");l.className="body1-txt",l.textContent=s.name;const m=document.createElement("code");m.textContent=s.file.replace("/assets","design-system/assets");const c=document.createElement("p");c.className="body2-txt",c.textContent=s.description,e.appendChild(n),e.appendChild(l),e.appendChild(m),e.appendChild(c),a.appendChild(e)}),t.appendChild(a),t}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Auth Provider Images';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Static image assets for authentication providers. These are used in login flows and related UI.';
    description.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(description);
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    grid.style.gap = 'var(--size-card-gap-md)';
    const assets = [{
      name: 'Google Icon',
      file: '/assets/images/auth-providers/google-icon.svg',
      description: 'Google auth provider logo used for Google sign-in buttons.'
    }, {
      name: 'Clever Image',
      file: '/assets/images/auth-providers/clever-image.png',
      description: 'Clever auth provider image used for Clever sign-in buttons.'
    }];
    assets.forEach(asset => {
      const card = document.createElement('div');
      card.style.backgroundColor = 'var(--color-surface-container-lowest)';
      card.style.borderRadius = 'var(--size-card-radius-sm)';
      card.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      card.style.border = '1px solid var(--color-outline-variant)';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = 'var(--size-element-gap-sm)';
      card.style.alignItems = 'flex-start';
      const imgWrapper = document.createElement('div');
      imgWrapper.style.display = 'flex';
      imgWrapper.style.alignItems = 'center';
      imgWrapper.style.justifyContent = 'center';
      imgWrapper.style.width = '80px';
      imgWrapper.style.height = '80px';
      imgWrapper.style.backgroundColor = 'var(--color-surface)';
      imgWrapper.style.borderRadius = '8px';
      imgWrapper.style.border = '1px solid var(--color-outline-variant)';
      const img = document.createElement('img');
      img.src = asset.file;
      img.alt = asset.name;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      imgWrapper.appendChild(img);
      const nameEl = document.createElement('div');
      nameEl.className = 'body1-txt';
      nameEl.textContent = asset.name;
      const fileEl = document.createElement('code');
      fileEl.textContent = asset.file.replace('/assets', 'design-system/assets');
      const descEl = document.createElement('p');
      descEl.className = 'body2-txt';
      descEl.textContent = asset.description;
      card.appendChild(imgWrapper);
      card.appendChild(nameEl);
      card.appendChild(fileEl);
      card.appendChild(descEl);
      grid.appendChild(card);
    });
    container.appendChild(grid);
    return container;
  }
}`,...i.parameters?.docs?.source},description:{story:"Auth Provider Images",...i.parameters?.docs?.description}}};const u=["AuthProviders"];export{i as AuthProviders,u as __namedExportsOrder,g as default};
