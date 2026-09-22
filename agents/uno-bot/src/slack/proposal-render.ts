// Proposal-card presentation: turn the `ProposalCard` a turn handed over into
// the ⚠️ confirmation card the requester sees. Cards are read by designers, not
// machines — parameters render as labeled `•` bullets, never raw JSON (user
// decision, 2026-07-12). The executable input lives in the DO's pending state;
// this text is display-only. (Extracted from events.ts, 2026-07-12.)
//
// THE CARD ARRIVES AS DATA, and this is the one place it becomes words (#623).
// `renderProposalCard` is the whole entry: every `:warning:`, every `*bold*`,
// the confirm footer and the button row come from here and from nowhere else.
// Until now the text was assembled inside `turn/turn.ts` out of this module's
// `formatProposal` — so a module declared Slack-free imported Slack, and a turn
// test could only match the rendered string. What the turn hands over instead
// is a verb, a lead, the fields, the caveats it decided and the whole batch;
// what it gets back is what was posted.
//
// Import-free collaborators only: this module renders card TEXT and blocks and
// posts nothing. The Figma preview arrives on the card as a URL — the render
// call that fetches it is a named client on `TurnDeps.cards`, wired in
// `turn/env-deps.ts`, which is what keeps `Env` out of here.
import { textSections } from "./render";
import type { CardCaveat, CardField, CardRevision, ProposalCard } from "../turn/index";
import type { ProposalOperation } from "../thread-state/index";
import { gateWordsFor } from "../agent/tool-table";
import { relayRecipientId } from "../tools/relayed-dm-render";

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

/** A card, as Slack: the notification/fallback text, the blocks when the card
 *  has any of its own, and the messages that go out BEFORE it. */
export interface RenderedCard {
  text: string;
  blocks?: unknown[];
  /** Posted before the card, so the buttons stay last in the thread. */
  followUp?: string[];
}

/**
 * The one door: a `ProposalCard` in, Slack in, nothing else.
 *
 * Every decision above this line is the turn's — which card, which verb, which
 * caveats, which batch. Every decision below it is Slack's: the ⚠️, the bullet
 * shapes, the footer, the button row, and what to do about a plan that will not
 * fit in one message.
 */
export function renderProposalCard(card: ProposalCard): RenderedCard {
  const body = card.kind === "revision" ? revisionText(card) : confirmText(card);
  const plan = withOperationPlan(body, card.operations);
  const followUp = plan.followUp ?? [];
  if (!card.previewImageUrl) {
    return followUp.length ? { text: plan.text, followUp } : { text: plan.text };
  }
  // The Figma preview card. Its BLOCKS carry the screenshot, the preamble and
  // the footer; the planned text rides along as Slack's notification and
  // fallback copy, and as what the button handler re-renders from. A
  // `prototype_scaffold` is a single operation, so there is no plan to lose.
  const blocks: unknown[] = [];
  if (card.lead) blocks.push({ type: "section", text: { type: "mrkdwn", text: card.lead } });
  blocks.push({
    type: "image",
    image_url: card.previewImageUrl,
    alt_text: "Figma preview of the design to implement",
  });
  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: `${aboutTo(card)}\n${renderFields(card.fields)}` },
  });
  blocks.push({ type: "section", text: { type: "mrkdwn", text: CONFIRM_FOOTER } });
  blocks.push(...proposalActionBlocks());
  return followUp.length ? { text: plan.text, blocks, followUp } : { text: plan.text, blocks };
}

function aboutTo(card: ProposalCard): string {
  return `:warning: About to *${card.verb}*:`;
}

/** The ⚠️ card every gated tool but `notion_update` gets. */
function confirmText(card: ProposalCard): string {
  const lines: string[] = [];
  if (card.lead) lines.push(card.lead, "");
  lines.push(aboutTo(card));
  // The resolved target above the raw params, so the approver of a write sees
  // the CONCRETE page it will touch, not just an opaque id.
  if (card.target) lines.push(`• *Target:* ${targetWords(card.target)}`);
  lines.push(renderFields(card.fields));
  for (const caveat of card.caveats) lines.push(caveatText(caveat));
  lines.push(CONFIRM_FOOTER);
  return lines.join("\n");
}

/** `notion_update`'s own conversational card: no ⚠️ preamble, because the warm
 *  lead, the named page and the `current → new` diff say it better. */
function revisionText(card: ProposalCard): string {
  const lines: string[] = [];
  if (card.lead) lines.push(card.lead, "");
  const body = card.revision ? revisionBody(card.revision) : "";
  if (body) lines.push(body);
  for (const caveat of card.caveats) lines.push(caveatText(caveat));
  lines.push(CONFIRM_FOOTER);
  return lines.join("\n");
}

function targetWords(target: { title: string; parent?: string }): string {
  return target.parent ? `${target.title} — in ${target.parent}` : target.title;
}

function revisionBody(revision: CardRevision): string {
  const lines: string[] = [];
  const { page } = revision;
  if (page) {
    // Named + linked card — `<url|Title> — in <ParentDB>`, never a bare hex URL.
    lines.push(
      page.title
        ? `*<${page.url}|${page.title}>*${page.parent ? ` — in ${page.parent}` : ""}`
        : `*<${page.url}|this Notion page>*`,
    );
  }
  // One bullet per changed field, always — `current → new`, values backticked.
  for (const p of revision.properties) {
    lines.push(
      p.from ? `• *${p.label}:* \`${p.from}\` → \`${p.to}\`` : `• *${p.label}:* \`${p.to}\``,
    );
  }
  if (revision.rewrite) {
    const { blocks, previews } = revision.rewrite;
    const head = `• *Rewriting ${blocks} block(s) in place* (the rest of the page is untouched).`;
    lines.push(
      previews.length ? `${head}\n${previews.map((t) => `    ↳ _${t}_`).join("\n")}` : head,
    );
  }
  if (revision.append) {
    const { headings } = revision.append;
    lines.push(
      headings.length
        ? `• *Appending:* ${headings.map((h) => `_${h}_`).join(", ")}`
        : `• *Appending a note to the page.*`,
    );
  }
  return lines.join("\n");
}

/**
 * A caveat, in words.
 *
 * WHETHER a caveat is on the card is the turn's judgement and lives in
 * `turn/turn.ts`; this is only how each one reads. Every one of them is informed
 * consent rather than decoration — "stage, but flag gaps loudly" (Bill,
 * 2026-07-16) — which is why they sit above the footer and not in the prompt: a
 * weaker model provider cannot silently skip a disclosure the renderer writes.
 */
function caveatText(caveat: CardCaveat): string {
  if (caveat.kind === "bundle-incomplete") {
    return (
      `:rotating_light: *Bundle incomplete — missing: ${caveat.missing.join(" · ")}.*\n` +
      `:white_check_mark: posts *without* them — or drop the links in this thread first and I'll fold them in.`
    );
  }
  if (caveat.kind === "repo-visibility") {
    // What goes out, and the words a person checks before it does.
    const [what, when, check] =
      caveat.write === "comment"
        ? ["the comment", "once it's posted", "Check it"]
        : ["the issue", "once it's filed", "Check the body"];
    const who =
      caveat.visibility === "public"
        ? `:globe_with_meridians: *${caveat.repo}* is public — anyone can read ${what} ${when}.`
        : caveat.visibility === "private"
          ? `:lock: *${caveat.repo}* is private — only people with access to it can read ${what}.`
          : `:globe_with_meridians: *${caveat.repo}* may be public — I couldn't check, so treat ${what} as readable by anyone.`;
    // A DM's footer names the requester and links nothing, so the card
    // promises no link either.
    const footer = caveat.fromDm ? "I add a footer naming you." : "I add a footer naming you and linking this thread.";
    return `${who} ${check} for anything from a DM or private channel before you approve; ${footer}`;
  }
  return ":mag: *No open questions were named for this brief.* If it leaves anything ambiguous (states, interactions, semantics), cancel and ask — confirming builds it as-is.";
}

function renderFields(fields: ReadonlyArray<CardField>): string {
  if (!fields.length) return "• _(no parameters)_";
  return fields.map((f) => renderField(f, "")).join("\n");
}

function renderField(field: CardField, indent: string): string {
  const label = `${indent}• *${humanizeParamKey(field.label)}:*`;
  const under = field.under ?? [];
  if (!under.length) return `${label} ${field.value ?? ""}`;
  return [
    label,
    ...under.map((row) =>
      "item" in row ? `${indent}    ◦ ${row.item}` : renderField(row.field, `${indent}    `),
    ),
  ].join("\n");
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

/** One staged tool call, as the plan reads it — the batch's own row, so the
 *  plan and the thing a ✅ executes can never be two different shapes. */
export type PlannedOperation = ProposalOperation;

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
  if (op.toolName === "dm_relay") {
    const id = relayRecipientId(op.input.recipient);
    return id
      ? { key: `dm:${id}`, heading: `*<@${id}>*` }
      : { key: "dm:", heading: "*a DM*" };
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
  // The row's own word for one operation of this kind, and the raw tool name
  // only for something the table does not gate — which a planned operation
  // never is.
  const kind = gateWordsFor(op.toolName)?.kind ?? op.toolName;
  if (op.toolName !== "notion_update") {
    const detail = operationTarget(op.input);
    return [{ label: kind, details: detail ? [detail] : [] }];
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
  return kinds.length ? kinds : [{ label: kind, details: [] }];
}

/** The kinds of one operation on one line — what a result line names an outcome
 *  by, so a done/failed line says WHICH of a page's changes it was. */
export function operationKindSummary(op: PlannedOperation): string {
  return operationKinds(op)
    .map((k) => k.label)
    .join(" · ");
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

