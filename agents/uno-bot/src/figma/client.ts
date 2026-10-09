// The Figma client — every Figma REST call uno-bot makes, as one port (#892).
//
// Before this module Figma was reached from two places with two policies: the
// library poll's `figmaGet` retried twice on a fixed second and swallowed a
// budget stop, and the frame read and image render behind `source_read` and
// vision did not retry at all, so one 429 read as "couldn't read it". Every
// personal token on Bill's account draws from ONE budget per rate-limit tier,
// so the calls have to be paced together — which needs them in one place.
//
//   • `client.ts` (this file) — the port: methods, response shapes, errors.
//     PURE: no `Env`, no fetch.
//   • `rest.ts` — the client over Figma's REST API: paced per tier, retried
//     on a 429. The only file in `src/` that names api.figma.com, and
//     `scripts/check-fetch.mjs` fails the build on any other.
//   • `in-memory.ts` — the one shared fake every Figma job's tests use
//     (#891, Seam 1). PURE.
//   • `production.ts` — `figmaClientFor(env)`, the one place `Env` enters.
//
// Each method returns Figma's documented response body, typed only as far as
// uno-bot reads it. Endpoint facts — which exist on this token, their fields
// and limits — are in `research/figma-api-facts.md` (branch
// `research/figma-api-facts`, checked 2026-09-30).

import type { FigmaNode } from "../integrations/figma-reading";

/** The rate-limit tier Figma files an endpoint under. */
export type FigmaTier = 1 | 2 | 3;

/**
 * Bounds on one call. Every method takes them as its last argument.
 *
 * `maxWaitMs` covers everything the call would sleep for — a pacing slot and
 * 429 backoff together. A wait that would cross it is refused at once, with a
 * `FigmaRateLimitError` and no sleep, so a caller with a deadline of its own
 * (a card posted under `waitUntil`, a reply someone is waiting on) is never
 * held past it.
 */
export interface FigmaCallOptions {
  /** Abort one attempt after this long. Default 15 s. */
  timeoutMs?: number;
  /** The most the call may wait, pacing and backoff together. Default 60 s. */
  maxWaitMs?: number;
  /** Attempts in all, the first included. Default 3. */
  attempts?: number;
}

/** GET /v1/files/:key */
export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  version?: string;
  document: FigmaNode;
}

/**
 * GET /v1/files/:key/meta, as far as uno-bot reads it: the file without its
 * tree. `creator` is who made the file — a User, so a handle and an id, never
 * an email (developers.figma.com/docs/rest-api/files-endpoints, read
 * 2026-10-08; not yet probed on this token).
 */
export interface FigmaFileMetaResponse {
  file: {
    name: string;
    creator?: FigmaUser;
    folder_name?: string;
    last_touched_at?: string;
  };
}

/** One entry of a /nodes response; null when the id names nothing in the file. */
export interface FigmaNodeEntry {
  document?: FigmaNode;
}

/** GET /v1/files/:key/nodes */
export interface FigmaNodesResponse {
  name?: string;
  lastModified?: string;
  err?: string | null;
  nodes?: Record<string, FigmaNodeEntry | null | undefined>;
}

/** GET /v1/images/:key — a short-lived signed URL per node, or null when it would not render. */
export interface FigmaImagesResponse {
  err?: string | null;
  images?: Record<string, string | null>;
}

/** GET /v1/files/:key/components, as far as the poll and the precedence check read it. */
export interface FigmaComponentsResponse {
  meta?: {
    components?: {
      key: string;
      name: string;
      description?: string;
      node_id: string;
      containing_frame?: { name?: string; nodeId?: string; containingComponentSet?: { name?: string; nodeId?: string } };
    }[];
  };
}

/** GET /v1/files/:key/versions, newest first. Autosaves have a null label and description. */
export interface FigmaVersionsResponse {
  versions?: {
    id: string;
    label?: string | null;
    description?: string | null;
    created_at: string;
    user?: { handle?: string };
  }[];
}

/** A Figma user. No email: only `/v1/me` carries one. */
export interface FigmaUser {
  id: string;
  handle: string;
  img_url?: string;
}

/** Where a new root comment is pinned: a node, and an offset inside it. */
export interface FigmaCommentPin {
  node_id: string;
  node_offset: { x: number; y: number };
}

export interface FigmaComment {
  id: string;
  file_key: string;
  /** The root's id on a reply; empty or absent on a root. Threads are one level deep. */
  parent_id?: string | null;
  user: FigmaUser;
  created_at: string;
  resolved_at?: string | null;
  message: string;
  /** A root's pin. A reply carries none — it inherits its root's. */
  client_meta?: Partial<FigmaCommentPin> | null;
  order_id?: string | null;
}

/** GET /v1/files/:key/comments */
export interface FigmaCommentsResponse {
  comments: FigmaComment[];
}

export interface FigmaFolder {
  id: string;
  name: string;
  parent_folder_id?: string | null;
}

/** GET /v2/teams/:id/folders — top-level folders only; nested ones need a walk. */
export interface FigmaTeamFoldersResponse {
  name?: string;
  folders: FigmaFolder[];
}

export interface FigmaFolderFile {
  key: string;
  name: string;
  last_modified: string;
  thumbnail_url?: string;
}

/** GET /v2/folders/:id/files */
export interface FigmaFolderFilesResponse {
  name?: string;
  files: FigmaFolderFile[];
}

/** A Dev Mode link. It has no creator field, so who added it can only live in `name`. */
export interface FigmaDevResource {
  id: string;
  name: string;
  url: string;
  file_key: string;
  node_id: string;
}

/** GET /v1/files/:key/dev_resources */
export interface FigmaDevResourcesResponse {
  dev_resources: FigmaDevResource[];
}

export type FigmaNewDevResource = Omit<FigmaDevResource, "id">;

/**
 * POST /v1/dev_resources. A partial refusal is a 200: the links Figma took,
 * and one error per link it would not (a node already at its 10, or a URL the
 * node already has).
 */
export interface FigmaDevResourcesCreated {
  links_created: FigmaDevResource[];
  errors: { file_key?: string | null; node_id?: string | null; error: string }[];
}

export type FigmaWebhookEvent =
  | "PING"
  | "FILE_UPDATE"
  | "FILE_VERSION_UPDATE"
  | "FILE_DELETE"
  | "LIBRARY_PUBLISH"
  | "FILE_COMMENT"
  | "DEV_MODE_STATUS_UPDATE";

export interface FigmaWebhook {
  id: string;
  event_type: FigmaWebhookEvent;
  context: "team" | "project" | "file";
  context_id: string;
  endpoint: string;
  /** Required to create one; Figma reads it back as an empty string. */
  passcode: string;
  status: "ACTIVE" | "PAUSED";
  description?: string | null;
}

/** GET /v2/webhooks?context=team&context_id=… */
export interface FigmaWebhooksResponse {
  webhooks: FigmaWebhook[];
}

/**
 * One delivery Figma made to a webhook, as far as the setup reads it. The
 * payload carries the passcode and any comment's text, so a reader takes its
 * `event_type` and nothing else.
 */
export interface FigmaWebhookRequest {
  webhook_id: string;
  request_info: { endpoint?: string; payload?: { event_type?: string }; sent_at: string };
  /** Null when the endpoint never answered. */
  response_info: { status: string | number; received_at?: string } | null;
  error_msg?: string | null;
}

/** GET /v2/webhooks/:id/requests — the deliveries of the last seven days. */
export interface FigmaWebhookRequestsResponse {
  requests: FigmaWebhookRequest[];
}

/** POST /v2/webhooks. A team takes 20 at most, and only a team admin may create one. */
export interface FigmaNewWebhook {
  event_type: FigmaWebhookEvent;
  context: "team" | "project" | "file";
  context_id: string;
  endpoint: string;
  /** At most 100 characters; echoed in every delivery. */
  passcode: string;
  /** PAUSED skips the PING Figma otherwise sends on creation. */
  status?: "ACTIVE" | "PAUSED";
  description?: string;
}

/** Every Figma REST call uno-bot makes. */
export interface FigmaClient {
  /**
   * The whole file, `depth` levels of it (1 is the pages alone), or — with
   * `ids` — only the path from the document down to those nodes and the
   * subtrees under them. Tier 1.
   */
  file(fileKey: string, opts?: FigmaCallOptions & { depth?: number; ids?: readonly string[] }): Promise<FigmaFileResponse>;
  /** The file's name and creator, without its tree. Tier 3. */
  fileMeta(fileKey: string, opts?: FigmaCallOptions): Promise<FigmaFileMetaResponse>;
  /** Some nodes of a file, by id. Tier 1. */
  nodes(
    fileKey: string,
    ids: readonly string[],
    opts?: FigmaCallOptions & { depth?: number; geometry?: "paths" },
  ): Promise<FigmaNodesResponse>;
  /** Nodes rendered to images, by id. Tier 1. */
  images(
    fileKey: string,
    ids: readonly string[],
    opts?: FigmaCallOptions & { format?: "png" | "jpg" | "svg" | "pdf"; scale?: number },
  ): Promise<FigmaImagesResponse>;
  /** The file's published components. Tier 3. */
  components(fileKey: string, opts?: FigmaCallOptions): Promise<FigmaComponentsResponse>;
  /** The file's version history, newest first. Tier 2. */
  versions(fileKey: string, opts?: FigmaCallOptions): Promise<FigmaVersionsResponse>;
  /** Every comment on the file, roots and replies. Tier 2. */
  comments(fileKey: string, opts?: FigmaCallOptions): Promise<FigmaCommentsResponse>;
  /** A new root comment, pinned to a node when `at` is given. Posts as the token's owner. Tier 2. */
  postComment(fileKey: string, message: string, at?: FigmaCommentPin, opts?: FigmaCallOptions): Promise<FigmaComment>;
  /** A reply. `rootCommentId` must be a root: Figma refuses a reply to a reply. Tier 2. */
  replyToComment(fileKey: string, rootCommentId: string, message: string, opts?: FigmaCallOptions): Promise<FigmaComment>;
  /** A team's top-level folders. Tier 2. */
  teamFolders(teamId: string, opts?: FigmaCallOptions): Promise<FigmaTeamFoldersResponse>;
  /** The files in one folder. Tier 2. */
  folderFiles(folderId: string, opts?: FigmaCallOptions): Promise<FigmaFolderFilesResponse>;
  /** A file's Dev Mode links, optionally only those on some nodes. Tier 2. */
  devResources(fileKey: string, nodeIds?: readonly string[], opts?: FigmaCallOptions): Promise<FigmaDevResourcesResponse>;
  /** Add Dev Mode links. A partial refusal is a 200 carrying `errors`. Tier 2. */
  addDevResources(links: readonly FigmaNewDevResource[], opts?: FigmaCallOptions): Promise<FigmaDevResourcesCreated>;
  /** Remove one Dev Mode link. Tier 2. */
  removeDevResource(fileKey: string, devResourceId: string, opts?: FigmaCallOptions): Promise<void>;
  /** A team's notification subscriptions. Tier 2. */
  teamWebhooks(teamId: string, opts?: FigmaCallOptions): Promise<FigmaWebhooksResponse>;
  /** Subscribe to a notification. Tier 2. */
  createWebhook(input: FigmaNewWebhook, opts?: FigmaCallOptions): Promise<FigmaWebhook>;
  /** What Figma delivered to one subscription in the last seven days, and how each was answered. Tier 2. */
  webhookRequests(webhookId: string, opts?: FigmaCallOptions): Promise<FigmaWebhookRequestsResponse>;
}

/** The name of one client method, for the fake's inspectors and failure switch. */
export type FigmaMethod = keyof FigmaClient;

/**
 * A Figma refusal: a non-2xx, a 2xx carrying an `err`, or a network failure
 * (`status` 0). The message reads `Figma <what> <status>: <detail>`.
 */
export class FigmaRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FigmaRequestError";
  }
}

/**
 * The rate budget refused the call — Figma's 429 still standing after the
 * retries, or a wait the call could not afford. Its own class so a job can
 * say "try later" rather than "Figma refused".
 */
export class FigmaRateLimitError extends FigmaRequestError {
  constructor(
    message: string,
    /** How long the budget asked for; null when Figma gave no Retry-After. */
    readonly retryAfterMs: number | null,
    /** `X-Figma-Plan-Tier` on Figma's 429; null when the client refused it itself. */
    readonly planTier: string | null = null,
    /** `X-Figma-Rate-Limit-Type` on Figma's 429; null when the client refused it itself. */
    readonly rateLimitType: string | null = null,
  ) {
    super(429, message);
    this.name = "FigmaRateLimitError";
  }
}
