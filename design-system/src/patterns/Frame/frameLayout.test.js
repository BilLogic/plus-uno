import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveFrameLayout, dockedPanelMax, FRAME_LAYOUT, clamp } from './frameLayout';

const byDefault = { open: true, setBy: 'default' };
const byHand = { open: true, setBy: 'hand' };
const closedByHand = { open: false, setBy: 'hand' };

const resolve = (over) => {
    const frameWidth = over?.frameWidth ?? 1440;
    const r = resolveFrameLayout({ frameWidth, ...over });
    // The content width, derived here from what the Frame draws (the resolver does not return it).
    const raw = frameWidth
        - (r.sidebar === 'docked' ? FRAME_LAYOUT.sidebarWidth : 0)
        - (r.panel === 'docked' ? r.panelWidth : 0)
        - FRAME_LAYOUT.pagePad * 2;
    return { ...r, contentWidth: Math.min(FRAME_LAYOUT.contentCap, raw) };
};

describe('constants', () => {
    it('carry the spec numbers', () => {
        expect(FRAME_LAYOUT).toMatchObject({
            sidebarWidth: 240,
            pagePad: 24,
            contentFloor: 720,
            contentCap: 1232,
            splitFloor: 960,
            dockMin: 1024,
            fullWidthBelow: 768,
        });
    });
});

describe('no Panel (content width)', () => {
    it.each([
        // frame, sidebar request, sidebar, content
        [767, byDefault, 'collapsed', 719],
        [768, byDefault, 'collapsed', 720],
        [1023, byDefault, 'collapsed', 975],
        [1024, byDefault, 'docked', 736],
        [1167, byDefault, 'docked', 879],
        [1440, byDefault, 'docked', 1152],
        [1520, byDefault, 'docked', 1232],
        [1648, byDefault, 'docked', 1232],
        [1440, closedByHand, 'collapsed', 1232],
    ])('frame %i, %j: sidebar %s, content %i', (frameWidth, sidebar, state, content) => {
        const r = resolve({ frameWidth, sidebar });
        expect(r.sidebar).toBe(state);
        expect(r.contentWidth).toBe(content);
        expect(r.panel).toBe('none');
    });

    it('caps content at 1232 from 1520', () => {
        expect(resolve({ frameWidth: 1519 }).contentWidth).toBe(1231);
        expect(resolve({ frameWidth: 1520 }).contentWidth).toBe(1232);
    });
});

describe('Sidebar under 1024', () => {
    it('never docks by default', () => {
        expect(resolve({ frameWidth: 1023, sidebar: byDefault }).sidebar).toBe('collapsed');
    });
    it('opened by hand is an overlay without a Blanket, never docked', () => {
        const r = resolve({ frameWidth: 1023, sidebar: byHand });
        expect(r.sidebar).toBe('overlay');
        expect(r.blanket).toBe(false);
        expect(r.contentWidth).toBe(975);
    });
    it('peeks on hover when collapsed, without a Blanket', () => {
        const r = resolve({ frameWidth: 900, sidebar: byDefault, sidebarPeek: true });
        expect(r.sidebar).toBe('peeking');
        expect(r.blanket).toBe(false);
    });
    it('does not peek while docked', () => {
        expect(resolve({ frameWidth: 1440, sidebarPeek: true }).sidebar).toBe('docked');
    });
});

describe('Panel thresholds, Sidebar by default', () => {
    // [panel width, frame, sidebar, panel state, content]
    it.each([
        // 400: both docked from 1408, Panel alone from 1168
        [400, 1648, 'docked', 'docked', 960],
        [400, 1520, 'docked', 'docked', 832],
        [400, 1408, 'docked', 'docked', 720],
        [400, 1407, 'collapsed', 'docked', 959],
        [400, 1168, 'collapsed', 'docked', 720],
        [400, 1167, 'docked', 'overlay', 879],
        [400, 1024, 'docked', 'overlay', 736],
        // 320: 1328 / 1088
        [320, 1328, 'docked', 'docked', 720],
        [320, 1327, 'collapsed', 'docked', 959],
        [320, 1088, 'collapsed', 'docked', 720],
        [320, 1087, 'docked', 'overlay', 799],
        // 640: 1648 / 1408
        [640, 1648, 'docked', 'docked', 720],
        [640, 1647, 'collapsed', 'docked', 959],
        [640, 1408, 'collapsed', 'docked', 720],
        [640, 1407, 'docked', 'overlay', 1119],
    ])('Panel %i at frame %i: Sidebar %s, Panel %s, content %i', (panelWidth, frameWidth, sidebar, panel, content) => {
        const r = resolve({ frameWidth, panelWidth, chatMode: 'panel', sidebar: byDefault });
        expect(r.sidebar).toBe(sidebar);
        expect(r.panel).toBe(panel);
        expect(r.contentWidth).toBe(content);
        expect(r.panelWidth).toBe(panelWidth);
        expect(r.blanket).toBe(panel === 'overlay');
    });

    it('collapses the default Sidebar one pixel under 1408, and docks it at 1408', () => {
        expect(resolve({ frameWidth: 1407, chatMode: 'panel' }).sidebar).toBe('collapsed');
        expect(resolve({ frameWidth: 1408, chatMode: 'panel' }).sidebar).toBe('docked');
    });

    it('restores the Sidebar when the Panel closes', () => {
        expect(resolve({ frameWidth: 1407, chatMode: 'popup' }).sidebar).toBe('docked');
    });
});

describe('Panel with the Sidebar opened by hand', () => {
    it('wins over the Panel when both do not fit: Panel goes to overlay', () => {
        const r = resolve({ frameWidth: 1407, chatMode: 'panel', sidebar: byHand });
        expect(r.sidebar).toBe('docked');
        expect(r.panel).toBe('overlay');
        expect(r.blanket).toBe(true);
    });
    it('both dock when they fit', () => {
        const r = resolve({ frameWidth: 1408, chatMode: 'panel', sidebar: byHand });
        expect(r.sidebar).toBe('docked');
        expect(r.panel).toBe('docked');
    });
    it('a Sidebar closed by hand leaves room: Panel docks from 1168', () => {
        expect(resolve({ frameWidth: 1168, chatMode: 'panel', sidebar: closedByHand }).panel).toBe('docked');
        expect(resolve({ frameWidth: 1167, chatMode: 'panel', sidebar: closedByHand }).panel).toBe('overlay');
    });
});

describe('Panel under 1024 and under 768', () => {
    it('caps at 320 and opens as overlay under 1024', () => {
        const r = resolve({ frameWidth: 1023, panelWidth: 640, chatMode: 'panel' });
        expect(r.panel).toBe('overlay');
        expect(r.panelWidth).toBe(320);
        expect(r.blanket).toBe(true);
    });
    it('takes the full width under 768', () => {
        const r = resolve({ frameWidth: 767, panelWidth: 400, chatMode: 'panel' });
        expect(r.panel).toBe('overlay');
        expect(r.panelWidth).toBe(767);
    });
    it('is 320 at exactly 768', () => {
        expect(resolve({ frameWidth: 768, chatMode: 'panel' }).panelWidth).toBe(320);
    });
    it('is one overlay at a time: the Panel keeps it, the Sidebar collapses', () => {
        const r = resolve({ frameWidth: 900, chatMode: 'panel', sidebar: byHand });
        expect(r.panel).toBe('overlay');
        expect(r.sidebar).toBe('collapsed');
    });
});

describe('Panel width is clamped to 320..640', () => {
    it('clamps a stray value', () => {
        expect(resolve({ frameWidth: 1648, chatMode: 'panel', panelWidth: 900 }).panelWidth).toBe(640);
        expect(resolve({ frameWidth: 1648, chatMode: 'panel', panelWidth: 100 }).panelWidth).toBe(320);
    });
});

describe('chat mode', () => {
    it('only the panel mode shows the Panel', () => {
        expect(resolve({ chatMode: 'popup' }).panel).toBe('none');
        expect(resolve({ chatMode: 'fullscreen' }).panel).toBe('none');
        expect(resolve({ chatMode: 'panel' }).panel).toBe('docked');
    });
});

describe('List and detail', () => {
    it('holds the split from 960 content', () => {
        expect(resolve({ frameWidth: 1440, listDetail: true }).splitHolds).toBe(true); // 1152
        expect(resolve({ frameWidth: 1248, listDetail: true }).splitHolds).toBe(true); // 960
        expect(resolve({ frameWidth: 1247, listDetail: true }).splitHolds).toBe(false); // 959
    });
    it('is off when List and detail is off', () => {
        expect(resolve({ frameWidth: 1440, listDetail: false }).splitHolds).toBe(false);
    });
    it('collapses the Sidebar first to keep the split when the Panel opens', () => {
        // 1440 - 400 - 48 = 992 (Sidebar docked would be 752)
        const r = resolve({ frameWidth: 1440, chatMode: 'panel', listDetail: true });
        expect(r.sidebar).toBe('collapsed');
        expect(r.panel).toBe('docked');
        expect(r.contentWidth).toBe(992);
        expect(r.splitHolds).toBe(true);
    });
    it('without List and detail the same frame keeps both docked', () => {
        const r = resolve({ frameWidth: 1440, chatMode: 'panel', listDetail: false });
        expect(r.sidebar).toBe('docked');
        expect(r.panel).toBe('docked');
        expect(r.contentWidth).toBe(752);
    });
    it('does not collapse a Sidebar opened by hand: the split gives way', () => {
        const r = resolve({ frameWidth: 1440, chatMode: 'panel', listDetail: true, sidebar: byHand });
        expect(r.sidebar).toBe('docked');
        expect(r.panel).toBe('docked');
        expect(r.splitHolds).toBe(false);
    });
    it('gives way when even a collapsed Sidebar leaves under 960', () => {
        // 1300 - 400 - 48 = 852
        const r = resolve({ frameWidth: 1300, chatMode: 'panel', listDetail: true });
        expect(r.panel).toBe('docked');
        expect(r.contentWidth).toBe(852);
        expect(r.splitHolds).toBe(false);
    });
    it('does not auto-collapse for the split when no Panel is docked', () => {
        const r = resolve({ frameWidth: 1100, listDetail: true });
        expect(r.sidebar).toBe('docked');
        expect(r.splitHolds).toBe(false);
    });
});

describe('docked Panel maximum (the splitter)', () => {
    it('keeps the 720 floor when no split holds', () => {
        // 1440 - 240 - 48 - 720 = 432
        expect(dockedPanelMax({ frameWidth: 1440, sidebarDocked: true, splitHolds: false })).toBe(432);
    });
    it('keeps 960 while a split holds, so a drag never breaks it', () => {
        // 1440 - 0 - 48 - 960 = 432
        expect(dockedPanelMax({ frameWidth: 1440, sidebarDocked: false, splitHolds: true })).toBe(432);
        // 1600 - 48 - 960 = 592 (floor-only would allow 640)
        expect(dockedPanelMax({ frameWidth: 1600, sidebarDocked: false, splitHolds: true })).toBe(592);
    });
    it('stays inside the Panel range', () => {
        expect(dockedPanelMax({ frameWidth: 3000, sidebarDocked: false, splitHolds: true })).toBe(640);
        expect(dockedPanelMax({ frameWidth: 1100, sidebarDocked: true, splitHolds: true })).toBe(320);
    });
    it('resolves a split that holds at the maximum', () => {
        const max = dockedPanelMax({ frameWidth: 1600, sidebarDocked: false, splitHolds: true });
        const r = resolve({ frameWidth: 1600, chatMode: 'panel', listDetail: true, panelWidth: max });
        expect(r.splitHolds).toBe(true);
    });
});

describe('the Blanket', () => {
    it('is true only for an overlay Panel', () => {
        for (const frameWidth of [900, 1023, 1024, 1167, 1407, 1440]) {
            for (const sidebar of [byDefault, byHand, closedByHand]) {
                for (const chatMode of ['popup', 'panel', 'fullscreen']) {
                    const r = resolve({ frameWidth, sidebar, chatMode });
                    expect(r.blanket, `${frameWidth} ${sidebar.setBy} ${sidebar.open} ${chatMode}`).toBe(r.panel === 'overlay');
                }
            }
        }
    });
});

describe('outputs', () => {
    it('are exactly the ones the Frame reads', () => {
        expect(Object.keys(resolveFrameLayout({ frameWidth: 1440 })).sort())
            .toEqual(['blanket', 'panel', 'panelWidth', 'sidebar', 'splitHolds']);
    });
});

describe('clamp', () => {
    it('is the one clamp', () => {
        expect(clamp(5, 10, 20)).toBe(10);
        expect(clamp(25, 10, 20)).toBe(20);
        expect(clamp(15, 10, 20)).toBe(15);
    });
});

describe('FRAME_LAYOUT against the token source', () => {
    const tokenDir = join(dirname(fileURLToPath(import.meta.url)), '../../tokens');
    const decls = new Map();
    const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.name.endsWith('.scss')) {
                for (const m of readFileSync(full, 'utf8').matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)) decls.set(m[1], m[2].trim());
            }
        }
    };
    walk(tokenDir);
    const px = (name) => {
        const raw = decls.get(name);
        if (raw === undefined) throw new Error(`token ${name} not found`);
        const ref = raw.match(/^var\((--[\w-]+)\)$/);
        if (ref) return px(ref[1]);
        const n = raw.match(/^(-?[\d.]+)px$/);
        if (!n) throw new Error(`token ${name} is not a px length: ${raw}`);
        return Number(n[1]);
    };
    it.each([
        ['sidebarWidth', '--frame-sidebar-width'],
        ['pagePad', '--page-pad'],
        ['panelMin', '--panel-min-width'],
        ['panelDefault', '--panel-width-default'],
        ['panelMax', '--panel-max-width'],
    ])('%s matches %s', (key, token) => {
        expect(FRAME_LAYOUT[key]).toBe(px(token));
    });
});
