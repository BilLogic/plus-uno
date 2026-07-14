import React from 'react';
import { motion } from 'framer-motion';
import { getHeatmapColorByValue, formatCorrelationLabel } from '../utils';
import { ChartSkeleton } from './ChartSkeleton';
import type { CorrelationMatrix } from '../types';

/** Show skeleton for this many ms after heatmap phase starts. */
const SKELETON_MS = 800;

/** Hard-coded correlation matrix: strategies × outcomes. */
const CORRELATIONS: CorrelationMatrix = {
  'Visual Reps': { Breakthrough: 0.82, Progress: 0.71, Engagement: 0.68, Retention: 0.65 },
  'Effort Valid.': { Breakthrough: 0.78, Progress: 0.75, Engagement: 0.8, Retention: 0.72 },
  'Step Chunk': { Breakthrough: 0.76, Progress: 0.73, Engagement: 0.64, Retention: 0.7 },
  'Peer Collab': { Breakthrough: 0.58, Progress: 0.62, Engagement: 0.71, Retention: 0.66 },
};

const STRATEGIES = Object.keys(CORRELATIONS) as (keyof CorrelationMatrix)[];
const OUTCOMES = ['Breakthrough', 'Progress', 'Engagement', 'Retention'] as const;

/** Top 3 cells to highlight (strategy × outcome). */
const HIGHLIGHT_CELLS: Array<{ strategy: string; outcome: string }> = [
  { strategy: 'Visual Reps', outcome: 'Breakthrough' },
  { strategy: 'Effort Valid.', outcome: 'Breakthrough' },
  { strategy: 'Step Chunk', outcome: 'Breakthrough' },
];

const CELL_WIDTH = 140;
const CELL_HEIGHT = 80;

const CELL_STAGGER_DELAY = 0.08;
const QUOTE_DELAY = 0.8;

/** Heatmap theme colors for labels and borders using PLUS tokens. */
const HEATMAP_THEMES = {
  dark: { text: '#E5E7EB', quoteBg: 'rgba(255, 255, 255, 0.05)', quoteBorder: 'rgba(255, 255, 255, 0.1)' },
  light: {
    text: 'var(--color-on-surface-variant, #49454f)',
    quoteBg: 'var(--color-surface-container, #f3f4f6)',
    quoteBorder: 'var(--color-outline-variant, #e0e0e0)'
  },
};

/**
 * Strategy correlation heatmap: 4×4 grid.
 * Phase 2: cell stagger reveal, highlight border, quote fade-in.
 * @param theme - light or dark theme
 * @param elapsedSinceVisible - ms since heatmap phase started (drives stagger; optional for static use).
 */
export function StrategyHeatmap({
  theme = 'dark',
  elapsedSinceVisible,
}: {
  theme?: 'light' | 'dark';
  elapsedSinceVisible?: number;
} = {}): React.ReactElement {
  const loading = elapsedSinceVisible != null && elapsedSinceVisible < SKELETON_MS;
  const t = HEATMAP_THEMES[theme];

  if (loading) {
    const heatmapWidth = CELL_WIDTH * (STRATEGIES.length + 1);
    const heatmapHeight = CELL_HEIGHT * (OUTCOMES.length + 1);
    return (
      <ChartSkeleton
        width={heatmapWidth}
        height={heatmapHeight}
        theme={theme}
        style={{ minWidth: heatmapWidth }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: CELL_WIDTH, flexShrink: 0 }} />
        {STRATEGIES.map((strategy) => (
          <div
            key={strategy}
            style={{
              width: CELL_WIDTH,
              height: CELL_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-body2, 14px)',
              fontWeight: 600,
              color: t.text,
              borderBottom: '1px solid var(--chat-outline, #d1d5db)',
              borderLeft: '1px solid var(--chat-outline, #d1d5db)',
              padding: 'var(--size-element-pad-y-sm, 4px)',
              textAlign: 'center',
            }}
          >
            {strategy}
          </div>
        ))}
      </div>
      {OUTCOMES.map((outcome, rowIndex) => (
        <div key={outcome} style={{ display: 'flex', alignItems: 'stretch' }}>
          <div
            style={{
              width: CELL_WIDTH,
              minHeight: CELL_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--size-element-pad-y-sm, 4px) var(--size-element-pad-x-sm, 8px)',
              fontSize: 'var(--font-size-body2, 14px)',
              fontWeight: 600,
              color: t.text,
              borderBottom: '1px solid var(--chat-outline, #d1d5db)',
              borderLeft: '1px solid var(--chat-outline, #d1d5db)',
            }}
          >
            {outcome}
          </div>
          {STRATEGIES.map((strategy, colIndex) => {
            const value = CORRELATIONS[strategy]?.[outcome] ?? 0;
            const isHighlight = HIGHLIGHT_CELLS.some(
              (c) => c.strategy === strategy && c.outcome === outcome
            );
            const cellIndex = rowIndex * STRATEGIES.length + colIndex;
            return (
              <motion.div
                key={`${strategy}-${outcome}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.25,
                  delay: cellIndex * CELL_STAGGER_DELAY,
                }}
                style={{
                  width: CELL_WIDTH,
                  height: CELL_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: getHeatmapColorByValue(value),
                  color: '#fff',
                  fontSize: 'var(--font-size-body2, 14px)',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--chat-outline, #d1d5db)',
                  borderLeft: '1px solid var(--chat-outline, #d1d5db)',
                  boxSizing: 'border-box',
                  border: isHighlight ? '2px solid white' : undefined,
                }}
              >
                {formatCorrelationLabel(value)}
              </motion.div>
            );
          })}
        </div>
      ))}
      <motion.div
        style={{
          display: 'flex',
          marginTop: 'var(--size-element-gap-sm, 8px)',
          gap: 'var(--size-element-gap-sm, 8px)',
          flexWrap: 'wrap',
        }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: QUOTE_DELAY,
            },
          },
        }}
      >
        <QuoteBox text="Student's face lit up when we used pizza slices..." theme={theme} />
        <QuoteBox text="Celebrating small wins kept them from giving up" theme={theme} />
      </motion.div>
    </div>
  );
}

/** Quote box with Framer Motion fade + slide in. */
function QuoteBox({ text, theme = 'dark' }: { text: string; theme?: 'light' | 'dark' }): React.ReactElement {
  const t = HEATMAP_THEMES[theme];
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3 }}
      style={{
        width: 200,
        minHeight: 60,
        padding: 'var(--size-element-pad-y-md, 6px) var(--size-element-pad-x-md, 10px)',
        borderRadius: 'var(--size-border-radius-radius-200, 8px)',
        background: t.quoteBg,
        border: `1px solid ${t.quoteBorder}`,
        fontStyle: 'italic',
        fontSize: 'var(--font-size-body2, 14px)',
        color: t.text,
      }}
    >
      &ldquo;{text}&rdquo;
    </motion.div>
  );
}
