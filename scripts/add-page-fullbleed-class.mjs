#!/usr/bin/env node
/**
 * Adds the `sb-ds-component-docs--page-fullbleed` modifier class to the
 * top-level wrapper in every Admin / Training Pages MDX file so the
 * docs body widens and the embedded ResponsiveFrame is no longer clipped.
 *
 * Idempotent — running twice is a no-op.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const ROOTS = [
    'design-system/src/specs/Admin',
    'design-system/src/specs/Training',
];

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walk(full);
        } else {
            yield full;
        }
    }
}

const targets = [];
for (const root of ROOTS) {
    const abs = path.join(repoRoot, root);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
        if (!file.endsWith('.mdx')) continue;
        if (!/[\\/]Pages[\\/]/.test(file)) continue;
        targets.push(file);
    }
}

const CLASS_TO_ADD = 'sb-ds-component-docs--page-fullbleed';
let touched = 0;
for (const file of targets) {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes(CLASS_TO_ADD)) {
        continue;
    }
    const next = src.replace(
        /className="sb-ds-component-docs sb-ds-component-docs--page not-prose"/g,
        `className="sb-ds-component-docs sb-ds-component-docs--page ${CLASS_TO_ADD} not-prose"`
    );
    if (next !== src) {
        fs.writeFileSync(file, next);
        touched += 1;
        console.log('UPDATED', path.relative(repoRoot, file));
    } else {
        console.warn('SKIPPED (no matching wrapper)', path.relative(repoRoot, file));
    }
}

console.log(`\nDone — ${touched} file(s) updated, ${targets.length - touched} unchanged.`);
