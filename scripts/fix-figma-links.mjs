#!/usr/bin/env node
/* Rewrite the `figmaLink` prop on every Admin + Training MDX `ResourcesBlock`
 * to match the canonical Figma node ID found in the corresponding component's
 * stories.jsx / source jsx. Area-level MDX files (no in-source ID) are mapped
 * to a representative child node via the AREA_OVERRIDES table.
 *
 * Also patches any inline `<strong className="text-foreground">NNN-NNN</strong>`
 * node-id callouts inside MDX descriptions when the parent component dir's
 * canonical ID is known.
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
    'design-system/src/specs/Home',
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

const RATING_PRIMARY = '63-177636';

const AREA_OVERRIDES = {
    'design-system/src/specs/Universal/Elements/SmartBadges': '83-125838',
};

const sourceIdsByDir = {};
const mdxFilesByDir = {};

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
            if (!mdxFilesByDir[dir]) mdxFilesByDir[dir] = [];
            mdxFilesByDir[dir].push(f);
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

function pickId(dir) {
    const rel = path.relative(repoRoot, dir);
    if (AREA_OVERRIDES[rel]) return AREA_OVERRIDES[rel];
    const set = sourceIdsByDir[dir];
    if (!set) return null;
    const ids = Array.from(set);
    if (ids.includes(RATING_PRIMARY)) return RATING_PRIMARY;
    return ids[0];
}

let changed = 0;
for (const [dir, files] of Object.entries(mdxFilesByDir)) {
    const canonical = pickId(dir);
    if (!canonical) {
        console.log('skip (no canonical ID):', path.relative(repoRoot, dir));
        continue;
    }
    for (const f of files) {
        let src = fs.readFileSync(f, 'utf8');
        const before = src;
        src = src.replace(
            /(figmaLink="[^"]*node-id=)([0-9]+-[0-9]+)/g,
            (m, prefix, currentId) => (currentId === canonical ? m : `${prefix}${canonical}`),
        );
        if (src !== before) {
            fs.writeFileSync(f, src);
            console.log('patched', path.relative(repoRoot, f));
            changed++;
        }
    }
}

console.log(`\nDone. ${changed} MDX file(s) updated.`);
