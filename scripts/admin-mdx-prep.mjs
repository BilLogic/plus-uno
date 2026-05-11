#!/usr/bin/env node
/* One-off helper used while migrating spec areas to per-component MDX docs.
 * Operates on .stories.jsx files under the supplied roots.
 *
 * - Replaces tags: [...] with tags: ['!dev', '!autodocs'] in the default export
 *   (and inserts a tags entry if missing)
 * - Removes any `export const Docs = { … };` block (now redundant with the MDX docs page),
 *   including the immediately-preceding JSDoc comment if present
 *
 * Usage:
 *   node scripts/admin-mdx-prep.mjs                       # defaults to specs/Admin
 *   node scripts/admin-mdx-prep.mjs design-system/src/specs/Training
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const cliRoots = process.argv.slice(2);
const adminRoots = cliRoots.length > 0
    ? cliRoots
    : ['design-system/src/specs/Admin'];

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, out);
        else if (ent.name.endsWith('.stories.jsx')) out.push(p);
    }
    return out;
}

function findDocsExportStart(src) {
    const exportIdx = src.indexOf('export const Docs = {');
    if (exportIdx === -1) return { exportIdx: -1, blockStart: -1 };
    const before = src.slice(0, exportIdx);
    const lastCommentClose = before.lastIndexOf('*/');
    let blockStart = exportIdx;
    if (lastCommentClose !== -1) {
        const between = src.slice(lastCommentClose + 2, exportIdx);
        if (/^\s*$/.test(between)) {
            const commentOpen = src.lastIndexOf('/**', lastCommentClose);
            if (commentOpen !== -1) blockStart = commentOpen;
        }
    }
    return { exportIdx, blockStart };
}

function removeDocsExport(src) {
    const { exportIdx, blockStart } = findDocsExportStart(src);
    if (exportIdx === -1) return src;
    const openBraceIdx = src.indexOf('{', exportIdx);
    let depth = 0;
    let i = openBraceIdx;
    for (; i < src.length; i++) {
        const ch = src[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) {
                i++;
                while (i < src.length && src[i] !== ';') i++;
                if (src[i] === ';') i++;
                while (i < src.length && (src[i] === '\n' || src[i] === '\r')) i++;
                break;
            }
        }
    }
    return src.slice(0, blockStart) + src.slice(i);
}

function patchTags(src) {
    const tagsRe = /(\bexport default \{[\s\S]*?)(\btags:\s*\[[^\]]*\])/m;
    const replacement = "tags: ['!dev', '!autodocs']";
    if (tagsRe.test(src)) return src.replace(tagsRe, `$1${replacement}`);
    const titleInsertRe = /(export default \{\s*\n(?:[^\n]*\n)*?[^\n]*\btitle:[^\n]*\n)/;
    if (titleInsertRe.test(src)) {
        return src.replace(titleInsertRe, `$1    tags: ['!dev', '!autodocs'],\n`);
    }
    return src;
}

let touched = 0;
for (const rel of adminRoots) {
    const root = path.join(repoRoot, rel);
    const files = walk(root);
    for (const file of files) {
        const before = fs.readFileSync(file, 'utf8');
        let after = removeDocsExport(before);
        after = patchTags(after);
        if (after !== before) {
            fs.writeFileSync(file, after);
            touched++;
            console.log('patched', path.relative(repoRoot, file));
        }
    }
}
console.log(`\nDone. ${touched} stories file(s) updated.`);
