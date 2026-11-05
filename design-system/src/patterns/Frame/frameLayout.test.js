import { describe, it, expect } from 'vitest';
import { resolveFrameLayout, FRAME_LAYOUT } from './frameLayout';

const byDefault = { open: true, setBy: 'default' };
const byHand = { open: true, setBy: 'hand' };
const closedByHand = { open: false, setBy: 'hand' };

const resolve = (over) => resolveFrameLayout({ frameWidth: 1440, ...over });

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
    it('opened by hand is an overlay with a Blanket, never docked', () => {
        const r = resolve({ frameWidth: 1023, sidebar: byHand });
        expect(r.sidebar).toBe('overlay');
        expect(r.blanket).toBe(true);
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

    it('marks the Sidebar auto-collapsed so it can be restored', () => {
        expect(resolve({ frameWidth: 1407, chatMode: 'panel' }).sidebarAutoCollapsed).toBe(true);
        expect(resolve({ frameWidth: 1408, chatMode: 'panel' }).sidebarAutoCollapsed).toBe(false);
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
        expect(r.sidebarAutoCollapsed).toBe(false);
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
    it('the popup goes full screen under 768', () => {
        expect(resolve({ frameWidth: 767, chatMode: 'popup' }).popupFullScreen).toBe(true);
        expect(resolve({ frameWidth: 768, chatMode: 'popup' }).popupFullScreen).toBe(false);
        expect(resolve({ frameWidth: 767, chatMode: 'panel' }).popupFullScreen).toBe(false);
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
        expect(r.sidebarAutoCollapsed).toBe(true);
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
