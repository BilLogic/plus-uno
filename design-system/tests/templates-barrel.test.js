// @vitest-environment node
/** The `@/templates` barrel: every coded template and the parts it is filled with. */
import { describe, expect, it } from 'vitest';

import * as templates from '@/templates';

describe('@/templates', () => {
    it('exports every template under its name', () => {
        for (const name of ['Frame', 'Page', 'Section', 'Card', 'Table', 'Modal', 'Panel', 'Popup', 'AiChat']) {
            expect(templates[name], name).toBeDefined();
        }
    });

    it('carries the parts a template is filled with', () => {
        for (const name of ['PanelContainer', 'PanelBody', 'SECTION_DETAIL_FLOOR', 'MODAL_WIDTHS', 'TABLE_KINDS']) {
            expect(templates[name], name).toBeDefined();
        }
    });

    it('does not export the old template names', () => {
        for (const name of ['Section', 'Card', 'Table'].map((name) => `Pattern${name}`)) {
            expect(templates[name], name).toBeUndefined();
        }
    });
});
