import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../types";

export const MODEL = "claude-sonnet-4-6";

export function makeAnthropicClient(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}
