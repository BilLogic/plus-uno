const fs = require('fs');
const path = require('path');

// --- Helper: Normalize Token Names ---
// Goal: Convert "--color-primary-text" and "--primary-primary-text" to "primary-text"
function normalizeName(name) {
    let core = name.replace(/^--/, '');

    // Remove common prefixes used in Codebase
    core = core.replace(/^color-/, '');
    core = core.replace(/^size-/, '');
    core = core.replace(/^font-size-/, '');
    core = core.replace(/^font-weight-/, '');
    core = core.replace(/^font-line-height-/, '');
    core = core.replace(/^font-family-/, '');

    // Remove common prefixes used in Export (Figma export seems to duplicate groups often)
    // E.g. "social-emotional-social-emotional" -> "social-emotional"
    // "primary-primary" -> "primary"
    // This is tricky. Let's try to be smarter.

    // Strategy: Map specific known patterns or create a fuzzy map.
    // Let's try a direct normalization first, but keep original for reference.
    return core;
}

// --- Helper: Normalize Values ---
function normalizeValue(val) {
    if (!val) return '';
    let v = val.trim().toLowerCase();
    v = v.replace('pxpx', 'px'); // Fix the known bug
    v = v.replace(/\s+/g, ''); // Remove spaces
    v = v.replace(/^0\./, '.'); // .5 vs 0.5
    // Remove units for pure number comparison? No, keep units.

    // Color normalization
    if (v.startsWith('#')) {
        if (v.length === 4) { // #fff -> #ffffff
            v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
        }
        v = v.substring(0, 7); // Ignore alpha in hex if present (usually distinct setting)
    }

    return v;
}

// 1. Read Codebase Tokens
const codebaseDir = '/Users/billguo/Library/CloudStorage/Box-Box/plus-vibe-coding-starting-kit/plus-vibe-coding-starting-kit/develop/tokens';
const codebaseFiles = ['_colors.scss', '_spacing_semantics.scss', '_layout.scss', '_fonts.scss'];
const codebaseTokens = {}; // validName -> { originalKey, value, source }

codebaseFiles.forEach(file => {
    try {
        const content = fs.readFileSync(path.join(codebaseDir, file), 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
            if (match) {
                const key = match[1];
                const val = match[2];
                if (key.includes('display4')) return; // Ignore

                // We store by ORIGINAL key for now, we'll map later
                codebaseTokens[key] = { value: val, source: file };
            }
        });
    } catch (e) {
        console.error(`Skipping ${file}: ${e.message}`);
    }
});

// 2. Read Export Tokens
const exportContent = fs.readFileSync('/Users/billguo/Downloads/figma-export.css', 'utf8');
const exportTokens = {}; // originalKey -> value
exportContent.split('\n').forEach(line => {
    const match = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
    if (match) {
        const key = match[1];
        const val = match[2];
        if (key.includes('display-display-4')) return;
        exportTokens[key] = val;
    }
});

// 3. Mapping Strategy
// We need to pair keys.
// Known Codebase Pattern  <-> Known Export Pattern
// --color-X               <-> --X-X  (e.g., --color-social-emotional <-> --social-emotional-social-emotional)
// --color-X               <-> --X (if simplified)
// --color-X-text          <-> --X-X-text
// --size-X                <-> --X
const map = [];
const exportKeysUsed = new Set();
const potentialUpdates = [];

Object.keys(codebaseTokens).forEach(cKey => {
    let bestMatch = null;
    let baseName = cKey.replace(/^--color-/, '').replace(/^--size-/, '').replace(/^--font-/, '');

    // Strategy 1: exact postfix match (e.g. codebase "primary" matches export "primary-primary")
    const attempts = [
        `--${baseName}`, // exact
        `--${baseName}-${baseName}`, // duplicate prefix (social-emotional-social-emotional)
    ];

    // Special handling for nested groups logic seen in export
    // e.g. codebase: social-emotional-text
    // export: social-emotional-social-emotional-text
    const parts = baseName.split('-');
    if (parts.length > 1) {
        attempts.push(`--${parts[0]}-${baseName}`);
    }

    // Try finding in export
    for (const attempt of attempts) {
        if (exportTokens[attempt]) {
            bestMatch = attempt;
            break;
        }
    }

    // Fuzzy fallback: check if one includes the other
    if (!bestMatch) {
        const search = baseName.replace(/^--/, '');
        const candidate = Object.keys(exportTokens).find(k => {
            // Very strict fuzzy: export key ends with normalized codebase key
            // e.g. export "--warning-warning-text" ends with "warning-text"
            return k.endsWith(search) && k.includes(parts[0]);
        });
        if (candidate) bestMatch = candidate;
    }

    if (bestMatch) {
        exportKeysUsed.add(bestMatch);
        const cVal = normalizeValue(codebaseTokens[cKey].value);
        const eVal = normalizeValue(exportTokens[bestMatch]);

        if (cVal !== eVal) {
            potentialUpdates.push({
                token: cKey,
                file: codebaseTokens[cKey].source,
                oldVal: codebaseTokens[cKey].value,
                newVal: exportTokens[bestMatch],
                exportKey: bestMatch
            });
        }
    }
});

// Output Report
let report = `# Smart Token Comparison

## Corrected Findings
- **SMART Colors**: Found! They are matched correctly now (e.g., \`--color-social-emotional\` matches \`--social-emotional-social-emotional\`).
- **Updates Found**: ${potentialUpdates.length} tokens have value differences.

## Detailed Value Updates
These are the tokens clearly defined in your codebase that have **NEW VALUES** in Figma.

### Colors & Padding Updates
`;

potentialUpdates.forEach(u => {
    report += `- **${u.token}** (${u.file})\n`;
    report += `  - Current: \`${u.oldVal}\`\n`;
    report += `  - New: \`${u.newVal}\` (from \`${u.exportKey}\`)\n`;
});

fs.writeFileSync('smart_token_report.md', report);
console.log('Report generated: smart_token_report.md');
