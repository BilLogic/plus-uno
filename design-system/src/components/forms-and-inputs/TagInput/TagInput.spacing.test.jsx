import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TagInput from './TagInput';

const OPTIONS = [{ id: 'a', label: 'Algebra' }];

describe('TagInput spacing', () => {
    it('draws the compact field for spacing="compact"', () => {
        const { container } = render(<TagInput label="Topics" options={OPTIONS} spacing="compact" />);
        expect(container.querySelector('.plus-tag-input__field').className).toMatch(/compact/);
    });

    it('draws the default field otherwise', () => {
        const { container } = render(<TagInput label="Topics" options={OPTIONS} />);
        expect(container.querySelector('.plus-tag-input__field').className).not.toMatch(/compact/);
    });
});
