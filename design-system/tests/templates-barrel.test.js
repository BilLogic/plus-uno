// @vitest-environment node
/**
 * The `@/templates` barrel: the new names for the coded templates, beside the
 * old `@/patterns` names, which keep working and resolve to the same component.
 */
import { describe, expect, it } from 'vitest';

import * as patterns from '@/patterns';
import * as templates from '@/templates';

describe('@/templates', () => {
    it('exports every template under its new name', () => {
        for (const name of ['Frame', 'Page', 'Section', 'Card', 'Table', 'Modal', 'Panel', 'Popup']) {
            expect(templates[name], name).toBeDefined();
        }
    });

    it('keeps the old names working, as the same components', () => {
        expect(templates.Section).toBe(patterns.PatternSection);
        expect(templates.Card).toBe(patterns.PatternCard);
        for (const name of ['Frame', 'Page', 'Table', 'Modal', 'Panel']) {
            expect(templates[name], name).toBe(patterns[name]);
        }
    });

    it('carries the parts a template is filled with', () => {
        expect(templates.PanelContainer).toBe(patterns.PanelContainer);
        expect(templates.SECTION_DETAIL_FLOOR).toBe(patterns.SECTION_DETAIL_FLOOR);
    });
});
