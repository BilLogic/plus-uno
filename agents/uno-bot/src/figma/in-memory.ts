// The Figma client in memory — the one fake every Figma job's tests use
// (#891, Seam 1). Seed it with the files, teams and folders a test needs, run
// the job against it, and read back what the job sent.
//
// It answers the way Figma does where a test could tell the difference, each
// rule from `research/figma-api-facts.md`:
//   • a reply goes to a root comment only — a reply to a reply is a 400;
//   • an unknown file, comment, team, folder or Dev Mode link is a 404;
//   • a node takes 10 Dev Mode links, and a URL it already has is refused —
//     both as an `errors` entry on a 200, as Figma refuses part of a batch;
//   • a team takes 20 webhooks, and the 21st is a 400;
//   • a webhook's passcode reads back as an empty string;
//   • a webhook's delivery history is what the test seeded, and an unknown
//     webhook's is a 404;
//   • a comment is posted as the token's owner (`me`), whoever asked;
//   • a file read to a `depth` stops that many levels below the document (1
//     is the pages alone), and one read for `ids` holds only the paths down to
//     those nodes, with their subtrees.
// Refusals are `FigmaRequestError`s worded like the REST client's.
//
// PURE: no `Env`, no fetch.

import type { FigmaNode } from "../integrations/figma-reading";
import {
  FigmaRequestError,
  type FigmaClient,
  type FigmaComment,
  type FigmaComponentsResponse,
  type FigmaDevResource,
  type FigmaFolder,
  type FigmaFolderFile,
  type FigmaMethod,
  type FigmaUser,
  type FigmaVersionsResponse,
  type FigmaWebhook,
  type FigmaWebhookRequest,
} from "./client";

/** A Dev Mode link limit: Figma's, per node. */
const MAX_LINKS_PER_NODE = 10;
/** A webhook limit: Figma's, per team. */
const MAX_WEBHOOKS_PER_TEAM = 20;

/** What a seeded file holds. Seeding a file again replaces only the fields given. */
export interface SeedFile {
  name?: string;
  lastModified?: string;
  document?: FigmaNode;
  /** The nodes `/nodes` and `/images` answer for, by id. */
  nodes?: Record<string, FigmaNode>;
  /** The `/components` body. */
  components?: FigmaComponentsResponse;
  /** The `/versions` body. */
  versions?: FigmaVersionsResponse;
  comments?: FigmaComment[];
  devResources?: FigmaDevResource[];
  /** Who made the file, as `/meta` says. */
  creator?: FigmaUser;
}

/** One call the fake answered or refused. */
export interface FigmaCall {
  method: FigmaMethod;
  args: unknown[];
}

export interface InMemoryFigma extends FigmaClient {
  /** Seed a file, or change one already seeded. */
  seedFile(fileKey: string, file: SeedFile): void;
  /** Seed a team's top-level folders. */
  seedTeam(teamId: string, folders: FigmaFolder[]): void;
  /** Seed a folder's files. */
  seedFolder(folderId: string, files: FigmaFolderFile[]): void;
  /** Seed what Figma delivered to a webhook, newest first or in any order. */
  seedWebhookRequests(webhookId: string, requests: FigmaWebhookRequest[]): void;
  /** Every call, in order, refused ones included. */
  calls(): FigmaCall[];
  /** The calls that changed Figma — posts, replies, link adds and removes, webhooks created. */
  writes(): FigmaCall[];
  /** The next call to `method` throws `error` instead of answering. */
  failNext(method: FigmaMethod, error: unknown): void;
}

const WRITES: ReadonlySet<FigmaMethod> = new Set<FigmaMethod>([
  "postComment",
  "replyToComment",
  "addDevResources",
  "removeDevResource",
  "createWebhook",
]);

interface StoredFile {
  name: string;
  lastModified: string;
  document: FigmaNode;
  nodes: Record<string, FigmaNode>;
  components: FigmaComponentsResponse;
  versions: FigmaVersionsResponse;
  comments: FigmaComment[];
  devResources: FigmaDevResource[];
  creator: FigmaUser | null;
}

/** The tree cut `depth` levels below `node`, as Figma's `depth` cuts it. */
function toDepth(node: FigmaNode, depth: number): FigmaNode {
  if (depth <= 0) {
    const { children: _cut, ...rest } = node;
    return rest;
  }
  return node.children ? { ...node, children: node.children.map((c) => toDepth(c, depth - 1)) } : node;
}

/** Only the paths from `node` down to `ids`, with their subtrees; null when none is under it. */
function toPaths(node: FigmaNode, ids: ReadonlySet<string>): FigmaNode | null {
  if (node.id && ids.has(node.id)) return node;
  const kept = (node.children ?? []).map((c) => toPaths(c, ids)).filter((c): c is FigmaNode => c !== null);
  return kept.length ? { ...node, children: kept } : null;
}

/**
 * A Figma that lives in memory.
 *
 * @param opts - `me`, the token's owner, who every posted comment is by;
 *   `now`, the clock comments are stamped with
 */
export function createInMemoryFigma(opts: { me?: FigmaUser; now?: () => number } = {}): InMemoryFigma {
  const me = opts.me ?? { id: "1000000001", handle: "token owner" };
  const now = opts.now ?? (() => Date.now());
  const files = new Map<string, StoredFile>();
  const teams = new Map<string, FigmaFolder[]>();
  const folders = new Map<string, FigmaFolderFile[]>();
  const webhooks: FigmaWebhook[] = [];
  const deliveries = new Map<string, FigmaWebhookRequest[]>();
  const log: Array<FigmaCall & { landed: boolean }> = [];
  const failures = new Map<FigmaMethod, unknown[]>();
  let seq = 0;
  const nextId = (prefix: string): string => `${prefix}${++seq}`;
  // Nothing handed in or out is shared, so a test cannot reach into the fake's
  // state through a value it kept.
  const clone = <T>(value: T): T => structuredClone(value);

  /** Record the call, then throw a queued failure if one is waiting. */
  function enter(method: FigmaMethod, args: unknown[]): FigmaCall & { landed: boolean } {
    const entry = { method, args: clone(args), landed: false };
    log.push(entry);
    const queued = failures.get(method);
    if (queued?.length) throw queued.shift();
    return entry;
  }

  function fileOf(what: string, key: string): StoredFile {
    const found = files.get(key);
    if (!found) throw new FigmaRequestError(404, `Figma ${what} 404: Not found`);
    return found;
  }

  function landed<T>(entry: { landed: boolean }, value: T): T {
    entry.landed = true;
    return clone(value);
  }

  return {
    seedFile(fileKey, seed) {
      const current = files.get(fileKey) ?? {
        name: fileKey,
        lastModified: new Date(now()).toISOString(),
        document: { name: "Document", type: "DOCUMENT", children: [] },
        nodes: {},
        components: { meta: { components: [] } },
        versions: { versions: [] },
        comments: [],
        devResources: [],
        creator: null,
      };
      files.set(fileKey, {
        name: seed.name ?? current.name,
        lastModified: seed.lastModified ?? current.lastModified,
        document: clone(seed.document ?? current.document),
        nodes: clone(seed.nodes ?? current.nodes),
        components: clone(seed.components ?? current.components),
        versions: clone(seed.versions ?? current.versions),
        comments: clone(seed.comments ?? current.comments),
        devResources: clone(seed.devResources ?? current.devResources),
        creator: clone(seed.creator ?? current.creator),
      });
    },
    seedTeam(teamId, list) {
      teams.set(teamId, clone(list));
    },
    seedFolder(folderId, list) {
      folders.set(folderId, clone(list));
    },
    seedWebhookRequests(webhookId, list) {
      deliveries.set(webhookId, clone(list));
    },
    calls: () => log.map(({ method, args }) => ({ method, args: clone(args) })),
    writes: () => log.filter((c) => c.landed && WRITES.has(c.method)).map(({ method, args }) => ({ method, args: clone(args) })),
    failNext(method, error) {
      failures.set(method, [...(failures.get(method) ?? []), error]);
    },

    async file(key, o) {
      const entry = enter("file", [key, o]);
      const f = fileOf("file", key);
      let document = f.document;
      if (o?.ids?.length) document = toPaths(document, new Set(o.ids)) ?? { ...document, children: [] };
      if (o?.depth !== undefined) document = toDepth(document, o.depth);
      return landed(entry, { name: f.name, lastModified: f.lastModified, document });
    },
    async fileMeta(key, o) {
      const entry = enter("fileMeta", [key, o]);
      const f = fileOf("file meta", key);
      return landed(entry, { file: { name: f.name, ...(f.creator ? { creator: f.creator } : {}), last_touched_at: f.lastModified } });
    },
    async nodes(key, ids, o) {
      const entry = enter("nodes", [key, ids, o]);
      const f = fileOf("nodes", key);
      // An id the file does not hold comes back null, as Figma's does.
      const nodes = Object.fromEntries(ids.map((id) => [id, f.nodes[id] ? { document: f.nodes[id] } : null]));
      return landed(entry, { name: f.name, lastModified: f.lastModified, err: null, nodes });
    },
    async images(key, ids, o) {
      const entry = enter("images", [key, ids, o]);
      const f = fileOf("images", key);
      const format = o?.format ?? "png";
      const images = Object.fromEntries(
        ids.map((id) => [id, f.nodes[id] ? `https://figma-images.example/${key}/${encodeURIComponent(id)}.${format}` : null]),
      );
      return landed(entry, { err: null, images });
    },
    async components(key, o) {
      const entry = enter("components", [key, o]);
      return landed(entry, fileOf("components", key).components);
    },
    async versions(key, o) {
      const entry = enter("versions", [key, o]);
      return landed(entry, fileOf("versions", key).versions);
    },
    async comments(key, o) {
      const entry = enter("comments", [key, o]);
      return landed(entry, { comments: fileOf("comments", key).comments });
    },
    async postComment(key, message, at, o) {
      const entry = enter("postComment", [key, message, at, o]);
      const f = fileOf("comment post", key);
      const comment: FigmaComment = {
        id: nextId("comment-"),
        file_key: key,
        parent_id: "",
        user: me,
        created_at: new Date(now()).toISOString(),
        resolved_at: null,
        message,
        client_meta: at ?? null,
        order_id: String(f.comments.filter((c) => !c.parent_id).length + 1),
      };
      f.comments.push(comment);
      return landed(entry, comment);
    },
    async replyToComment(key, rootCommentId, message, o) {
      const entry = enter("replyToComment", [key, rootCommentId, message, o]);
      const f = fileOf("comment reply", key);
      const root = f.comments.find((c) => c.id === rootCommentId);
      if (!root) throw new FigmaRequestError(404, "Figma comment reply 404: Comment not found");
      if (root.parent_id) {
        throw new FigmaRequestError(400, "Figma comment reply 400: you cannot reply to a comment that is a reply itself");
      }
      const reply: FigmaComment = {
        id: nextId("comment-"),
        file_key: key,
        parent_id: root.id,
        user: me,
        created_at: new Date(now()).toISOString(),
        resolved_at: null,
        message,
        client_meta: null,
        order_id: null,
      };
      f.comments.push(reply);
      return landed(entry, reply);
    },
    async teamFolders(teamId, o) {
      const entry = enter("teamFolders", [teamId, o]);
      const list = teams.get(teamId);
      if (!list) throw new FigmaRequestError(404, "Figma team folders 404: Not found");
      return landed(entry, { folders: list });
    },
    async folderFiles(folderId, o) {
      const entry = enter("folderFiles", [folderId, o]);
      const list = folders.get(folderId);
      if (!list) throw new FigmaRequestError(404, "Figma folder files 404: Not found");
      return landed(entry, { files: list });
    },
    async devResources(key, nodeIds, o) {
      const entry = enter("devResources", [key, nodeIds, o]);
      const all = fileOf("dev resources", key).devResources;
      const wanted = nodeIds?.length ? new Set(nodeIds) : null;
      return landed(entry, { dev_resources: wanted ? all.filter((r) => wanted.has(r.node_id)) : all });
    },
    async addDevResources(links, o) {
      const entry = enter("addDevResources", [links, o]);
      const created: FigmaDevResource[] = [];
      const errors: { file_key: string; node_id: string; error: string }[] = [];
      for (const link of links) {
        const f = files.get(link.file_key);
        const refuse = (error: string): void => void errors.push({ file_key: link.file_key, node_id: link.node_id, error });
        if (!f) {
          refuse("File not found");
          continue;
        }
        const onNode = f.devResources.filter((r) => r.node_id === link.node_id);
        if (onNode.length >= MAX_LINKS_PER_NODE) {
          refuse(`The node already has the maximum of ${MAX_LINKS_PER_NODE} dev resources`);
          continue;
        }
        if (onNode.some((r) => r.url === link.url)) {
          refuse("Another dev resource for the node has the same url");
          continue;
        }
        const resource: FigmaDevResource = { id: nextId("dev-resource-"), ...link };
        f.devResources.push(resource);
        created.push(resource);
      }
      return landed(entry, { links_created: created, errors });
    },
    async removeDevResource(key, devResourceId, o) {
      const entry = enter("removeDevResource", [key, devResourceId, o]);
      const f = fileOf("dev resource remove", key);
      const at = f.devResources.findIndex((r) => r.id === devResourceId);
      if (at < 0) throw new FigmaRequestError(404, "Figma dev resource remove 404: Not found");
      f.devResources.splice(at, 1);
      landed(entry, undefined);
    },
    async teamWebhooks(teamId, o) {
      const entry = enter("teamWebhooks", [teamId, o]);
      const hooks = webhooks.filter((w) => w.context === "team" && w.context_id === teamId);
      return landed(entry, { webhooks: hooks.map((w) => ({ ...w, passcode: "" })) });
    },
    async createWebhook(input, o) {
      const entry = enter("createWebhook", [input, o]);
      const same = webhooks.filter((w) => w.context === input.context && w.context_id === input.context_id);
      if (input.context === "team" && same.length >= MAX_WEBHOOKS_PER_TEAM) {
        throw new FigmaRequestError(400, `Figma webhook create 400: a team takes at most ${MAX_WEBHOOKS_PER_TEAM} webhooks`);
      }
      const hook: FigmaWebhook = {
        id: nextId("webhook-"),
        event_type: input.event_type,
        context: input.context,
        context_id: input.context_id,
        endpoint: input.endpoint,
        passcode: input.passcode,
        status: input.status ?? "ACTIVE",
        description: input.description ?? null,
      };
      webhooks.push(hook);
      return landed(entry, { ...hook, passcode: "" });
    },
    async webhookRequests(webhookId, o) {
      const entry = enter("webhookRequests", [webhookId, o]);
      if (!webhooks.some((w) => w.id === webhookId) && !deliveries.has(webhookId)) {
        throw new FigmaRequestError(404, "Figma webhook requests 404: Not found");
      }
      return landed(entry, { requests: deliveries.get(webhookId) ?? [] });
    },
  };
}
