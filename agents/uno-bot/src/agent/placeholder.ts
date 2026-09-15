// Placeholder SHAPE, not vocabulary — what a create call may not be filed with.
//
// The guard used to be a word list (`/\b(TBD|TODO|lorem|placeholder)\b/i`) run
// over every string in the call, which refused a decision record whose body
// honestly said flows were "parked in Figma under TBD" (2026-09-15). A
// placeholder is a SHAPE, not a word: a field that is nothing but the token, a
// bracketed or templated slot nobody filled, or a required field left empty.
// Prose that merely mentions the word is content — and so is anything quoted or
// in a code span, which is how a person NAMES a token rather than leaving one.
//
// Import-free, like `tool-input.ts` beside it: `preflight.ts` carries `Env` and
// the design-system component list, so a detector living there is one
// `tsconfig.test.json` cannot compile and no test can drive directly.

/** A field that is nothing but one of these is a slot nobody filled in. */
const PLACEHOLDER_TOKEN_RE =
  /^(?:tbd|tba|tbc|todo|placeholder|lorem(?:\s+ipsum[\s\S]*)?|x{3,}|\?{3,})$/i;

/** What makes bracketed text a template slot rather than a real phrase. */
const SLOT_WORD_RE =
  /^(?:tbd|tba|tbc|todo|placeholder|lorem[\s\S]*|x{3,}|\?{3,}|(?:fill|insert|add|write|describe|your|name of|link to)\b[\s\S]*)$/i;

/** Quoted text and code spans are how a person names a token; never a slot. */
function scannable(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/"[^"\n]*"/g, " ")
    .replace(/“[^”\n]*”/g, " ")
    .replace(/‘[^’\n]*’/g, " ");
}

/** The first unfilled slot in one field's text, written as it appears. */
function findSlot(text: string): string | null {
  const mustache = text.match(/\{\{[^{}]*\}\}/);
  if (mustache) return mustache[0];
  const rule = text.match(/_{3,}/);
  if (rule) return rule[0];
  // `[label](url)` is a link and `- [ ]` a checkbox — only a bare bracket whose
  // inside reads as scaffolding counts.
  for (const m of text.matchAll(/\[([^\]\n]*)\](\()?/g)) {
    if (!m[2] && SLOT_WORD_RE.test((m[1] ?? "").trim())) return `[${m[1]}]`;
  }
  // `<@U123>` and `<https://…>` are Slack's own angle brackets; same test.
  for (const m of text.matchAll(/<([^<>\n]*)>/g)) {
    if (SLOT_WORD_RE.test((m[1] ?? "").trim())) return `<${m[1]}>`;
  }
  return null;
}

/**
 * A reconcile-shaped call can carry the text it is rewriting. A slot the SOURCE
 * already contains is the source's own wording, not something the model left
 * blank, so it is not the bot's to refuse. No create surface passes one today —
 * the rule lives here so the first one that does inherits it.
 */
const SOURCE_KEYS = ["source_text", "current_text", "existing_text", "page_text"];
function sourceTextOf(input: Record<string, unknown>): string {
  return SOURCE_KEYS.map((k) => (typeof input[k] === "string" ? (input[k] as string) : "")).join(
    "\n",
  );
}

interface PlaceholderHit {
  /** The field in the person's words ("summary", "the Decision section"). */
  field: string;
  /** Exactly what tripped it, so one reply can fix it. */
  text: string;
}

function findPlaceholder(
  fields: Array<{ name: string; value: string }>,
  source: string,
): PlaceholderHit | null {
  for (const { name, value } of fields) {
    const text = scannable(value);
    const bare = text
      .trim()
      .replace(/^[\s*_>#-]+/, "")
      .replace(/[\s*_.:;,!-]+$/, "");
    if (bare && PLACEHOLDER_TOKEN_RE.test(bare)) return { field: name, text: bare };
    const slot = findSlot(text);
    if (slot && !source.includes(slot)) return { field: name, text: slot };
  }
  return null;
}

/** The surface in its own words — a decision record is not "a card". */
function notionSurfaceName(input: Record<string, unknown>): string {
  const surface = typeof input.surface === "string" ? input.surface.trim().toLowerCase() : "";
  switch (surface) {
    case "prd":
      return "PRD";
    case "decision":
      return "decision record";
    case "intake":
      return "intake";
    default:
      return "Notion page";
  }
}

/** Every scanned field of a `notion_create`, labelled as a person would say it. */
function notionCreateFields(
  input: Record<string, unknown>,
): Array<{ name: string; value: string }> {
  const fields: Array<{ name: string; value: string }> = [];
  if (typeof input.title === "string") fields.push({ name: "title", value: input.title });
  if (typeof input.summary === "string") fields.push({ name: "summary", value: input.summary });
  const sections = Array.isArray(input.sections) ? input.sections : [];
  sections.forEach((s, i) => {
    if (typeof s === "string") {
      fields.push({ name: `section ${i + 1}`, value: s });
      return;
    }
    if (!s || typeof s !== "object") return;
    const section = s as Record<string, unknown>;
    const heading = typeof section.heading === "string" ? section.heading.trim() : "";
    const label = heading ? `${heading} section` : `section ${i + 1}`;
    for (const [key, value] of Object.entries(section)) {
      if (typeof value !== "string") continue;
      fields.push({ name: key === "heading" ? `${label} heading` : label, value });
    }
  });
  return fields;
}

/**
 * Why this create call may not be filed as written, or null when it may.
 *
 * The wording names the surface, the field and the text that tripped it: a
 * refusal the reader cannot act on in one reply is a refusal that just gets the
 * same proposal posted back (the model gets this string as the call's result
 * before anyone sees it — `agent/loop.ts`).
 */
export function placeholderRefusal(
  toolName: string,
  input: Record<string, unknown>,
): string | null {
  if (toolName !== "notion_create") return null;
  const surface = notionSurfaceName(input);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) {
    return `:memo: That ${surface} has no *title* yet. Give me a one-liner and I'll stage it.`;
  }
  const hit = findPlaceholder(notionCreateFields(input), sourceTextOf(input));
  if (!hit) return null;
  return (
    `:memo: I won't file that ${surface} yet — the *${hit.field}* is still a placeholder (\`${hit.text}\`). ` +
    "Send me the real wording for that one and I'll stage it."
  );
}
