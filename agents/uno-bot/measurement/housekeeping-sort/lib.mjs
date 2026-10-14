// @ts-check
// The housekeeping sort's pure half: parsing, batching, the batch a Claude Code
// session labels, the labels it reads back, and the counting. Nothing here
// touches the network or the filesystem, so every number the sort prints is
// testable offline (sort.test.mjs). sort.mjs is the CLI that wires this to
// disk.
//
// WHERE THE DEFINITIONS COME FROM. The baseline this re-counts is "about nine
// housekeeping requests a workday in a busy semester (Spring 2026)". Its
// derivation was reconstructed from the recovered corpus, which is kept outside
// the repo because it holds private messages. The published sources are the
// Notion "Data analysis" page
// (https://app.notion.com/p/3ecb7cca498281b0a3dbd2253d1fa198) and the Asks
// corpus database (https://app.notion.com/p/3b899ab32d1e402192278ede0455d56e),
// whose "What it took" and "Where it arrived" columns carry the fields below.
//
//   HOUSEKEEPING  = an ask whose "What it took" is NOT "Needs the lead's
//                   judgment" (the filter on the Data analysis page's monthly
//                   housekeeping chart). 2,125 of the 2,413 asks (88%) were
//                   housekeeping.
//   WHAT IT TOOK  = the corpus `bot_fit`, folded three ways:
//                   Lookup / Automation / Lookup + Automation -> "Could be
//                   looked up"; Human + bot prep -> "Needs prep, then a
//                   person"; Stays human -> "Needs the lead's judgment".
//   WORKDAY       = a Monday-to-Friday date inside the semester window, with no
//                   holiday taken out. Spring 2026 is 2026-01-12 to 2026-05-01,
//                   80 workdays. The numerator counts every ask dated in the
//                   window, weekend ones included, because the corpus count
//                   did; the weekend ones are also reported apart so nothing
//                   is hidden.
//   THE NINE      = (6.4 DM asks + 0.8 channel-mention asks a workday, from the
//                   inbox count, + 3.6 meeting asks a workday, from the corpus)
//                   x 0.88 housekeeping share = 9.5, which Bill rounded to
//                   "about nine" for the story. The corpus alone gives 6.5 a
//                   workday for Spring 2026 (it holds under half the DM asks
//                   the inbox count saw), so calibration compares against 6.5,
//                   the figure its own rows can reproduce.

/** Rows per batch file. Big enough that the rubric is read once per 25 rows. */
export const DEFAULT_BATCH_SIZE = 25;

export const SOURCES = /** @type {const} */ (["dm", "channel", "meeting"]);

/** The three "What it took" values, exactly as the published legend words them. */
export const WHAT_IT_TOOK = /** @type {const} */ ([
  "Could be looked up",
  "Needs prep, then a person",
  "Needs the lead's judgment",
]);
export const JUDGMENT = "Needs the lead's judgment";
/** What the model writes for a row that is not a request. */
export const NOT_A_REQUEST = "Not a request";

/**
 * The corpus Sub-type options, exactly as the Asks corpus spells them (the
 * Asks corpus database's `Sub-type` options). These are the "kinds".
 */
export const KINDS = /** @type {const} */ ([
  "Access request",
  "Agenda/reminder",
  "Artifact location",
  "Assignment recall",
  "Automation proposal",
  "Beta access",
  "Bot/automation setup",
  "Component placement",
  "Convention explainer",
  "Decision recall",
  "Design judgment",
  "Design system taxonomy",
  "Dev coordination",
  "Dev handoff docs",
  "Documentation standard",
  "Domain fact",
  "Feature walkthrough",
  "Grid/alignment",
  "Institutional memory",
  "Layout bug",
  "Meeting access",
  "Prior-cohort work recall",
  "Relay/routing",
  "Repeat teaching",
  "Status recap",
  "Sync/drift",
  "Token governance",
  "Tool mechanics",
  "Tooling onboarding",
]);

/** The corpus `bot_fit` folded to "What it took". */
export const BOT_FIT_TO_WHAT_IT_TOOK = {
  Lookup: "Could be looked up",
  Automation: "Could be looked up",
  "Lookup + Automation": "Could be looked up",
  "Human + bot prep": "Needs prep, then a person",
  "Stays human": JUDGMENT,
};

/** The baseline window: Spring 2026, 80 workdays. */
export const SPRING_2026 = { from: "2026-01-12", to: "2026-05-01" };
/** The published figure and how it was built, for the calibration printout. */
export const PUBLISHED_BASELINE = {
  perWorkday: 9,
  computed: 9.5,
  how: "(6.4 DM asks + 0.8 mention asks from the inbox count + 3.6 meeting asks from the corpus) x 0.88 housekeeping share, rounded down to 'about nine'",
};

// ---------------------------------------------------------------------------
// Parsing

/**
 * @typedef {{ id: string, source: typeof SOURCES[number], sent_at: string, sender: string, text: string }} ExportRow
 */

/**
 * Parses the local export: one JSON object a line with
 * `id, source (dm|channel|meeting), sent_at, sender, text`. Blank lines are
 * skipped; anything else malformed throws with its line number, because a
 * silently dropped row is an undercount nobody sees.
 * @param {string} text
 * @returns {ExportRow[]}
 */
export function parseExport(text) {
  /** @type {ExportRow[]} */
  const rows = [];
  const seen = new Set();
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const where = `line ${i + 1}`;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      throw new Error(`${where}: not JSON`);
    }
    if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error(`${where}: not an object`);
    const id = o.id == null ? "" : String(o.id);
    if (!id) throw new Error(`${where}: missing id`);
    if (seen.has(id)) throw new Error(`${where}: duplicate id ${id}`);
    seen.add(id);
    if (!SOURCES.includes(o.source)) throw new Error(`${where}: source must be one of ${SOURCES.join("|")}`);
    if (typeof o.sent_at !== "string" || !localDate(o.sent_at)) throw new Error(`${where}: sent_at is not a date`);
    if (typeof o.text !== "string" || !o.text.trim()) throw new Error(`${where}: missing text`);
    rows.push({ id, source: o.source, sent_at: o.sent_at, sender: typeof o.sender === "string" ? o.sender : "", text: o.text });
  });
  return rows;
}

const ET_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * The US Eastern calendar date of a timestamp (the corpus dates Slack asks in
 * Eastern time). A bare YYYY-MM-DD is taken as given.
 * @param {string} sentAt
 * @returns {string | null}
 */
export function localDate(sentAt) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(sentAt)) return isRealDate(sentAt) ? sentAt : null;
  const t = Date.parse(sentAt);
  if (Number.isNaN(t)) return null;
  return ET_DATE.format(new Date(t));
}

/** @param {string} ymd */
function isRealDate(ymd) {
  const d = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd;
}

// ---------------------------------------------------------------------------
// Batching and the batch file

/**
 * @template T
 * @param {T[]} rows
 * @param {number} size
 * @returns {T[][]}
 */
export function toBatches(rows, size = DEFAULT_BATCH_SIZE) {
  if (!Number.isInteger(size) || size < 1) throw new Error("batch size must be a positive integer");
  /** @type {T[][]} */
  const out = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/** The JSON schema the labels are held to; the prompt's Output section points at it. */
export const LABEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["labels"],
  properties: {
    labels: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "is_request", "is_thanks", "what_it_took", "kinds"],
        properties: {
          id: { type: "string" },
          is_request: { type: "boolean" },
          is_thanks: { type: "boolean" },
          what_it_took: { type: "string", enum: [...WHAT_IT_TOOK, NOT_A_REQUEST] },
          kinds: { type: "array", items: { type: "string", enum: [...KINDS] } },
        },
      },
    },
  },
};

/**
 * One batch for a Claude Code session to label: the rubric verbatim as
 * `system`, the rows as `user`, and the schema the labels are held to. The
 * sender is passed as it is in the export. The model is the session's, so the
 * batch names none.
 * @param {ExportRow[]} batch
 * @param {string} prompt
 */
export function buildBatch(batch, prompt) {
  const rows = batch.map((r) => JSON.stringify({ id: r.id, source: r.source, sent_at: r.sent_at, sender: r.sender, text: r.text }));
  return {
    ids: batch.map((r) => r.id),
    system: prompt,
    user: `Label each of these ${batch.length} messages. One label per id, every id exactly once.\n\n${rows.join("\n")}`,
    output_schema: LABEL_SCHEMA,
  };
}

// ---------------------------------------------------------------------------
// Reading labels back

/**
 * @typedef {{ id: string, is_request: boolean, is_thanks: boolean, what_it_took: typeof WHAT_IT_TOOK[number] | null, kinds: string[] }} Label
 */

/**
 * Reads one batch's labels, as the prompt returns them, and holds them to the
 * batch (see checkLabels).
 * @param {string} text the batch's `{"labels": [...]}`
 * @param {string[]} ids the batch's ids, in order
 * @returns {Label[]}
 */
export function parseLabels(text, ids) {
  let o;
  try {
    o = JSON.parse(text);
  } catch {
    throw new Error("response is not JSON");
  }
  const list = Array.isArray(o) ? o : o?.labels;
  if (!Array.isArray(list)) throw new Error("response has no labels array");
  return checkLabels(list, ids);
}

/**
 * Reads the labels file a session wrote, one JSON object a line: either one
 * batch's whole `{"labels": [...]}` or a single label. Blank lines are skipped.
 * The labels are held to every id the count needs (see checkLabels).
 * @param {string} jsonl
 * @param {string[]} ids every id to be labelled, in order
 * @returns {Label[]}
 */
export function parseLabelLines(jsonl, ids) {
  /** @type {unknown[]} */
  const list = [];
  jsonl.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      throw new Error(`labels line ${i + 1}: not JSON`);
    }
    if (Array.isArray(o)) list.push(...o);
    else if (Array.isArray(o?.labels)) list.push(...o.labels);
    else if (o && typeof o === "object" && "id" in o) list.push(o);
    else throw new Error(`labels line ${i + 1}: neither a label nor a labels array`);
  });
  return checkLabels(list, ids);
}

/**
 * Holds labels to their ids: every id once, no stranger, values from the
 * rubric. A request with no "What it took", or a non-request with one, is an
 * error rather than a guess.
 * @param {any[]} list
 * @param {string[]} ids
 * @returns {Label[]}
 */
function checkLabels(list, ids) {
  const want = new Set(ids);
  /** @type {Map<string, Label>} */
  const got = new Map();
  for (const l of list) {
    const id = l?.id == null ? "" : String(l.id);
    if (!want.has(id)) throw new Error(`label for unknown id ${id}`);
    if (got.has(id)) throw new Error(`two labels for id ${id}`);
    if (typeof l.is_request !== "boolean" || typeof l.is_thanks !== "boolean") throw new Error(`id ${id}: is_request and is_thanks must be booleans`);
    const took = l.what_it_took;
    if (l.is_request) {
      if (!WHAT_IT_TOOK.includes(took)) throw new Error(`id ${id}: a request needs a What it took value`);
    } else if (took != null && took !== NOT_A_REQUEST) {
      throw new Error(`id ${id}: not a request but has What it took "${took}"`);
    }
    const kinds = Array.isArray(l.kinds) ? l.kinds : [];
    for (const k of kinds) if (!KINDS.includes(k)) throw new Error(`id ${id}: unknown kind "${k}"`);
    got.set(id, { id, is_request: l.is_request, is_thanks: l.is_thanks, what_it_took: l.is_request ? took : null, kinds: l.is_request ? [...new Set(kinds)] : [] });
  }
  const missing = ids.filter((id) => !got.has(id));
  if (missing.length) throw new Error(`no label for ${missing.length} id(s): ${missing.slice(0, 5).join(", ")}`);
  return ids.map((id) => /** @type {Label} */ (got.get(id)));
}

// ---------------------------------------------------------------------------
// Counting

/**
 * Monday-to-Friday dates from `from` to `to`, both included. No holidays are
 * taken out: the baseline's 80 for Spring 2026 counts MLK Day and spring break.
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @returns {string[]}
 */
export function workdays(from, to) {
  if (!isRealDate(from) || !isRealDate(to)) throw new Error("window dates must be YYYY-MM-DD");
  const out = [];
  for (let d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** @param {Label | undefined} l */
export function isHousekeeping(l) {
  return !!l && l.is_request && l.what_it_took !== JUDGMENT;
}

/**
 * Counts per workday over a window, by the baseline's definition (see the top
 * of this file): every housekeeping request dated in the window, over the
 * window's Monday-to-Friday days.
 * @param {ExportRow[]} rows
 * @param {Label[]} labels
 * @param {{ from: string, to: string }} window
 */
export function countPerWorkday(rows, labels, window) {
  const byId = new Map(labels.map((l) => [l.id, l]));
  const days = workdays(window.from, window.to);
  const workdaySet = new Set(days);
  const split = Object.fromEntries(WHAT_IT_TOOK.map((w) => [w, 0]));
  const bySource = Object.fromEntries(SOURCES.map((s) => [s, 0]));
  const perDay = Object.fromEntries(days.map((d) => [d, 0]));
  let inWindow = 0, unlabelled = 0, requests = 0, housekeeping = 0, weekendHousekeeping = 0, thanks = 0;
  for (const r of rows) {
    const date = localDate(r.sent_at);
    if (!date || date < window.from || date > window.to) continue;
    inWindow++;
    const l = byId.get(r.id);
    if (!l) { unlabelled++; continue; }
    if (l.is_thanks) thanks++;
    if (!l.is_request) continue;
    requests++;
    split[/** @type {string} */ (l.what_it_took)]++;
    if (!isHousekeeping(l)) continue;
    housekeeping++;
    bySource[r.source]++;
    if (workdaySet.has(date)) perDay[date]++;
    else weekendHousekeeping++;
  }
  const n = days.length;
  return {
    window: { ...window, workdays: n },
    messages: inWindow,
    unlabelled,
    requests,
    housekeeping,
    weekendHousekeeping,
    thanks,
    housekeepingPerWorkday: n ? round1(housekeeping / n) : 0,
    requestsPerWorkday: n ? round1(requests / n) : 0,
    thanksPerWeek: n ? round1((thanks / n) * 5) : 0,
    split,
    housekeepingBySource: bySource,
    perDay,
  };
}

/** @param {number} x */
const round1 = (x) => Math.round(x * 10) / 10;

// ---------------------------------------------------------------------------
// Calibration over the corpus

/**
 * The corpus rows the calibration runs over, in the export's shape, with the
 * corpus's own labels beside them. Spring 2026 by the corpus's semester label
 * and `in_stats` (the 2,413 base), as the baseline counted.
 * @param {string} jsonl recovered-rows.jsonl
 * @returns {{ rows: ExportRow[], expected: Map<string, { what_it_took: string, kinds: string[] }> }}
 */
export function corpusCalibrationRows(jsonl) {
  /** @type {ExportRow[]} */
  const rows = [];
  const expected = new Map();
  for (const line of jsonl.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    if (!r.in_stats || r.semester !== "Spring 2026") continue;
    const took = BOT_FIT_TO_WHAT_IT_TOOK[/** @type {keyof typeof BOT_FIT_TO_WHAT_IT_TOOK} */ (r.bot_fit)];
    if (!took) throw new Error(`corpus row ${r._id}: unknown bot_fit "${r.bot_fit}"`);
    const id = String(r._id);
    rows.push({
      id,
      source: corpusSource(r.source),
      // The semester label is what the baseline counted by, so a row keeps its
      // date even when it falls before the window opens; the calibration window
      // below is the semester, and the denominator stays the 80 workdays.
      sent_at: String(r.effective_date || r.date || ""),
      sender: r.requester_name || r.requester || "",
      text: r.verbatim || r.request || "",
    });
    expected.set(id, { what_it_took: took, kinds: Array.isArray(r.subtypes) ? r.subtypes : [] });
  }
  return { rows, expected };
}

/** @param {string} s */
function corpusSource(s) {
  if (s === "Slack DM" || s === "Slack group DM") return "dm";
  if (s === "Slack channel") return "channel";
  return "meeting";
}

/**
 * Compares the model's labels with the corpus's over the same rows. Every
 * corpus row is an ask, so `requestRecall` is the share the model also called
 * a request; `agreement` is over rows both call a request.
 * @param {ExportRow[]} rows
 * @param {Map<string, { what_it_took: string, kinds: string[] }>} expected
 * @param {Label[]} labels
 * @param {number} workdayCount
 */
export function calibrationReport(rows, expected, labels, workdayCount = workdays(SPRING_2026.from, SPRING_2026.to).length) {
  const byId = new Map(labels.map((l) => [l.id, l]));
  const corpusSplit = Object.fromEntries(WHAT_IT_TOOK.map((w) => [w, 0]));
  const modelSplit = Object.fromEntries(WHAT_IT_TOOK.map((w) => [w, 0]));
  /** @type {Record<string, Record<string, number>>} */
  const confusion = Object.fromEntries(WHAT_IT_TOOK.map((a) => [a, Object.fromEntries([...WHAT_IT_TOOK, NOT_A_REQUEST].map((b) => [b, 0]))]));
  let corpusHk = 0, modelHk = 0, modelRequests = 0, both = 0, agree = 0, labelled = 0, kindOverlap = 0;
  for (const r of rows) {
    const e = expected.get(r.id);
    if (!e) continue;
    corpusSplit[e.what_it_took]++;
    if (e.what_it_took !== JUDGMENT) corpusHk++;
    const l = byId.get(r.id);
    if (!l) continue;
    labelled++;
    confusion[e.what_it_took][l.is_request ? /** @type {string} */ (l.what_it_took) : NOT_A_REQUEST]++;
    if (!l.is_request) continue;
    modelRequests++;
    modelSplit[/** @type {string} */ (l.what_it_took)]++;
    if (isHousekeeping(l)) modelHk++;
    both++;
    if (l.what_it_took === e.what_it_took) agree++;
    if (l.kinds.some((k) => e.kinds.includes(k))) kindOverlap++;
  }
  const n = expected.size;
  const share = (/** @type {Record<string, number>} */ s, /** @type {number} */ d) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, d ? Math.round((1000 * v) / d) / 10 : 0]));
  return {
    rows: n,
    labelled,
    workdays: workdayCount,
    corpus: { housekeeping: corpusHk, housekeepingPerWorkday: round1(corpusHk / workdayCount), splitPercent: share(corpusSplit, n) },
    model: { requests: modelRequests, housekeeping: modelHk, housekeepingPerWorkday: round1(modelHk / workdayCount), splitPercent: share(modelSplit, modelRequests) },
    requestRecall: labelled ? round1((100 * modelRequests) / labelled) : 0,
    whatItTookAgreementPercent: both ? round1((100 * agree) / both) : 0,
    kindOverlapPercent: both ? round1((100 * kindOverlap) / both) : 0,
    confusion,
    published: PUBLISHED_BASELINE,
  };
}
