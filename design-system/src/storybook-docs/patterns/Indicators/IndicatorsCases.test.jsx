import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CODE } from './IndicatorsCases.jsx';
import { DangerOnMissed, RiseIsBad, RiseIsGood, SuccessOnMissed } from './IndicatorsExamples.jsx';

describe('Indicators do and don\'t examples', () => {
    it('render the words the page describes', () => {
        const { unmount } = render(<><DangerOnMissed /><SuccessOnMissed /></>);
        expect(screen.getAllByText('Missed')).toHaveLength(2);
        unmount();
        const { container } = render(<><RiseIsBad /><RiseIsGood /></>);
        expect(container.textContent).toContain('vs last week');
    });

    it('print each example from its own source', () => {
        expect(Object.keys(CODE)).toEqual(['DangerOnMissed', 'SuccessOnMissed', 'RiseIsBad', 'RiseIsGood']);
        expect(CODE.DangerOnMissed).toBe("import { StatusTag } from '@/components';\n\nconst DangerOnMissed = () => <StatusTag appearance=\"danger\">Missed</StatusTag>;");
        expect(CODE.RiseIsBad).toContain('goodDirection="down"');
    });
});
