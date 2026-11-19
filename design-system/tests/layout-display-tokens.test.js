// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..', '..');

const PRIMITIVE_READ = /var\(\s*--(?:(?:space|size|height|width|stroke|radius)-\d|palette-)/;
const RAW_UNIT = /\b\d+(?:\.\d+)?(?:px|rem)\b/;

function stripCommentsAndSafeLines(source, { allowVisuallyHidden = false, allowContainerQuery = false } = {}) {
    let text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    if (allowVisuallyHidden) {
        text = text.replace(/\.visually-hidden\s*\{[\s\S]*?\}/g, '');
    }
    if (allowContainerQuery) {
        text = text.replace(/@container\s*\([^)]*\)/g, '');
    }
    return text;
}

const TARGETS = [
    { file: 'design-system/src/patterns/Panel/Panel.scss' },
    { file: 'design-system/src/components/layout-and-structure/PageHeader/PageHeader.scss' },
    { file: 'design-system/src/patterns/PatternSection/PatternSection.scss' },
    { file: 'design-system/src/patterns/PatternSection/PatternSection.jsx' },
    { file: 'design-system/src/patterns/Table/Table.scss' },
    { file: 'design-system/src/components/text-and-data-display/Table/Table.scss' },
    { file: 'design-system/src/styles/_base.scss' },
    { file: 'design-system/src/styles/main.scss', allowVisuallyHidden: true },
    { file: 'design-system/src/components/forms-and-inputs/Comment/Comment.scss' },
    { file: 'design-system/src/components/messaging/Spotlight/Spotlight.scss' },
    { file: 'design-system/src/components/status-indicators/ProgressTracker/ProgressTracker.scss' },
    { file: 'design-system/src/components/layout-and-structure/Carousel/Carousel.scss', allowContainerQuery: true },
];

describe('layout and display components read tier tokens, never primitives or raw px/rem', () => {
    for (const target of TARGETS) {
        it(`${target.file} has no primitive token reads or raw px/rem literals`, () => {
            const raw = readFileSync(resolve(ROOT, target.file), 'utf8');
            const cleaned = stripCommentsAndSafeLines(raw, target);
            expect(cleaned, `${target.file} primitive read`).not.toMatch(PRIMITIVE_READ);
            expect(cleaned, `${target.file} raw px/rem literal`).not.toMatch(RAW_UNIT);
        });
    }
});
