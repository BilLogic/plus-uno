/**
 * TypeScript interfaces for Research Assistant Chat prototype (hard-coded data).
 * @file types.ts
 */

/** Single engagement series (novice or experienced). */
export interface EngagementSeries {
  name: string;
  data: number[];
  color: string;
}

/** Week labels for engagement chart. */
export type WeekLabel = `Week ${number}`;

/** Correlation value for one strategy × outcome cell. */
export type CorrelationValue = number;

/** Strategy names (heatmap columns). */
export type StrategyKey =
  | 'Visual Reps'
  | 'Effort Valid.'
  | 'Step Chunk'
  | 'Peer Collab';

/** Outcome names (heatmap rows). */
export type OutcomeKey =
  | 'Breakthrough'
  | 'Progress'
  | 'Engagement'
  | 'Retention';

/** Correlation matrix: strategy -> outcome -> value. */
export interface CorrelationMatrix {
  [strategy: string]: { [outcome: string]: CorrelationValue };
}

/** Single quote item for heatmap insight. */
export interface QuoteItem {
  text: string;
  /** Optional position hint (e.g. row index for layout). */
  positionHint?: number;
}

/** Demo step index (0 = idle, 1–10 = scripted steps). */
export type DemoStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Phase 2: scripted demo timeline (ms). Exchange 1: 0–4s, Exchange 2: 4–8s. */
export const DEMO_TIMING = {
  /** User message 1 typing ends (start 0). */
  USER1_TYPING_END_MS: 800,
  /** Thinking 1 ends; chart phase starts. */
  THINKING1_END_MS: 1500,
  /** Exchange 1 ends; user message 2 typing starts. */
  EXCHANGE1_END_MS: 4000,
  /** User message 2 typing ends. */
  USER2_TYPING_END_MS: 4800,
  /** Thinking 2 ends; heatmap phase starts. */
  THINKING2_END_MS: 5500,
  /** Full demo length (heatmap visible until end). */
  DEMO_LENGTH_MS: 8000,
} as const;

/** App view: tutors tab (with floating bubble) or full research chat. */
export type AppView = 'tutors' | 'research-chat';

/** Suggested prompt for floating chat bubble. */
export interface SuggestedPrompt {
  title: string;
  description: string;
}
