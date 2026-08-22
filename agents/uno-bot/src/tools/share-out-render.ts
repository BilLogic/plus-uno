// The share-out post, rendered.
//
// Split out of share-for-feedback.ts so the SHAPE is testable — the executor
// reaches for Env and the Slack API, neither of which exists under `npm test`,
// and the shape is the part that drifted.
//
// WHAT DRIFTED. `docs/conventions/slack.md` § Share-out post has specified the
// Flow 3 template since 2026-07-16: fidelity, round, what changed, up to three
// specific questions, an explicit out-of-scope line, the bundle links, and a
// cc + date. The tool posted four fixed lines built from `summary` / `link` /
// `reviewers` / `deadline` and had no fields for any of the rest, so the
// documented template was reachable only if the model crammed everything into
// `summary` — and the header line could never match at all.
//
// The doc won, because each field it asks for changes what a reviewer does:
// fidelity says which critiques are useful yet, round says whether to repeat
// last round's points, three specific questions prevent "thoughts?", and the
// out-of-scope line stops feedback nobody can act on. That is a team practice,
// not decoration, so the tool grew to carry it rather than the doc shrinking to
// match an under-built tool.

/** At most this many feedback questions. The cap IS the convention — an
 *  open-ended list is the "thoughts?" the ritual exists to prevent. */
export const MAX_FEEDBACK_QUESTIONS = 3;

export interface ShareoutFields {
  summary: string;
  project?: string;
  artifact?: string;
  fidelity?: string;
  round?: number;
  whatChanged?: string;
  feedbackWanted: string[];
  notLookingFor?: string;
  link?: string;
  reviewers: string[];
  deadline?: string;
}

/** A Slack user id ("U…"/"W…") gets @-mentioned; anything else is shown as-is. */
export function renderReviewer(r: string): string {
  const t = r.trim();
  return /^[UW][A-Z0-9]{6,}$/.test(t) ? `<@${t}>` : t;
}

/**
 * The message body, in Slack mrkdwn.
 *
 * Worker-authored text is written as mrkdwn directly (the model's Markdown is
 * converted at `postMessage`); `toSlackMrkdwn` is idempotent over this, so a
 * model-supplied `summary` carrying Markdown still converts correctly.
 *
 * Every line below the first is optional. A share-out with only a summary
 * still posts — the ritual degrades to what the old tool did rather than
 * refusing, because a partial share-out beats a blocked one (the same policy
 * as the bundle audit, 2026-07-16).
 */
export function renderShareout(f: ShareoutFields, requester: string): string {
  const head = [
    ":mega:",
    f.project ? `*${f.project}*` : null,
    f.artifact ? `— ${f.artifact}` : null,
    f.fidelity ? `· fidelity: ${f.fidelity}` : null,
    f.round && f.round > 1 ? `· round ${f.round}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const lines: string[] = [];
  // Fall back to the old header when no project/artifact was given, so the
  // post never opens with a bare megaphone.
  lines.push(head === ":mega:" ? `:mega: *Sharing for feedback*` : head);
  lines.push(`*What this is:* ${f.summary}`);
  if (f.whatChanged) lines.push(`*What changed since last round:* ${f.whatChanged}`);

  const questions = f.feedbackWanted.slice(0, MAX_FEEDBACK_QUESTIONS);
  if (questions.length) {
    lines.push(`:dart: *Feedback wanted on:*`);
    questions.forEach((q, i) => lines.push(`  ${i + 1}. ${q}`));
  }
  if (f.notLookingFor) lines.push(`*Not looking for feedback on:* ${f.notLookingFor}`);
  if (f.link) lines.push(`:link: ${f.link}`);
  if (f.reviewers.length) lines.push(`cc ${f.reviewers.map(renderReviewer).join(" ")}`);

  lines.push(
    `Shared by ${requester}. Comments in-thread${f.deadline ? ` by *${f.deadline}*` : ""}.`,
  );
  return lines.join("\n");
}

/** Normalize a tool input value to a string list (accepts an array or a
 *  comma-separated string, which is what the model reaches for under load). */
export function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Pull the rendered fields out of a raw tool payload. */
export function fieldsFromInput(input: Record<string, unknown>): ShareoutFields {
  const str = (k: string): string | undefined => {
    const v = input[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const round = typeof input.round === "number" ? input.round : Number(input.round) || undefined;
  return {
    summary: str("summary") ?? "",
    project: str("project"),
    artifact: str("artifact"),
    fidelity: str("fidelity"),
    round,
    whatChanged: str("what_changed"),
    feedbackWanted: asList(input.feedback_wanted),
    notLookingFor: str("not_looking_for"),
    link: str("link"),
    reviewers: asList(input.reviewers),
    deadline: str("deadline"),
  };
}
