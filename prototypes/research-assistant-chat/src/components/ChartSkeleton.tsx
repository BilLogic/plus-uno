/**
 * Skeleton placeholder for charts/heatmaps while "loading".
 * Uses shimmer animation; same approximate size as chart/heatmap container.
 */
import React from 'react';

export interface ChartSkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  /** Optional theme for background. */
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ChartSkeleton: shimmer placeholder for EngagementChart / StrategyHeatmap.
 */
export function ChartSkeleton({
  width = 600,
  height = 300,
  borderRadius = 8,
  theme = 'light',
  className = '',
  style = {},
}: ChartSkeletonProps): React.ReactElement {
  const bg = theme === 'light' ? '#e8eaed' : '#374151';
  const highlight = theme === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)';

  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: `var(--size-border-radius-radius-200, ${borderRadius}px)`,
        background: bg,
        border: '1px solid var(--chat-outline, #d1d5db)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${highlight} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          backgroundPosition: '200% 0',
          animation: 'chart-skeleton-shimmer 2.8s ease-in-out infinite',
        }}
        aria-hidden
      />
    </div>
  );
}
