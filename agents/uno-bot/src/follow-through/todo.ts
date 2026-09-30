// The card to-do detector: one swept thread in, to-dos to MAKE A ROADMAP CARD
// out — "Bill to create a card for the facelift's last stage", "can someone
// make a card for this". A to-do about anything else is not one: that is a
// promise, and commitment reminders read it.
//
// It asks the `chill` tier through ModelProvider's one-shot `generate`, the
// commitment detector's seam, only when a new message carries card words
// (`mayHoldCardTodo`). Anything off the shape is dropped, never repaired:
//   • a message that is not one of tonight's new messages;
//   • an assignee who neither posted in the thread nor is @-mentioned in it —
//     a name the thread never shows is a guess;
//   • an empty subject once markup is stripped (`cleanWhat`);
//   • a confidence under `CARD_TODO_CONFIDENCE_FLOOR`.
//
// PURE: the provider is a parameter, so tests replay recorded replies through
// the fake adapter (tests/card-follow-through.test.ts, and the eval cases in
// docs/evals/fixtures/card-todo-cases.json).

import type { ModelProvider } from "../agent/model-provider";
import type { SweepMessage, SweepThread } from "../sweep/finding";
import { cleanWhat } from "../commitments/copy";

export const CARD_TODO_CONFIDENCE_FLOOR = 0.7;
const TIER = "chill" as const;
const MAX_MESSAGE_CHARS = 1_200;
const MAX_THREAD_CHARS = 12_000;
const MAX_TOKENS = 1_500;

/** A message that may ask for a card: the word, and a verb that makes one. */
const CARD_WORD = /\b(card|cards|ticket)\b/i;
const MAKE_WORD = /\b(create|make|file|open|add|draft|write|put|start|log)\b/i;

export const CARD_TODO_SYSTEM = [
  "You read one Slack thread and report TO-DOS TO CREATE A ROADMAP CARD in its NEW messages.",
  "A card to-do assigns, volunteers or asks for making a new card on the team's Roadmap board: \"Bill to create a card for the facelift last stage\", \"can someone make a card for this?\", \"I'll file a card for the empty states\".",
  "Not a card to-do:",
  "- a to-do about anything else (sharing a link, updating a PRD, fixing a bug) — even when it mentions an existing card;",
  "- talk about a card that already exists (\"the card is in WIP\", \"I moved the card\");",
  "- a hypothetical, a joke, or a card already made in the same message.",
  "Reply with JSON only, no prose, in exactly this shape:",
  '{"todos":[{"message_ts":"…","assignee":"U…"|null,"what":"…","confidence":0.0}]}',
  "- message_ts: the ts of the NEW message that holds the to-do.",
  "- assignee: the Slack user id who is to make the card — named, volunteering, or asked — or null when nobody was.",
  "- what: what the card is for, as it would follow \"the card for\" — a short noun phrase, at most 10 words, no quotes, no names.",
  "- confidence: 0 to 1 that this is a real to-do to create a card.",
  'None → {"todos":[]}.',
].join("\n");

/** One validated card to-do. */
export interface DetectedCardTodo {
  messageTs: string;
  assignee: string | null;
  /** Cleaned (`cleanWhat`). */
  what: string;
  confidence: number;
}

export type CardTodoDetection = { ok: true; todos: DetectedCardTodo[] } | { ok: false; error: string };

export interface CardTodoDetector {
  detect(input: { thread: SweepThread; since: string }): Promise<CardTodoDetection>;
}

/** The detector over a ModelProvider. */
export function modelCardTodoDetector(provider: ModelProvider): CardTodoDetector {
  return { detect: (input) => detectCardTodos(provider, input) };
}

/** True when a new message carries card words — the gate on the model call. */
export function mayHoldCardTodo(messages: readonly SweepMessage[], since: string): boolean {
  return messages.some((m) => Number(m.ts) > Number(since) && CARD_WORD.test(m.text) && MAKE_WORD.test(m.text));
}

/**
 * Detect the card to-dos in one thread's new messages.
 *
 * @param provider - Asked at most once, on the `chill` tier
 * @param input.thread - Human messages only, root first
 * @param input.since - The channel's cursor
 */
export async function detectCardTodos(
  provider: ModelProvider,
  input: { thread: SweepThread; since: string },
): Promise<CardTodoDetection> {
  if (!mayHoldCardTodo(input.thread.messages, input.since)) return { ok: true, todos: [] };
  const shown = withinChars(input.thread.messages, input.thread.rootTs);
  const reply = await provider.generate({ tier: TIER, system: CARD_TODO_SYSTEM, prompt: todoPrompt(shown, input.since), maxTokens: MAX_TOKENS });
  if (!reply.ok) return { ok: false, error: reply.message };
  return { ok: true, todos: parseCardTodoReply(reply.text, shown, input.since) };
}

/** The prompt: the thread, oldest first, new messages marked. */
export function todoPrompt(messages: readonly SweepMessage[], since: string): string {
  const lines = ["THREAD (oldest first; NEW marks tonight's messages):"];
  for (const m of messages) {
    const text = m.text.length > MAX_MESSAGE_CHARS ? `${m.text.slice(0, MAX_MESSAGE_CHARS - 1)}…` : m.text;
    lines.push(`${Number(m.ts) > Number(since) ? "NEW " : ""}[${m.ts}] <@${m.user}>: ${text}`);
  }
  return lines.join("\n");
}

/** The reply, validated against the messages shown. */
export function parseCardTodoReply(text: string, shown: readonly SweepMessage[], since: string): DetectedCardTodo[] {
  const raw = jsonObjectIn(text) as { todos?: unknown } | null;
  const list = raw && Array.isArray(raw.todos) ? raw.todos : [];
  const byTs = new Map(shown.map((m) => [m.ts, m] as const));
  const seen = new Set<string>(shown.map((m) => m.user));
  for (const m of shown) for (const hit of m.text.matchAll(/<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g)) seen.add(hit[1]!);
  const out: DetectedCardTodo[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const t = entry as Record<string, unknown>;
    const message = byTs.get(str(t.message_ts));
    if (!message || Number(message.ts) <= Number(since)) continue;
    const confidence = typeof t.confidence === "number" ? t.confidence : Number.NaN;
    if (!(confidence >= CARD_TODO_CONFIDENCE_FLOOR) || confidence > 1) continue;
    const what = cleanWhat(str(t.what));
    if (!what) continue;
    if (out.some((o) => o.messageTs === message.ts)) continue;
    const assignee = str(t.assignee);
    out.push({ messageTs: message.ts, assignee: assignee && seen.has(assignee) ? assignee : null, what, confidence });
  }
  return out;
}

function withinChars(messages: readonly SweepMessage[], rootTs: string): SweepMessage[] {
  const size = (m: SweepMessage) => Math.min(m.text.length, MAX_MESSAGE_CHARS) + 40;
  const root = messages.find((m) => m.ts === rootTs);
  let left = MAX_THREAD_CHARS - (root ? size(root) : 0);
  const kept: SweepMessage[] = [];
  for (const m of [...messages].reverse()) {
    if (m === root) continue;
    if (size(m) > left) break;
    left -= size(m);
    kept.unshift(m);
  }
  return root ? [root, ...kept] : kept;
}

function jsonObjectIn(text: string): unknown {
  const from = text.indexOf("{");
  const to = text.lastIndexOf("}");
  if (from < 0 || to <= from) return null;
  try {
    return JSON.parse(text.slice(from, to + 1));
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
