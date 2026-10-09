// What a task card says about its lookup, beside the title the tool table
// gives it: the query it ran, what came back, and the links it read.
//
// WHY A MODULE BESIDE THE TABLE, NOT A COLUMN IN IT. The table's `taskCard`
// column is words — data its five non-Slack readers can carry
// without noticing. These are functions over a tool's own payload, and every
// one of them knows that payload's shape; living beside the tool table keeps
// the table a table. The membership rule still holds as hard as a column
// would: `READOUTS` is typed over exactly the tools that get a card, so a new
// lookup with card words and no readout — or a readout for a tool with none —
// fails `tsc` where the map is written.
//
// WHAT IT READS. `details` reads the arguments the model sent; `output` and
// `sources` read the whole raw result, where the loop builds the `finished`
// progress event (`tool-progress.ts`), so a large read is never cut short of
// valid JSON before it is read. A result that is not
// JSON, or that says it failed, has no output and no sources here: an error
// card's line is the error itself, which the adapter already shortens.
//
// WHAT IT DOES NOT DECIDE. Which of these sources a thread may see. A link is
// reported with what the tool knew about its visibility (`slack_search`'s own
// `visibility` field) and nothing else; the filter, and the 256-character pass
// over every string, are the Slack adapter's and the Slack client's.
//
// A PURE module: no Env, no Slack shape.

import type { TaskCardWords, TOOL_TABLE } from "./tool-table";
import { taskCardFor } from "./tool-table";

/** One link a lookup read. */
export interface TaskCardSource {
  /** What to call it — the page's title, the file's path, the channel. */
  readonly text: string;
  readonly url: string;
  /**
   * Who could see it, in the tool's own words, when the tool said — today
   * only `slack_search`, whose result names the firewall it searched behind.
   * Absent everywhere else.
   */
  readonly visibility?: string;
  /**
   * What the lookup queried, as against one of the rows it found: the
   * `collection` it searched (the Roadmap board, a scoped Notion database) or
   * the `page` it read whole. An answer stands on what it queried whatever it
   * names, so the Sources box keeps this one and a row only when the prose
   * names it (`slack/sources-box.ts`).
   */
  readonly queried?: "collection" | "page";
  /** The row's number as its estate shows it — a Roadmap card's — so prose
   *  that writes "#412" names it. */
  readonly number?: number;
}

/** What a card says beyond its title. Every method answers null (or none)
 *  rather than inventing a line it cannot ground. */
export interface TaskCardReadout {
  /** What the call looked for, from the arguments the model sent. */
  details(args: Record<string, unknown>): string | null;
  /** What came back, as a glance — "4 pages", "no matches". */
  output(result: string): string | null;
  /** The links the result names, each once — every row's, since an answer
   *  may name any of them. A card shows the first few. */
  sources(result: string): TaskCardSource[];
  /** Where the call is routed, for a tool whose code routes it — which repo,
   *  which Notion database — or null where it routes nowhere in particular. */
  decision?(args: Record<string, unknown>): TaskCardDecision | null;
}

/**
 * A routing choice the tool's own code makes from the call's arguments, shown
 * as a step of its own.
 *
 * Only routing the CODE does: `resolveRepoFor` sends a call that names no repo
 * to the default one, and `notion_search` turns a scope into the database it
 * queries. Nothing here reads the model's reasons, because a card that claimed
 * to know them would be inventing them.
 */
export interface TaskCardDecision {
  /** What is being chosen — a call's choice is compared only with earlier
   *  choices of the same kind. */
  readonly kind: "repo" | "notion-database";
  /** The choice itself, so two calls routed alike share one step. */
  readonly value: string;
  /** The step's title. */
  readonly title: string;
}

/** The tools that get a card: ungated rows whose taskCard is not null. */
type CardTool = {
  [K in keyof typeof TOOL_TABLE]: (typeof TOOL_TABLE)[K] extends { readonly taskCard: TaskCardWords } ? K : never;
}[keyof typeof TOOL_TABLE];

// ─── reading a payload ───────────────────────────────────────────────────────

type Payload = Record<string, unknown>;

/** The result as a JSON object, or null — not JSON, or not an object. */
function payloadOf(result: string): Payload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(result);
  } catch {
    return null;
  }
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Payload) : null;
}

/** Does a payload say it failed? */
const saysFailed = (p: Payload): boolean => p.ok === false || typeof p.error === "string";

/** The result as a successful payload, or null — not JSON, not an object, or
 *  a result that says it failed. */
function succeeded(result: string): Payload | null {
  const p = payloadOf(result);
  return p && !saysFailed(p) ? p : null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** `n` of a thing, in words: "1 page", "4 pages". */
function counted(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** How many came back: the tool's own `count` when it wrote one, else the
 *  length of the list it returned. */
function countOf(p: Payload, list: string): number | null {
  if (typeof p.count === "number") return p.count;
  const rows = p[list];
  return Array.isArray(rows) ? rows.length : null;
}

/** A count readout: the noun when something came back, `none` when nothing. */
function countOutput(list: string, one: string, none = "no matches", many?: string) {
  return (result: string): string | null => {
    const p = succeeded(result);
    if (!p) return null;
    const n = countOf(p, list);
    if (n === null) return null;
    return n === 0 ? none : counted(n, one, many);
  };
}

/** The links the rows of `list` carry, named by the first label field present.
 *  Only a row's own `url` / `link` — never a URL found inside its content,
 *  which is what the page SAYS, not what the lookup READ. */
function rowLinks(list: string, labels: readonly string[], opts: { visibilityFrom?: string; numberFrom?: string } = {}) {
  return (result: string): TaskCardSource[] => {
    const p = succeeded(result);
    const rows = p?.[list];
    if (!p || !Array.isArray(rows)) return [];
    const visibility = opts.visibilityFrom ? str(p[opts.visibilityFrom]) : null;
    return unique(
      rows.flatMap((row) => {
        if (!row || typeof row !== "object") return [];
        const r = row as Payload;
        const url = httpUrl(r.url) ?? httpUrl(r.link);
        if (!url) return [];
        const text = labels.map((k) => str(r[k])).find(Boolean) ?? url;
        const number = opts.numberFrom ? r[opts.numberFrom] : undefined;
        return [{ text, url, ...(visibility ? { visibility } : {}), ...(typeof number === "number" ? { number } : {}) }];
      }),
    );
  };
}

/** The one link a single-document read returned: the page it read. */
function ownLink(result: string): TaskCardSource[] {
  const p = succeeded(result);
  const url = p && httpUrl(p.url);
  if (!p || !url) return [];
  return [{ text: str(p.title) ?? url, url, queried: "page" }];
}

/** The collection a lookup queried — the payload's `field`, a `{ title, url }`
 *  the tool writes when it has the collection's link — then its rows' links. */
function collectionThenRows(field: string, rows: (result: string) => TaskCardSource[]) {
  return (result: string): TaskCardSource[] => {
    const p = succeeded(result);
    const collection = p?.[field] as Payload | undefined;
    const url = collection && typeof collection === "object" ? httpUrl(collection.url) : null;
    const own: TaskCardSource[] = url ? [{ text: str(collection!.title) ?? url, url, queried: "collection" }] : [];
    return unique([...own, ...rows(result)]);
  };
}

const httpUrl = (v: unknown): string | null => {
  const s = str(v);
  return s && /^https?:\/\//i.test(s) ? s : null;
};

function unique(sources: TaskCardSource[]): TaskCardSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => !seen.has(s.url) && seen.add(s.url));
}

const noSources = (): TaskCardSource[] => [];

/**
 * The link a `source_read` call reads: the URL it was handed, or the first one
 * in the text it was handed — the tool's own rule for which link it reads.
 *
 * @param args - The call's arguments
 */
export function readLinkOf(args: Record<string, unknown>): string | null {
  return str(args.url) ?? str(args.text)?.match(/https?:\/\/[^\s<>|)"']+/i)?.[0] ?? null;
}

/** The first argument present, as text. */
const arg = (...keys: string[]) => (args: Record<string, unknown>): string | null =>
  keys.map((k) => str(args[k])).find(Boolean) ?? null;

/**
 * The repo a GitHub call goes to: the one it names, or the default when it
 * names none — `resolveRepoFor`'s rule. A repo off the list is refused by the
 * tool, and its card says so; the step only names what was asked for.
 */
function repoDecision(args: Record<string, unknown>): TaskCardDecision {
  const repo = str(args.repo);
  if (!repo) return { kind: "repo", value: "", title: "Chose the default repo" };
  const name = repo.split("/").pop() || repo;
  return { kind: "repo", value: repo.toLowerCase(), title: `Chose the ${name} repo` };
}

/** What each `notion_search` scope searches, as a person would call it. The
 *  scopes are the tool's enum (`tools/notion-search.ts`); `any` searches the
 *  whole workspace and so chooses nothing. */
const NOTION_SCOPE_WORDS: Readonly<Record<string, string>> = {
  team: "the team roster",
  apps: "the Third Party Applications database",
  marketplace: "the Prototype Marketplace",
  help_tutors: "the tutor Help Center",
  help_teachers: "the teacher Help Center",
  decisions: "the Decisions database",
  running_notes: "the Design Running Notes",
  news: "the News database",
  success_stories: "the Success Stories database",
  research_papers: "the Research Papers database",
  banners: "the Banners database",
};

/** The Notion database a scoped search goes to, or null for `any`. */
function notionScopeDecision(args: Record<string, unknown>): TaskCardDecision | null {
  const scope = str(args.scope)?.toLowerCase();
  const words = scope ? NOTION_SCOPE_WORDS[scope] : undefined;
  return scope && words ? { kind: "notion-database", value: scope, title: `Chose ${words}` } : null;
}

// ─── the readouts ────────────────────────────────────────────────────────────

const READOUTS: { readonly [K in CardTool]: TaskCardReadout } = {
  roadmap_query: {
    details: (args) =>
      typeof args.card_number === "number" ? `#${args.card_number}` : arg("title", "person", "design_status")(args),
    output: countOutput("cards", "card", "no matching cards"),
    sources: collectionThenRows("board", rowLinks("cards", ["title"], { numberFrom: "card_number" })),
  },
  notion_search: {
    details: (args) => {
      const query = str(args.query);
      const scope = str(args.scope);
      if (!scope || scope.toLowerCase() === "any") return query;
      return query ? `${query} in ${scope}` : scope;
    },
    output: countOutput("results", "page"),
    sources: collectionThenRows("database", rowLinks("results", ["title", "name"])),
    decision: notionScopeDecision,
  },
  source_read: {
    details: readLinkOf,
    output: (result) => {
      const p = succeeded(result);
      if (!p) return null;
      const title = str(p.title);
      return title ? `Read ${title}` : "Read the page";
    },
    sources: ownLink,
  },
  search_blueprint: {
    details: arg("query"),
    output: countOutput("rows", "match", "no matches", "matches"),
    sources: rowLinks("rows", ["name", "label", "title"]),
  },
  github_read: {
    details: arg("search", "path"),
    output: (result) => {
      const p = succeeded(result);
      if (!p) return null;
      if (Array.isArray(p.hits)) return countOutput("hits", "file")(result);
      if (p.kind === "dir" && Array.isArray(p.entries)) return counted(p.entries.length, "entry", "entries");
      const path = str(p.path);
      return path ? `Read ${path}` : null;
    },
    sources: rowLinks("hits", ["path"]),
    decision: repoDecision,
  },
  github_intake_search: {
    details: arg("keywords"),
    output: countOutput("matches", "open intake", "no open intakes match"),
    sources: rowLinks("matches", ["title"]),
    decision: repoDecision,
  },
  // A Slack id says nothing to a person reading the card, and spelled as a
  // mention it would ping; a name looked up is what the card shows.
  slack_user_profile: {
    details: arg("name"),
    output: (result) => {
      const p = succeeded(result);
      if (!p) return null;
      if (Array.isArray(p.matches)) return p.matches.length ? counted(p.matches.length, "person", "people") : "no matches";
      const user = p.user as Payload | undefined;
      const name = user && str(user.name);
      return name ? `Found ${name}` : null;
    },
    sources: noSources,
  },
  slack_channel_members: {
    details: () => null,
    output: countOutput("member_ids", "member", "no members"),
    sources: noSources,
  },
  // The link it reads is a Slack permalink, and a permalink can name a thread
  // the room cannot see — so the card says how much it read, and no more.
  slack_thread_read: {
    details: () => null,
    output: countOutput("messages", "message", "no messages"),
    sources: noSources,
  },
  reminder_set: {
    details: arg("what"),
    output: (result) => {
      const p = payloadOf(result);
      if (!p) return null;
      if (!saysFailed(p)) return str(p.confirm) ?? "Reminder set";
      // Not set, and not failed either: the tool asked when.
      return str(p.ask) ? "Needs a time" : null;
    },
    sources: noSources,
  },
  slack_search: {
    details: arg("query"),
    output: countOutput("results", "message"),
    sources: rowLinks("results", ["channel"], { visibilityFrom: "visibility" }),
  },
  read_reference: {
    details: arg("name"),
    output: (result) => {
      const p = succeeded(result);
      const name = p && str(p.name);
      return name ? `Read ${name}` : null;
    },
    sources: noSources,
  },
};

/**
 * The readout for a tool's card, or null for a call that gets no card — the
 * same membership as `taskCardFor`, which it defers to.
 *
 * @param name - The tool's registered name
 */
export function readoutFor(name: string): TaskCardReadout | null {
  if (!taskCardFor(name)) return null;
  return (READOUTS as Record<string, TaskCardReadout>)[name] ?? null;
}
