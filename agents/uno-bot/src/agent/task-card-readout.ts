// What a task card says about its lookup, beside the title the tool table
// gives it: the query it ran, what came back, and the links it read.
//
// WHY A MODULE BESIDE THE TABLE, NOT A COLUMN IN IT. The table's `taskCard`
// column is words and an estate — data its five non-Slack readers can carry
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
}

/** What a card says beyond its title. Every method answers null (or none)
 *  rather than inventing a line it cannot ground. */
export interface TaskCardReadout {
  /** What the call looked for, from the arguments the model sent. */
  details(args: Record<string, unknown>): string | null;
  /** What came back, as a glance — "4 pages", "no matches". */
  output(result: string): string | null;
  /** The links the result names, at most `MAX_SOURCES`, each once. */
  sources(result: string): TaskCardSource[];
}

/** How many links one card carries. Enough to open the source behind a claim;
 *  few enough that a card stays a line, not a reading list. */
export const MAX_SOURCES = 5;

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
function rowLinks(list: string, labels: readonly string[], visibilityFrom?: string) {
  return (result: string): TaskCardSource[] => {
    const p = succeeded(result);
    const rows = p?.[list];
    if (!p || !Array.isArray(rows)) return [];
    const visibility = visibilityFrom ? str(p[visibilityFrom]) : null;
    return unique(
      rows.flatMap((row) => {
        if (!row || typeof row !== "object") return [];
        const r = row as Payload;
        const url = httpUrl(r.url) ?? httpUrl(r.link);
        if (!url) return [];
        const text = labels.map((k) => str(r[k])).find(Boolean) ?? url;
        return [{ text, url, ...(visibility ? { visibility } : {}) }];
      }),
    );
  };
}

/** The one link a single-document read returned. */
function ownLink(result: string): TaskCardSource[] {
  const p = succeeded(result);
  const url = p && httpUrl(p.url);
  if (!p || !url) return [];
  return [{ text: str(p.title) ?? url, url }];
}

const httpUrl = (v: unknown): string | null => {
  const s = str(v);
  return s && /^https?:\/\//i.test(s) ? s : null;
};

function unique(sources: TaskCardSource[]): TaskCardSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => !seen.has(s.url) && seen.add(s.url)).slice(0, MAX_SOURCES);
}

const noSources = (): TaskCardSource[] => [];

/**
 * The link a `source_read` call reads: the URL it was handed, or the first one
 * in the text it was handed — the tool's own rule for which link it reads. The
 * card's details and its logo (`slack/estate-logos.ts`) both read it here, so
 * the two never name different links.
 *
 * @param args - The call's arguments
 */
export function readLinkOf(args: Record<string, unknown>): string | null {
  return str(args.url) ?? str(args.text)?.match(/https?:\/\/[^\s<>|)"']+/i)?.[0] ?? null;
}

/** The first argument present, as text. */
const arg = (...keys: string[]) => (args: Record<string, unknown>): string | null =>
  keys.map((k) => str(args[k])).find(Boolean) ?? null;

// ─── the readouts ────────────────────────────────────────────────────────────

const READOUTS: { readonly [K in CardTool]: TaskCardReadout } = {
  roadmap_query: {
    details: (args) =>
      typeof args.card_number === "number" ? `#${args.card_number}` : arg("title", "person", "design_status")(args),
    output: countOutput("cards", "card", "no matching cards"),
    sources: rowLinks("cards", ["title"]),
  },
  notion_search: {
    details: (args) => {
      const query = str(args.query);
      const scope = str(args.scope);
      if (!scope || scope.toLowerCase() === "any") return query;
      return query ? `${query} in ${scope}` : scope;
    },
    output: countOutput("results", "page"),
    sources: rowLinks("results", ["title", "name"]),
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
  },
  github_intake_search: {
    details: arg("keywords"),
    output: countOutput("matches", "open intake", "no open intakes match"),
    sources: rowLinks("matches", ["title"]),
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
    sources: rowLinks("results", ["channel"], "visibility"),
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
