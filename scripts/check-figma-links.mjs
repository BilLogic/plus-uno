#!/usr/bin/env node
/* Audit Figma node IDs across Admin + Training MDX docs.
 *
 * Per component directory:
 *   - "source ID" = the node ID buried in the stories.jsx / *.jsx docs
 *     description for that component (the canonical reference Figma added
 *     to the file).
 *   - "mdx ID" = the node ID in the ResourcesBlock `figmaLink` prop of the
 *     MDX doc in that directory.
 *
 * Reports MISMATCH / MISSING-MDX / NO-SOURCE-ID rows.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const roots = [
    'design-system/src/specs/Admin',
    'design-system/src/specs/Training',
    'design-system/src/specs/Universal',
];

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
}

const figmaIdRe = /(?:node-id|Figma Node|Node ID|node id|Figma Specs?)[=:\s"*-]+([0-9]+[-:][0-9]+)/gi;
const norm = id => id.replace(':', '-');

const sourceIdsByDir = {};
const mdxByDir = {};

for (const rel of roots) {
    const root = path.join(repoRoot, rel);
    for (const f of walk(root)) {
        const isMdx = f.endsWith('.mdx');
        const isStory = f.endsWith('.stories.jsx');
        const isJsx = f.endsWith('.jsx');
        if (!isMdx && !isStory && !isJsx) continue;

        const src = fs.readFileSync(f, 'utf8');
        const dir = path.dirname(f);

        if (isMdx) {
            const m = /figmaLink="[^"]*node-id=([0-9]+-[0-9]+)/.exec(src);
            const mdxId = m ? norm(m[1]) : null;
            mdxByDir[dir] = { file: f, id: mdxId };
        } else {
            const ids = new Set();
            let m;
            while ((m = figmaIdRe.exec(src)) !== null) ids.add(norm(m[1]));
            if (ids.size > 0) {
                if (!sourceIdsByDir[dir]) sourceIdsByDir[dir] = new Set();
                ids.forEach(id => sourceIdsByDir[dir].add(id));
            }
        }
    }
}

const dirs = new Set([...Object.keys(mdxByDir), ...Object.keys(sourceIdsByDir)]);
const sortedDirs = Array.from(dirs).sort();

let mismatchCount = 0;
let missingMdxCount = 0;
let noSourceCount = 0;
let okCount = 0;

for (const dir of sortedDirs) {
    const sourceSet = sourceIdsByDir[dir];
    const mdx = mdxByDir[dir];
    const rel = path.relative(path.join(repoRoot, 'design-system/src/specs'), dir);

    if (!mdx) {
        if (sourceSet) {
            console.log(`MISSING-MDX  ${rel}`);
            console.log(`             source:  ${Array.from(sourceSet).join(', ')}`);
            missingMdxCount++;
        }
        continue;
    }
    if (!sourceSet) {
        console.log(`NO-SOURCE-ID ${rel}`);
        console.log(`             mdx:     ${mdx.id || '(none)'}`);
        noSourceCount++;
        continue;
    }
    if (sourceSet.has(mdx.id)) {
        okCount++;
        continue;
    }
    console.log(`MISMATCH     ${rel}`);
    console.log(`             mdx:     ${mdx.id || '(none)'}`);
    console.log(`             source:  ${Array.from(sourceSet).join(', ')}`);
    mismatchCount++;
}

console.log(
    `\nSummary: ${okCount} OK, ${mismatchCount} MISMATCH, ${missingMdxCount} MISSING-MDX, ${noSourceCount} NO-SOURCE-ID`,
);
