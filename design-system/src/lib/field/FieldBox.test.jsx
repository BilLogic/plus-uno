import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldBox } from './index';

const box = ({ elemAfter, ...props }) => render(
    <FieldBox {...props} elemAfter={elemAfter}>
        <input className="plus-field__control" aria-label="x" />
    </FieldBox>,
).container;

describe('FieldBox, invalid icon', () => {
    it("draws a decorative danger icon first in Trailing, before the host's own parts", () => {
        const container = box({ invalid: true, invalidIcon: true, elemAfter: <i data-testid="caret" className="fa-solid fa-caret-down" /> });
        const trailing = container.querySelector('.plus-field__trailing');
        expect(trailing.children).toHaveLength(2);
        expect(trailing.firstElementChild).toHaveClass('plus-field__invalid-icon', 'fa-circle-exclamation');
        expect(trailing.firstElementChild).toHaveAttribute('aria-hidden', 'true');
        expect(trailing.lastElementChild).toHaveAttribute('data-testid', 'caret');
    });

    it('draws Trailing for the icon alone when the host has no trailing parts', () => {
        const container = box({ invalid: true, invalidIcon: true });
        expect(container.querySelectorAll('.plus-field__invalid-icon')).toHaveLength(1);
    });

    it('draws none unless the host opts in, or when valid, warning, or disabled', () => {
        for (const props of [{ invalid: true }, { invalidIcon: true }, { invalidIcon: true, warning: true }, { invalidIcon: true, valid: true }, { invalid: true, invalidIcon: true, disabled: true }]) {
            expect(box(props).querySelector('.plus-field__invalid-icon')).toBeNull();
        }
    });
});
