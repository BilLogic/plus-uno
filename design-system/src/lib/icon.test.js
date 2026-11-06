import { describe, it, expect } from 'vitest';
import { iconClass, FREE_REGULAR_ICONS, ICON_SIZES } from './icon';

describe('iconClass', () => {
    it('draws regular where Free has it', () => {
        expect(iconClass('bell')).toBe('fa-regular fa-bell');
        expect(iconClass('calendar-days')).toBe('fa-regular fa-calendar-days');
    });
    it('falls back to solid where Free has no regular', () => {
        expect(iconClass('plus')).toBe('fa-solid fa-plus');
        expect(iconClass('caret-down')).toBe('fa-solid fa-caret-down');
    });
    it('leaves a full class list alone', () => {
        expect(iconClass('fa-brands fa-figma')).toBe('fa-brands fa-figma');
    });
    it('lists only current names, never a Pro-only family', () => {
        expect(FREE_REGULAR_ICONS.has('grid-2')).toBe(false);
        expect(FREE_REGULAR_ICONS.size).toBeGreaterThan(150);
    });
    it('names the three icon box tokens', () => {
        expect(Object.values(ICON_SIZES)).toEqual(['--icon-sm', '--icon-md', '--icon-lg']);
    });
});
