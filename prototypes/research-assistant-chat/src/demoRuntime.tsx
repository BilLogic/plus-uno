/**
 * Demo conversation for Research Assistant.
 * Plain React state holds the thread; a timed script appends the assistant's replies.
 * @file demoRuntime.tsx
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const DEMO_TIMING = {
  THINK_MS: 500,
  PARA1_MS: 2000,
  CHART_SKELETON_MS: 900,
  PARA2_MS: 1500,
  HEATMAP_SKELETON_MS: 800,
} as const;

const RESP1_PARA1 =
  "Here's how novice and experienced tutors compare on student momentum over the last 12 weeks. " +
  "The chart below shows weekly averages for two groups: tutors with fewer than six months of experience and those with a year or more.";
const RESP1_PARA2 =
  'Experienced tutors maintain about 15% higher momentum through consistent pacing and fewer dips. ' +
  'Novice tutors show more week-to-week variation; the gap tends to narrow toward the end of the term as newer tutors adopt similar habits.';

const RESP2_PARA1 =
  'These are the strategy–outcome correlations from recent sessions. ' +
  'Each cell reflects how strongly a given strategy (e.g. visual representations, effort validation) associates with an outcome (breakthrough, progress, engagement, retention).';
const RESP2_PARA2 =
  'Visual representations and effort validation show the strongest link to breakthroughs; the quotes are from tutors who saw clear student progress. ' +
  'Step chunking and peer collaboration correlate well with engagement and retention, though effect sizes vary by context.';

export type DemoPart =
  | { type: 'text'; text: string }
  | { type: 'data'; name: string; data: { variant: string; theme: string } };

export interface DemoMessage {
  id: number;
  role: 'user' | 'assistant';
  content: DemoPart[];
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Holds the thread in React state. `send` appends the user's message, then plays
 * the scripted reply for the first or second exchange: a paragraph, the chart or
 * heatmap, then a closing paragraph.
 */
export function useDemoConversation() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const nextId = useRef(1);
  const exchanges = useRef(0);
  const isRunning = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const append = useCallback((role: DemoMessage['role'], part: DemoPart) => {
    if (!mounted.current) return;
    setMessages(prev => [...prev, { id: nextId.current++, role, content: [part] }]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (isRunning.current) return;
      isRunning.current = true;
      exchanges.current += 1;
      const index = exchanges.current === 1 ? 1 : 2;
      append('user', { type: 'text', text });

      await wait(DEMO_TIMING.THINK_MS);
      append('assistant', { type: 'text', text: index === 1 ? RESP1_PARA1 : RESP2_PARA1 });

      await wait(DEMO_TIMING.PARA1_MS);
      append('assistant', {
        type: 'data',
        name: index === 1 ? 'engagement-chart' : 'strategy-heatmap',
        data: { variant: index === 1 ? 'engagement' : 'heatmap', theme: 'light' },
      });

      await wait(index === 1 ? DEMO_TIMING.CHART_SKELETON_MS : DEMO_TIMING.HEATMAP_SKELETON_MS);
      append('assistant', { type: 'text', text: index === 1 ? RESP1_PARA2 : RESP2_PARA2 });
      isRunning.current = false;
    },
    [append],
  );

  return { messages, send };
}
