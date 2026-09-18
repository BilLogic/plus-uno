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

import { documents } from './lib/corpus.mjs';
import { byRoot, isEntry, main } from './lib/findings.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DS_ROOT = (repoRoot) => path.join(repoRoot, 'design-system', 'src');
const FIGMA_DIR = (repoRoot) => path.join(repoRoot, 'design-system', 'figma');
const OUT_MD = 'design-system/figma/component-figma-links.md';

const FIGMA_LINK_RE = /figmaLink\s*=\s*["']([^"']+)["']/;

const DOCS_COLUMNS = ['Group', 'Component', 'Node ID', 'Figma link'];
const VARIANT_COLUMNS = ['Group', 'Component', 'Style / variant', 'Node ID', 'Figma link', 'Status'];

function componentNameFromMdx(dsRoot, mdxAbsPath) {
    const rel = path.relative(dsRoot, mdxAbsPath).replace(/\\/g, '/');
    const parts = rel.replace(/\.mdx$/, '').split('/');
    if (parts[0] === 'forms' && parts[1] === 'DatePicker') return 'DatePicker';
    if (parts[0] === 'forms' && parts[1] === 'InputGroup') return 'InputGroup';
    return parts[parts.length - 1];
}

function groupFromMdxPath(dsRoot, mdxAbsPath) {
    const rel = path.relative(dsRoot, mdxAbsPath).replace(/\\/g, '/');
    if (rel.startsWith('forms/')) return 'Forms';
    if (rel.startsWith('components/')) return 'Components';
    if (rel.startsWith('DataViz/')) return 'DataViz';
    return 'Other';
}

/** Every authored `.mdx` under `dir`, absolute — the corpus's walk (#503). */
function walkMdxFiles(dir) {
    return documents('.', { root: dir, ext: ['.mdx'] })
        .filter((rel) => !/ \d+\.mdx$/.test(rel))
        .map((rel) => path.join(dir, rel));
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
function buildRowSetsFromMdx(dsRoot) {
    const docsRows = [];
    const variantRows = [];
    const groupOrder = { Components: 0, Forms: 1, DataViz: 2, Other: 3 };

    const mdxFiles = walkMdxFiles(dsRoot)
        .map((mdxPath) => {
            const content = fs.readFileSync(mdxPath, 'utf8');
            const figmaMeta = extractFigmaMeta(content);
            if (!figmaMeta) return null;
            const figmaLinkMatch = content.match(FIGMA_LINK_RE);
            return {
                mdxPath,
                name: componentNameFromMdx(dsRoot, mdxPath),
                group: groupFromMdxPath(dsRoot, mdxPath),
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

/**
 * The would-be bytes of the one generated artifact, rendered and not written.
 *
 * Same split as `scripts/generate-check-scripts.mjs`: rendering is one
 * function, the comparison below is another, and the writing happens only in
 * the CLI entry. A `--check` that regenerated its own target would answer "is
 * the committed file stale?" with the bytes it had just written.
 *
 * @returns {{file: string, content: string}[]}
 */
export const artifacts = byRoot((repoRoot) => {
    const { docsRows, variantRows, componentCount } = buildRowSetsFromMdx(DS_ROOT(repoRoot));
    return [
        {
            file: OUT_MD,
            content: toMarkdown(docsRows, variantRows, componentCount),
            counts: { docs: docsRows.length, variants: variantRows.length },
        },
    ];
});

/**
 * The drift check. Reports and never writes.
 *
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT } = {}) {
    const found = [];
    for (const { file, content } of artifacts(repoRoot)) {
        const abs = path.join(repoRoot, file);
        const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
        if (current !== content) {
            found.push({ message: `${path.basename(file)} is stale. Run \`npm run generate:figma-links\`.` });
        }
    }
    return found;
}

/** The green line, which carries what the artifact was measured to hold. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
    const [{ file, counts }] = artifacts(repoRoot);
    return `${path.basename(file)} up to date (${counts.docs} docs-page + ${counts.variants} variant entries).`;
}

// As in the other generators: the default branch here is the write, not the
// gate, so `main()` is asked for only the `--check` half and the entry
// comparison comes from the module that owns it (#610).
if (isEntry(import.meta.url)) {
    if (process.argv.includes('--check')) {
        main(import.meta.url, 'check:figma-links', { run, summary });
    } else {
        // The write path, unchanged: the artifact is rewritten every run, because
        // this half is the generator and not the guard.
        const [{ file, content, counts }] = artifacts(REPO_ROOT);
        fs.mkdirSync(FIGMA_DIR(REPO_ROOT), { recursive: true });
        fs.writeFileSync(path.join(REPO_ROOT, file), content);
        console.log(
            `Wrote ${counts.docs} docs-page + ${counts.variants} variant entries → ${file}`
        );
    }
}
