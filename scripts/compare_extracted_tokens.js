const fs = require('fs');

const extracted = JSON.parse(fs.readFileSync('extracted_tokens.json', 'utf8'));
const cssContent = fs.readFileSync('/Users/billguo/Downloads/figma-export.css', 'utf8');

// Parse CSS Variables
const cssTokens = {}; // name -> value
const cssLines = cssContent.split('\n');
cssLines.forEach(line => {
    const match = line.match(/--([\w-]+):\s*([^;]+);/);
    if (match) {
        cssTokens[match[1]] = match[2].trim();
    }
});

// Normalize Hex
function normalizeHex(hex) {
    if (!hex) return '';
    hex = hex.toLowerCase().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length > 6) hex = hex.substring(0, 6); // Ignore alpha for loose comparison if strictly opaque
    return hex;
}

const figmaActiveColors = new Set();
const figmaGridConfigs = [];

// Process Extracted
extracted.colors.forEach(c => {
    if (c.value) figmaActiveColors.add(normalizeHex(c.value));
});

extracted.layout.forEach(l => {
    if (l.type === 'GRID') figmaGridConfigs.push(l);
});

// Analysis
const discrepancies = [];
const zombies = []; // In CSS, not in Figma
const missing = []; // In Figma (scan), not in CSS

// Check CSS Colors against Figma
Object.entries(cssTokens).forEach(([name, value]) => {
    if (value.startsWith('#')) {
        const hex = normalizeHex(value);
        if (!figmaActiveColors.has(hex)) {
            // Check if it's a known semantic alias or just missing
            zombies.push({ name, value });
        }
    }
});

// Check Grids
// CSS defines --columns-col-X. Figma defines Grid properties.
// We can't strictly compare without formula, but we can verify gutter/margin.
const cssGutter = cssTokens['spacing-medium-space-300']; // Assuming 16px
// ... logic to infer grid settings

// Output Report
let report = `# Figma vs CSS Token Verification Report

## Summary
- **CSS Tokens Scanned**: ${Object.keys(cssTokens).length}
- **Figma Colors Found**: ${figmaActiveColors.size}
- **Potential Zombies (In CSS, Inactive in Figma)**: ${zombies.length}

## Layout & Grid Verification
> User Request: Verify Layout & Grid content

**Figma Grids Found**:
`;

figmaGridConfigs.forEach(g => {
    report += `- **${g.name}**: ${g.details.pattern} (Count: ${g.details.count}, Gutter: ${g.details.gutterSize}, Offset: ${g.details.offset})\n`;
});

report += `
**CSS Grid Tokens Reference**:
- Col-1: ${cssTokens['columns-col-1']}
- Col-12: ${cssTokens['columns-col-12']}
- Gutter/Gap: (Implicit in grid implementation, check \`--grid-grid\`: ${cssTokens['grid-grid']})

## Color Discrepancies
> User Request: Colors need update/reference fixes

### Potential Outdated CSS Colors (Zombies)
These colors exist in CSS but were not found in the scanned Figma nodes (Colors & Elevations).
*(Top 20 shown)*
`;

zombies.slice(0, 20).forEach(z => {
    report += `- \`--${z.name}\`: ${z.value}\n`;
});

report += `
### Unit Verification
> User Request: Ignore Display 4 (shouldn't exist)
- \`--font-family-display-display-4\`: ${cssTokens['font-family-display-display-4'] ? 'EXISTS (Needs Removal)' : 'NOT FOUND (Good)'}
- \`--font-size-display-display-4\`: ${cssTokens['font-size-display-display-4'] || 'N/A'}

`;

fs.writeFileSync('figma_data_verification_report.md', report);
console.log('Report generated at figma_data_verification_report.md');
