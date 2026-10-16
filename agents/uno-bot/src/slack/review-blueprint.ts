// The Review pop-up's readings of the two blueprint cards, in the shared
// anatomy (`review-anatomy.ts`): the blueprint revision from shipped work
// (`docs/plans/2026-10-15-review-modal-redesign.md` § Blueprint cards, A3–A6)
// and the idea offered as a blueprint proposal (B3, B4). Both are
// `blueprint_revise`; the facts say which (`PendingProposal.facts`,
// `blueprint-upkeep/facts.ts`). A card staged before its facts rode the
// proposal has none, its reading is null, and the pop-up shows its text.
//
// ONE COMPARISON, ONE SECTION PER STEP. Every comparison is drawn step by
// step, never as one grid: the step in bold, its rows today as `` `lane`
// content ``, then — in a revision — that step's changes under the plain bold
// labels Added, Changed and Deprecated, or — in a proposal — its Proposed
// rows; a divider closes the step. One builder draws every step, open,
// read-only or decided, so the rule holds by construction. No line leads with
// an emoji.
//
// WHAT IS AN INPUT. In a revision a confirmer edits the text of each added and
// changed row in place (`review-blueprint-fields.ts`), each input under its
// step; past the cap the rest show as text. Nothing else is an input.
//
// FRAME WORDS AS CODE ONLY WHERE THE BLOCK TAKES CODE: in rich text and
// mrkdwn. The header, the card, the alerts and the decision's descriptions are
// plain text, and say them plain.
//
// PURE: blocks out, nothing posted, nothing read.
import { clip, isLink } from "./card-block";
import { fieldInputBlocks } from "./review-fields";
import { rowPath } from "./review-blueprint-fields";
import { blueprintApprove, type DraftAlert, type DraftAnatomy, type WhereElement } from "./review-anatomy";
import { codeStyled } from "./review-stated";
import type { AnatomyContext } from "./review-draft";
import type { BlueprintProposalFacts, BlueprintRevisionFacts, BlueprintRowFact, BlueprintStepFact, CardOwner } from "../thread-state/index";

type Input = Record<string, unknown>;

/** One element of a rich text line. */
type Style = { bold?: boolean; code?: boolean; italic?: boolean; strike?: boolean };
type Element = { type: "text"; text: string; style?: Style } | { type: "link"; url: string; text: string } | { type: "user"; user_id: string };

/** Slack's cap on a text; rich text is held to it per element. */
const TEXT_CHARS = 3000;
/** Today's rows a step lists before it says how many more there are. */
const MAX_ROWS = 40;

const t = (text: string, style?: Style): Element => ({ type: "text", text: clip(text, TEXT_CHARS), ...(style ? { style } : {}) });
const link = (url: string | undefined, text: string): Element => (url && isLink(url) ? { type: "link", url, text: clip(text, TEXT_CHARS) } : t(text));
const section = (elements: readonly Element[]) => ({ type: "rich_text_section", elements: [...elements] });
const bullets = (items: ReadonlyArray<readonly Element[]>, style: "bullet" | "ordered" = "bullet") => ({
  type: "rich_text_list",
  style,
  elements: items.map(section),
});
const rich = (...elements: unknown[]) => ({ type: "rich_text", elements });
const divider = { type: "divider" };
const context = (text: string) => ({ type: "context", elements: [{ type: "mrkdwn", text }] });

/** A row as a step lists it: its lane in code, then its text. */
const rowLine = (row: BlueprintRowFact): Element[] => [t(row.lane, { code: true }), t(` ${row.content}`)];

/** A changed row: its lane in code, today's text struck through, an arrow, the new text. */
const changedLine = (row: BlueprintRowFact & { before: string }): Element[] => [
  t(row.lane, { code: true }),
  t(" "),
  t(row.before, { strike: true }),
  t(` → ${row.content}`),
];

/** A step's rows as a list, past `MAX_ROWS` ending "and N more on the
 *  blueprint"; a line in italics where it has none. */
function rowsOf(rows: readonly BlueprintRowFact[], none: string): unknown {
  if (!rows.length) return section([t(none, { italic: true })]);
  const shown = rows.slice(0, MAX_ROWS).map(rowLine);
  if (rows.length > MAX_ROWS) shown.push([t(`and ${rows.length - MAX_ROWS} more on the blueprint`)]);
  return bullets(shown);
}

/** The text a row writes: the operation's, which holds what was approved,
 *  else the facts'. */
function contentAt(input: Input, row: number, fallback: string): string {
  const rows = Array.isArray(input.rows) ? input.rows : [];
  const content = (rows[row] as { content?: unknown } | undefined)?.content;
  return typeof content === "string" && content.trim() ? content : fallback;
}

/** "@A and @B": each owner a pill where Slack knows them, else their name. */
function ownerElements(owners: readonly CardOwner[]): Element[] {
  const out: Element[] = [];
  owners.forEach((o, i) => {
    if (i) out.push(t(i === owners.length - 1 ? " and " : ", "));
    out.push("slack" in o ? { type: "user", user_id: o.slack } : t(o.name));
  });
  return out;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ── The revision ────────────────────────────────────────────────────────────

/**
 * One step of a revision: today's rows, then its changes. For a confirmer each
 * added and changed row's text is its input, under the step; otherwise the
 * step is one block, a changed row's old text struck through before an arrow.
 */
function revisionStep(step: BlueprintStepFact, input: Input, ctx: AnatomyContext): unknown[] {
  const head = [section([t(step.step, { bold: true })]), section([t("Today", { italic: true })]), rowsOf(step.today, "No rows today")];
  const field = (row: number) => ctx.inline?.get(`0.${rowPath(row)}`);
  const added = (step.added ?? []).map((r) => ({ ...r, content: contentAt(input, r.row, r.content) }));
  const changed = (step.changed ?? []).map((r) => ({ ...r, content: contentAt(input, r.row, r.content) }));
  const inputs = [...added, ...changed].some((r) => field(r.row));

  const deprecated = step.deprecated?.length
    ? [
        section([t("Deprecated", { bold: true })]),
        bullets(step.deprecated.map((r) => [t(r.lane, { code: true }), t(" "), t(r.content, { strike: true }), ...(r.inferred ? [t("  inferred", { italic: true })] : [])])),
      ]
    : [];
  const promoted = step.promoted?.length ? [section([t("Promoted", { bold: true })]), bullets(step.promoted.map(rowLine))] : [];

  if (!inputs) {
    const parts = [
      ...(added.length ? [section([t("Added", { bold: true })]), bullets(added.map(rowLine))] : []),
      ...(changed.length ? [section([t("Changed", { bold: true })]), bullets(changed.map(changedLine))] : []),
      ...deprecated,
      ...promoted,
    ];
    return [rich(...head, ...parts), divider];
  }

  const blocks: unknown[] = [rich(...head)];
  const inputOf = (row: number) => fieldInputBlocks([field(row)!]);
  if (added.length) {
    const shown = added.filter((r) => !field(r.row));
    blocks.push(rich(section([t("Added", { bold: true })]), ...(shown.length ? [bullets(shown.map(rowLine))] : [])));
    for (const r of added) if (field(r.row)) blocks.push(...inputOf(r.row));
  }
  if (changed.length) {
    // An input's row is named with its text today; one past the cap, whole.
    const lines = changed.map((r) => (field(r.row) ? [t(r.lane, { code: true }), t(" today: "), t(r.before, { strike: true })] : changedLine(r)));
    blocks.push(rich(section([t("Changed", { bold: true })]), bullets(lines)));
    for (const r of changed) if (field(r.row)) blocks.push(...inputOf(r.row));
  }
  if (deprecated.length || promoted.length) blocks.push(rich(...deprecated, ...promoted));
  blocks.push(divider);
  return blocks;
}

/** Rows of the later steps listed, at most; past them a line says how many
 *  more, and Needs changes splits the card. */
const MAX_LATER_ROWS = 40;

/**
 * The steps past the cap as one block of text: every row each adds, changes,
 * deprecates or promotes, under its step's name, so nothing the Approve
 * writes is out of sight. Their rows are not inputs; Needs changes corrects
 * them.
 */
function laterSteps(later: readonly BlueprintStepFact[]): unknown[] {
  if (!later.length) return [];
  const lines = later.flatMap((step) =>
    [
      ...(step.added ?? []).map((r) => [t("Added ", { bold: true }), ...rowLine(r)]),
      ...(step.changed ?? []).map((r) => [t("Changed ", { bold: true }), ...changedLine(r)]),
      ...(step.deprecated ?? []).map((r) => [t("Deprecated ", { bold: true }), t(r.lane, { code: true }), t(" "), t(r.content, { strike: true })]),
      ...(step.promoted ?? []).map((r) => [t("Promoted ", { bold: true }), ...rowLine(r)]),
    ].map((row) => [t(`${step.step}: `, { italic: true }), ...row]),
  );
  const shown = lines.slice(0, MAX_LATER_ROWS);
  if (lines.length > MAX_LATER_ROWS) shown.push([t(`and ${plural(lines.length - MAX_LATER_ROWS, "more row")}: Needs changes splits this card`)]);
  return [rich(section([t(`${plural(later.length, "more step")}, as text`, { bold: true })]), bullets(shown)), divider];
}

/** Every step drawn in full, then the later ones as text. */
function revisionSteps(facts: BlueprintRevisionFacts, input: Input, ctx: AnatomyContext): unknown[] {
  return [divider, ...facts.steps.flatMap((s) => revisionStep(s, input, ctx)), ...laterSteps(facts.later ?? [])];
}

/** The status the revision is written as, in rich text: "written as `live`",
 *  "`planned` → `live`". */
function statusElements(status: BlueprintRevisionFacts["status"]): Element[] {
  return status.from
    ? [t(status.from, { code: true }), t(" → "), t(status.to, { code: true })]
    : [t("written as "), t(status.to, { code: true })];
}

/** Why now, in the Roadmap's words: the RM-ID, its status in code and the
 *  owners, then the one quoted sentence. */
function whyNowElements(facts: BlueprintRevisionFacts): Element[] {
  const { card } = facts;
  return [
    t("Why now ", { bold: true }),
    link(card.url, card.id),
    t(" "),
    t(card.status, { code: true }),
    ...(facts.owners.length ? [t(" · "), ...ownerElements(facts.owners)] : []),
    ...(card.quote ? [t(`\n“${card.quote}” `), link(card.url, "From the card")] : []),
  ];
}

/** What needs attention: what the draft could not verify and what it
 *  inferred, then the tier it fell back to. */
function revisionAlerts(facts: BlueprintRevisionFacts): DraftAlert[] {
  const unverified = Math.max(0, facts.questions.length - facts.inferred);
  const parts = [
    ...(unverified ? [`${plural(unverified, "thing")} unverified`] : []),
    ...(facts.inferred ? [`${plural(facts.inferred, "row")} inferred`] : []),
  ];
  return [
    ...(parts.length ? [{ level: "warning" as const, text: `${parts.join(" and ")}. The owner is asked below.` }] : []),
    ...(facts.tierNote ? [{ level: "info" as const, text: facts.tierNote }] : []),
  ];
}

/** The owner's questions before the rows are written, as an ordered list. */
function questionBlocks(facts: BlueprintRevisionFacts, editing: boolean): unknown[] {
  if (!facts.questions.length) return [];
  const lead = facts.owners.length ? [...ownerElements(facts.owners), t(", before this is written:")] : [t("Before this is written:")];
  return [
    rich(section(lead), bullets(facts.questions.map((q) => codeStyled(q) as Element[]), "ordered")),
    ...(editing ? [context("Answer in Needs changes' note, or in the thread naming this path. Either redrafts this card.")] : []),
  ];
}

const WRITER = "Written by uno-bot's blueprint identity, each row logged with its undo.";

/** Said for Needs changes on a revision (§ A3) and on a retirement, which has
 *  no rows to redraft. */
export const REVISION_REVISE = "I redraft the rows from your note, on this card.";
export const RETIREMENT_REVISE = "A retirement isn't redrafted: Reject keeps the path as it is.";

/**
 * A blueprint revision (§ A3): the path as the header, where it is and what
 * changes, why now, the gaps as an alert, today's path as a card with View
 * slice, one section per changed step — the confirmer's inputs in place —
 * then the owner's questions and who writes it. Decided (§ A5), the where
 * line, the alert and the questions go.
 */
function revisionAnatomy(input: Input, facts: BlueprintRevisionFacts, ctx: AnatomyContext): DraftAnatomy {
  const header = `${facts.scenario} › ${facts.today.name}`;
  const counts = (["added", "changed", "deprecated", "promoted"] as const).filter((k) => facts.counts[k]).map((k) => `${facts.counts[k]} ${k}`);
  const what = facts.retires ? `${plural(facts.counts.deprecated, "row")} retire with it` : counts.join(", ");
  const where: WhereElement[] = [
    link(facts.scenarioUrl, facts.scenario) as WhereElement,
    { type: "text", text: " · " },
    ...(statusElements(facts.status) as WhereElement[]),
    ...(what ? [{ type: "text" as const, text: ` · ${what}` }] : []),
  ];
  const object = {
    title: `Today: ${facts.today.name}`,
    subtitle: `${facts.scenario} · ${facts.today.rows}`,
    ...(facts.today.view ? { open: { url: facts.today.view, text: "View slice" } } : {}),
  };
  const note = facts.note ? [context(facts.note)] : [];
  const steps = revisionSteps(facts, input, ctx);
  const rows = Array.isArray(input.rows) ? input.rows.length : 0;
  const destination = facts.retires
    ? "set the path to `deprecated`"
    : `write ${plural(rows, "change")} to the blueprint`;
  return {
    header,
    where: [...where, { type: "text", text: "\n" }, ...(whyNowElements(facts) as WhereElement[])],
    alerts: revisionAlerts(facts),
    object,
    content: [...note, ...steps, ...questionBlocks(facts, ctx.editing === true), context(WRITER)],
    approve: blueprintApprove(input),
    revise: facts.retires ? RETIREMENT_REVISE : REVISION_REVISE,
    destination,
    settled: {
      header,
      object,
      content: [rich(section(whyNowElements(facts))), ...note, ...revisionSteps(facts, input, { ...ctx, inline: new Map(), editing: false }), context(WRITER)],
    },
  };
}

// ── The proposal ────────────────────────────────────────────────────────────

/** One step of a proposal: today's rows, then the proposal's, "No such step"
 *  where a side has none. One block and its divider. */
function proposalStep(step: BlueprintStepFact): unknown[] {
  return [
    rich(
      section([t(step.step, { bold: true })]),
      section([t("Today", { italic: true })]),
      rowsOf(step.today, "No rows today"),
      section([t("Proposed", { italic: true })]),
      rowsOf(step.proposed ?? [], "No such step"),
    ),
    divider,
  ];
}

/** A drawn proposal's step once decided: what it wrote, nothing else. */
function drawnStep(step: BlueprintStepFact): unknown[] {
  if (!step.proposed?.length) return [];
  return [rich(section([t(step.step, { bold: true })]), rowsOf(step.proposed, "")), divider];
}

/**
 * A blueprint proposal (§ B3): the new path as the header, where it is drawn
 * and that nothing `live` changes, what the draft had to guess as alerts,
 * today's path as a card with View slice, then one section per step, today's
 * rows and the proposal's. Its rows are not inputs. Decided (§ B4), the card
 * is the drawn path and each step shows what it wrote.
 */
function proposalAnatomy(input: Input, facts: BlueprintProposalFacts): DraftAnatomy {
  const header = `${facts.scenario} › ${facts.name}`;
  const more = facts.moreSteps ? [context(`${plural(facts.moreSteps, "more step")} on the blueprint.`)] : [];
  return {
    header,
    where: [
      { type: "text", text: "New " },
      { type: "text", text: "path", style: { code: true } },
      { type: "text", text: " in " },
      link(facts.scenarioUrl, facts.scenario) as WhereElement,
      { type: "text", text: " · written as " },
      { type: "text", text: "proposed", style: { code: true } },
      { type: "text", text: " · nothing " },
      { type: "text", text: "live", style: { code: true } },
      { type: "text", text: " changes" },
    ],
    alerts: facts.gaps.map((g) => ({ level: "warning" as const, text: g.replace(/`/g, "") })),
    object: {
      title: `Today: ${facts.today.name}`,
      subtitle: `${facts.scenario} · ${facts.today.rows}`,
      ...(facts.today.view ? { open: { url: facts.today.view, text: "View slice" } } : {}),
    },
    content: [
      divider,
      ...facts.steps.flatMap(proposalStep),
      ...more,
      context("Written by uno-bot's blueprint identity. Once your PRD is a Roadmap card, shipping it promotes these rows."),
    ],
    approve: blueprintApprove(input),
    destination: `draw ${plural(facts.rows, "`proposed` row")} on the blueprint`,
    settled: {
      header,
      object: {
        title: `Proposed: ${facts.name}`,
        subtitle: `${facts.scenario} · new path · ${plural(facts.rows, "row")}, proposed`,
        ...(facts.today.view ? { open: { url: facts.today.view, text: "View slice" } } : {}),
      },
      content: [
        divider,
        ...facts.steps.flatMap(drawnStep),
        context("Say “remove it” in the thread to withdraw it. With no Roadmap card after 30 days, I'll offer to remove it."),
      ],
    },
  };
}

/**
 * `blueprint_revise` in the shared anatomy: a revision or a proposal, by its
 * facts; null for a card staged without them.
 *
 * @param input - The operation's input, edits applied
 * @param context - The card's facts, its inputs in place and whether the
 *   reader may decide
 */
export function blueprintReviseAnatomy(input: Input, context: AnatomyContext): DraftAnatomy | null {
  const facts = context.facts;
  if (facts?.kind === "blueprint_revision") return revisionAnatomy(input, facts, context);
  if (facts?.kind === "blueprint_proposal") return proposalAnatomy(input, facts);
  return null;
}
