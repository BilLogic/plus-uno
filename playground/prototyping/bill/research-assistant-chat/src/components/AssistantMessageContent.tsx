/**
 * Renders assistant message content: text parts and data parts (engagement-chart, strategy-heatmap).
 * Decoupled from assistant-ui context to allow manual rendering.
 */
import React, { useState, useEffect } from 'react';
import { EngagementChart } from './EngagementChart';
import { StrategyHeatmap } from './StrategyHeatmap';
import { ChartSkeleton } from './ChartSkeleton';
import { ToolTerminal, ToolStats, ToolCarousel, ToolCard } from './FakeTools';
import { TypingText } from './TypingText';

const SKELETON_MS = 900;

/**
 * Renders a single part: text (with InProgress) or data (chart/heatmap with skeleton).
 */
function PartRenderer({ part }: { part: any }): React.ReactElement | null {
  if (!part) return null;
  if (part.type === 'text') {
    // Check if this text should be typed out
    const shouldType = 'shouldType' in part ? part.shouldType : false;

    return (
      <p
        style={{
          margin: 0,
          marginBottom: 'var(--size-element-gap-sm, 8px)',
          fontFamily: 'var(--font-family-body)',
          fontSize: 'var(--font-size-body1, 1rem)',
          lineHeight: 'var(--font-line-height-body1, 1.5)',
          color: 'var(--chat-on-surface-muted, #6b7280)',
          whiteSpace: 'pre-line',
        }}
      >
        {shouldType ? (
          <TypingText text={part.text} speed={40} />
        ) : (
          part.text
        )}
      </p>
    );
  }
  if (part.type === 'data') {
    const name = 'name' in part ? part.name : '';
    const data = 'data' in part ? part.data : {};
    const payload = typeof data === 'object' && data !== null ? data as { variant?: string; theme?: string, logs?: string[] } : {};
    return (
      <DataPartRenderer
        name={name}
        variant={payload.variant ?? 'engagement'}
        theme={payload.theme ?? 'light'}
        data={payload}
      />
    );
  }
  return null;
}

/**
 * Renders data part: skeleton then EngagementChart or StrategyHeatmap.
 */
function DataPartRenderer({
  name,
  variant,
  theme,
  data
}: {
  name: string;
  variant: string;
  theme: string;
  data: any;
}): React.ReactElement {
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShowContent(true), SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  // Removed old containerStyle as ToolCard handles it now
  const skeletonContainerStyle: React.CSSProperties = {
    marginBottom: '8px',
    padding: '8px',
    background: 'var(--chat-surface, #ffffff)',
    borderRadius: '12px',
    border: '1px solid var(--chat-outline, #d1d5db)',
  };

  if (!showContent) {
    return (
      <div style={skeletonContainerStyle}>
        <ChartSkeleton width={600} height={300} theme={theme as 'light' | 'dark'} />
      </div>
    );
  }

  if (name === 'terminal') {
    return (
      <ToolTerminal
        title="Analysis Console"
        logs={data.logs || [
          "connecting to db...",
          "querying sessions...",
          "done."
        ]}
      />
    );
  }

  if (name === 'stats') {
    return (
      <ToolStats
        title="Performance Overview"
        description="Average metrics for novice tutors (< 6 months experience)"
        stats={[
          {
            key: 'engagement',
            label: 'Avg Engagement',
            value: 78,
            format: { kind: 'percent', decimals: 0, basis: 'unit' },
            sparkline: {
              data: [72, 74, 76, 75, 77, 78, 79, 78, 80, 79, 78, 78],
              color: 'var(--color-primary, #0472a8)'
            },
            diff: { value: 4.2, decimals: 1 }
          },
          {
            key: 'retention',
            label: 'Retention Rate',
            value: 92,
            format: { kind: 'percent', decimals: 0, basis: 'unit' },
            sparkline: {
              data: [88, 89, 90, 90, 91, 91, 92, 92, 92, 93, 92, 92],
              color: '#16a34a'
            },
            diff: { value: 1.5, decimals: 1 }
          },
          {
            key: 'session-time',
            label: 'Avg Session Time',
            value: 45,
            format: { kind: 'number', decimals: 0 },
            sparkline: {
              data: [48, 47, 46, 47, 46, 45, 45, 44, 45, 45, 46, 45],
              color: '#f59e0b'
            },
            diff: { value: -2, decimals: 0 }  // Down is bad (we want longer sessions)
          },
          {
            key: 'nps',
            label: 'NPS Score',
            value: 68,
            format: { kind: 'number', decimals: 0 },
            sparkline: {
              data: [58, 61, 62, 63, 64, 65, 66, 66, 67, 68, 68, 68],
              color: '#8b5cf6'
            },
            diff: { value: 5.0, decimals: 0 }
          }
        ]}
      />
    );
  }

  if (name === 'carousel') {
    return (
      <ToolCarousel
        title="Recommended Strategies"
        description="High-impact interventions based on correlation data"
        items={[
          { title: 'Visual Reps', desc: 'Using diagrams/charts to explain concepts.', icon: '📊' },
          { title: 'Validation', desc: 'Acknowledging student effort explicitly.', icon: '✅' },
          { title: 'Step Chunking', desc: 'Breaking complex problems into small steps.', icon: '🧱' },
          { title: 'Peer Collab', desc: 'Encouraging students to help each other.', icon: '👥' }
        ]}
      />
    );
  }

  if (name === 'engagement-chart' || variant === 'engagement') {
    return (
      <ToolCard title="Engagement Analysis" description="Comparing novice vs experienced tutor momentum over 12 weeks">
        <div style={{ padding: '0' }}>
          <EngagementChart theme={theme as 'light' | 'dark'} />
        </div>
      </ToolCard>
    );
  }

  if (name === 'strategy-heatmap' || variant === 'heatmap') {
    return (
      <ToolCard title="Strategy Impact Matrix" description="Correlation between teaching strategies and student outcomes">
        <div style={{ padding: '8px' }}>
          <StrategyHeatmap theme={theme as 'light' | 'dark'} />
        </div>
      </ToolCard>
    );
  }

  return <div style={skeletonContainerStyle} />;
}

/**
 * Assistant message content: loops parts and renders each.
 */
export function AssistantMessageContent({ parts }: { parts: any[] }): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: 'var(--font-family-body)',
        fontSize: 'var(--font-size-body1, 1rem)',
        lineHeight: 'var(--font-line-height-body1, 1.5)',
        color: 'var(--chat-on-surface-muted, #6b7280)',
      }}
    >
      {parts.map((part, index) => (
        <PartRenderer key={index} part={part} />
      ))}
    </div>
  );
}
