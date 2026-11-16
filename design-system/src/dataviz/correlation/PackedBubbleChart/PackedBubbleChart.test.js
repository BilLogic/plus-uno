import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { BRAND, CATEGORICAL } from '@/dataviz/palette';

const capturedOptions = [];

vi.mock('@/dataviz/PlusChart', () => ({
    default: ({ options }) => {
        capturedOptions.push(options);
        return React.createElement('div', { 'data-testid': 'plus-chart' });
    },
}));

import PackedBubbleChart from './PackedBubbleChart';

describe('PackedBubbleChart options', () => {
    it('sorts groups and items most-to-least by default, opts out with sort={false}, uses BRAND for one group, and carries no inline data-label transition or weight 400 override', () => {
        capturedOptions.length = 0;
        const multiData = [
            {
                name: 'Small',
                data: [
                    { name: 'Low', value: 60 },
                    { name: 'High', value: 120 },
                ],
            },
            {
                name: 'Large',
                data: [
                    { name: 'Mid', value: 150 },
                    { name: 'Top', value: 300 },
                ],
            },
        ];
        render(React.createElement(PackedBubbleChart, { data: multiData }));
        const sorted = capturedOptions.at(-1);

        expect(sorted.series.map((s) => s.name)).toEqual(['Large', 'Small']);
        expect(sorted.series[0].data.map((d) => d.name)).toEqual(['Top', 'Mid']);
        expect(sorted.series[1].data.map((d) => d.name)).toEqual(['High', 'Low']);
        expect(sorted.series.map((s) => s.color)).toEqual([CATEGORICAL[0], CATEGORICAL[1]]);
        expect(sorted.plotOptions.packedbubble.dataLabels.style?.fontWeight).not.toBe('var(--type-weight-regular)');
        expect(sorted.plotOptions.packedbubble.dataLabels.style?.transition).toBe('none');
        expect(sorted.tooltip.pointFormat).toContain(CHART_VALUE_CLASS);
        expect(sorted.tooltip.pointFormat).not.toMatch(/<b\b/i);
        expect(sorted.plotOptions.packedbubble.tooltip.pointFormat).not.toMatch(/<b\b/i);

        render(React.createElement(PackedBubbleChart, { data: multiData, sort: false }));
        const unsorted = capturedOptions.at(-1);
        expect(unsorted.series.map((s) => s.name)).toEqual(['Small', 'Large']);
        expect(unsorted.series[0].data.map((d) => d.name)).toEqual(['Low', 'High']);

        render(
            React.createElement(PackedBubbleChart, {
                data: [{ name: 'Only', data: [{ name: 'A', value: 100 }] }],
            }),
        );
        const single = capturedOptions.at(-1);
        expect(single.series[0].color).toBe(BRAND);
    });
});
