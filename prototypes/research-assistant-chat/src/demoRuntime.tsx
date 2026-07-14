/**
 * Demo runtime for Research Assistant.
 * Uses useLocalRuntime for stable state management and scripts the conversation timeline.
 * @file demoRuntime.tsx
 */
import React, { useEffect, useRef } from 'react';
import {
  useLocalRuntime, // Assuming this is available in roughly v0.12+
  AssistantRuntimeProvider,
  type AssistantRuntime,
} from '@assistant-ui/react';

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

/**
 * Hook to drive the demo script based on user messages.
 */
function useDemoScript(runtime: AssistantRuntime) {
  const isRunningRef = useRef(false);

  useEffect(() => {
    // Subscribe to the thread's state to detect new user messages.
    // Use runtime.thread.subscribe because AssistantRuntime doesn't expose a direct subscribe method.
    const unsub = runtime.thread.subscribe(() => {
      // Use runtime.thread.getState() to access messages
      const state = runtime.thread.getState();
      const messages = state.messages;
      const lastMsg = messages[messages.length - 1];

      // If last message is User and we aren't already running a script response
      if (lastMsg?.role === 'user' && !isRunningRef.current) {
        isRunningRef.current = true;
        const exchangeIndex = messages.length === 1 ? 1 : 2; // Simple logic: 1st vs 2nd msg
        runScript(runtime, exchangeIndex).then(() => {
          isRunningRef.current = false;
        });
      }
    });
    return unsub;
  }, [runtime]);
}

async function runScript(runtime: AssistantRuntime, index: 1 | 2) {
  // Step 1: Think (simulate latency)
  await new Promise(r => setTimeout(r, DEMO_TIMING.THINK_MS));

  // Step 2: First Paragraph
  // Note: runtime.append() might not exist on the AssistantRuntime interface based on d.ts
  // Use runtime.thread.append() instead.
  runtime.thread.append({
    role: 'assistant',
    content: [{ type: 'text', text: index === 1 ? RESP1_PARA1 : RESP2_PARA1 }],
  });

  // Step 3: Chart (Data Part) - Wait for reading time
  await new Promise(r => setTimeout(r, DEMO_TIMING.PARA1_MS));

  // Append Chart as a separate message bubble (Tool UI style)
  runtime.thread.append({
    role: 'assistant',
    content: [{
      type: 'data',
      name: index === 1 ? 'engagement-chart' : 'strategy-heatmap',
      data: { variant: index === 1 ? 'engagement' : 'heatmap', theme: 'light' }
    }]
  });

  // Wait for Chart Skeleton Time (visual pacing)
  await new Promise(r => setTimeout(r, index === 1 ? DEMO_TIMING.CHART_SKELETON_MS : DEMO_TIMING.HEATMAP_SKELETON_MS));

  // Step 4: Second Paragraph
  runtime.thread.append({
    role: 'assistant',
    content: [{ type: 'text', text: index === 1 ? RESP1_PARA2 : RESP2_PARA2 }]
  });
}

/**
 * Dummy adapter that does nothing, as we drive the conversation manually via script.
 */
const demoAdapter = {
  async *run(options: any) {
    yield {
      content: [],
    };
  },
};

export function useDemoRuntime(): AssistantRuntime {
  // Initialize local runtime with dummy adapter
  const runtime = useLocalRuntime(demoAdapter);
  useDemoScript(runtime);
  return runtime;
}

export function DemoRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const runtime = useDemoRuntime();
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
