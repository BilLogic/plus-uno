import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ChartSkeleton } from './ChartSkeleton';

/** Hard-coded engagement data: novice vs experienced tutors (Student Momentum %). */
const ENGAGEMENT_DATA = {
  categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
  novice: [65, 72, 68, 75, 70, 77, 74, 80, 76, 79, 75, 78],
  experienced: [88, 90, 91, 92, 91, 93, 92, 94, 93, 92, 93, 92],
};

const CHART_HEIGHT = 340;
const CHART_WIDTH = 600;

/** Show skeleton for this many ms after chart phase starts. */
const SKELETON_MS = 900;

/** Chart colors for light vs dark theme using PLUS tokens. */
const CHART_THEMES = {
  dark: {
    bg: '#111827',
    text: '#D1D5DB',
    grid: '#374151',
    axis: '#4b5563',
  },
  light: {
    bg: 'var(--color-surface, #ffffff)',
    text: 'var(--color-on-surface-variant, #49454f)',
    grid: 'var(--color-outline-variant, #e0e0e0)',
    axis: 'var(--color-outline, #79747e)',
  },
};

/**
 * Dual-line engagement chart: Novice vs Experienced tutors (Student Momentum %).
 * Supports light/dark theme and skeleton loading.
 * @param theme - light or dark
 * @param elapsedSinceVisible - ms since chart phase started; skeleton shown for first SKELETON_MS
 */
export function EngagementChart({
  theme = 'dark',
  elapsedSinceVisible,
}: {
  theme?: 'light' | 'dark';
  elapsedSinceVisible?: number;
}): React.ReactElement {
  const loading = elapsedSinceVisible != null && elapsedSinceVisible < SKELETON_MS;
  const colors = CHART_THEMES[theme];

  if (loading) {
    return (
      <ChartSkeleton
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        theme={theme}
        style={{
          padding: 'var(--size-element-pad-y-lg, 8px)',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  // Get CSS variable values for series colors if possible, else fallback
  // Note: Highcharts requires resolved colors or rgba strings for some features, 
  // but standard CSS vars work in SVG fill/stroke in modern browsers.
  const primaryColor = 'var(--color-primary, #0472a8)';
  const secondaryColor = 'var(--color-tertiary, #c96a6a)'; // Using a contrasting token or fallback

  const options: Highcharts.Options = {
    chart: {
      type: 'line',
      backgroundColor: colors.bg,
      height: CHART_HEIGHT,
      width: CHART_WIDTH,
      spacingBottom: 20,
      style: {
        fontFamily: 'var(--font-family-body, "Merriweather Sans", "Open Sans", sans-serif)',
        color: colors.text,
      },
    },
    title: { text: undefined },
    xAxis: {
      categories: ENGAGEMENT_DATA.categories,
      labels: {
        style: { color: colors.text, fontSize: '14px' },
      },
      lineColor: colors.axis,
      tickColor: colors.axis,
    },
    yAxis: {
      title: { text: 'Student Momentum %', style: { color: colors.text } },
      min: 0,
      max: 100,
      labels: { style: { color: colors.text, fontSize: '14px' } },
      gridLineColor: colors.grid,
      lineColor: colors.axis,
      tickColor: colors.axis,
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'top',
      itemStyle: { color: colors.text },
    },
    plotOptions: {
      series: {
        animation: { duration: 1500 },
      },
      line: {
        marker: { enabled: true, symbol: 'circle' },
        lineWidth: 2.5,
      },
    },
    series: [
      { name: 'Novice tutors', data: ENGAGEMENT_DATA.novice, color: secondaryColor, type: 'line' },
      { name: 'Experienced tutors', data: ENGAGEMENT_DATA.experienced, color: primaryColor, type: 'line' },
    ],
    credits: { enabled: false },
  };

  return (
    <div
      style={{
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        padding: '12px 12px 20px 12px',
        background: colors.bg,
        borderRadius: 'var(--size-border-radius-radius-200, 8px)',
        border: '1px solid var(--chat-outline, #d1d5db)',
      }}
    >
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
