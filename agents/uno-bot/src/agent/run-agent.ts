// Provider dispatcher: one entry point (runAgent) that routes a turn to the
// active model lane. Both lanes honour the same AgentInput/AgentResult contract
// (loop-shared.ts), so everything downstream — the proposal gate, delivery,
// history — is provider-blind.
//
//   MODEL_PROVIDER = "gemini"        → gemini-agent.ts  (DEFAULT / production)
//   MODEL_PROVIDER = "vertex-claude" → claude-agent.ts  (Claude via Vertex AI,
//                                       billed to the GCP project; opt-in)
//
// Flipping MODEL_PROVIDER is the whole switch. Vertex-Claude falls back to the
// Gemini lane if its service-account credentials aren't configured, so a
// mis-set flag degrades instead of failing.

import { runGeminiAgent } from "./gemini-agent";
import { runClaudeAgent } from "./claude-agent";
import { claudeVertexConfigured } from "../vertex/claude";
import type { AgentInput, AgentResult } from "./loop-shared";

export type { HistoryTurn, AgentInput, AgentResult, AgentImage } from "./loop-shared";

export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const provider = (input.env.MODEL_PROVIDER ?? "gemini").toLowerCase();
  if (provider === "vertex-claude" && claudeVertexConfigured(input.env)) {
    return runClaudeAgent(input);
  }
  return runGeminiAgent(input);
}
