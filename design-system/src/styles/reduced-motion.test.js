import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Reduced motion fades, never cuts: the token layer maps every spatial semantic to
 * the appearance.fast fade, so no stylesheet may switch transitions or animations
 * off wholesale. Loops are the exception: each stops in its own block.
 */
const SRC = join(__dirname, '..');
const read = (path) => readFileSync(join(SRC, path), 'utf8');
const reducedBlocks = (css) => css.split('@media (prefers-reduced-motion: reduce)').slice(1);

describe('reduced motion', () => {
    it('main.scss keeps scroll-behavior and leaves transitions and animations to the token layer', () => {
        const blocks = reducedBlocks(read('styles/main.scss'));
        expect(blocks.join('\n')).toMatch(/scroll-behavior:\s*auto/);
        for (const block of blocks) {
            const body = block.slice(0, block.indexOf('}'));
            expect(body).not.toMatch(/\btransition:\s*none/);
            expect(body).not.toMatch(/\banimation:\s*none/);
        }
    });

    it('Section leaves its detail trigger and chevron to the token layer', () => {
        expect(read('templates/Section/Section.scss')).not.toMatch(/prefers-reduced-motion/);
    });

    it('Frame fades its Sidebar and Panel under reduced motion instead of cutting', () => {
        const css = read('templates/Frame/Frame.scss');
        const mixin = css.slice(css.indexOf('@mixin frame-space-motion'), css.indexOf('.plus-frame__sidebar--docked { @include'));
        expect(mixin).not.toMatch(/animation:\s*none/);
        expect(mixin).toMatch(/\[data-reduced='true'\]\[data-entering='true'\][^{]*\{\s*animation:\s*plus-overlay-fade var\(--ds-motion-appearance-fast-duration\)/);
        expect(mixin).toMatch(/\[data-reduced='true'\]\[data-leaving='true'\][^{]*\{[^}]*animation:\s*plus-overlay-fade-out var\(--ds-motion-appearance-fast-duration\)[^;]*forwards/);
    });

    it.each([
        'components/loading/Skeleton/Skeleton.scss',
        'components/loading/Spinner/Spinner.scss',
        'components/loading/ProgressBar/ProgressBar.scss',
        'components/labels/Tag/Tag.scss',
        'components/ai/GenerativeBorder/GenerativeBorder.scss',
        'components/ai/AiMessage/AiMessage.scss',
        'components/forms-and-inputs/_internal/Listbox.scss',
        'components/forms-and-inputs/SearchField/SearchField.scss',
    ])('%s stops its loop in its own reduced-motion block', (path) => {
        const blocks = reducedBlocks(read(path));
        expect(blocks.some((block) => /animation:\s*none/.test(block.slice(0, 400)))).toBe(true);
    });

    it.each([
        ['components/loading/ProgressRing/ProgressRing.scss', /transition:\s*none/],
        ['components/status-indicators/ProgressIndicator/ProgressIndicator.scss', /transform:\s*none/],
    ])('%s still holds its fill still in its own reduced-motion block', (path, rule) => {
        expect(reducedBlocks(read(path)).some((block) => rule.test(block.slice(0, 400)))).toBe(true);
    });
});
