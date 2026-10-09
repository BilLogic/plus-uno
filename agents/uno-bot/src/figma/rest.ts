// The Figma client over REST — the only file in `src/` that names
// api.figma.com (#892). `scripts/check-fetch.mjs` fails the build on any
// other, so a new Figma call is a new method here, paced and retried like the
// rest.
//
// ── The budget ─────────────────────────────────────────────────────────────
//
// Figma counts a personal token "per-user, per-plan": every PAT on Bill's
// account — his IDE and MCP tools, this Worker, the snapshot-refresh Action —
// draws from one budget per tier. Its rate-limits page
// (developers.figma.com/docs/rest-api/rate-limits, in force since 2025-11-17,
// read 2026-09-30) gives a Full seat on Professional, which is what the
// Education plan is, these limits:
//
//   Tier 1  file, nodes, images                                     10/min
//   Tier 2  comments, versions, dev resources, folders, webhooks    25/min
//   Tier 3  components, file meta, /v1/me                           50/min
//
// uno-bot takes half of each (`UNO_SHARE_PER_MINUTE`), so Bill keeps at least
// half for his own tools even while a batch runs.
//
// ── Pacing ─────────────────────────────────────────────────────────────────
//
// One budget per tier, shaped like Figma's own leaky bucket: a burst of the
// share, then one call every 60/share seconds. A call takes its slot before
// it awaits anything, so calls made together queue behind one another rather
// than all reading "free". A 429 empties the tier until its wait has passed,
// so the next call waits too.
//
// ── Retries ────────────────────────────────────────────────────────────────
//
//   • 429, any method: Figma refused before acting, so it is safe to repeat.
//     Wait at least max(Retry-After, 1 s·2^(n−1)), then the tier's pacing, and
//     try again, 3 attempts in all.
//   • 5xx, a network failure or a timeout: retried on a GET only, after 1 s
//     then 2 s. A POST or a DELETE may have landed, and a comment posted twice
//     is worse than one reported as failed.
//   • A budget stop (`SubrequestBudgetError`) passes straight through. The old
//     `figmaGet` caught it, slept and threw a plain error, so a job out of
//     subrequests read as "Figma failed" (net.ts says why that matters).
//   • Any other refusal, or a 2xx carrying `err`, throws `FigmaRequestError`.
//
// Every wait counts toward the call's `maxWaitMs` (60 s unless the caller
// says otherwise), and a wait past it throws `FigmaRateLimitError` without
// sleeping: a Retry-After of an hour fails now, not in an hour.
//
// ── Where the buckets live ─────────────────────────────────────────────────
//
// In memory, per client. `figmaClientFor(env)` keeps one client per `Env`,
// which is one per Durable Object instance or isolate. Two invocations that
// overlap in different isolates each pace alone, and backoff covers the
// overlap. What would reopen this is 429s in the logs; the answer then is one
// Durable Object holding the budget for every caller.
//
// ── Cost ───────────────────────────────────────────────────────────────────
//
// Pacing costs wall time, not subrequests. Each retry is one more external
// call against the invocation's 50 (ADR-022), metered by `countedFetch` like
// any other.

import { countedFetch, isSubrequestBudgetError } from "../net";
import {
  FigmaRateLimitError,
  FigmaRequestError,
  type FigmaCallOptions,
  type FigmaClient,
  type FigmaComment,
  type FigmaCommentsResponse,
  type FigmaComponentsResponse,
  type FigmaDevResourcesCreated,
  type FigmaDevResourcesResponse,
  type FigmaFileMetaResponse,
  type FigmaFileResponse,
  type FigmaFolderFilesResponse,
  type FigmaImagesResponse,
  type FigmaNodesResponse,
  type FigmaTeamFoldersResponse,
  type FigmaTier,
  type FigmaVersionsResponse,
  type FigmaWebhook,
  type FigmaWebhookRequestsResponse,
  type FigmaWebhooksResponse,
} from "./client";

const FIGMA_API = "https://api.figma.com";

/** Figma's per-minute limits for a Full seat on Professional (the table above). */
export const FIGMA_PER_MINUTE: Readonly<Record<FigmaTier, number>> = { 1: 10, 2: 25, 3: 50 };

/** uno-bot's share of each tier: half, rounded down. */
export const UNO_SHARE_PER_MINUTE: Readonly<Record<FigmaTier, number>> = { 1: 5, 2: 12, 3: 25 };

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_WAIT_MS = 60_000;
const DEFAULT_ATTEMPTS = 3;
/** The first retry's backoff; each later one doubles it. */
const BACKOFF_MS = 1_000;
/** How much of Figma's refusal an error message carries. */
const DETAIL_CHARS = 200;

/** What the client sends through — `countedFetch`'s shape. */
export type FigmaTransport = (url: string, init: RequestInit, timeoutMs?: number) => Promise<Response>;

export interface FigmaRestDeps {
  /** A Figma personal access token. */
  token: string;
  /**
   * Defaults to `countedFetch`, so every call is metered (ADR-022). Called
   * `transport` because check-fetch reads any `.fetch(` as a stub call.
   */
  transport?: FigmaTransport;
  /** Defaults to a timer. A test passes one that moves its own clock. */
  sleep?: (ms: number) => Promise<void>;
  /** Defaults to `Date.now`. */
  now?: () => number;
  /** Calls per minute, by tier. Defaults to `UNO_SHARE_PER_MINUTE`. */
  perMinute?: Readonly<Record<FigmaTier, number>>;
}

/** One request, described. */
interface FigmaRequest {
  /** How errors name it: `Figma <what> <status>`. */
  what: string;
  tier: FigmaTier;
  method: "GET" | "POST" | "DELETE";
  /** From the API root, query included and already encoded. */
  path: string;
  body?: unknown;
}

/**
 * The client over Figma's REST API.
 *
 * @param deps - The token, and the transport, clock and sleep a test replaces
 */
export function createFigmaRestClient(deps: FigmaRestDeps): FigmaClient {
  const transport = deps.transport ?? countedFetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = deps.now ?? (() => Date.now());
  const share = deps.perMinute ?? UNO_SHARE_PER_MINUTE;
  const budgets: Record<FigmaTier, TierBudget> = {
    1: tierBudget(share[1]),
    2: tierBudget(share[2]),
    3: tierBudget(share[3]),
  };

  async function call<T>(req: FigmaRequest, opts: FigmaCallOptions = {}): Promise<T> {
    const attempts = Math.max(1, opts.attempts ?? DEFAULT_ATTEMPTS);
    const maxWaitMs = Math.max(0, opts.maxWaitMs ?? DEFAULT_MAX_WAIT_MS);
    const budget = budgets[req.tier];
    const url = `${FIGMA_API}${req.path}`;
    const init: RequestInit = {
      method: req.method,
      headers: {
        "X-Figma-Token": deps.token,
        ...(req.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(req.body === undefined ? {} : { body: JSON.stringify(req.body) }),
    };
    let waited = 0;
    const affords = (ms: number): boolean => waited + ms <= maxWaitMs;
    const wait = async (ms: number): Promise<void> => {
      if (ms <= 0) return;
      waited += ms;
      await sleep(ms);
    };

    for (let attempt = 1; ; attempt++) {
      // Price the slot, refuse it past the cap, take it — with no await in
      // between, so a call made alongside this one prices the slot after it.
      const t = now();
      const slot = budget.waitAt(t);
      if (!affords(slot)) {
        throw new FigmaRateLimitError(
          `Figma ${req.what}: paced — the next slot is ${seconds(slot)} away, past this call's ${seconds(maxWaitMs - waited)} wait`,
          slot,
        );
      }
      budget.take(t);
      await wait(slot);

      let res: Response;
      try {
        res = await transport(url, init, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      } catch (err) {
        if (isSubrequestBudgetError(err)) throw err;
        const failed = new FigmaRequestError(0, `Figma ${req.what} failed: ${messageOf(err)}`);
        const backoff = backoffFor(attempt);
        if (req.method !== "GET" || attempt >= attempts || !affords(backoff)) throw failed;
        await wait(backoff);
        continue;
      }

      if (res.status === 429) {
        const limited = rateLimited(req.what, res, now());
        await discard(res);
        const delay = Math.max(limited.retryAfterMs ?? 0, backoffFor(attempt));
        budget.emptyUntil(now() + delay);
        if (attempt >= attempts || !affords(delay)) throw limited;
        // The next attempt's slot is the wait: the tier is empty until then.
        continue;
      }

      if (!res.ok) {
        const refused = await requestError(req.what, res);
        const backoff = backoffFor(attempt);
        if (res.status < 500 || req.method !== "GET" || attempt >= attempts || !affords(backoff)) throw refused;
        await wait(backoff);
        continue;
      }

      if (req.method === "DELETE") {
        await discard(res);
        return undefined as T;
      }
      return body<T>(req.what, res);
    }
  }

  const file = (key: string): string => `/v1/files/${encodeURIComponent(key)}`;

  return {
    file: (key, opts = {}) =>
      call<FigmaFileResponse>(
        { what: "file", tier: 1, method: "GET", path: `${file(key)}${query({ ids: opts.ids, depth: opts.depth })}` },
        opts,
      ),
    fileMeta: (key, opts) =>
      call<FigmaFileMetaResponse>({ what: "file meta", tier: 3, method: "GET", path: `${file(key)}/meta` }, opts),
    nodes: (key, ids, opts = {}) =>
      call<FigmaNodesResponse>(
        {
          what: "nodes",
          tier: 1,
          method: "GET",
          path: `${file(key)}/nodes${query({ ids, depth: opts.depth, geometry: opts.geometry })}`,
        },
        opts,
      ),
    images: (key, ids, opts = {}) =>
      call<FigmaImagesResponse>(
        {
          what: "images",
          tier: 1,
          method: "GET",
          path: `/v1/images/${encodeURIComponent(key)}${query({ ids, format: opts.format, scale: opts.scale })}`,
        },
        opts,
      ),
    components: (key, opts) =>
      call<FigmaComponentsResponse>({ what: "components", tier: 3, method: "GET", path: `${file(key)}/components` }, opts),
    versions: (key, opts) =>
      call<FigmaVersionsResponse>({ what: "versions", tier: 2, method: "GET", path: `${file(key)}/versions` }, opts),
    comments: (key, opts) =>
      call<FigmaCommentsResponse>({ what: "comments", tier: 2, method: "GET", path: `${file(key)}/comments` }, opts),
    postComment: (key, message, at, opts) =>
      call<FigmaComment>(
        {
          what: "comment post",
          tier: 2,
          method: "POST",
          path: `${file(key)}/comments`,
          body: { message, ...(at ? { client_meta: at } : {}) },
        },
        opts,
      ),
    replyToComment: (key, rootCommentId, message, opts) =>
      call<FigmaComment>(
        {
          what: "comment reply",
          tier: 2,
          method: "POST",
          path: `${file(key)}/comments`,
          body: { message, comment_id: rootCommentId },
        },
        opts,
      ),
    teamFolders: (teamId, opts) =>
      call<FigmaTeamFoldersResponse>(
        { what: "team folders", tier: 2, method: "GET", path: `/v2/teams/${encodeURIComponent(teamId)}/folders` },
        opts,
      ),
    folderFiles: (folderId, opts) =>
      call<FigmaFolderFilesResponse>(
        { what: "folder files", tier: 2, method: "GET", path: `/v2/folders/${encodeURIComponent(folderId)}/files` },
        opts,
      ),
    devResources: (key, nodeIds, opts) =>
      call<FigmaDevResourcesResponse>(
        {
          what: "dev resources",
          tier: 2,
          method: "GET",
          path: `${file(key)}/dev_resources${query({ node_ids: nodeIds?.length ? nodeIds : undefined })}`,
        },
        opts,
      ),
    addDevResources: (links, opts) =>
      call<FigmaDevResourcesCreated>(
        { what: "dev resource add", tier: 2, method: "POST", path: "/v1/dev_resources", body: { dev_resources: links } },
        opts,
      ),
    removeDevResource: (key, devResourceId, opts) =>
      call<void>(
        {
          what: "dev resource remove",
          tier: 2,
          method: "DELETE",
          path: `${file(key)}/dev_resources/${encodeURIComponent(devResourceId)}`,
        },
        opts,
      ),
    teamWebhooks: (teamId, opts) =>
      call<FigmaWebhooksResponse>(
        { what: "webhooks", tier: 2, method: "GET", path: `/v2/webhooks${query({ context: "team", context_id: teamId })}` },
        opts,
      ),
    createWebhook: (input, opts) =>
      call<FigmaWebhook>({ what: "webhook create", tier: 2, method: "POST", path: "/v2/webhooks", body: input }, opts),
    webhookRequests: (webhookId, opts) =>
      call<FigmaWebhookRequestsResponse>(
        { what: "webhook requests", tier: 2, method: "GET", path: `/v2/webhooks/${encodeURIComponent(webhookId)}/requests` },
        opts,
      ),
  };
}

// ─── Pacing ──────────────────────────────────────────────────────────────────

interface TierBudget {
  /** How long a call made at `t` would wait for its slot. */
  waitAt(t: number): number;
  /** Take the slot `waitAt(t)` priced. */
  take(t: number): void;
  /** Figma refused: no slot before `until`, and no burst after it. */
  emptyUntil(until: number): void;
}

/**
 * One tier's budget as a virtual schedule: a burst of `perMinute` calls, then
 * one every 60/perMinute seconds. `due` is when the call after a full burst
 * is due, so a call waits until `due` less the burst.
 */
function tierBudget(perMinute: number): TierBudget {
  const interval = 60_000 / perMinute;
  const burst = interval * (perMinute - 1);
  let due = Number.NEGATIVE_INFINITY;
  return {
    waitAt: (t) => Math.max(0, Math.max(due, t) - burst - t),
    take(t) {
      due = Math.max(due, t) + interval;
    },
    emptyUntil(until) {
      due = Math.max(due, until + burst);
    },
  };
}

/** 1 s, then 2 s, then 4 s. */
function backoffFor(attempt: number): number {
  return BACKOFF_MS * 2 ** (attempt - 1);
}

// ─── Requests and responses ──────────────────────────────────────────────────

/**
 * `?k=v&…` over the values given. A value is URL-encoded; an id list has each
 * id encoded and the ids joined with literal commas, because Figma reads a
 * %2C-joined batch as one malformed id. Encoding each id is also what keeps a
 * pasted `node-id` from adding a parameter of its own to our request.
 */
function query(params: Record<string, string | number | readonly string[] | undefined>): string {
  const pairs: string[] = [];
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const encoded = typeof value === "object" ? value.map(encodeURIComponent).join(",") : encodeURIComponent(String(value));
    pairs.push(`${name}=${encoded}`);
  }
  return pairs.length ? `?${pairs.join("&")}` : "";
}

/** A 2xx's body. A 2xx carrying a non-null `err` (nodes, images) is a refusal. */
async function body<T>(what: string, res: Response): Promise<T> {
  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch (err) {
    // Not JSON, or the read was cut off (the attempt's timeout covers the body).
    throw new FigmaRequestError(res.status, `Figma ${what} ${res.status}: the body could not be read (${messageOf(err)})`);
  }
  const err = (parsed as { err?: unknown } | null)?.err;
  if (typeof err === "string" && err) {
    throw new FigmaRequestError(res.status, `Figma ${what} ${res.status}: ${err.slice(0, DETAIL_CHARS)}`);
  }
  return parsed as T;
}

/** A non-2xx, said with what Figma said about it. */
async function requestError(what: string, res: Response): Promise<FigmaRequestError> {
  const detail = detailOf(await res.text().catch(() => ""));
  return new FigmaRequestError(res.status, `Figma ${what} ${res.status}${detail ? `: ${detail}` : ""}`);
}

/** Figma's own words from an error body — `err` or `message` — else the text. */
function detailOf(text: string): string {
  try {
    const said = JSON.parse(text) as { err?: unknown; message?: unknown } | null;
    const words = typeof said?.err === "string" ? said.err : typeof said?.message === "string" ? said.message : "";
    if (words) return words.slice(0, DETAIL_CHARS);
  } catch {
    // Not JSON: the text itself.
  }
  return text.trim().slice(0, DETAIL_CHARS);
}

/** A 429, with what Figma's headers say about it. */
function rateLimited(what: string, res: Response, at: number): FigmaRateLimitError {
  const retryAfterMs = retryAfterOf(res.headers.get("retry-after"), at);
  return new FigmaRateLimitError(
    `Figma ${what} 429: rate limited${retryAfterMs === null ? "" : `, retry after ${seconds(retryAfterMs)}`}`,
    retryAfterMs,
    res.headers.get("x-figma-plan-tier"),
    res.headers.get("x-figma-rate-limit-type"),
  );
}

/** Retry-After in ms — Figma sends seconds; an HTTP date is read too. Null when absent or unreadable. */
function retryAfterOf(header: string | null, at: number): number | null {
  const value = header?.trim();
  if (!value) return null;
  const secs = Number(value);
  if (Number.isFinite(secs) && secs >= 0) return Math.ceil(secs * 1000);
  const when = Date.parse(value);
  return Number.isFinite(when) ? Math.max(0, when - at) : null;
}

/** Release a body the client will not read, so its connection is not held. */
async function discard(res: Response): Promise<void> {
  await res.body?.cancel().catch(() => undefined);
}

function seconds(ms: number): string {
  return `${Math.ceil(Math.max(0, ms) / 1000)}s`;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
