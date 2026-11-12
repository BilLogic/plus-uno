import { describe, it, expect } from 'vitest';
import { iconClass } from '../../../lib/icon';
import { SIDEBAR_GROUPS } from './sidebarConfig';

describe('sidebar config icons', () => {
    const icons = SIDEBAR_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item.icon]));

    it('draws every tab outlined, with brand marks as the only exception', () => {
        for (const [id, icon] of icons) {
            const classes = iconClass(icon);
            if (icon.startsWith('fa-brands ')) expect(classes, id).toContain('fa-brands');
            else expect(classes, id).toMatch(/^fa-regular /);
        }
    });

    it('uses the outlined house for Home', () => {
        expect(iconClass(icons.find(([id]) => id === 'home')[1])).toBe('fa-regular fa-house');
    });
});
