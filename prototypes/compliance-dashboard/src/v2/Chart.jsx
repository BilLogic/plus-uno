import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import Highcharts from '@/dataviz/highchartsModules';
import * as HighchartsReactModule from 'highcharts-react-official';
import chartTheme from '@/dataviz/chartTheme';

// Resolves to a CJS namespace object from this prototype, unlike inside the DS.
const HighchartsReact = HighchartsReactModule.default?.default
    ?? HighchartsReactModule.default
    ?? HighchartsReactModule;

/**
 * A chart on the design system's Highcharts instance and theme, with the
 * tooltip left open to the caller — the DS wrappers fix their tooltips, and
 * these charts are only worth hovering if the tooltip adds something the
 * axis labels don't already say.
 *
 * Fills its container at every size. Highcharts measures once at first draw
 * and otherwise only on window resize, so a chart drawn into a card that was
 * still being laid out (or that changes width without the window resizing)
 * stayed small. Watching the container and reflowing fixes that.
 */
const Chart = ({ options, height = 220 }) => {
    const wrapRef = useRef(null);
    const chartRef = useRef(null);
    const keepChart = useCallback((chart) => { chartRef.current = chart; }, []);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        // The chart instance comes from the wrapper's `callback`: its ref comes
        // back empty in this prototype, like its default export does. Set the
        // size from the measured box rather than calling reflow(), which only
        // acts when Highcharts kept a previous measurement to compare with.
        const observer = new ResizeObserver(([entry]) => {
            const chart = chartRef.current;
            const width = Math.floor(entry.contentRect.width);
            if (chart?.renderer && width > 0 && Math.abs(chart.chartWidth - width) > 1) {
                chart.setSize(width, null, false);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const merged = useMemo(() => ({
        ...chartTheme,
        ...options,
        // Highcharts rewrites the data arrays it is given when a chart updates.
        // Hand it copies, so shared data (which tiles and tables also read) never
        // turns into point objects under them.
        series: (options.series ?? []).map((s) => ({
            ...s,
            data: (s.data ?? []).map((d) => (d && typeof d === 'object' ? { ...d } : d)),
        })),
        chart: { ...chartTheme.chart, height, ...(options.chart ?? {}) },
        title: { text: null },
        credits: { enabled: false },
        tooltip: { ...chartTheme.tooltip, ...(options.tooltip ?? {}) },
    }), [options, height]);

    return (
        <div ref={wrapRef} style={{ width: '100%', minWidth: 0, height }}>
            <HighchartsReact
                callback={keepChart}
                highcharts={Highcharts}
                options={merged}
                containerProps={{ style: { width: '100%', height: '100%' } }}
            />
        </div>
    );
};

/**
 * Series colours, all from the DS chart theme: its danger colour first (for
 * Communication & Conduct and other "act on one" series), then its categorical
 * palette in order.
 */
export const PALETTE = [chartTheme.statusColors.danger, ...chartTheme.colors];

/** DS status and neutral colours for charts, as CSS variables. */
export const CHART_COLORS = { ...chartTheme.statusColors, ...chartTheme.neutralColors };

/*
 * Memoised: the Highcharts wrapper re-applies its options — and replays the
 * animation — after every render of its parent, changed or not. So a click
 * anywhere on the page (a tab, a filter) re-animated every chart. Now a chart
 * only redraws when its own options or height change.
 */
export default memo(Chart);
