import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { BRAND } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import VennDiagram from './VennDiagram';

describe('VennDiagram options', () => {
    it('sorts single sets and overlaps most-to-least by default, opts out with sort={false}, uses BRAND for a single set, and formats tooltips with tabular values', () => {
        capturedOptions.length = 0;
        const data = [
            { sets: ['Math'], value: 5, name: 'Math' },
            { sets: ['Science'], value: 4, name: 'Science' },
            { sets: ['English'], value: 8, name: 'English' },
            { sets: ['Science', 'English'], value: 1, name: 'Science & English' },
            { sets: ['Math', 'English'], value: 3, name: 'Math & English' },
        ];
        render(React.createElement(VennDiagram, { data }));
        const sorted = capturedOptions.at(-1);

        expect(sorted.series[0].data.map((d) => d.name)).toEqual([
            'English',
            'Math',
            'Science',
            'Math & English',
            'Science & English',
        ]);
        expect(sorted.plotOptions.venn.colorByPoint).toBe(true);
        expect(sorted.tooltip.headerFormat).toBe('');
        expect(sorted.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(sorted.tooltip.pointFormat).not.toMatch(/<b\b/i);

        render(React.createElement(VennDiagram, { data, sort: false }));
        const unsorted = capturedOptions.at(-1);
        expect(unsorted.series[0].data.map((d) => d.name)).toEqual([
            'Math',
            'Science',
            'English',
            'Science & English',
            'Math & English',
        ]);

        render(
            React.createElement(VennDiagram, {
                data: [{ sets: ['Math'], value: 12, name: 'Math' }],
            }),
        );
        const single = capturedOptions.at(-1);
        expect(single.plotOptions.venn.colorByPoint).toBe(false);
        expect(single.series[0].color).toBe(BRAND);
    });
});
