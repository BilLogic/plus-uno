const fs = require('fs');
const path = require('path');

// 1. Read Codebase Tokens (SCSS)
// We'll parse the SCSS files to extract variable names and values
const tokenDir = '/Users/billguo/Library/CloudStorage/Box-Box/plus-vibe-coding-starting-kit/plus-vibe-coding-starting-kit/design-system/src/tokens';
const files = ['_colors.scss', '_fonts.scss', '_layout.scss', '_spacing_semantics.scss', '_primitives.scss'];

let codebaseTokens = {};

function parseScssFile(filename) {
    try {
        const content = fs.readFileSync(path.join(tokenDir, filename), 'utf8');
        const lines = content.split('\n');
        lines.forEach(line => {
            // Match --variable-name: value;
            const match = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
            if (match) {
                const name = match[1];
                const val = match[2].trim();
                // Filter out Display 4
                if (name.includes('display4')) return;

                codebaseTokens[name] = {
                    value: val,
                    source: filename
                };
            }
        });
    } catch (e) {
        // file might not doubt, ignore primitives if not verified
    }
}

files.forEach(parseScssFile);

// 2. Read Export CSS
const exportContent = fs.readFileSync('/Users/billguo/Downloads/figma-export.css', 'utf8');
const exportTokens = {};
exportContent.split('\n').forEach(line => {
    const match = line.match(/--([\w-]+):\s*([^;]+);/);
    if (match) {
        const name = '--' + match[1]; // ensure prefix
        const val = match[2].trim();
        // Ignore display 4
        if (name.includes('display-display-4') || name.includes('display4')) return;
        exportTokens[name] = val;
    }
});

// 3. Compare
const diffs = [];
const missingInCodebase = [];
const missingInExport = [];

// Helper to normalize values for comparison (remove spaces, lowercase)
const norm = (v) => v ? v.toLowerCase().replace(/\s/g, '').replace('pxpx', 'px') : '';

// Check Codebase vs Export
Object.keys(codebaseTokens).forEach(key => {
    // Map codebase naming convention to export naming convention if they differ
    // It seems they might differ. 
    // Codebase: --color-primary
    // Export: --primary-primary (based on earlier scan) or --color-primary?
    // Let's check keys.

    // We'll need a fuzzy match or assume keys should match.
    // If keys don't match, we report that too.

    // Try exact match first
    if (exportTokens[key]) {
        const codeVal = norm(codebaseTokens[key].value);
        const exportVal = norm(exportTokens[key]);

        // Handle variables references (var(--foo)) - hard to resolve without full graph
        // Just compare raw strings for now
        if (codeVal !== exportVal) {
            diffs.push({ name: key, current: codebaseTokens[key].value, new: exportTokens[key] });
        }
    } else {
        // Try mapping: Codebase "--color-X" vs Export "--X-X"?
        // e.g. Codebase: --color-primary
        // Export: --primary-primary

        // Let's dump a few keys to see pattern in report if this fails
        // For now, list as missing in export
        missingInExport.push(key);
    }
});

Object.keys(exportTokens).forEach(key => {
    if (!codebaseTokens[key]) {
        missingInCodebase.push({ name: key, value: exportTokens[key] });
    }
});

// Generate Report
let report = `# Token Update Analysis
Compared \`design-system/src/tokens/*.scss\` with \`figma-export.css\`

## Summary
- **Codebase Tokens**: ${Object.keys(codebaseTokens).length}
- **New Export Tokens**: ${Object.keys(exportTokens).length}

## Value Mismatches (Updates Needed)
These tokens exist in both but have different values.
`;

diffs.forEach(d => {
    report += `- **${d.name}**\n  - Current: \`${d.current}\`\n  - New: \`${d.new}\`\n`;
});

report += `
## Codebase Tokens Missing in Export
These might be custom tokens, renamed in Figma, or deleted.
`;
missingInExport.forEach(k => report += `- ${k} (${codebaseTokens[k].source})\n`);

report += `
## New Tokens in Export (Missing in Codebase)
Candidates for addition.
`;

// Group by prefix
const newGroups = {};
missingInCodebase.forEach(item => {
    const prefix = item.name.split('-')[2] || 'other';
    if (!newGroups[prefix]) newGroups[prefix] = [];
    newGroups[prefix].push(item);
});

Object.keys(newGroups).forEach(group => {
    report += `### ${group}\n`;
    newGroups[group].slice(0, 10).forEach(i => report += `- \`${i.name}\`: ${i.value}\n`);
    if (newGroups[group].length > 10) report += `... (${newGroups[group].length - 10} more)\n`;
});

fs.writeFileSync('token_diff_report.md', report);
console.log('Report generated: token_diff_report.md');
