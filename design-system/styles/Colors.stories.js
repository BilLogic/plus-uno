/**
 * Color Tokens
 * Material Design 3 color system with accent colors, neutral colors, and state layers
 */

import { PlusInterface } from '../components/index.js';

export default {
  title: 'Styles/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Color system following Material Design 3 color roles. Includes accent colors (Primary, Secondary, Tertiary, Success, Danger, Warning, Info), SMART Framework colors, neutral colors, and state layers for interactive elements.',
      },
    },
  },
};

/**
 * Helper function to create a color table
 */
function createColorTable(headers, rows) {
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
    
    // First column - always token/state
    const firstCell = document.createElement('td');
    firstCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    const code = document.createElement('code');
    code.textContent = rowData.token;
    code.style.fontSize = '0.875rem';
    firstCell.appendChild(code);
    row.appendChild(firstCell);
    
    // Second column - value/overlay token
    const secondCell = document.createElement('td');
    secondCell.style.fontFamily = 'monospace';
    secondCell.style.fontSize = '0.875rem';
    secondCell.textContent = rowData.value;
    secondCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    row.appendChild(secondCell);
    
    // Handle 4-column tables (State, Overlay Token, Border/Stroke, Opacity Rule)
    if (headers.length === 4 && headers.includes('Border / Stroke')) {
      // Third column - Border/Stroke
      const borderCell = document.createElement('td');
      borderCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
      borderCell.className = 'body2-txt';
      borderCell.textContent = rowData.border || '';
      row.appendChild(borderCell);
      
      // Fourth column - Opacity Rule
      const opacityCell = document.createElement('td');
      opacityCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
      opacityCell.className = 'body2-txt';
      opacityCell.textContent = rowData.opacity || '';
      row.appendChild(opacityCell);
    } else {
      // Visual swatch for color tables
      if (headers.includes('Color')) {
        const visualCell = document.createElement('td');
        visualCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
        const swatch = document.createElement('div');
        swatch.style.width = '60px';
        swatch.style.height = '40px';
        swatch.style.backgroundColor = rowData.value;
        swatch.style.border = '1px solid var(--color-outline-variant, #bec8ca)';
        swatch.style.borderRadius = '4px';
        visualCell.appendChild(swatch);
        row.appendChild(visualCell);
      }
      
      // Description column
      const descCell = document.createElement('td');
      descCell.textContent = rowData.description || '';
      descCell.className = 'body2-txt';
      descCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
      row.appendChild(descCell);
    }
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  
  return table;
}

/**
 * Color Overview
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'PLUS follows Material Design 3 color guidance. All colors follow Material Design 3 roles and are sourced from Figma design system variables. The color system includes accent colors, SMART Framework colors, neutral colors, and state layers for interactive elements.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    return container;
  },
};

/**
 * Accent Colors - Primary (internal section)
 * Used by AccentColors combined story.
 */
const AccentPrimarySection = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Primary Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const table = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-primary', value: '#0472a8', description: 'Main primary color - for borders/backgrounds' },
        { token: '--color-primary-text', value: '#00547e', description: 'Primary text color - for text' },
        { token: '--color-on-primary', value: '#ffffff', description: 'Content color on primary' },
        { token: '--color-primary-container', value: '#61b5cf', description: 'Primary container background' },
        { token: '--color-on-primary-container', value: '#001e2e', description: 'Content color on primary container' },
        { token: '--color-inverse-primary', value: '#84cfff', description: 'Inverse primary color' },
      ]
    );
    container.appendChild(table);
    
    const stateTitle = document.createElement('h3');
    stateTitle.className = 'h3';
    stateTitle.textContent = 'Primary State Layers';
    stateTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    stateTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(stateTitle);
    
    const stateTable = createColorTable(
      ['Token', 'Value', 'Description'],
      [
        { token: '--color-primary-state-08', value: 'rgba(0, 101, 142, 0.08)', description: '8% opacity state layer' },
        { token: '--color-primary-state-12', value: 'rgba(0, 101, 142, 0.12)', description: '12% opacity state layer' },
        { token: '--color-primary-state-16', value: 'rgba(0, 101, 142, 0.16)', description: '16% opacity state layer' },
        { token: '--color-primary-container-state-08', value: 'rgba(199, 231, 255, 0.08)', description: 'Container 8% opacity' },
        { token: '--color-primary-container-state-12', value: 'rgba(199, 231, 255, 0.12)', description: 'Container 12% opacity' },
        { token: '--color-primary-container-state-16', value: 'rgba(199, 231, 255, 0.16)', description: 'Container 16% opacity' },
      ]
    );
    container.appendChild(stateTable);
    
    return container;
  },
};

/**
 * Accent Colors - Secondary (internal section)
 */
const AccentSecondarySection = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Secondary Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const table = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-secondary', value: '#445c6a', description: 'Main secondary color - for borders/backgrounds' },
        { token: '--color-secondary-text', value: '#3b525f', description: 'Secondary text color - for text' },
        { token: '--color-on-secondary', value: '#ffffff', description: 'Content color on secondary' },
        { token: '--color-secondary-container', value: '#5e849b', description: 'Secondary container background' },
        { token: '--color-on-secondary-container', value: '#09171f', description: 'Content color on secondary container' },
      ]
    );
    container.appendChild(table);
    
    return container;
  },
};

/**
 * Accent Colors - Tertiary (internal section)
 */
const AccentTertiarySection = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Tertiary Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const table = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-tertiary', value: '#0e8175', description: 'Main tertiary color' },
        { token: '--color-tertiary-text', value: '#005a50', description: 'Tertiary text color - for text' },
        { token: '--color-on-tertiary', value: '#ffffff', description: 'Content color on tertiary' },
        { token: '--color-tertiary-container', value: '#85ecd5', description: 'Tertiary container background' },
        { token: '--color-on-tertiary-container', value: '#005a50', description: 'Content color on tertiary container' },
      ]
    );
    container.appendChild(table);
    
    const infoNote = document.createElement('p');
    infoNote.className = 'body2-txt';
    infoNote.style.marginTop = 'var(--size-section-pad-y-md)';
    infoNote.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    infoNote.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    infoNote.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
    infoNote.innerHTML = '<strong>Note:</strong> Info colors alias to Tertiary using <code>var()</code> references. Use <code>--color-info</code> which references <code>--color-tertiary</code>.';
    container.appendChild(infoNote);
    
    return container;
  },
};

/**
 * Combined Accent Colors story
 */
export const AccentColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Accent Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Accent colors provide primary, secondary, and tertiary emphasis in the UI. Use primary for main actions, secondary for supporting actions, and tertiary (also used for Info) for contextual emphasis.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    // Primary section
    container.appendChild(AccentPrimarySection.render());
    
    // Secondary section
    const secondarySection = AccentSecondarySection.render();
    secondarySection.style.marginTop = 'var(--size-section-pad-y-lg)';
    container.appendChild(secondarySection);
    
    // Tertiary section
    const tertiarySection = AccentTertiarySection.render();
    tertiarySection.style.marginTop = 'var(--size-section-pad-y-lg)';
    container.appendChild(tertiarySection);
    
    // Button Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.className = 'h3';
    examplesTitle.textContent = 'Button Examples';
    examplesTitle.style.marginTop = 'var(--size-section-pad-y-lg)';
    examplesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(examplesTitle);
    
    const examplesDescription = document.createElement('p');
    examplesDescription.className = 'body2-txt';
    examplesDescription.textContent = 'Accent colors are used in buttons with different fill variants. Below are examples showing filled, outline, and tonal buttons for each accent color.';
    examplesDescription.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(examplesDescription);
    
    const styles = ['primary', 'secondary', 'tertiary'];
    const fills = ['filled', 'outline', 'tonal'];
    
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.marginBottom = 'var(--size-section-pad-y-md)';
      
      const styleLabel = document.createElement('h4');
      styleLabel.className = 'h4';
      styleLabel.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const buttonRow = document.createElement('div');
      buttonRow.style.display = 'flex';
      buttonRow.style.flexWrap = 'wrap';
      buttonRow.style.gap = 'var(--size-element-gap-md)';
      buttonRow.style.alignItems = 'center';
      
      fills.forEach((fill) => {
        const button = PlusInterface.createButton({
          btnText: `${style.charAt(0).toUpperCase() + style.slice(1)} ${fill.charAt(0).toUpperCase() + fill.slice(1)}`,
          btnStyle: style,
          btnFill: fill,
          btnSize: 'default',
        });
        buttonRow.appendChild(button);
      });
      
      styleSection.appendChild(buttonRow);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Status Colors - Success, Danger, Warning
 */
export const StatusColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Status Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const successTitle = document.createElement('h3');
    successTitle.className = 'h3';
    successTitle.textContent = 'Success';
    successTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    successTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(successTitle);
    
    const successTable = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-success', value: '#3e691a', description: 'Main success color - for borders/backgrounds' },
        { token: '--color-success-text', value: '#2c5609', description: 'Success text color - for text' },
        { token: '--color-on-success', value: '#ffffff', description: 'Content color on success' },
        { token: '--color-success-container', value: '#a1eb83', description: 'Success container background' },
        { token: '--color-on-success-container', value: '#0c2000', description: 'Content color on success container' },
      ]
    );
    container.appendChild(successTable);
    
    const dangerTitle = document.createElement('h3');
    dangerTitle.className = 'h3';
    dangerTitle.textContent = 'Danger';
    dangerTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    dangerTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(dangerTitle);
    
    const dangerTable = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-danger', value: '#ba1a1a', description: 'Main danger color - for borders/backgrounds' },
        { token: '--color-danger-text', value: '#9b0606', description: 'Danger text color - for text' },
        { token: '--color-on-danger', value: '#ffffff', description: 'Content color on danger' },
        { token: '--color-danger-container', value: '#ffdad6', description: 'Danger container background' },
        { token: '--color-on-danger-container', value: '#410002', description: 'Content color on danger container' },
      ]
    );
    container.appendChild(dangerTable);
    
    const warningTitle = document.createElement('h3');
    warningTitle.className = 'h3';
    warningTitle.textContent = 'Warning';
    warningTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    warningTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(warningTitle);
    
    const warningTable = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-warning', value: '#9f8205', description: 'Main warning color - for borders/backgrounds' },
        { token: '--color-warning-text', value: '#5b4a00', description: 'Warning text color - for text' },
        { token: '--color-on-warning', value: '#ffffff', description: 'Content color on warning' },
        { token: '--color-warning-container', value: '#ffe17a', description: 'Warning container background' },
        { token: '--color-on-warning-container', value: '#231b00', description: 'Content color on warning container' },
      ]
    );
    container.appendChild(warningTable);
    
    // Alert Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.className = 'h3';
    examplesTitle.textContent = 'Alert Component Examples';
    examplesTitle.style.marginTop = 'var(--size-section-pad-y-lg)';
    examplesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(examplesTitle);
    
    const examplesDescription = document.createElement('p');
    examplesDescription.className = 'body2-txt';
    examplesDescription.textContent = 'Status colors are used in Alert components to provide contextual feedback. Below are examples showing how each status color is applied in context.';
    examplesDescription.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(examplesDescription);
    
    const alertExamples = document.createElement('div');
    alertExamples.style.display = 'flex';
    alertExamples.style.flexDirection = 'column';
    alertExamples.style.gap = 'var(--size-card-gap-md)';
    
    const statusAlerts = [
      { style: 'success', title: 'Success Alert', text: 'This is a success alert demonstrating the success color tokens.' },
      { style: 'danger', title: 'Danger Alert', text: 'This is a danger alert demonstrating the danger color tokens.' },
      { style: 'warning', title: 'Warning Alert', text: 'This is a warning alert demonstrating the warning color tokens.' },
    ];
    
    statusAlerts.forEach((alertData) => {
      const alert = PlusInterface.createAlert({
        style: alertData.style,
        title: alertData.title,
        text: alertData.text,
        dismissable: false,
      });
      alertExamples.appendChild(alert);
    });
    
    container.appendChild(alertExamples);
    
    return container;
  },
};

/**
 * Neutral Colors
 */
export const NeutralColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Neutral Colors';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const textTitle = document.createElement('h3');
    textTitle.className = 'h3';
    textTitle.textContent = 'Neutral Font Colors';
    textTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    textTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(textTitle);
    
    const textTable = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-on-surface', value: '#191c1e', description: 'Primary text color. Use for headings and primary content.' },
        { token: '--color-on-surface-variant', value: '#3f484a', description: 'Secondary text color. Use for subtitles, metadata, and timestamps.' },
      ]
    );
    container.appendChild(textTable);
    
    const outlineTitle = document.createElement('h3');
    outlineTitle.className = 'h3';
    outlineTitle.textContent = 'Outline Colors';
    outlineTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    outlineTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(outlineTitle);
    
    const outlineTable = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-outline', value: '#6f797a', description: 'Outer borders. Use for component perimeters (e.g., card borders).' },
        { token: '--color-outline-variant', value: '#bec8ca', description: 'Inner dividers. Use for internal separators and lines.' },
      ]
    );
    container.appendChild(outlineTable);
    
    const disabledTitle = document.createElement('h3');
    disabledTitle.className = 'h3';
    disabledTitle.textContent = 'Disabled State';
    disabledTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    disabledTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(disabledTitle);
    
    const disabledTable = createColorTable(
      ['Token', 'Value', 'Color', 'Description'],
      [
        { token: '--color-on-surface-state-08', value: 'rgba(25, 28, 30, 0.08)', description: 'Overlay for disabled state. Combine with 38% overall component opacity.' },
      ]
    );
    container.appendChild(disabledTable);
    
    // Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.className = 'h3';
    examplesTitle.textContent = 'Examples';
    examplesTitle.style.marginTop = 'var(--size-section-pad-y-lg)';
    examplesTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(examplesTitle);
    
    // Font Colors Example
    const fontExampleTitle = document.createElement('h4');
    fontExampleTitle.className = 'h4';
    fontExampleTitle.textContent = 'Font Colors';
    fontExampleTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    fontExampleTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(fontExampleTitle);
    
    const formExample = document.createElement('div');
    formExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    formExample.style.backgroundColor = 'var(--color-surface-container-lowest)';
    formExample.style.borderRadius = 'var(--size-card-radius-sm)';
    formExample.style.border = '1px solid var(--color-outline-variant)';
    formExample.style.maxWidth = '400px';
    
    const label1 = document.createElement('label');
    label1.className = 'body2-txt';
    label1.textContent = 'Primary Text (on-surface)';
    label1.style.display = 'block';
    label1.style.marginBottom = 'var(--size-element-gap-xs)';
    label1.style.color = 'var(--color-on-surface)';
    formExample.appendChild(label1);
    
    const input1 = document.createElement('input');
    input1.type = 'text';
    input1.className = 'plus-text-field body2-txt';
    input1.value = 'Example input text';
    input1.style.marginBottom = 'var(--size-element-gap-md)';
    formExample.appendChild(input1);
    
    const label2 = document.createElement('label');
    label2.className = 'body2-txt';
    label2.textContent = 'Secondary Text (on-surface-variant)';
    label2.style.display = 'block';
    label2.style.marginBottom = 'var(--size-element-gap-xs)';
    label2.style.color = 'var(--color-on-surface-variant)';
    formExample.appendChild(label2);
    
    const metadata = document.createElement('div');
    metadata.className = 'body2-txt';
    metadata.textContent = 'Last updated: 2 hours ago';
    metadata.style.color = 'var(--color-on-surface-variant)';
    formExample.appendChild(metadata);
    
    container.appendChild(formExample);
    
    // Outline Colors Example
    const outlineExampleTitle = document.createElement('h4');
    outlineExampleTitle.className = 'h4';
    outlineExampleTitle.textContent = 'Outline Colors';
    outlineExampleTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    outlineExampleTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(outlineExampleTitle);
    
    const cardExample = document.createElement('div');
    cardExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    cardExample.style.backgroundColor = 'var(--color-surface-container-lowest)';
    cardExample.style.borderRadius = 'var(--size-card-radius-sm)';
    cardExample.style.border = '1px solid var(--color-outline)';
    cardExample.style.maxWidth = '400px';
    
    const cardTitle = document.createElement('div');
    cardTitle.className = 'h4';
    cardTitle.textContent = 'Card with Outer Border';
    cardTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    cardExample.appendChild(cardTitle);
    
    const divider = document.createElement('div');
    divider.style.height = '1px';
    divider.style.backgroundColor = 'var(--color-outline-variant)';
    divider.style.margin = 'var(--size-element-gap-md) 0';
    cardExample.appendChild(divider);
    
    const cardText = document.createElement('div');
    cardText.className = 'body2-txt';
    cardText.textContent = 'This divider uses outline-variant (inner divider).';
    cardExample.appendChild(cardText);
    
    container.appendChild(cardExample);
    
    // Disabled State Example
    const disabledExampleTitle = document.createElement('h4');
    disabledExampleTitle.className = 'h4';
    disabledExampleTitle.textContent = 'Disabled State';
    disabledExampleTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    disabledExampleTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(disabledExampleTitle);
    
    const disabledButton = PlusInterface.createButton({
      btnText: 'Disabled Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false,
    });
    container.appendChild(disabledButton);
    
    return container;
  },
};


/**
 * Surface Colors & Elevation Context
 */
export const SurfaceColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Surface Colors & Elevation';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Choose surface tokens based on component type and elevation. Elevation implies visual layering; interaction overlays are always additive on top of these base fills.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    // Element – Default / Read State
    const elementDefaultTitle = document.createElement('h3');
    elementDefaultTitle.className = 'h3';
    elementDefaultTitle.textContent = 'Element – Default / Read State';
    elementDefaultTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    elementDefaultTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementDefaultTitle);
    
    const elementDefaultInfo = document.createElement('p');
    elementDefaultInfo.className = 'body2-txt';
    elementDefaultInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface</code> | <strong>Elevation:</strong> 0 on top of surface';
    elementDefaultInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementDefaultInfo);
    
    const elementDefaultExample = document.createElement('div');
    elementDefaultExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    elementDefaultExample.style.backgroundColor = 'var(--color-surface)';
    elementDefaultExample.style.borderRadius = 'var(--size-card-radius-sm)';
    elementDefaultExample.style.border = '1px solid var(--color-outline-variant)';
    elementDefaultExample.style.maxWidth = '400px';
    elementDefaultExample.innerHTML = '<div class="body2-txt">Default element using --color-surface</div>';
    container.appendChild(elementDefaultExample);
    
    // Element – Active
    const elementActiveTitle = document.createElement('h3');
    elementActiveTitle.className = 'h3';
    elementActiveTitle.textContent = 'Element – Active';
    elementActiveTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    elementActiveTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementActiveTitle);
    
    const elementActiveInfo = document.createElement('p');
    elementActiveInfo.className = 'body2-txt';
    elementActiveInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-highest</code> | <strong>Elevation:</strong> Used for active states layered above container';
    elementActiveInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(elementActiveInfo);
    
    const elementActiveExample = document.createElement('div');
    elementActiveExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    elementActiveExample.style.backgroundColor = 'var(--color-surface-container-highest)';
    elementActiveExample.style.borderRadius = 'var(--size-card-radius-sm)';
    elementActiveExample.style.border = '1px solid var(--color-outline-variant)';
    elementActiveExample.style.maxWidth = '400px';
    elementActiveExample.innerHTML = '<div class="body2-txt">Active element using --color-surface-container-highest</div>';
    container.appendChild(elementActiveExample);
    
    // Table – Default
    const tableTitle = document.createElement('h3');
    tableTitle.className = 'h3';
    tableTitle.textContent = 'Table – Default';
    tableTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    tableTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(tableTitle);
    
    const tableInfo = document.createElement('p');
    tableInfo.className = 'body2-txt';
    tableInfo.innerHTML = '<strong>Token:</strong> <code>no-fill</code> | <strong>Elevation:</strong> 0';
    tableInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(tableInfo);
    
    const tableExample = document.createElement('table');
    tableExample.style.width = '100%';
    tableExample.style.borderCollapse = 'collapse';
    tableExample.style.border = '1px solid var(--color-outline-variant)';
    tableExample.style.maxWidth = '400px';
    const tableRow = document.createElement('tr');
    const tableCell1 = document.createElement('td');
    tableCell1.className = 'body2-txt';
    tableCell1.textContent = 'Cell 1';
    tableCell1.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    const tableCell2 = document.createElement('td');
    tableCell2.className = 'body2-txt';
    tableCell2.textContent = 'Cell 2';
    tableCell2.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    tableRow.appendChild(tableCell1);
    tableRow.appendChild(tableCell2);
    tableExample.appendChild(tableRow);
    container.appendChild(tableExample);
    
    // Section – Default
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'h3';
    sectionTitle.textContent = 'Section – Default';
    sectionTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    sectionTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(sectionTitle);
    
    const sectionInfo = document.createElement('p');
    sectionInfo.className = 'body2-txt';
    sectionInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-low</code> (or no-fill) | <strong>Elevation:</strong> 0';
    sectionInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(sectionInfo);
    
    const sectionExample = document.createElement('div');
    sectionExample.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    sectionExample.style.backgroundColor = 'var(--color-surface-container-low)';
    sectionExample.style.borderRadius = 'var(--size-section-radius-md)';
    sectionExample.style.border = '1px solid var(--color-outline-variant)';
    sectionExample.style.maxWidth = '400px';
    sectionExample.innerHTML = '<div class="body2-txt">Section container using --color-surface-container-low</div>';
    container.appendChild(sectionExample);
    
    // Modal – Default
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'h3';
    modalTitle.textContent = 'Modal – Default';
    modalTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    modalTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(modalTitle);
    
    const modalInfo = document.createElement('p');
    modalInfo.className = 'body2-txt';
    modalInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-high</code> | <strong>Elevation:</strong> <code>--elevation-light-3</code>';
    modalInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(modalInfo);
    
    const modalExample = PlusInterface.createModal({
      modalId: 'surface-color-modal-example',
      modalTitle: 'Modal Example',
      modalBody: 'This modal uses --color-surface-container-high with elevation token --elevation-light-3.',
      showCloseButton: true,
    });
    modalExample.style.maxWidth = '400px';
    modalExample.style.position = 'relative';
    modalExample.style.margin = '0';
    container.appendChild(modalExample);
    
    // Card – Default
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'h3';
    cardTitle.textContent = 'Card – Default';
    cardTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    cardTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(cardTitle);
    
    const cardInfo = document.createElement('p');
    cardInfo.className = 'body2-txt';
    cardInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container-lowest</code> | <strong>Elevation:</strong> <code>--elevation-light-1</code>';
    cardInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(cardInfo);
    
    const cardExample = PlusInterface.createCard({
      cardTitle: 'Card Example',
      cardBody: 'This card uses --color-surface-container-lowest with elevation token --elevation-light-1.',
    });
    cardExample.style.maxWidth = '400px';
    container.appendChild(cardExample);
    
    // Surface Container – General Wrapper
    const surfaceContainerTitle = document.createElement('h3');
    surfaceContainerTitle.className = 'h3';
    surfaceContainerTitle.textContent = 'Surface Container – General Wrapper';
    surfaceContainerTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    surfaceContainerTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceContainerTitle);
    
    const surfaceContainerInfo = document.createElement('p');
    surfaceContainerInfo.className = 'body2-txt';
    surfaceContainerInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface-container</code> | <strong>Elevation:</strong> 0';
    surfaceContainerInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceContainerInfo);
    
    const surfaceContainerExample = document.createElement('div');
    surfaceContainerExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    surfaceContainerExample.style.backgroundColor = 'var(--color-surface-container)';
    surfaceContainerExample.style.borderRadius = 'var(--size-card-radius-sm)';
    surfaceContainerExample.style.border = '1px solid var(--color-outline-variant)';
    surfaceContainerExample.style.maxWidth = '400px';
    surfaceContainerExample.innerHTML = '<div class="body2-txt">General wrapper using --color-surface-container</div>';
    container.appendChild(surfaceContainerExample);
    
    // Surface – Base Background
    const surfaceTitle = document.createElement('h3');
    surfaceTitle.className = 'h3';
    surfaceTitle.textContent = 'Surface – Base Background';
    surfaceTitle.style.marginTop = 'var(--size-section-pad-y-md)';
    surfaceTitle.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceTitle);
    
    const surfaceInfo = document.createElement('p');
    surfaceInfo.className = 'body2-txt';
    surfaceInfo.innerHTML = '<strong>Token:</strong> <code>--color-surface</code> | <strong>Elevation:</strong> 0';
    surfaceInfo.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(surfaceInfo);
    
    const surfaceExample = document.createElement('div');
    surfaceExample.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    surfaceExample.style.backgroundColor = 'var(--color-surface)';
    surfaceExample.style.borderRadius = 'var(--size-card-radius-sm)';
    surfaceExample.style.border = '1px solid var(--color-outline-variant)';
    surfaceExample.style.maxWidth = '400px';
    surfaceExample.innerHTML = '<div class="body2-txt">Base background using --color-surface</div>';
    container.appendChild(surfaceExample);
    
    return container;
  },
};

/**
 * Universal Interaction Logic
 */
export const InteractionStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Universal Interaction Logic';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Interaction states are implemented as additive overlays on top of the base surface token. Do not replace the base fill token – apply on-surface state layers above it.';
    description.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(description);
    
    const logicList = document.createElement('ul');
    logicList.className = 'body2-txt';
    [
      'Hover: Apply on-surface @ 8% opacity on top of the base surface.',
      'Pressed: Apply on-surface @ 16% opacity on top of the base surface.',
      'Focus: Apply on-surface @ 12% opacity and change border to inverse primary.',
      'Disabled: Apply on-surface @ 8% opacity and set total component opacity to 38%.',
    ].forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      logicList.appendChild(li);
    });
    container.appendChild(logicList);
    
    const stateTable = createColorTable(
      ['State', 'Overlay Token', 'Border / Stroke', 'Opacity Rule'],
      [
        { token: 'Default', value: 'transparent', border: 'No stroke', opacity: '100% opacity' },
        { token: 'Hover', value: '--color-on-surface-state-08', border: 'No border change', opacity: 'Component remains at 100% opacity' },
        { token: 'Pressed', value: '--color-on-surface-state-16', border: 'No border change', opacity: 'Component remains at 100% opacity' },
        { token: 'Focus', value: '--color-on-surface-state-12', border: 'Border switches to --color-inverse-primary (typically 2px)', opacity: 'Component remains at 100% opacity' },
        { token: 'Disabled', value: '--color-on-surface-state-08', border: 'No border change', opacity: 'Set total component opacity to 38%' },
      ]
    );
    container.appendChild(stateTable);
    
    const tableNote = document.createElement('p');
    tableNote.className = 'body2-txt';
    tableNote.style.marginTop = 'var(--size-section-pad-y-md)';
    tableNote.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    tableNote.style.backgroundColor = 'var(--color-surface-container-low, #f3f3f6)';
    tableNote.style.borderRadius = 'var(--size-card-radius-sm, 12px)';
    tableNote.innerHTML = '<strong>Note:</strong> Table buttons and interactive elements follow the same universal interaction logic shown above.';
    container.appendChild(tableNote);
    
    return container;
  },
};

/**
 * Interactive Color Playground
 * Interactive playground with Storybook controls to test color tokens
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Interactive Color Playground';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Use the controls below to test different color tokens and see how they look in context.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    // Color swatch example
    const swatchContainer = document.createElement('div');
    swatchContainer.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    swatchContainer.style.backgroundColor = args.backgroundColor || 'var(--color-surface)';
    swatchContainer.style.borderRadius = 'var(--size-card-radius-sm)';
    swatchContainer.style.border = `2px solid ${args.borderColor || 'var(--color-outline)'}`;
    swatchContainer.style.marginBottom = 'var(--size-card-gap-md)';
    
    const swatchTitle = document.createElement('h3');
    swatchTitle.className = 'h3';
    swatchTitle.textContent = args.title || 'Color Example';
    swatchTitle.style.color = args.textColor || 'var(--color-on-surface)';
    swatchTitle.style.marginBottom = 'var(--size-element-gap-sm)';
    swatchContainer.appendChild(swatchTitle);
    
    const swatchText = document.createElement('p');
    swatchText.className = 'body2-txt';
    swatchText.textContent = args.description || 'This is example text showing how colors work together.';
    swatchText.style.color = args.textColor || 'var(--color-on-surface)';
    swatchContainer.appendChild(swatchText);
    
    container.appendChild(swatchContainer);
    
    // Button example
    if (args.showButton) {
      const button = PlusInterface.createButton({
        btnText: args.buttonText || 'Example Button',
        btnStyle: args.buttonStyle || 'primary',
        btnFill: args.buttonFill || 'filled',
        btnSize: args.buttonSize || 'default',
      });
      button.style.marginTop = 'var(--size-element-gap-md)';
      container.appendChild(button);
    }
    
    return container;
  },
  argTypes: {
    backgroundColor: {
      control: 'text',
      description: 'Background color token (e.g., var(--color-surface))',
    },
    borderColor: {
      control: 'text',
      description: 'Border color token (e.g., var(--color-outline))',
    },
    textColor: {
      control: 'text',
      description: 'Text color token (e.g., var(--color-on-surface))',
    },
    title: {
      control: 'text',
      description: 'Example title text',
    },
    description: {
      control: 'text',
      description: 'Example description text',
    },
    showButton: {
      control: 'boolean',
      description: 'Show example button',
    },
    buttonText: {
      control: 'text',
      description: 'Button text',
      if: { arg: 'showButton', eq: true },
    },
    buttonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Button style',
      if: { arg: 'showButton', eq: true },
    },
    buttonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Button fill variant',
      if: { arg: 'showButton', eq: true },
    },
    buttonSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Button size',
      if: { arg: 'showButton', eq: true },
    },
  },
  args: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-outline)',
    textColor: 'var(--color-on-surface)',
    title: 'Color Example',
    description: 'This is example text showing how colors work together.',
    showButton: true,
    buttonText: 'Example Button',
    buttonStyle: 'primary',
    buttonFill: 'filled',
    buttonSize: 'default',
  },
};

