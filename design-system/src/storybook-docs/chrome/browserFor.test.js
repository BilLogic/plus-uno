import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { browserFor } from './browserFor';

const TEMPLATES = join(__dirname, '..', '..', 'templates');

const storyFiles = (dir) => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return storyFiles(path);
    return name.endsWith('.stories.jsx') ? [path] : [];
});

describe('browserFor: browser chrome frames full pages only', () => {
    it('draws the toolbar choice for a full page', () => {
        expect(browserFor({ fullPage: true }, { plusBrowser: 'safari' })).toBe('safari');
        expect(browserFor({ fullPage: true }, { plusBrowser: 'none' })).toBe('none');
    });

    it('draws a block bare whatever the toolbar says', () => {
        expect(browserFor({}, { plusBrowser: 'chrome' })).toBe('none');
        expect(browserFor(undefined, { plusBrowser: 'chrome' })).toBe('none');
        expect(browserFor({ fullPage: false }, { plusBrowser: 'edge' })).toBe('none');
    });

    it('lets parameters.browserFrame force one choice', () => {
        expect(browserFor({ fullPage: true, browserFrame: 'none' }, { plusBrowser: 'chrome' })).toBe('none');
        expect(browserFor({ browserFrame: 'chrome' }, { plusBrowser: 'none' })).toBe('chrome');
    });

    it('is set by no Section, Card, Table, Modal, Popup or Heading outline story', () => {
        const blocks = storyFiles(TEMPLATES).filter((file) => /\/(Section|Card|Table|Modal|Popup)\/|HeadingOutline/.test(file));
        expect(blocks.length).toBeGreaterThanOrEqual(6);
        for (const file of blocks) expect(readFileSync(file, 'utf8'), file).not.toMatch(/fullPage/);
    });

    it('is set on every Frame story and every Reference screen', () => {
        for (const file of ['Frame/Frame.stories.jsx', 'Page/ReferenceScreens.stories.jsx']) {
            expect(readFileSync(join(TEMPLATES, file), 'utf8'), file).toMatch(/export default \{[\s\S]*?parameters: \{[^}]*fullPage: true/);
        }
    });

    it('is set only where the story renders a Frame', () => {
        for (const file of storyFiles(TEMPLATES)) {
            const source = readFileSync(file, 'utf8');
            if (/fullPage/.test(source)) expect(source, file).toMatch(/<Frame\b|PageStage|InAppFrame|PanelStage|FrameStage|Demo/);
        }
    });
});
