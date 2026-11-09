// github_read executor — READ-ONLY. Read a file's contents or list a directory
// (to check what exists, e.g. a DS component folder), or search the code, in any repo on the Worker's repo
// list. Runs inline in the agent loop (no gate).
//
// `lookup` answers a design-system question before any repo is resolved: the
// hosted DS MCP first (`integrations/ds-mcp.ts`, one subrequest), the facts
// baked into the Worker (`integrations/ds-facts.ts`) when it misses.
//
// The model may name a `repo`; it reaches GitHub only as the entry the resolver
// hands back, so a repo off the list is refused here, naming the list, and
// never fetched.
//
// IT TAKES NAMED DEPENDENCIES — the resolver and the reader — so `readGithub`
// is driven in `tests/github-read.test.ts` with fakes, and `Env` enters only in
// `executeGithubRead`, the binding at the foot of this file.

import type { Env } from "../types";
import {
  githubReadPath,
  githubSearchCode,
  resolveRepoFor,
  type GithubCodeHit,
  type GithubReadResult,
  type RepoEntry,
  type RepoResolution,
} from "../integrations/github";
import { isWithheldRepoPath, WITHHELD_NOTE } from "../integrations/repo-read-guard";
import { storybookDocFor, type StorybookDoc } from "../integrations/storybook-docs";
import { dsFacts } from "../integrations/ds-facts";
import { DS_SECTIONS, dsMcpClient, type DsMcpClient, type DsMcpMiss, type DsSection } from "../integrations/ds-mcp";
import { budgetHeadroom, countedFetch } from "../net";

/** A token role can name hundreds (`ds` is every color): the rest are counted, not listed. */
const TOKEN_LIMIT = 60;

const LOOKUP_NOTE =
  "From the design system's facts, as the IDE reads them. `exists` is importable with `import`; `not-here` is a name this system does not have — write `use`'s name and its import instead; `unknown` means it does not exist here — say so, and offer `near` if there is one. A prop's description and a component's full doc are read by path.";

const HOSTED_NOTE =
  "From the released design system, the one the production Storybook shows. Ground the answer in this text and name components as it does; a not-here name in it comes with what to use instead.";

const WORDS_FALLBACK_NOTE =
  "The hosted lookup did not answer, and the built-in facts match names only, so `unknown` here is not an absence: read design-system/agent-views/components/index.md by path and pick from it, or look up a name you find there.";

export interface DsLookupOptions {
  /** The hosted DS MCP; absent, the built-in facts answer alone. */
  ds?: DsMcpClient;
  /** One part of a named record (`ds_get`'s `section`). */
  section?: DsSection;
}

type Facts = ReturnType<typeof dsFacts>;
type Found = ReturnType<Facts["find"]>;

/**
 * What a design-system question is, decided from the built-in facts alone,
 * before anything is spent:
 *
 *   token-role  a token role (`stack`): answered from the built-in facts, no call
 *   get         a name the facts know, or a token (`--stack-md`): `ds_get`
 *   find        a task in words: `ds_find`
 *
 * `found` is the built-in answer the facts give when the hosted call is not made or misses.
 */
export type DsQuery =
  | { kind: "token-role"; q: string; found: Found; tokens: ReturnType<Facts["tokens"]> }
  | { kind: "get"; q: string; found: Found | null; name: string }
  | { kind: "find"; q: string; found: Found | null };

export function classifyDsQuery(q: string, facts: Facts): DsQuery {
  const found = q.startsWith("--") ? null : facts.find(q);
  const known = found !== null && found.answer.status !== "unknown";
  if (found && !known && !q.includes(".")) {
    const tokens = facts.tokens(q);
    if (tokens.length) return { kind: "token-role", q, found, tokens };
  }
  if (q.startsWith("--") || known) {
    // `ds_get` takes a prop, not a prop's value: `Button.appearance=primary` asks for `Button.appearance`.
    return { kind: "get", q, found, name: (known ? found.answer.name : q).split("=")[0]! };
  }
  return { kind: "find", q, found };
}

/** The answer from the facts baked into the Worker; `fallback` is why the hosted call missed, when one was made. */
function answerFromFacts(query: string, asked: DsQuery, facts: Facts, fallback?: DsMcpMiss): string {
  const builtIn = { source: "built-in", ...(fallback ? { fallback } : {}) };
  const { found } = asked;
  if (!found) {
    return JSON.stringify({ ok: true, lookup: query, ...builtIn, tokens: facts.tokens(asked.q), note: LOOKUP_NOTE });
  }
  if (asked.kind === "token-role") {
    return JSON.stringify({
      ok: true,
      lookup: query,
      ...builtIn,
      tokens: asked.tokens.slice(0, TOKEN_LIMIT),
      ...(asked.tokens.length > TOKEN_LIMIT ? { more: asked.tokens.length - TOKEN_LIMIT } : {}),
      note: LOOKUP_NOTE,
    });
  }
  return JSON.stringify({
    ok: true,
    lookup: query,
    ...builtIn,
    answer: found.answer,
    ...(found.use.length ? { use: found.use } : {}),
    ...(found.near.length ? { near: found.near } : {}),
    note: fallback && asked.kind === "find" ? WORDS_FALLBACK_NOTE : LOOKUP_NOTE,
  });
}

/**
 * A design-system question, asked of the hosted MCP first and answered from the
 * facts baked into the Worker when it misses. `classifyDsQuery` decides which
 * call it is; a token role makes none. One subrequest at most: the single
 * `get` or `find` below (`integrations/ds-mcp.ts`).
 */
export async function lookupDesignSystem(query: string, opts: DsLookupOptions = {}): Promise<string> {
  const facts = dsFacts();
  const asked = classifyDsQuery(query.trim(), facts);
  let fallback: DsMcpMiss | undefined;
  if (opts.ds && asked.kind !== "token-role") {
    const hosted = asked.kind === "get" ? await opts.ds.get(asked.name, opts.section) : await opts.ds.find(asked.q);
    const tool = asked.kind === "get" ? "ds_get" : "ds_find";
    if (hosted.ok) return JSON.stringify({ ok: true, lookup: query, source: "hosted", tool, text: hosted.text, note: HOSTED_NOTE });
    fallback = hosted.reason;
  }
  return answerFromFacts(query, asked, facts, fallback);
}


export interface GithubReadDeps {
  /** The model's `repo` input, resolved against the repo list. */
  resolveRepo(requested: unknown): RepoResolution;
  readPath(target: RepoEntry, path: string, ref?: string): Promise<GithubReadResult>;
  searchCode(target: RepoEntry, query: string): Promise<GithubCodeHit[]>;
  /** The Storybook docs page of the component a path in the default repo
   *  belongs to; absent, the baked map (`integrations/storybook-docs.ts`). */
  storybookDoc?(path: string): StorybookDoc | null;
  /** The hosted DS MCP `lookup` asks first; absent, the built-in facts answer alone. */
  ds?: DsMcpClient;
}

export async function readGithub(input: Record<string, unknown>, deps: GithubReadDeps): Promise<string> {
  const path = typeof input.path === "string" ? input.path.trim() : "";
  const ref = typeof input.ref === "string" ? input.ref.trim() : undefined;
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const lookup = typeof input.lookup === "string" ? input.lookup.trim() : "";
  if (lookup) {
    // `examples` is Best practices' old name; the hosted lookup still reads it as `practices`.
    const asked = input.section === "examples" ? "practices" : input.section;
    const section = DS_SECTIONS.find((s) => s === asked);
    return lookupDesignSystem(lookup, { ...(deps.ds ? { ds: deps.ds } : {}), ...(section ? { section } : {}) });
  }

  const target = deps.resolveRepo(input.repo);
  if (!target.ok) {
    return JSON.stringify({
      ok: false,
      error: target.error,
      note: "Say which repos you can reach, from the error, and ask which one they meant.",
    });
  }
  const repo = target.entry.repo;
  // The eval corpus is the harness repo's — the default — and nobody else's.
  const withheldHere = (p: string) => target.isDefault && isWithheldRepoPath(p);

  // Search mode (added 2026-07-10): find WHERE something lives, then read it
  // by path. Replaces the hosted GitHub MCP's code search in gemini mode.
  if (search) {
    try {
      const allHits = await deps.searchCode(target.entry, search);
      // The eval corpus is filtered out of results too, not just out of
      // direct reads: a search that returns the path is half the answer.
      const hits = allHits.filter((hit) => !withheldHere(hit?.path ?? ""));
      const withheld = allHits.length - hits.length;
      return JSON.stringify({
        ok: true,
        repo,
        search,
        count: hits.length,
        hits,
        ...(withheld > 0 ? { withheld, withheld_note: WITHHELD_NOTE } : {}),
        note: hits.length
          ? "Code-search hits (path + github.com link). Read the promising ones by path; link files as github.com URLs in replies."
          : "No code-search hits — the term may not appear in the repo; say so rather than guessing.",
      });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        repo,
        error: err instanceof Error ? err.message : String(err),
        note: "Code search failed — fall back to reading likely paths directly.",
      });
    }
  }

  if (!path) return JSON.stringify({ ok: false, error: "missing 'path' (or use 'search', or 'lookup' for a design-system name)" });
  if (withheldHere(path)) {
    return JSON.stringify({ ok: false, error: `${path} is withheld`, note: WITHHELD_NOTE });
  }

  try {
    const r = await deps.readPath(target.entry, path, ref);
    // The registry the docs map is baked from is the default repo's, so only
    // its paths have a Storybook page (#1563).
    const doc = target.isDefault ? (deps.storybookDoc ?? storybookDocFor)(r.path) : null;
    const storybook = doc ? { storybook: doc } : {};
    const storybookNote = doc
      ? " Its Storybook docs page is `storybook.url`: link that one when you name the Storybook page, never a Storybook link you build."
      : "";
    if (r.kind === "dir") {
      return JSON.stringify({
        ok: true,
        repo,
        path: r.path,
        url: githubLink(repo, "tree", r.path, ref),
        kind: "dir",
        entries: r.entries,
        ...storybook,
        note: `Directory listing — use it to confirm what exists (e.g. a DS component folder). Link it at its \`url\`.${storybookNote}`,
      });
    }
    return JSON.stringify({
      ok: true,
      repo,
      path: r.path,
      url: githubLink(repo, "blob", r.path, ref),
      kind: "file",
      content: r.text,
      truncated: r.truncated,
      ...storybook,
      note: `File contents from the repo. Ground your answer in this and link it at its \`url\`.${storybookNote}`,
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      repo,
      error: err instanceof Error ? err.message : String(err),
      note: "Couldn't read that repo path — tell the user; don't answer from memory.",
    });
  }
}

/**
 * The github.com page of what a path read read: `blob` for a file, `tree` for
 * a directory. A read that named no ref read the default branch, which `HEAD`
 * names on github.com whatever that branch is called.
 */
function githubLink(repo: string, kind: "blob" | "tree", path: string, ref?: string): string {
  return `https://github.com/${repo}/${kind}/${encodeURIComponent(ref || "HEAD")}/${encodeURI(path)}`;
}

/**
 * The binding: `Env` turned into the resolver and the reader.
 * @param env - Worker bindings
 * @param input - Tool args from the model — `lookup`, `section`, `path`, `ref`, `search`, `repo`
 */
export async function executeGithubRead(env: Env, input: Record<string, unknown>): Promise<string> {
  return readGithub(input, {
    resolveRepo: (requested) => resolveRepoFor(env, requested),
    readPath: (target, path, ref) => githubReadPath(env, target, path, ref),
    searchCode: (target, query) => githubSearchCode(env, target, query),
    ds: dsMcpClient({ key: env.DS_MCP_KEY, post: countedFetch, canSpend: () => budgetHeadroom().subrequests >= 1 }),
  });
}
