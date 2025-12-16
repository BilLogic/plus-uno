/**
 * Elevation Tokens
 * Material Design 3 elevation system for creating depth and hierarchy
 */

export default {
  title: 'Styles/Elevation',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Elevation tokens provide box-shadow values for creating depth and hierarchy in the UI. Use elevation tokens instead of custom box-shadow values to maintain consistency.',
      },
    },
  },
};

/**
 * Helper function to create an elevation table
 */
function createElevationTable(headers, rows) {
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
    valueCell.style.fontFamily = 'monospace';
    valueCell.style.fontSize = '0.75rem';
    valueCell.style.wordBreak = 'break-all';
    valueCell.textContent = rowData.value;
    row.appendChild(valueCell);
    
    // Visual representation
    if (headers.includes('Visual')) {
      const visualCell = document.createElement('td');
      visualCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
      const visual = document.createElement('div');
      visual.style.width = '100px';
      visual.style.height = '60px';
      visual.style.backgroundColor = 'var(--color-surface-container, #edeef0)';
      visual.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
      visual.style.boxShadow = rowData.value;
      visual.style.margin = '0 auto';
      visualCell.appendChild(visual);
      row.appendChild(visualCell);
    }
    
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
 * Elevation Overview
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Elevation';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Elevation tokens provide box-shadow values for creating depth and hierarchy in the UI. Always use elevation tokens instead of custom box-shadow values. Higher elevation indicates more important or urgent content.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const principlesTitle = document.createElement('h2');
    principlesTitle.className = 'h2';
    principlesTitle.textContent = 'Elevation Principles';
    principlesTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    principlesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(principlesTitle);
    
    const principlesList = document.createElement('ul');
    principlesList.className = 'body2-txt';
    principlesList.style.paddingLeft = 'var(--size-section-pad-x-md)';
    const principles = [
      'Use elevation tokens: Always use elevation tokens instead of custom box-shadow values',
      'Match elevation to importance: Use higher elevation for more important/urgent content',
      'Consider context: Modals typically use elevation 3-5, cards use elevation 1-2',
    ];
    principles.forEach(principle => {
      const li = document.createElement('li');
      li.textContent = principle;
      li.style.marginBottom = 'var(--size-element-gap-sm)';
      principlesList.appendChild(li);
    });
    container.appendChild(principlesList);
    
    return container;
  },
};

/**
 * All Elevation Levels
 */
export const AllElevations = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Elevation Levels';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const table = createElevationTable(
      ['Token', 'Value', 'Visual', 'Use Case'],
      [
        {
          token: '--elevation-light-1',
          value: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
          description: 'Subtle elevation, cards at rest'
        },
        {
          token: '--elevation-light-2',
          value: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
          description: 'Slightly raised elements, hover states'
        },
        {
          token: '--elevation-light-3',
          value: '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
          description: 'Modals, dialogs, raised cards'
        },
        {
          token: '--elevation-light-4',
          value: '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
          description: 'Prominent modals, important overlays'
        },
        {
          token: '--elevation-light-5',
          value: '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
          description: 'Maximum elevation, critical dialogs'
        },
      ]
    );
    container.appendChild(table);
    
    return container;
  },
};

/**
 * Usage Examples
 */
export const UsageExamples = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Usage Examples';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const cardExample = document.createElement('div');
    cardExample.style.marginBottom = 'var(--size-card-gap-lg)';
    
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'h3';
    cardTitle.textContent = 'Card at Rest and Hover';
    cardTitle.style.marginBottom = 'var(--size-element-gap-md)';
    cardExample.appendChild(cardTitle);
    
    const codeBlock = document.createElement('pre');
    codeBlock.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    codeBlock.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    codeBlock.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
    codeBlock.style.overflow = 'auto';
    codeBlock.style.fontSize = '0.875rem';
    codeBlock.style.fontFamily = 'monospace';
    codeBlock.textContent = `.card {
    box-shadow: var(--elevation-light-1);
}

.card:hover {
    box-shadow: var(--elevation-light-2);
}`;
    cardExample.appendChild(codeBlock);
    container.appendChild(cardExample);
    
    const modalExample = document.createElement('div');
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'h3';
    modalTitle.textContent = 'Modal/Dialog';
    modalTitle.style.marginBottom = 'var(--size-element-gap-md)';
    modalExample.appendChild(modalTitle);
    
    const modalCodeBlock = document.createElement('pre');
    modalCodeBlock.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    modalCodeBlock.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    modalCodeBlock.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
    modalCodeBlock.style.overflow = 'auto';
    modalCodeBlock.style.fontSize = '0.875rem';
    modalCodeBlock.style.fontFamily = 'monospace';
    modalCodeBlock.textContent = `.modal {
    box-shadow: var(--elevation-light-3);
}

/* For prominent modals */
.modal.prominent {
    box-shadow: var(--elevation-light-4);
}

/* For critical dialogs */
.modal.critical {
    box-shadow: var(--elevation-light-5);
}`;
    modalExample.appendChild(modalCodeBlock);
    container.appendChild(modalExample);
    
    return container;
  },
};

