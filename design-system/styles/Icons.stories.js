/**
 * Icon Foundation Documentation
 * 
 * ## Font Awesome Free Icon Library
 * 
 * PLUS Design System uses **Font Awesome's free icon library** for all icons.
 * Font Awesome provides thousands of free icons that can be used with simple CSS classes.
 * 
 * ### Font Awesome Resources
 * - **Icon Library**: https://fontawesome.com/icons
 * - **Documentation**: https://fontawesome.com/docs
 * - **Free Icons**: All icons with the "Free" badge are available for use
 * 
 * ### Icon Styles
 * - **Solid (fas)**: Filled icons for emphasis or primary actions
 * - **Regular (far)**: Outlined icons for secondary actions or lighter emphasis
 * 
 * ### Usage
 * Icons are implemented using Font Awesome CSS classes:
 * ```html
 * <i class="fas fa-star"></i>
 * <i class="far fa-star"></i>
 * ```
 * Solid icons use "fas" class, regular (outlined) icons use "far" class.
 * 
 * ### Icon Sizing
 * Icons use typography-based sizing tokens that automatically match the text size they accompany.
 * Icons should match the typography scale of their surrounding text.
 * 
 * ### Best Practices
 * - Use semantic icons that clearly represent their function
 * - Match icon style to action importance (solid for primary, regular for secondary)
 * - Use consistent sizing within a component or section
 * - Ensure sufficient contrast for accessibility
 * - Pair icons with text labels when meaning might be unclear
 * - Use color to reinforce meaning (e.g., green for success, red for error)
 * 
 * See docs/guidelines/token-reference.md for complete icon token reference
 */

import { PlusInterface } from '../components/index.js';

export default {
  title: 'Styles/Icons',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Icon system using Font Awesome 6 Free icon library. Icons use typography-based sizing tokens and support solid and regular styles.',
      },
    },
  },
};

/**
 * Helper function to create an icon token table
 */
function createIconTokenTable(headers, rows) {
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginBottom = 'var(--size-section-pad-y-md)';
  table.style.border = '1px solid var(--color-outline-variant, #bec8ca)';
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
  headerRow.style.borderBottom = '2px solid var(--color-outline, #6f797a)';
  
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    th.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    th.style.textAlign = 'left';
    th.style.fontWeight = '600';
    th.className = 'body2-txt';
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  rows.forEach(rowData => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--color-outline-variant, #bec8ca)';
    
    // Token name
    const tokenCell = document.createElement('td');
    tokenCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    const code = document.createElement('code');
    code.textContent = rowData.token;
    code.style.fontSize = '0.875rem';
    tokenCell.appendChild(code);
    row.appendChild(tokenCell);
    
    // Size
    const sizeCell = document.createElement('td');
    sizeCell.textContent = rowData.size;
    sizeCell.style.fontFamily = 'monospace';
    sizeCell.style.fontSize = '0.875rem';
    row.appendChild(sizeCell);
    
    // Line Height
    const lineHeightCell = document.createElement('td');
    lineHeightCell.textContent = rowData.lineHeight;
    lineHeightCell.style.fontFamily = 'monospace';
    lineHeightCell.style.fontSize = '0.875rem';
    row.appendChild(lineHeightCell);
    
    // Description
    const descCell = document.createElement('td');
    descCell.textContent = rowData.description;
    descCell.className = 'body2-txt';
    row.appendChild(descCell);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  
  return table;
}

/**
 * Overview
 * Complete icon token reference and usage guide
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    // Introduction
    const intro = document.createElement('div');
    intro.style.marginBottom = 'var(--size-section-pad-y-md)';
    const introTitle = document.createElement('h2');
    introTitle.className = 'h3';
    introTitle.textContent = 'Font Awesome Free Icon Library';
    intro.appendChild(introTitle);
    
    const introText = document.createElement('p');
    introText.className = 'body2-txt';
    introText.style.marginTop = 'var(--size-element-gap-sm)';
    introText.innerHTML = `
      PLUS Design System uses <strong>Font Awesome's free icon library</strong> for all icons.
      Font Awesome provides thousands of free icons that can be used with simple CSS classes.
      <br><br>
      <strong>Resources:</strong><br>
      • <a href="https://fontawesome.com/icons" target="_blank">Icon Library</a> - Browse and search all available icons<br>
      • <a href="https://fontawesome.com/docs" target="_blank">Documentation</a> - Complete Font Awesome documentation<br>
      • All icons with the "Free" badge are available for use in PLUS Design System
    `;
    intro.appendChild(introText);
    container.appendChild(intro);
    
    // Icon Styles
    const stylesSection = document.createElement('div');
    stylesSection.style.marginBottom = 'var(--size-section-pad-y-md)';
    const stylesTitle = document.createElement('h3');
    stylesTitle.className = 'h4';
    stylesTitle.textContent = 'Icon Styles';
    stylesSection.appendChild(stylesTitle);
    
    const stylesList = document.createElement('ul');
    stylesList.className = 'body2-txt';
    stylesList.style.marginTop = 'var(--size-element-gap-sm)';
    stylesList.style.paddingLeft = 'var(--size-element-pad-x-md)';
    
    const solidItem = document.createElement('li');
    solidItem.innerHTML = '<strong>Solid (fas)</strong>: Filled icons for emphasis or primary actions';
    stylesList.appendChild(solidItem);
    
    const regularItem = document.createElement('li');
    regularItem.innerHTML = '<strong>Regular (far)</strong>: Outlined icons for secondary actions or lighter emphasis';
    stylesList.appendChild(regularItem);
    
    stylesSection.appendChild(stylesList);
    container.appendChild(stylesSection);
    
    // Usage Example
    const usageSection = document.createElement('div');
    usageSection.style.marginBottom = 'var(--size-section-pad-y-md)';
    const usageTitle = document.createElement('h3');
    usageTitle.className = 'h4';
    usageTitle.textContent = 'Usage Example';
    usageSection.appendChild(usageTitle);
    
    const codeBlock = document.createElement('pre');
    codeBlock.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    codeBlock.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    codeBlock.style.borderRadius = 'var(--size-element-radius-sm)';
    codeBlock.style.overflow = 'auto';
    codeBlock.style.marginTop = 'var(--size-element-gap-sm)';
    codeBlock.innerHTML = `<code class="body3-txt">&lt;i class="fas fa-star"&gt;&lt;/i&gt;
&lt;i class="far fa-star"&gt;&lt;/i&gt;</code>`;
    usageSection.appendChild(codeBlock);
    container.appendChild(usageSection);
    
    return container;
  },
};

/**
 * Icon Size Tokens - Solid
 * Font Awesome Solid icon sizing tokens
 */
export const IconSizeTokensSolid = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Font Awesome Solid Icon Tokens';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body2-txt';
    description.textContent = 'Font Awesome solid icons use specific sizing tokens that correspond to typography levels. Icons should match the text size they accompany.';
    description.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(description);
    
    // Headline Icons
    const headlineTitle = document.createElement('h3');
    headlineTitle.className = 'h4';
    headlineTitle.textContent = 'Headline Icons';
    headlineTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(headlineTitle);
    
    const headlineTable = createIconTokenTable(
      ['Token', 'Size', 'Line Height', 'Description'],
      [
        { token: '--font-size-fa-h1-solid', size: '36px (2.25rem)', lineHeight: '177.8%', description: 'H1 headline icon size' },
        { token: '--font-size-fa-h2-solid', size: '28px (1.75rem)', lineHeight: '171.4%', description: 'H2 headline icon size' },
        { token: '--font-size-fa-h3-solid', size: '24px (1.5rem)', lineHeight: '166.7%', description: 'H3 headline icon size' },
        { token: '--font-size-fa-h4-solid', size: '20px (1.25rem)', lineHeight: '160%', description: 'H4 headline icon size' },
        { token: '--font-size-fa-h5-solid', size: '16px (1rem)', lineHeight: '175%', description: 'H5 headline icon size' },
        { token: '--font-size-fa-h6-solid', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'H6 headline icon size' },
      ]
    );
    container.appendChild(headlineTable);
    
    // Body Icons
    const bodyTitle = document.createElement('h3');
    bodyTitle.className = 'h4';
    bodyTitle.textContent = 'Body Icons';
    bodyTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    bodyTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(bodyTitle);
    
    const bodyTable = createIconTokenTable(
      ['Token', 'Size', 'Line Height', 'Description'],
      [
        { token: '--font-size-fa-body1-solid', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'Body 1 icon size' },
        { token: '--font-size-fa-body2-solid', size: '12px (0.75rem)', lineHeight: '183.3%', description: 'Body 2 icon size (default)' },
        { token: '--font-size-fa-body3-solid', size: '10px (0.625rem)', lineHeight: '200%', description: 'Body 3 icon size' },
      ]
    );
    container.appendChild(bodyTable);
    
    return container;
  },
};

/**
 * Icon Size Tokens - Regular
 * Font Awesome Regular icon sizing tokens
 */
export const IconSizeTokensRegular = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Font Awesome Regular Icon Tokens';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body2-txt';
    description.textContent = 'Font Awesome regular (outlined) icons use the same sizing tokens as solid icons, matching typography levels.';
    description.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(description);
    
    // Headline Icons
    const headlineTitle = document.createElement('h3');
    headlineTitle.className = 'h4';
    headlineTitle.textContent = 'Headline Icons';
    headlineTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(headlineTitle);
    
    const headlineTable = createIconTokenTable(
      ['Token', 'Size', 'Line Height', 'Description'],
      [
        { token: '--font-size-fa-h1-regular', size: '36px (2.25rem)', lineHeight: '177.8%', description: 'H1 headline icon size' },
        { token: '--font-size-fa-h2-regular', size: '28px (1.75rem)', lineHeight: '171.4%', description: 'H2 headline icon size' },
        { token: '--font-size-fa-h3-regular', size: '24px (1.5rem)', lineHeight: '166.7%', description: 'H3 headline icon size' },
        { token: '--font-size-fa-h4-regular', size: '20px (1.25rem)', lineHeight: '160%', description: 'H4 headline icon size' },
        { token: '--font-size-fa-h5-regular', size: '16px (1rem)', lineHeight: '175%', description: 'H5 headline icon size' },
        { token: '--font-size-fa-h6-regular', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'H6 headline icon size' },
      ]
    );
    container.appendChild(headlineTable);
    
    // Body Icons
    const bodyTitle = document.createElement('h3');
    bodyTitle.className = 'h4';
    bodyTitle.textContent = 'Body Icons';
    bodyTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    bodyTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(bodyTitle);
    
    const bodyTable = createIconTokenTable(
      ['Token', 'Size', 'Line Height', 'Description'],
      [
        { token: '--font-size-fa-body1-regular', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'Body 1 icon size' },
        { token: '--font-size-fa-body2-regular', size: '12px (0.75rem)', lineHeight: '183.3%', description: 'Body 2 icon size (default)' },
        { token: '--font-size-fa-body3-regular', size: '10px (0.625rem)', lineHeight: '200%', description: 'Body 3 icon size' },
      ]
    );
    container.appendChild(bodyTable);
    
    return container;
  },
};

/**
 * Icon Examples
 * Visual examples of icons with different sizes and styles
 */
export const IconExamples = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Icon Examples';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    
    const styles = [
      { class: 'fas', label: 'Solid' },
      { class: 'far', label: 'Regular' },
    ];
    
    // Define sizes with proper token names for both solid and regular
    const getSizeConfig = (displayLabel, baseName, sizePx) => {
      return {
        label: displayLabel,
        size: sizePx,
        getSizeToken: (isSolid) => `--font-size-fa-${baseName}${isSolid ? '-solid' : '-regular'}`,
        getLineHeightToken: (isSolid) => `--font-line-height-fa-${baseName}${isSolid ? '-solid' : '-regular'}`,
      };
    };
    
    const sizes = [
      getSizeConfig('H1', 'h1', '36px'),
      getSizeConfig('H2', 'h2', '28px'),
      getSizeConfig('H3', 'h3', '24px'),
      getSizeConfig('H4', 'h4', '20px'),
      getSizeConfig('H5', 'h5', '16px'),
      getSizeConfig('H6', 'h6', '14px'),
      getSizeConfig('Body 1', 'body1', '14px'),
      getSizeConfig('Body 2', 'body2', '12px'),
      getSizeConfig('Body 3', 'body3', '10px'),
    ];
    
    // Organize by visual style - each style shows all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      styleSection.style.marginBottom = 'var(--size-section-pad-y-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h4';
      styleLabel.textContent = `${style.label} Style - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesContainer = document.createElement('div');
      sizesContainer.style.display = 'flex';
      sizesContainer.style.alignItems = 'center';
      sizesContainer.style.gap = 'var(--size-section-gap-md)';
      sizesContainer.style.flexWrap = 'wrap';
      
      sizes.forEach((size) => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = 'var(--size-element-gap-sm)';
        wrapper.style.padding = 'var(--size-element-pad-y-md)';
        wrapper.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
        wrapper.style.borderRadius = 'var(--size-element-radius-sm)';
        
        const icon = document.createElement('i');
        // Font Awesome 6 uses: fas/far for style, fa-{icon-name} for icon
        // Using fa-circle-check as a reliable test icon (exists in both solid and regular)
        const iconName = style.class === 'fas' ? 'fa-circle-check' : 'fa-circle';
        icon.className = `${style.class} ${iconName}`;
        // Apply Font Awesome size token directly - don't use typography classes as they override font-family
        const isSolid = style.class === 'fas';
        const sizeToken = size.getSizeToken(isSolid);
        const lineHeightToken = size.getLineHeightToken(isSolid);
        icon.style.fontSize = `var(${sizeToken})`;
        icon.style.lineHeight = `var(${lineHeightToken})`;
        icon.style.color = 'var(--color-on-surface-variant, #3f484a)';
        icon.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(icon);
        
        const label = document.createElement('div');
        label.className = 'body3-txt';
        label.textContent = `${size.label} (${size.size})`;
        label.style.marginTop = 'var(--size-element-gap-xs)';
        wrapper.appendChild(label);
        
        const tokenLabel = document.createElement('div');
        tokenLabel.className = 'body3-txt';
        tokenLabel.style.fontFamily = 'monospace';
        tokenLabel.style.fontSize = '0.75rem';
        tokenLabel.style.color = 'var(--color-on-surface-variant)';
        // Show the actual token being used
        tokenLabel.textContent = sizeToken;
        wrapper.appendChild(tokenLabel);
        
        sizesContainer.appendChild(wrapper);
      });
      
      styleSection.appendChild(sizesContainer);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Common Icons
 * Examples of commonly used Font Awesome free icons
 */
export const CommonIcons = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'Common Icons';
    title.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body2-txt';
    description.textContent = 'Examples of commonly used Font Awesome free icons. Browse all available icons at https://fontawesome.com/icons';
    description.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(description);
    
    const commonIcons = [
      { name: 'circle-check', label: 'Check', class: 'fas' },
      { name: 'xmark', label: 'Close', class: 'fas' },
      { name: 'user', label: 'User', class: 'far' },
      { name: 'house', label: 'Home', class: 'fas' },
      { name: 'gear', label: 'Settings', class: 'fas' },
      { name: 'magnifying-glass', label: 'Search', class: 'fas' },
      { name: 'bell', label: 'Notification', class: 'far' },
      { name: 'envelope', label: 'Message', class: 'far' },
      { name: 'heart', label: 'Favorite', class: 'far' },
      { name: 'star', label: 'Star', class: 'fas' },
      { name: 'arrow-right', label: 'Arrow Right', class: 'fas' },
      { name: 'arrow-left', label: 'Arrow Left', class: 'fas' },
      { name: 'chevron-down', label: 'Chevron Down', class: 'fas' },
      { name: 'chevron-up', label: 'Chevron Up', class: 'fas' },
      { name: 'plus', label: 'Add', class: 'fas' },
      { name: 'minus', label: 'Remove', class: 'fas' },
      { name: 'pen-to-square', label: 'Edit', class: 'far' },
      { name: 'trash-can', label: 'Delete', class: 'far' },
      { name: 'download', label: 'Download', class: 'fas' },
      { name: 'upload', label: 'Upload', class: 'fas' },
    ];
    
    const iconsGrid = document.createElement('div');
    iconsGrid.style.display = 'grid';
    iconsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
    iconsGrid.style.gap = 'var(--size-element-gap-md)';
    
    commonIcons.forEach((iconData) => {
      const iconWrapper = document.createElement('div');
      iconWrapper.style.display = 'flex';
      iconWrapper.style.flexDirection = 'column';
      iconWrapper.style.alignItems = 'center';
      iconWrapper.style.gap = 'var(--size-element-gap-sm)';
      iconWrapper.style.padding = 'var(--size-element-pad-y-md)';
      iconWrapper.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
      iconWrapper.style.borderRadius = 'var(--size-element-radius-sm)';
      
      const icon = document.createElement('i');
      // Don't use typography classes on icons - they override FontAwesome's font-family
      icon.className = `${iconData.class} fa-${iconData.name}`;
      // Apply size using FontAwesome token if needed, or let it inherit
      icon.style.fontSize = 'var(--font-size-fa-body2-solid, 12px)';
      icon.style.color = 'var(--color-on-surface-variant, #3f484a)';
      icon.setAttribute('aria-hidden', 'true');
      iconWrapper.appendChild(icon);
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = iconData.label;
      iconWrapper.appendChild(label);
      
      const codeLabel = document.createElement('div');
      codeLabel.className = 'body3-txt';
      codeLabel.style.fontFamily = 'monospace';
      codeLabel.style.fontSize = '0.75rem';
      codeLabel.style.color = 'var(--color-on-surface-variant)';
      codeLabel.textContent = `fa-${iconData.name}`;
      iconWrapper.appendChild(codeLabel);
      
      iconsGrid.appendChild(iconWrapper);
    });
    
    container.appendChild(iconsGrid);
    
    return container;
  },
};


