// Proposal-card presentation: turn a staged side-effect tool call into the
// ⚠️ confirmation card the requester sees. Cards are read by designers, not
// machines — parameters render as labeled `•` bullets, never raw JSON (user
// decision, 2026-07-12). The executable input lives in the DO's pending state;
// this text is display-only. (Extracted from events.ts, 2026-07-12.)

// Import-free collaborators only: this module renders card TEXT and blocks and
// posts nothing, so the Turn module can build a card without `Env`. The Figma
// preview card, which needs a render call, lives in `proposal-figma.ts`.
import { collectStrings } from "../agent/tool-input";
import { textSections } from "./render";

// One shared confirmation footer on every card. Anyone in the thread may
// confirm/cancel (the requester lock was removed 2026-07-14), so it names no
// approver. It names the two gestures and nothing else — no "or just say go
// ahead": the buttons and reactions are the clear path, and anything typed
// goes to the model, which reads it in context (2026-08-22).
export const CONFIRM_FOOTER =
  `:white_check_mark: to approve · :no_entry: to cancel (then tell me what to change).`;

/**
 * The Approve / Cancel button row.
 *
 * STYLING, and what Slack actually allows. Block Kit gives a button exactly
 * three looks — `style: "primary"` (filled green), `style: "danger"` (filled
 * red), and no `style` at all (the quiet default outline). There is no tonal
 * variant, no custom colour, no border control. Emoji in the label is the only
 * other dial.
 *
 * The first cut used filled + emoji on BOTH buttons, which read as shouting:
 * colour and glyph each carried the whole message, so the row said everything
 * twice in two saturated blocks side by side.
 *
 * Now: filled on both, no emoji. The colour carries the meaning and the label
 * says the word; the glyph was the third copy of the same signal.
 *
 * Approve is `primary`, Cancel is `danger` (Bill's call, 2026-08-22). I had
 * argued for a quiet default on Cancel, on the reasoning that red marks the
 * dangerous choice and here *Approve* is the one firing the irreversible
 * write. Overruled, and the counter-argument is good: in a two-button yes/no
 * the pair reads as a pair, and a green/red set is instantly legible at a
 * glance in a busy thread — which is where these cards are actually read.
 *
 * The handler in slack/interactive.ts resolves the card the button sits on, so
 * the buttons carry no payload — the message ts is the identity, as with a
 * reaction.
 */
export function proposalActionBlocks(): unknown[] {
  return [
    {
      type: "actions",
      block_id: "uno_proposal_actions",
      elements: [
        {
          type: "button",
          action_id: "uno_proposal_confirm",
          style: "primary",
          text: { type: "plain_text", text: "Approve" },
          value: "confirm",
        },
        {
          type: "button",
          action_id: "uno_proposal_cancel",
          style: "danger",
          text: { type: "plain_text", text: "Cancel" },
          value: "cancel",
        },
      ],
    },
  ];
}

/** A text-only card as blocks: the text in ≤3000-char sections, then the
 *  button row. Used at post time and again by the button handler to re-render
 *  the card once it is resolved (buttons off, outcome on). */
export function proposalCardBlocks(text: string, resolvedNote?: string): unknown[] {
  const blocks: unknown[] = [...textSections(text)];
  if (resolvedNote) {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: resolvedNote }] });
  } else {
    blocks.push(...proposalActionBlocks());
  }
  return blocks;
}

export function formatProposal(
  toolName: string,
  input: Record<string, unknown>,
  // Kept in the signature for callers that still pass it (the id is stored on the
  // proposal for the record) — no longer rendered, since anyone can confirm.
  _requesterUserId: string,
  previewText: string | undefined,
  // Optional resolved-target line (e.g. "• *Target:* «title» — in «DB»") shown
  // above the raw params, so the approver of a write sees the CONCRETE page it
  // will touch, not just an opaque id. Used for notion_archive.
  targetNote?: string,
): string {
  const body = renderParamsForHumans(input);
  const lines: string[] = [];
  if (previewText) {
    lines.push(previewText, "");
  }
  lines.push(`:warning: About to *${proposalVerb(toolName)}*:`);
  if (targetNote) lines.push(targetNote);
  lines.push(body);
  if (toolName === "shareout_post") {
    const audit = shareoutBundleNote(input);
    if (audit) lines.push(audit);
  }
  // Missing-context gate, made visible at confirm time (todo 070): the model is
  // told to name a brief's open questions before staging, but does so
  // inconsistently. If nothing staged mentions a gap, say so ON the card — the
  // ✅ then knowingly accepts a gap-free reading of the brief instead of
  // silently inheriting one.
  //
  // Covers PRD-shaped `notion_create` as well as `prototype_scaffold` since
  // 2026-08-22. Eval P3 regressed 3/3 → 2/3 the moment AGENT.md rule 4 started
  // steering a build-from-this-brief ask toward staging the PRD card: the flag
  // existed for one tool and the model reached for the other, so an incomplete
  // brief was staged with nothing marking it incomplete. A gate that depends on
  // which tool the model picked is not a gate.
  const gapGated =
    toolName === "prototype_scaffold" ||
    (toolName === "notion_create" && input.surface === "prd");
  if (gapGated) {
    const staged = [
      previewText ?? "",
      typeof input.notes === "string" ? input.notes : "",
      JSON.stringify(input.sections ?? ""),
      typeof input.summary === "string" ? input.summary : "",
    ]
      .join(" ")
      .toLowerCase();
    if (!/(open question|gap|ambiguit|unspecified|undecided|to confirm|tbd)/.test(staged)) {
      lines.push(
        ":mag: *No open questions were named for this brief.* If it leaves anything ambiguous (states, interactions, semantics), cancel and ask — confirming builds it as-is.",
      );
    }
  }
  lines.push(CONFIRM_FOOTER);
  return lines.join("\n");
}

// "Stage, but flag gaps loudly" (Bill, 2026-07-16): a share-out stages
// immediately with whatever is in hand, and the CARD carries the bundle audit —
// so ✅ is informed consent to post without the missing pieces, and a weaker
// model provider can't silently skip the disclosure (renderer-level, not
// prompt-level). Bundle contract for prototype share-outs: Loom walkthrough +
// live preview + Decisions DB link (skills/uno-publish/references/method.md).
function shareoutBundleNote(input: Record<string, unknown>): string | null {
  const summary = typeof input.summary === "string" ? input.summary : "";
  if (!/prototype|prototypes|scaffold/i.test(summary)) return null;
  const haystack = collectStrings(input).join("\n");
  const missing: string[] = [];
  if (!/https?:\/\/[^\s]*loom\.com/i.test(haystack)) missing.push("Loom walkthrough");
  if (!/https?:\/\/[^\s]*(netlify\.app|workers\.dev)/i.test(haystack)) missing.push("live preview");
  if (!/https?:\/\/[^\s]*(notion\.so|notion\.site|app\.notion\.com)/i.test(haystack)) {
    missing.push("Decisions DB link");
  }
  if (missing.length === 0) return null;
  return (
    `:rotating_light: *Bundle incomplete — missing: ${missing.join(" · ")}.*\n` +
    `:white_check_mark: posts *without* them — or drop the links in this thread first and I'll fold them in.`
  );
}

// notion_update gets its OWN conversational card (no ⚠️ preamble): a warm lead,
// a named + linked card line, and a `current → new` diff — all built by the
// caller (events.ts), which has the Notion reads. This just frames the lead +
// body with the shared footer. `body` is the linked-card line + diff bullets.
export function formatNotionUpdateProposal(
  previewText: string | undefined,
  body: string,
): string {
  const lines: string[] = [];
  if (previewText) lines.push(previewText, "");
  if (body) lines.push(body);
  lines.push(CONFIRM_FOOTER);
  return lines.join("\n");
}

export function renderParamsForHumans(input: Record<string, unknown>): string {
  const entries = Object.entries(input).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!entries.length) return "• _(no parameters)_";
  return entries.map(([k, v]) => renderParamEntry(k, v, "")).join("\n");
}

function renderParamEntry(key: string, value: unknown, indent: string): string {
  const label = `${indent}• *${humanizeParamKey(key)}:*`;
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return [label, ...value.map((item) => `${indent}    ◦ ${String(item)}`)].join("\n");
    }
    return [
      label,
      ...value.map((item) =>
        typeof item === "object" && item !== null
          ? Object.entries(item as Record<string, unknown>)
              .map(([k, v]) => renderParamEntry(k, v, indent + "    "))
              .join("\n")
          : `${indent}    ◦ ${String(item)}`,
      ),
    ].join("\n");
  }
  if (typeof value === "object" && value !== null) {
    return [
      label,
      ...Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        renderParamEntry(k, v, indent + "    "),
      ),
    ].join("\n");
  }
  return `${label} ${String(value)}`;
}

function humanizeParamKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\burl\b/gi, "link")
    .replace(/\bnotion prd\b/gi, "PRD")
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ── The batch plan: every operation, grouped by what it touches ──────────────

/**
 * Slack's hard shape limits on ONE message, which the plan has to live inside:
 * 50 blocks, 3,000 characters in a `section`'s text, and 40,000 in the `text`
 * field — which a card fills too, as the notification and fallback copy, so the
 * smallest of the three is what a long plan actually trips.
 */
const MAX_BLOCKS = 50;
const SECTION_LIMIT = 3000;
const MESSAGE_TEXT_LIMIT = 40000;

/** What one follow-up message is packed to — under the ~3,900 a single message
 *  is held to elsewhere, so a chunk always posts as one message. */
const FOLLOW_UP_CHARS = 3500;

/** How much of a replacement's text a plan line echoes, either side of the →. */
const GIST = 90;

/** One staged tool call, as the plan reads it. */
export interface PlannedOperation {
  toolName: string;
  input: Record<string, unknown>;
}

/** The card text, and — when the full plan would not fit on it — the messages
 *  that carry the plan instead, in the order they are posted. */
export interface OperationPlan {
  text: string;
  followUp?: string[];
}

/**
 * Splice the batch's plan into a card that renders one operation's body: every
 * operation, grouped by the page, data source, repo, channel or recipient it
 * touches, each labelled by kind, in the order they will run.
 *
 * NEVER truncated, at either fidelity. A card that shows three of four
 * operations is the failure this exists to end: the person's ✅ is consent to
 * what the card says, so the card says all of it. Past Slack's limits the plan
 * COLLAPSES — each group to its heading, its operation count and its kind tally
 * — and the complete per-operation list moves to a follow-up message. Full →
 * per-group collapsed → never dropped, in that order.
 *
 * The follow-up is posted BEFORE the card, and that ordering is the point: the
 * card carries the ✅/⛔ buttons, so it has to be the last thing in the thread —
 * a plan posted after it would put the decision above the thing being decided,
 * and the person would press the button with the list still below the fold.
 *
 * On the card itself the plan goes in ABOVE the confirm footer, so "react with
 * ✅" stays the last line read — which is the whole job of that footer.
 */
export function withOperationPlan(
  cardText: string,
  operations: ReadonlyArray<PlannedOperation>,
): OperationPlan {
  if (operations.length <= 1) return { text: cardText };
  const groups = groupOperations(operations);
  const full = planBody(operations, groups, false);
  const head = planHead(operations.length, groups.length);

  const whole = splicePlan(cardText, [head, ...full].join("\n"));
  if (fitsOneMessage(whole)) return { text: whole };

  const collapsed = splicePlan(
    cardText,
    [
      head,
      "_Too long for one card — the complete list is in the message(s) just above._",
      ...planBody(operations, groups, true),
    ].join("\n"),
  );
  return {
    text: collapsed,
    followUp: packMessages(
      `:package: *The full plan for the card below — ${operations.length} operations, in order:*`,
      full,
    ),
  };
}

/** The card's plan sections plus its one action block, inside Slack's shape. */
function fitsOneMessage(text: string): boolean {
  if (text.length > MESSAGE_TEXT_LIMIT) return false;
  const sections = textSections(text) as Array<{ text: { text: string } }>;
  if (sections.length + 1 > MAX_BLOCKS) return false;
  return sections.every((s) => s.text.text.length <= SECTION_LIMIT);
}

/**
 * The full list as messages, not as one message.
 *
 * A plan too big for the card can also be too big for a single post, and
 * "never truncated" has to survive that too — so it is packed at line
 * granularity into as many messages as it takes, in order.
 */
function packMessages(lead: string, lines: string[]): string[] {
  const messages: string[] = [];
  let current = lead;
  for (const line of lines) {
    if (current.length + line.length + 1 > FOLLOW_UP_CHARS) {
      messages.push(current);
      current = line;
      continue;
    }
    current = `${current}\n${line}`;
  }
  messages.push(current);
  return messages;
}

function planHead(operations: number, groups: number): string {
  const where = groups === 1 ? "" : ` across ${groups} targets`;
  return `:package: *This one ✅ runs ${operations} operations${where}, in order:*`;
}

function planBody(
  operations: ReadonlyArray<PlannedOperation>,
  groups: OperationGroup[],
  collapse: boolean,
): string[] {
  const lines: string[] = [];
  for (const group of groups) {
    if (collapse) {
      lines.push(`${group.heading} — ${groupTally(group.members.map((i) => operations[i]!))}`);
      continue;
    }
    lines.push(group.heading);
    for (const i of group.members) lines.push(...planLines(operations[i]!, i + 1));
  }
  return lines;
}

/** `3 ops: 1 replace in place, 2 append` — enough to know what a collapsed
 *  group does, without the group pretending the detail is gone. */
function groupTally(members: ReadonlyArray<PlannedOperation>): string {
  const counts = new Map<string, number>();
  for (const op of members) {
    for (const kind of operationKinds(op)) {
      counts.set(kind.label, (counts.get(kind.label) ?? 0) + 1);
    }
  }
  const tally = [...counts].map(([label, n]) => `${n} ${label}`).join(", ");
  return `${members.length} op${members.length === 1 ? "" : "s"}: ${tally}`;
}

function planLines(op: PlannedOperation, n: number): string[] {
  const [first, ...rest] = operationKinds(op);
  const lines = [`  ${n}. *${first!.label}*${first!.details[0] ? ` — ${first!.details[0]}` : ""}`];
  for (const detail of first!.details.slice(1)) lines.push(`       ↳ ${detail}`);
  for (const kind of rest) {
    lines.push(`       ↳ *${kind.label}*${kind.details[0] ? ` — ${kind.details[0]}` : ""}`);
    for (const detail of kind.details.slice(1)) lines.push(`       ↳ ${detail}`);
  }
  return lines;
}

/** A run of operations that land on the SAME thing, in batch order. */
export interface OperationGroup {
  heading: string;
  /** Indices into the batch — so a caller can pair a group with whatever else
   *  it holds per operation (the Gate's outcomes) without re-deriving order. */
  members: number[];
}

/**
 * The batch, grouped by target and nothing else.
 *
 * Grouping is what makes a four-page plan readable: "these three lines are all
 * the PRD" is the question a person actually asks of the card. Groups appear in
 * the order their first operation does, and the numbering is the batch's own,
 * so the headings still read top to bottom as the run order.
 */
export function groupOperations(operations: ReadonlyArray<PlannedOperation>): OperationGroup[] {
  const groups: OperationGroup[] = [];
  const byKey = new Map<string, OperationGroup>();
  operations.forEach((op, i) => {
    const { key, heading } = operationGroupKey(op);
    let group = byKey.get(key);
    if (!group) {
      group = { heading, members: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.members.push(i);
  });
  return groups;
}

/** What an operation lands ON, in the words its own input uses — a Notion page,
 *  a data source, a repo, a channel, a recipient. Never invented: an input that
 *  names no target gets the tool's own generic heading, because a wrong target
 *  on a card is worse than a vague one. */
function operationGroupKey(op: PlannedOperation): { key: string; heading: string } {
  const str = (k: string): string =>
    typeof op.input[k] === "string" ? (op.input[k] as string).trim() : "";

  if (op.toolName === "notion_create") {
    const source = str("database") || str("data_source") || str("surface");
    return source
      ? { key: `source:${source.toLowerCase()}`, heading: `*${source}* (Notion data source)` }
      : { key: "source:notion", heading: "*Notion*" };
  }
  if (op.toolName === "email_send") {
    const to = str("to") || str("recipient");
    return to
      ? { key: `email:${to.toLowerCase()}`, heading: `*${to}*` }
      : { key: "email:", heading: "*Gmail*" };
  }
  if (op.toolName === "shareout_post") {
    const channel = str("channel") || "#plus-design-feedback";
    return { key: `channel:${channel.toLowerCase()}`, heading: `*${channel}*` };
  }
  if (op.toolName === "component_implement" || op.toolName === "prototype_scaffold") {
    const repo = str("repo") || str("repository");
    if (repo) return { key: `repo:${repo.toLowerCase()}`, heading: `*${repo}*` };
  }
  const pageUrl = str("page_url") || str("url");
  const title = str("title") || str("page_title") || str("page");
  if (pageUrl || title) {
    const heading = pageUrl ? `*<${pageUrl}|${title || "this Notion page"}>*` : `*${title}*`;
    return { key: `page:${(pageUrl || title).toLowerCase()}`, heading };
  }
  const target = operationTarget(op.input);
  return target
    ? { key: `other:${target.toLowerCase()}`, heading: `*${target}*` }
    : { key: `tool:${op.toolName}`, heading: `*${op.toolName}*` };
}

/** One operation's kinds, each with its own detail lines. A `notion_update`
 *  can carry more than one — properties AND a rewrite AND an append are three
 *  different things to consent to, so they get three labels, not one "update". */
export function operationKinds(
  op: PlannedOperation,
): Array<{ label: string; details: string[] }> {
  if (op.toolName !== "notion_update") {
    const detail = operationTarget(op.input);
    return [{ label: simpleKind(op.toolName), details: detail ? [detail] : [] }];
  }
  const kinds: Array<{ label: string; details: string[] }> = [];
  const properties =
    op.input.properties && typeof op.input.properties === "object"
      ? (op.input.properties as Record<string, unknown>)
      : {};
  const fields = Object.entries(properties).filter(([, v]) => typeof v === "string");
  if (fields.length) {
    kinds.push({
      label: "set properties",
      details: fields.map(([k, v]) => `${humanizeParamKey(k)} → \`${String(v)}\``),
    });
  }
  const replaces = Array.isArray(op.input.replace)
    ? (op.input.replace.filter((r) => r && typeof r === "object") as Record<string, unknown>[])
    : [];
  if (replaces.length) kinds.push({ label: "replace in place", details: replaces.map(replaceGist) });
  const append = appendDetail(op.input.append);
  if (append) kinds.push({ label: "append", details: [append] });
  return kinds.length ? kinds : [{ label: "update", details: [] }];
}

/** The kinds of one operation on one line — what a result line names an outcome
 *  by, so a done/failed line says WHICH of a page's changes it was. */
export function operationKindSummary(op: PlannedOperation): string {
  return operationKinds(op)
    .map((k) => k.label)
    .join(" · ");
}

function simpleKind(toolName: string): string {
  switch (toolName) {
    case "notion_create": return "create row";
    case "notion_archive": return "archive";
    case "shareout_post": return "post a share-out";
    case "component_implement": return "dispatch an implementation";
    case "prototype_scaffold": return "scaffold a prototype";
    case "email_send": return "send an email";
    default: return toolName;
  }
}

/**
 * A replacement as `before → after`.
 *
 * The "before" is the block's text as the READ reported it, when the operation
 * carries it — the only honest source for what the page says now, since this
 * module performs no Notion read of its own. Without it the card cites the
 * block id instead: a person can match that against the read they just saw, and
 * an invented "before" would be a lie on the one operation that overwrites
 * words a human wrote.
 */
function replaceGist(replace: Record<string, unknown>): string {
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = replace[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };
  const before = pick("before", "current", "current_text", "block_text", "was");
  const blockId = pick("block_id", "blockId");
  const after = firstLine(pick("content"));
  const from = before
    ? `_${firstLine(before)}_`
    : blockId
      ? `block \`${blockId}\``
      : "_(the cited block)_";
  return after ? `${from} → _${after}_` : from;
}

function firstLine(text: string): string {
  const line = text.split("\n")[0] ?? "";
  return line.length > GIST ? `${line.slice(0, GIST)}…` : line;
}

function appendDetail(append: unknown): string | null {
  if (!append || typeof append !== "object") return null;
  const o = append as Record<string, unknown>;
  const headings = (Array.isArray(o.sections) ? o.sections : [])
    .map((s) =>
      s && typeof s === "object" ? String((s as Record<string, unknown>).heading ?? "").trim() : "",
    )
    .filter(Boolean);
  if (headings.length) return headings.map((h) => `_${h}_`).join(", ");
  if (typeof o.text === "string" && o.text.trim()) return "_a note on the page_";
  return null;
}

function splicePlan(cardText: string, plan: string): string {
  const at = cardText.lastIndexOf(CONFIRM_FOOTER);
  // A blank line either side: the plan is its own thing to read, not a
  // continuation of the first operation's body.
  if (at === -1) return `${cardText}\n\n${plan}`;
  return `${cardText.slice(0, at)}\n${plan}\n\n${cardText.slice(at)}`;
}

/** What an operation acts ON, in the words its input already uses: a page
 *  title, a link, or the database it lands in. Absent rather than guessed — a
 *  wrong target on a card is worse than none. */
function operationTarget(input: Record<string, unknown>): string | null {
  for (const key of [
    "title",
    "page_title",
    "page_url",
    "url",
    "page",
    "page_id",
    "database",
    "data_source",
    "surface",
    "component",
    "summary",
    "subject",
  ]) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function proposalVerb(toolName: string): string {
  switch (toolName) {
    case "component_implement": return "implement this component";
    case "prototype_scaffold": return "scaffold a new prototype from this Figma design";
    case "notion_create": return "create this card in Notion";
    case "notion_update": return "update this Notion page";
    case "notion_archive": return "archive this Notion card";
    case "shareout_post": return "share this for feedback in #plus-design-feedback";
    case "email_send": return "send an email via Gmail";
    default: return toolName;
  }
}
