/**
 * Assets / Images Stories
 * Documents static image assets such as auth provider logos.
 */

export default {
  title: 'Assets/Images',
  tags: ['autodocs'],
};

/**
 * Auth Provider Images
 */
export const AuthProviders = {
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
    
    const assets = [
      {
        name: 'Google Icon',
        file: '/assets/images/auth-providers/google-icon.svg',
        description: 'Google auth provider logo used for Google sign-in buttons.',
      },
      {
        name: 'Clever Image',
        file: '/assets/images/auth-providers/clever-image.png',
        description: 'Clever auth provider image used for Clever sign-in buttons.',
      },
    ];
    
    assets.forEach((asset) => {
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
  },
};


