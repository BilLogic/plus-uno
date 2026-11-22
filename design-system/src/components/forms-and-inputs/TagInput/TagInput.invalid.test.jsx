import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TagInput from './TagInput';

const OPTIONS = [{ id: 'a', label: 'Session prep' }];

describe('TagInput, invalid icon', () => {
    it('draws one decorative danger icon in the box when invalid, and none when valid', () => {
        const { container, rerender } = render(<TagInput label="Topics" options={OPTIONS} />);
        expect(container.querySelector('.plus-field__invalid-icon')).toBeNull();
        rerender(<TagInput label="Topics" options={OPTIONS} isInvalid errorMessage="Pick a topic" />);
        const icons = container.querySelectorAll('.plus-field__invalid-icon');
        expect(icons).toHaveLength(1);
        expect(icons[0]).toHaveClass('fa-circle-exclamation');
        expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
        expect(icons[0].closest('.plus-field__trailing')).not.toBeNull();
    });
});
