/**
 * Generate component-figma-links.md from Storybook component MDX files.
 *
 * Source of truth: each component MDX declares
 *   export const figmaMeta = { fileKey, sets: [...] };
 *   <ResourcesBlock figmaLink="..." ... />
 *
 * Emits one generated artifact (DO NOT EDIT BY HAND):
 *   design-system/figma/component-figma-links.md   (docs-page + style/variant tables)
 *
 * Usage:
 *   node scripts/generate-figma-links-spreadsheet.js          (write)
 *   node scripts/generate-figma-links-spreadsheet.js --check  (CI: fail if stale)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DS_ROOT = path.join(REPO_ROOT, 'design-system', 'src');
const FIGMA_DIR = path.join(REPO_ROOT, 'design-system', 'figma');
const OUT_MD = path.join(FIGMA_DIR, 'component-figma-links.md');

const FIGMA_LINK_RE = /figmaLink\s*=\s*["']([^"']+)["']/;

const DOCS_COLUMNS = ['Group', 'Component', 'Node ID', 'Figma link'];
const VARIANT_COLUMNS = ['Group', 'Component', 'Style / variant', 'Node ID', 'Figma link', 'Status'];

function componentNameFromMdx(mdxAbsPath) {
    const rel = path.relative(DS_ROOT, mdxAbsPath).replace(/\\/g, '/');
    const parts = rel.replace(/\.mdx$/, '').split('/');
    if (parts[0] === 'forms' && parts[1] === 'DatePicker') return 'DatePicker';
    if (parts[0] === 'forms' && parts[1] === 'InputGroup') return 'InputGroup';
    return parts[parts.length - 1];
}

function groupFromMdxPath(mdxAbsPath) {
    const rel = path.relative(DS_ROOT, mdxAbsPath).replace(/\\/g, '/');
    if (rel.startsWith('forms/')) return 'Forms';
    if (rel.startsWith('components/')) return 'Components';
    if (rel.startsWith('DataViz/')) return 'DataViz';
    return 'Other';
}

function walkMdxFiles(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkMdxFiles(full, acc);
        else if (entry.name.endsWith('.mdx') && !/ \d+\.mdx$/.test(entry.name)) acc.push(full);
    }
    return acc;
}

function extractFigmaMeta(content) {
    const m = content.search(/export\s+const\s+figmaMeta\s*=/);
    if (m === -1) return null;
    const braceStart = content.indexOf('{', m);
    if (braceStart === -1) return null;
    let depth = 0;
    let inStr = false;
    let end = -1;
    for (let i = braceStart; i < content.length; i++) {
        const ch = content[i];
        if (inStr) {
            if (ch === '\\') i++;
            else if (ch === '"') inStr = false;
        } else if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    if (end === -1) return null;
    try {
        return JSON.parse(content.slice(braceStart, end + 1));
    } catch (err) {
        throw new Error(`Failed to parse figmaMeta: ${err.message}`);
    }
}

function figmaUrl(set, fileKey) {
    if (set.url) return set.url;
    const node = set.componentSetNodeId || set.nodeId;
    if (!fileKey || !node) return '';
    return `https://www.figma.com/design/${fileKey}/?node-id=${String(node).replace(':', '-')}`;
}

function nodeIdFromUrl(url = '') {
    const m = url.match(/node-id=([0-9]+)-([0-9]+)/);
    return m ? `${m[1]}:${m[2]}` : '';
}

function sortRows(rows, groupOrder) {
    rows.sort((a, b) => {
        const g = (groupOrder[a.Group] ?? 9) - (groupOrder[b.Group] ?? 9);
        if (g !== 0) return g;
        const c = a.Component.localeCompare(b.Component);
        if (c !== 0) return c;
        return (a['Style / variant'] || '').localeCompare(b['Style / variant'] || '');
    });
    return rows;
}

/** Read all component MDX files and split into docs-page vs style/variant rows. */
function buildRowSetsFromMdx() {
    const docsRows = [];
    const variantRows = [];
    const groupOrder = { Components: 0, Forms: 1, DataViz: 2, Other: 3 };

    const mdxFiles = walkMdxFiles(DS_ROOT)
        .map((mdxPath) => {
            const content = fs.readFileSync(mdxPath, 'utf8');
            const figmaMeta = extractFigmaMeta(content);
            if (!figmaMeta) return null;
            const figmaLinkMatch = content.match(FIGMA_LINK_RE);
            return {
                mdxPath,
                name: componentNameFromMdx(mdxPath),
                group: groupFromMdxPath(mdxPath),
                figmaMeta,
                docsPageUrl: figmaLinkMatch ? figmaLinkMatch[1] : null,
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const { name, group, figmaMeta, docsPageUrl } of mdxFiles) {
        const fileKey = figmaMeta.fileKey || '';
        const sets = figmaMeta.sets || [];

        if (docsPageUrl) {
            docsRows.push({
                Group: group,
                Component: name,
                'Node ID': nodeIdFromUrl(docsPageUrl),
                'Figma link': docsPageUrl,
            });
        }

        for (const set of sets) {
            if ((set.status || '') === 'docs-page') continue;
            variantRows.push({
                Group: group,
                Component: name,
                'Style / variant': set.name || set.id || '',
                'Node ID': set.componentSetNodeId || set.nodeId || '',
                'Figma link': figmaUrl(set, fileKey),
                Status: set.status || '',
            });
        }
    }

    return {
        docsRows: sortRows(docsRows, groupOrder),
        variantRows: sortRows(variantRows, groupOrder),
        componentCount: mdxFiles.length,
    };
}

function mdCell(value) {
    return String(value ?? '').replace(/\|/g, '\\|');
}

function markdownTable(rows, columns) {
    const header = [
        `| ${columns.join(' | ')} |`,
        `| ${columns.map(() => '---').join(' | ')} |`,
    ];
    const body = rows.map((row) => {
        const cells = columns.map((col) => {
            if (col === 'Figma link' && row[col]) return `[Open](${row[col]})`;
            if (col === 'Node ID' && row[col]) return `\`${row[col]}\``;
            return mdCell(row[col]);
        });
        return `| ${cells.join(' | ')} |`;
    });
    return header.concat(body).join('\n');
}

function toMarkdown(docsRows, variantRows, componentCount) {
    return [
        '<!-- GENERATED FILE — DO NOT EDIT BY HAND.',
        '     Run `npm run generate:figma-links` to regenerate.',
        '     Source: component MDX files (`figmaMeta` + `ResourcesBlock` `figmaLink`) -->',
        '',
        '# Component Figma Links',
        '',
        'Consolidated reference of every component design system Figma node.',
        `${docsRows.length} docs-page links + ${variantRows.length} style/variant entries across ${componentCount} components.`,
        'Links may span multiple Figma files — see the Figma link column per row.',
        '',
        '## Docs pages (Resources → Figma)',
        '',
        'The Figma link used by each Storybook docs page **Resources** card (`ResourcesBlock` `figmaLink`).',
        '',
        markdownTable(docsRows, DOCS_COLUMNS),
        '',
        '## Styles / variants',
        '',
        'Individual Figma component sets mapped to each component style or variant (`figmaMeta.sets`).',
        '',
        markdownTable(variantRows, VARIANT_COLUMNS),
        '',
    ].join('\n');
}

function main() {
    const check = process.argv.includes('--check');
    const { docsRows, variantRows, componentCount } = buildRowSetsFromMdx();
    const md = toMarkdown(docsRows, variantRows, componentCount);

    if (check) {
        const currentMd = fs.existsSync(OUT_MD) ? fs.readFileSync(OUT_MD, 'utf8') : '';
        if (currentMd !== md) {
            console.error('✗ component-figma-links.md is stale. Run `npm run generate:figma-links`.');
            process.exit(1);
        }
        console.log(
            `✓ component-figma-links.md up to date (${docsRows.length} docs-page + ${variantRows.length} variant entries).`
        );
        return;
    }

    fs.mkdirSync(FIGMA_DIR, { recursive: true });
    fs.writeFileSync(OUT_MD, md);
    console.log(
        `Wrote ${docsRows.length} docs-page + ${variantRows.length} variant entries → ${path.relative(REPO_ROOT, OUT_MD)}`
    );
}

main();
