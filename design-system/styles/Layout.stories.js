/**
 * Layout Tokens
 * Breakpoints, container sizes, spacing tokens, and layout tokens
 */

export default {
  title: 'Styles/Layout',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Layout tokens define breakpoints, container sizes, and spacing tokens for responsive design. Use breakpoints to create adaptive layouts that work across different screen sizes. Spacing tokens are organized by component layer (elements, cards, sections, modals, surfaces, tables).',
      },
    },
  },
};

/**
 * Helper function to create a spacing table
 */
function createSpacingTable(headers, rows) {
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
    
    // Value
    const valueCell = document.createElement('td');
    valueCell.textContent = rowData.value;
    valueCell.style.fontFamily = 'monospace';
    valueCell.style.fontSize = '0.875rem';
    row.appendChild(valueCell);
    
    // Description
    const descCell = document.createElement('td');
    descCell.textContent = rowData.description;
    descCell.className = 'body2-txt';
    row.appendChild(descCell);
    
    // Extra column (Best For) if provided
    if (rowData.extra) {
      const extraCell = document.createElement('td');
      extraCell.textContent = rowData.extra;
      extraCell.className = 'body2-txt';
      row.appendChild(extraCell);
    }
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  
  return table;
}

/**
 * Layout Overview
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Layout';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Layout tokens define breakpoints, container sizes, and spacing tokens for responsive design. Breakpoints enable adaptive layouts that work seamlessly across mobile, tablet, and desktop devices. Spacing tokens are organized by component layer (elements, cards, sections, modals, surfaces, tables).';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    description.style.lineHeight = '1.6';
    container.appendChild(description);
    
    return container;
  },
};

/**
 * Columns
 */
export const Columns = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Columns';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Columns define how content is distributed horizontally for tables, dialogs, and complex layouts. Use columns to keep content readable on wide screens and to align related information.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const gridTitle = document.createElement('h3');
    gridTitle.className = 'h3';
    gridTitle.textContent = '12-Column Mental Model';
    gridTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(gridTitle);
    
    const gridExplanation = document.createElement('p');
    gridExplanation.className = 'body2-txt';
    gridExplanation.textContent = 'Think of the page as a 12-column grid. Common patterns: dialogs span 6–8 columns in the center, tables often use full-width, and side panels use 3–4 columns on one side.';
    gridExplanation.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(gridExplanation);
    
    const gridDemo = document.createElement('div');
    gridDemo.style.display = 'grid';
    gridDemo.style.gridTemplateColumns = 'repeat(6, 1fr)';
    gridDemo.style.gridTemplateRows = 'repeat(2, 1fr)';
    gridDemo.style.gap = '4px';
    gridDemo.style.marginBottom = 'var(--size-section-pad-y-md)';
    
    for (let i = 1; i <= 12; i += 1) {
      const col = document.createElement('div');
      col.style.height = '32px';
      col.style.backgroundColor = 'var(--color-surface-container-low)';
      col.style.borderRadius = '4px';
      col.style.border = '1px dashed var(--color-outline-variant)';
      col.style.display = 'flex';
      col.style.alignItems = 'center';
      col.style.justifyContent = 'center';
      col.style.fontSize = '0.75rem';
      col.style.color = 'var(--color-on-surface-variant)';
      col.textContent = i;
      col.title = `Column ${i}`;
      gridDemo.appendChild(col);
    }
    container.appendChild(gridDemo);
    
    const examplesTitle = document.createElement('h3');
    examplesTitle.className = 'h3';
    examplesTitle.textContent = 'Common Column Usage';
    examplesTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    examplesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(examplesTitle);
    
    const examplesTable = createSpacingTable(
      ['Component', 'Typical Width', 'Notes'],
      [
        { token: 'Dialog / Modal', value: '6–8 columns', description: 'Center-aligned. Leaves comfortable margins on desktop.' },
        { token: 'Side Panel', value: '3–4 columns', description: 'Docked to left or right, used for filters or details.' },
        { token: 'Data Table', value: '10–12 columns', description: 'Typically full-width, with internal cell spacing controlled by table tokens.' },
        { token: 'Content Card Grid', value: '3–4 columns per row', description: 'Responsive grid that wraps based on breakpoint and card width.' },
      ]
    );
    container.appendChild(examplesTable);
    
    return container;
  },
};

/**
 * Breakpoints
 */
export const Breakpoints = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Breakpoints';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Breakpoints define the screen sizes at which your layout should change. Use min-width media queries with these breakpoints to create responsive designs.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const breakpointTable = createSpacingTable(
      ['Token Name', 'Value', 'Description'],
      [
        { token: '--breakpoint-md-min', value: '768px', description: 'Minimum width for medium screens (tablets)' },
        { token: '--breakpoint-md-max', value: '991.98px', description: 'Maximum width for medium screens' },
        { token: '--breakpoint-lg-min', value: '992px', description: 'Minimum width for large screens (desktops)' },
        { token: '--breakpoint-lg-max', value: '1199.98px', description: 'Maximum width for large screens' },
        { token: '--breakpoint-xl-min', value: '1200px', description: 'Minimum width for extra large screens' },
        { token: '--breakpoint-xl-max', value: '1399.98px', description: 'Maximum width for extra large screens' },
        { token: '--breakpoint-xxl-min', value: '1400px', description: 'Minimum width for 2x large screens' },
        { token: '--breakpoint-xxl-max', value: '1800px', description: 'Maximum width for 2x large screens' },
      ]
    );
    container.appendChild(breakpointTable);
    
    return container;
  },
};

/**
 * Element Spacings
 */
export const ElementSpacings = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Element Spacings';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Element spacing tokens are used for buttons, form inputs, badges, and other small UI elements. Use element-gap-xs only for label-to-input spacing.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    // Padding
    const paddingTitle = document.createElement('h3');
    paddingTitle.className = 'h3';
    paddingTitle.textContent = 'Padding';
    paddingTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    paddingTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(paddingTitle);
    
    const paddingTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-element-pad-x-lg', value: '16px', description: 'Large horizontal padding for elements' },
        { token: '--size-element-pad-x-md', value: '10px', description: 'Medium horizontal padding (default)' },
        { token: '--size-element-pad-x-sm', value: '8px', description: 'Small horizontal padding for compact elements' },
        { token: '--size-element-pad-y-lg', value: '8px', description: 'Large vertical padding for elements' },
        { token: '--size-element-pad-y-md', value: '6px', description: 'Medium vertical padding (default)' },
        { token: '--size-element-pad-y-sm', value: '4px', description: 'Small vertical padding for compact elements' },
      ]
    );
    container.appendChild(paddingTable);
    
    // Gap
    const gapTitle = document.createElement('h3');
    gapTitle.className = 'h3';
    gapTitle.textContent = 'Gap';
    gapTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    gapTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(gapTitle);
    
    const gapTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-element-gap-lg', value: '12px', description: 'Large gap between elements' },
        { token: '--size-element-gap-md', value: '10px', description: 'Medium gap between elements (default)' },
        { token: '--size-element-gap-sm', value: '8px', description: 'Small gap between elements' },
        { token: '--size-element-gap-xs', value: '4px', description: 'Extra small gap - reserved for label-to-input spacing only' },
      ]
    );
    container.appendChild(gapTable);
    
    // Radius
    const radiusTitle = document.createElement('h3');
    radiusTitle.className = 'h3';
    radiusTitle.textContent = 'Radius';
    radiusTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    radiusTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(radiusTitle);
    
    const radiusTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-element-radius-sm', value: '4px', description: 'Small radius - use with element-pad-sm (8px/4px padding)' },
        { token: '--size-element-radius-md', value: '4px', description: 'Medium radius - use with element-pad-md (10px/6px padding)' },
        { token: '--size-element-radius-lg', value: '4px', description: 'Large radius - use with element-pad-lg (16px/8px padding)' },
        { token: '--size-element-radius-pill', value: '999px', description: 'Pill shape - for badges, chips, toggle switches' },
      ]
    );
    container.appendChild(gapTable);
    
    return container;
  },
};

/**
 * Table Spacings
 */
export const TableSpacings = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Table Spacings';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table spacing tokens are used for table cells and spacing. Cell gap should be omitted when texts should be close together.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const tableTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-table-cell-x', value: '10px', description: 'Cell horizontal padding' },
        { token: '--size-table-cell-y', value: '8px', description: 'Cell vertical padding' },
        { token: '--size-table-cell-gap', value: '10px', description: 'Gap between cells (omit when texts should be close)' },
        { token: '--size-table-radius-sm', value: '6px', description: 'Row border radius - small' },
        { token: '--size-table-radius-md', value: '8px', description: 'Row border radius - medium' },
      ]
    );
    container.appendChild(tableTable);
    
    return container;
  },
};

/**
 * Card Spacings
 */
export const CardSpacings = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Card Spacings';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Card spacing tokens are used for self-contained containers displaying information.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const cardTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-card-pad-x-lg', value: '24px', description: 'Large horizontal padding for cards' },
        { token: '--size-card-pad-x-md', value: '20px', description: 'Medium horizontal padding (default)' },
        { token: '--size-card-pad-x-sm', value: '16px', description: 'Small horizontal padding for compact cards' },
        { token: '--size-card-pad-y-lg', value: '24px', description: 'Large vertical padding for cards' },
        { token: '--size-card-pad-y-md', value: '20px', description: 'Medium vertical padding (default)' },
        { token: '--size-card-pad-y-sm', value: '16px', description: 'Small vertical padding for compact cards' },
        { token: '--size-card-gap-lg', value: '32px', description: 'Large gap within cards' },
        { token: '--size-card-gap-md', value: '16px', description: 'Medium gap within cards (default)' },
        { token: '--size-card-gap-sm', value: '8px', description: 'Small gap within cards' },
        { token: '--size-card-radius-sm', value: '12px', description: 'Small border radius - use with card-pad-sm (16px padding)' },
        { token: '--size-card-radius-md', value: '16px', description: 'Medium border radius - use with card-pad-md (20px) or card-pad-lg (24px)' },
      ]
    );
    container.appendChild(cardTable);
    
    return container;
  },
};

/**
 * Modal Spacings
 */
export const ModalSpacings = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Modal Spacings';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal spacing tokens are used for dialog windows and modal overlays. Modals have generous padding to create comfortable content areas and clear visual hierarchy.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const modalTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-modal-pad-x-lg', value: '40px', description: 'Large horizontal padding for modals' },
        { token: '--size-modal-pad-x-md', value: '16px', description: 'Medium horizontal padding (default)' },
        { token: '--size-modal-pad-x-sm', value: '10px', description: 'Small horizontal padding for compact modals' },
        { token: '--size-modal-pad-y-lg', value: '24px', description: 'Large vertical padding for modals' },
        { token: '--size-modal-pad-y-md', value: '12px', description: 'Medium vertical padding (default)' },
        { token: '--size-modal-pad-y-sm', value: '8px', description: 'Small vertical padding for compact modals' },
        { token: '--size-modal-gap-lg', value: '32px', description: 'Large gap within modals' },
        { token: '--size-modal-gap-md', value: '12px', description: 'Medium gap within modals (default)' },
        { token: '--size-modal-gap-sm', value: '8px', description: 'Small gap within modals' },
        { token: '--size-modal-radius-sm', value: '4px', description: 'Small border radius - use with modal-pad-sm (10px/8px padding)' },
        { token: '--size-modal-radius-md', value: '6px', description: 'Medium border radius (default) - use with modal-pad-md (16px/12px padding)' },
        { token: '--size-modal-radius-lg', value: '12px', description: 'Large border radius - use with modal-pad-lg (40px/24px padding)' },
      ]
    );
    container.appendChild(modalTable);
    
    return container;
  },
};

/**
 * Section Spacings
 */
export const SectionSpacings = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Section Spacings';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Section spacing tokens are used for containers that group cards or forms, grouping related content.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const sectionTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-section-pad-x-lg', value: '36px', description: 'Large horizontal padding for sections' },
        { token: '--size-section-pad-x-md', value: '24px', description: 'Medium horizontal padding (default)' },
        { token: '--size-section-pad-x-sm', value: '16px', description: 'Small horizontal padding for compact sections' },
        { token: '--size-section-pad-y-lg', value: '36px', description: 'Large vertical padding for sections' },
        { token: '--size-section-pad-y-md', value: '24px', description: 'Medium vertical padding (default)' },
        { token: '--size-section-pad-y-sm', value: '16px', description: 'Small vertical padding for compact sections' },
        { token: '--size-section-gap-lg', value: '24px', description: 'Large gap within sections' },
        { token: '--size-section-gap-md', value: '16px', description: 'Medium gap within sections (default)' },
        { token: '--size-section-gap-sm', value: '8px', description: 'Small gap within sections' },
        { token: '--size-section-radius-sm', value: '8px', description: 'Small border radius - use with section-pad-sm (16px padding)' },
        { token: '--size-section-radius-md', value: '8px', description: 'Medium border radius (default) - use with section-pad-md (24px padding)' },
        { token: '--size-section-radius-lg', value: '16px', description: 'Large border radius - use with section-pad-lg (36px padding)' },
      ]
    );
    container.appendChild(sectionTable);
    
    return container;
  },
};

/**
 * Corner Radius Application
 * Demonstrates radius tokens and their relationship to padding/gap sizes
 */
export const CornerRadiusApplication = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Corner Radius Application';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Corner radius (border-radius) selection should be contextually related to the padding and gap sizes used within the same component. The radius size should match the padding/gap size tier to maintain visual consistency and hierarchy.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const principleTitle = document.createElement('h3');
    principleTitle.className = 'h3';
    principleTitle.textContent = 'Core Principle';
    principleTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    principleTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(principleTitle);
    
    const principleText = document.createElement('p');
    principleText.className = 'body1-txt';
    principleText.textContent = 'Radius size should match padding/gap size tier: Small padding → small radius, medium padding → medium radius, large padding → large radius.';
    principleText.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(principleText);
    
    // Elements Layer
    const elementsTitle = document.createElement('h3');
    elementsTitle.className = 'h3';
    elementsTitle.textContent = 'Elements Layer';
    elementsTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    elementsTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementsTitle);
    
    const elementsTable = createSpacingTable(
      ['Token', 'Value', 'Use With', 'Best For'],
      [
        { token: '--size-element-radius-sm', value: '4px', description: 'element-pad-sm (8px/4px)', extra: 'Small buttons, compact form inputs' },
        { token: '--size-element-radius-md', value: '4px', description: 'element-pad-md (10px/6px)', extra: 'Standard buttons, default form inputs' },
        { token: '--size-element-radius-lg', value: '4px', description: 'element-pad-lg (16px/8px)', extra: 'Large buttons, prominent form inputs' },
        { token: '--size-element-radius-pill', value: '999px', description: 'Independent of padding', extra: 'Badges, chips, toggle switches' },
      ]
    );
    container.appendChild(elementsTable);
    
    // Cards Layer
    const cardsTitle = document.createElement('h3');
    cardsTitle.className = 'h3';
    cardsTitle.textContent = 'Cards Layer';
    cardsTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    cardsTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(cardsTitle);
    
    const cardsTable = createSpacingTable(
      ['Token', 'Value', 'Use With', 'Best For'],
      [
        { token: '--size-card-radius-sm', value: '12px', description: 'card-pad-sm (16px)', extra: 'Compact cards, dense interfaces (default)' },
        { token: '--size-card-radius-md', value: '16px', description: 'card-pad-md (20px) or card-pad-lg (24px)', extra: 'Standard cards, content-rich layouts' },
      ]
    );
    container.appendChild(cardsTable);
    
    // Sections Layer
    const sectionsTitle = document.createElement('h3');
    sectionsTitle.className = 'h3';
    sectionsTitle.textContent = 'Sections Layer';
    sectionsTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    sectionsTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(sectionsTitle);
    
    const sectionsTable = createSpacingTable(
      ['Token', 'Value', 'Use With', 'Best For'],
      [
        { token: '--size-section-radius-sm', value: '8px', description: 'section-pad-sm (16px)', extra: 'Compact sections, dense layouts' },
        { token: '--size-section-radius-md', value: '8px', description: 'section-pad-md (24px)', extra: 'Standard sections, typical layouts' },
        { token: '--size-section-radius-lg', value: '16px', description: 'section-pad-lg (36px)', extra: 'Spacious sections, hero sections' },
      ]
    );
    container.appendChild(sectionsTable);
    
    // Modals Layer
    const modalsTitle = document.createElement('h3');
    modalsTitle.className = 'h3';
    modalsTitle.textContent = 'Modals Layer';
    modalsTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    modalsTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(modalsTitle);
    
    const modalsTable = createSpacingTable(
      ['Token', 'Value', 'Use With', 'Best For'],
      [
        { token: '--size-modal-radius-sm', value: '4px', description: 'modal-pad-sm (10px/8px)', extra: 'Compact modals, alerts, small dialogs' },
        { token: '--size-modal-radius-md', value: '6px', description: 'modal-pad-md (16px/12px)', extra: 'Standard modals, default dialogs (most common)' },
        { token: '--size-modal-radius-lg', value: '12px', description: 'modal-pad-lg (40px/24px)', extra: 'Spacious modals, important dialogs' },
      ]
    );
    container.appendChild(modalsTable);
    
    // Surfaces Layer
    const surfacesTitle = document.createElement('h3');
    surfacesTitle.className = 'h3';
    surfacesTitle.textContent = 'Surfaces Layer';
    surfacesTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    surfacesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfacesTitle);
    
    const surfacesTable = createSpacingTable(
      ['Token', 'Value', 'Use With', 'Best For'],
      [
        { token: '--size-surface-radius', value: '16px', description: 'All surface components', extra: 'Full screen/organism layouts, page-level containers' },
      ]
    );
    container.appendChild(surfacesTable);
    
    // Surface Containers Note
    const surfaceContainersNote = document.createElement('div');
    surfaceContainersNote.className = 'body1-txt';
    surfaceContainersNote.style.marginTop = 'var(--size-section-pad-y-md)';
    surfaceContainersNote.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    surfaceContainersNote.style.backgroundColor = 'var(--color-surface-container-low)';
    surfaceContainersNote.style.borderRadius = 'var(--size-card-radius-sm)';
    surfaceContainersNote.style.border = '1px solid var(--color-outline-variant)';
    surfaceContainersNote.innerHTML = '<strong>Surface Containers:</strong> No radius tokens - surface containers are the outermost layer (sidebars, top bars) and do not require corner radius. They extend to screen edges.';
    container.appendChild(surfaceContainersNote);
    
    return container;
  },
};

CornerRadiusApplication.storyName = 'Corner Radius Application';

/**
 * Page Spacings
 */
export const PageSpacings = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Page Spacings';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Page spacing tokens (Surface tokens) are used for full screen/organism layouts that the user sees at one time.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const pageTable = createSpacingTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--size-surface-pad-x', value: '32px', description: 'Horizontal padding for page/surface' },
        { token: '--size-surface-pad-y', value: '24px', description: 'Vertical padding for page/surface' },
        { token: '--size-surface-gap-lg', value: '32px', description: 'Large gap within page/surface' },
        { token: '--size-surface-gap-md', value: '24px', description: 'Medium gap within page/surface (default)' },
        { token: '--size-surface-gap-sm', value: '16px', description: 'Small gap within page/surface' },
        { token: '--size-surface-radius', value: '16px', description: 'Border radius for page/surface' },
        { token: '--size-surface-border', value: '2px', description: 'Border width for page/surface' },
      ]
    );
    container.appendChild(pageTable);
    
    return container;
  },
};
