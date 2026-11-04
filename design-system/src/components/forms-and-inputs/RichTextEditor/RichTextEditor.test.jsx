import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RichTextEditor from './RichTextEditor';

describe('RichTextEditor spacing', () => {
    it('marks compact spacing and leaves default unmarked', () => {
        const compact = render(<RichTextEditor label="Notes" spacing="compact" />);
        expect(compact.container.querySelector('.plus-rich-text-editor--compact')).not.toBeNull();
        const base = render(<RichTextEditor label="Notes" />);
        expect(base.container.querySelector('.plus-rich-text-editor--compact')).toBeNull();
    });

    it('no longer draws a size class', () => {
        const { container } = render(<RichTextEditor label="Notes" />);
        expect(container.querySelector('[class*="plus-rich-text-editor-medium"]')).toBeNull();
    });
});
