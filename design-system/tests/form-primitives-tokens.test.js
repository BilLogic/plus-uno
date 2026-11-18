// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..', '..');

const PRIMITIVE_READ = /var\(\s*--(?:space|size|stroke|radius)-\d+/;
const RAW_UNIT = /\b\d+(?:\.\d+)?(?:px|rem)\b/;
const NUMERIC_FALLBACK = /var\(\s*--[a-z0-9-]+\s*,\s*\d+(?:\.\d+)?(?:px|rem)\s*\)/;

function stripCommentsAndSrOnly(source) {
    let text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    // Strip nested rules first so outer sr-only blocks with nested &:focus rules match cleanly.
    const withoutNested = text.replace(/&[^{}]*\{[^{}]*\}/g, '');
    return withoutNested.replace(/\{[^{}]*(?:clip:\s*rect\(0,\s*0,\s*0,\s*0\)|clip-path:\s*inset\(50%\))[^{}]*\}/g, '{}');
}

const TARGETS = [
    'design-system/src/components/forms-and-inputs/Checkbox/Checkbox.scss',
    'design-system/src/components/forms-and-inputs/DateTimePicker/DateTimePicker.scss',
    'design-system/src/components/forms-and-inputs/Radio/Radio.scss',
    'design-system/src/components/forms-and-inputs/RadioGroup/RadioGroup.scss',
    'design-system/src/components/forms-and-inputs/Range/Range.scss',
    'design-system/src/components/forms-and-inputs/Rating/Rating.scss',
    'design-system/src/components/forms-and-inputs/RichTextEditor/RichTextEditor.scss',
    'design-system/src/components/forms-and-inputs/RichTextEditor/RichTextEditor.jsx',
    'design-system/src/components/forms-and-inputs/Select/Select.scss',
    'design-system/src/components/forms-and-inputs/TagInput/TagInput.scss',
    'design-system/src/components/forms-and-inputs/Toggle/Toggle.scss',
    'design-system/src/components/forms-and-inputs/_internal/Calendar.scss',
    'design-system/src/components/forms-and-inputs/_internal/FieldBox.scss',
    'design-system/src/components/labels/AiMessage/AiMessage.scss',
    'design-system/src/components/labels/CountTag/CountTag.scss',
    'design-system/src/components/labels/Tag/Tag.scss',
    'design-system/src/components/messaging/Modal/Modal.scss',
    'design-system/src/components/overlays-and-layering/Tooltip/Tooltip.scss',
];

describe('form and remaining components read tier tokens, never primitives, fallbacks, or raw px/rem', () => {
    for (const file of TARGETS) {
        it(`${file} has no primitive token reads, numeric fallbacks, or raw px/rem literals`, () => {
            const raw = readFileSync(resolve(ROOT, file), 'utf8');
            const cleaned = stripCommentsAndSrOnly(raw);
            expect(cleaned, `${file} primitive read`).not.toMatch(PRIMITIVE_READ);
            expect(cleaned, `${file} numeric fallback`).not.toMatch(NUMERIC_FALLBACK);
            expect(cleaned, `${file} raw px/rem literal`).not.toMatch(RAW_UNIT);
        });
    }
});
