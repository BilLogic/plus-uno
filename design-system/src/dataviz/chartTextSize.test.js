import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Highcharts keys its text-box cache on `style.fontSize`, so each chart text slot
 * needs its own real size string, read from the text role it uses. The probe reads
 * the computed size of a span styled with the role; here the computed style is
 * stubbed with the roles' sizes, since jsdom resolves no stylesheet.
 */
const SIZES = { '--body-sm': '12px', '--body-default': '14px', '--heading-lg': '24px', '--heading-md': '20px' };

const loadTheme = async () => {
    vi.resetModules();
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, ...rest) => {
        const role = el.style?.font?.match(/var\((--[\w-]+)\)/)?.[1];
        return role ? { fontSize: SIZES[role] } : real(el, ...rest);
    });
    return import('./chartTheme');
};

afterEach(() => vi.restoreAllMocks());

describe('chart text sizes', () => {
    it('reads each role once, with no probe left in the page', async () => {
        const { TEXT_SIZE, textSize } = await loadTheme();
        expect(TEXT_SIZE).toEqual({ small: '12px', base: '14px', title: '24px' });
        expect(textSize('--heading-md')).toBe('20px');
        expect(document.querySelectorAll('span[style*="visibility:hidden"]')).toHaveLength(0);
    });

    it('gives every slot a non-empty size, distinct where the sizes differ', async () => {
        const { default: theme, TEXT_SIZE } = await loadTheme();
        const slots = {
            title: theme.title.style.fontSize,
            subtitle: theme.subtitle.style.fontSize,
            caption: theme.caption.style.fontSize,
            xTick: theme.xAxis.labels.style.fontSize,
            yTick: theme.yAxis.labels.style.fontSize,
            xTitle: theme.xAxis.title.style.fontSize,
            legend: theme.legend.itemStyle.fontSize,
            dataLabels: theme.plotOptions.series.dataLabels.style.fontSize,
            tooltip: theme.tooltip.style.fontSize,
            noData: theme.noData.style.fontSize,
        };
        for (const [slot, size] of Object.entries(slots)) {
            expect(size, slot).toBeTruthy();
            expect(size, slot).not.toBe('inherit');
        }
        expect(slots.title).toBe(TEXT_SIZE.title);
        expect(slots.subtitle).toBe(TEXT_SIZE.base);
        expect(slots.tooltip).toBe(TEXT_SIZE.base);
        expect(slots.noData).toBe(TEXT_SIZE.base);
        for (const slot of ['caption', 'xTick', 'yTick', 'xTitle', 'legend', 'dataLabels']) expect(slots[slot], slot).toBe(TEXT_SIZE.small);
        expect(new Set([slots.title, slots.subtitle, slots.caption]).size).toBe(3);
    });
});
