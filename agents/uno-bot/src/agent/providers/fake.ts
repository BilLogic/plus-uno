// The fake ModelProvider — a scripted model, for testing the loop.
//
// It replays the replies it was handed, records everything the loop sent it, can
// be told to fail once with a given HTTP status, and answers `fallback` with
// whether a backup exists. The one-shot `generate` is scripted the same way,
// and records the tier and prompt it was asked on, so a caller of the seam's
// second call is as testable as the loop. That is the whole surface: the loop's behaviour is
// then observable without a network call, a credential or a Cloudflare runtime.
//
// Workers-global-free on purpose — no `Env`, no fetch — so `tsconfig.test.json`
// compiles it alongside the loop and the tests that drive it.

import type {
  ModelPrompt,
  ModelProvider,
  ModelReply,
  ModelStop,
  ModelText,
  ModelToolCall,
  ModelToolResult,
  ModelTurn,
  ModelUsage,
  ProviderDials,
} from "../model-provider";

/** One scripted model reply. Omitting `stop` infers it: `tool` when the reply
 *  carries calls, `end` when it does not. */
export interface ScriptedReply {
  text?: string;
  toolCalls?: Array<{ name: string; args?: Record<string, unknown> }>;
  stop?: ModelStop;
}

/** What the loop appended to the adapter's transcript, in order. */
export type FakeTranscriptEntry =
  | { kind: "results"; results: ModelToolResult[] }
  | { kind: "user"; text: string };

export interface FakeProviderOptions {
  /** Replayed in order. Past the end the fake answers with a plain end turn, so
   *  a loop that iterates further than the script cannot hang. */
  replies?: ScriptedReply[];
  /** Fail the next `send` this many times before replaying the script — the
   *  shape of a capacity outage the loop is meant to retry through. */
  failTimes?: number;
  /** The status those failures carry. */
  failStatus?: number;
  /** The backup model, or null for a provider that has none. */
  backupModel?: string | null;
  /** Statuses the backup is worth trying on. */
  fallbackStatuses?: number[];
  /** Canned one-shot replies, replayed in order by `generate`. Past the end it
   *  answers with empty text, so a caller that generates more often than the
   *  script cannot hang. */
  generateReplies?: string[];
  /** When set, every `generate` fails with this message — the caller's
   *  fail-open path (the draft judge sends the original draft). */
  generateFailMessage?: string;
  model?: string;
  usage?: Partial<ModelUsage>;
}

export interface FakeProvider extends ModelProvider {
  /** The turn the loop opened, or null if it never did. */
  readonly started: ModelTurn | null;
  /** One entry per `send`, with the model in force at the time — which is how a
   *  test sees that the retry went to the BACKUP and not to the primary again. */
  readonly sends: Array<{ toolsEnabled: boolean; model: string }>;
  /** Everything the loop handed back, in order. */
  readonly transcript: FakeTranscriptEntry[];
  /** Every tool call the fake announced, so a test can assert none ran. */
  readonly announced: ModelToolCall[];
  /** Every one-shot the fake was asked for, in order — which tier it was asked
   *  on and what prompt it carried. */
  readonly generated: ModelPrompt[];
}

export function fakeProvider(opts: FakeProviderOptions = {}): FakeProvider {
  const replies = [...(opts.replies ?? [])];
  const fallbackStatuses = new Set(opts.fallbackStatuses ?? [404, 429, 500, 503]);
  let model = opts.model ?? "fake-1";
  let failsLeft = opts.failTimes ?? 0;
  let fellBack = false;
  let cursor = 0;

  const sends: Array<{ toolsEnabled: boolean; model: string }> = [];
  const transcript: FakeTranscriptEntry[] = [];
  const announced: ModelToolCall[] = [];
  const generated: ModelPrompt[] = [];
  const generateReplies = [...(opts.generateReplies ?? [])];
  let generateCursor = 0;
  const usage: ModelUsage = {
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cachedInputTokens: 0,
    ...opts.usage,
  };

  const fake: FakeProvider = {
    name: "fake",
    started: null,
    sends,
    transcript,
    announced,
    generated,

    async start(turn: ModelTurn): Promise<void> {
      (fake as { started: ModelTurn | null }).started = turn;
    },

    async generate(prompt: ModelPrompt): Promise<ModelText> {
      generated.push(prompt);
      if (opts.generateFailMessage !== undefined) {
        return { ok: false, model, message: opts.generateFailMessage };
      }
      return { ok: true, model, text: generateReplies[generateCursor++] ?? "" };
    },

    async send({ toolsEnabled }): Promise<ModelReply> {
      sends.push({ toolsEnabled, model });
      if (failsLeft > 0) {
        failsLeft--;
        return { ok: false, status: opts.failStatus ?? 429, message: "fake capacity failure" };
      }
      const scripted = replies[cursor++];
      if (!scripted) return { ok: true, text: "(fake: out of script)", toolCalls: [], stop: "end" };
      const toolCalls: ModelToolCall[] = (scripted.toolCalls ?? []).map((c, i) => ({
        id: `${cursor}-${i}`,
        name: c.name,
        args: c.args ?? {},
      }));
      announced.push(...toolCalls);
      return {
        ok: true,
        text: scripted.text ?? "",
        toolCalls,
        stop: scripted.stop ?? (toolCalls.length > 0 ? "tool" : "end"),
      };
    },

    recordToolResults(results: ModelToolResult[]): void {
      transcript.push({ kind: "results", results });
    },

    recordUserText(text: string): void {
      transcript.push({ kind: "user", text });
    },

    fallback(status: number): boolean {
      const backup = opts.backupModel ?? null;
      if (fellBack || backup === null || !fallbackStatuses.has(status)) return false;
      fellBack = true;
      model = backup;
      return true;
    },

    dials(): ProviderDials {
      return { model, detail: {} };
    },

    usage(): ModelUsage {
      return { ...usage };
    },
  };

  return fake;
}
