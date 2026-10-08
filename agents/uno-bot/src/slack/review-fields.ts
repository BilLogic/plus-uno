// The draft's editable fields in the Review pop-up: which fields a confirmer
// may change, the inputs that offer them, and the check an edit passes before
// it is written.
//
// WHICH FIELDS. A table by tool, of the fields a person would fix in place — a
// title, a body, a pillar — and never the ones that say WHERE a write goes (a
// repo, a recipient, a page). Changing where is a new proposal, not an edit.
// A tool with no row offers nothing to edit and approves as staged.
//
// SELECTS OFFER ONLY WHAT THE DATABASE OFFERS. Notion silently creates any
// option it is handed (`docs/connectors/notion.md`), so a select reads the
// target database's live options when the pop-up opens and again when Approve
// is pressed: an option removed in between is refused, not created. A select
// whose options cannot be read is left out rather than offered as free text.
//
// THE SAME GUARDS AS A DRAFT. An edited text is held to the placeholder shape
// test a create call's fields are held to (`agent/placeholder.ts`), and a
// required field may not be emptied. A refusal is one sentence for the
// pop-up's alert, naming the field and what tripped it.
//
// PURE: no `Env`, no fetch. The options arrive through the door's
// `fieldOptions`, so `tests/proposal-edit.test.ts` drives all of it.
import { placeholderIn } from "../agent/placeholder";
import { proposalOperations, type PendingProposal, type ProposalOperation } from "../thread-state/index";

/** Where a select's options live: a database the Worker writes to, and the
 *  property, by its exact name. */
export interface OptionSource {
  database: "roadmap" | "decisions";
  property: string;
}

/** Reads a select's live options; null when they cannot be read. */
export type ReadOptions = (source: OptionSource) => Promise<string[] | null>;

/** One field the pop-up offers, with the draft's value. */
export interface EditableField {
  /** `<operation index>.<path in the tool input>`, e.g. `0.title`. */
  key: string;
  label: string;
  kind: "text" | "multiline" | "select";
  required: boolean;
  /** The draft's value; "" when the draft has none. */
  value: string;
  /** For a select: the options offered, in the database's spelling. */
  options?: string[];
}

/**
 * The pop-up's state as Slack sends it on a press or a submit
 * (`view.state.values`): block id → action id → the element's value.
 */
export type ReviewViewState = Record<
  string,
  Record<string, { type?: string; value?: string | null; selected_option?: { value?: string } | null }>
>;

/** An edit the guards took: the batch with it applied, and the labels of the
 *  fields that changed. */
export type CheckedEdits =
  | { ok: true; operations: ProposalOperation[]; edited: string[] }
  | { ok: false; alert: string };

/** Every input's block id starts with this; the rest is the field's key. */
export const FIELD_BLOCK_PREFIX = "uno_field:";
const FIELD_ACTION_ID = "value";

/** `plain_text_input`'s own cap; a longer value is not offered for editing. */
const MAX_INPUT_CHARS = 3000;
/** A `static_select` takes at most 100 options of at most 75 characters. */
const MAX_OPTIONS = 100;
const MAX_OPTION_CHARS = 75;

type Input = Record<string, unknown>;

interface FieldSpec {
  path: string;
  label: string;
  kind: EditableField["kind"];
  required?: boolean;
  options?: OptionSource;
  /** Whether the field applies to this call at all. */
  applies?: (input: Input) => boolean;
  /** The draft's value, where the executor would read it. Default: `path`. */
  read?: (input: Input) => unknown;
}

const surfaceIs = (surface: string) => (input: Input) =>
  typeof input.surface === "string" && input.surface.trim().toLowerCase() === surface;
const props = (input: Input): Input =>
  input.properties && typeof input.properties === "object" ? (input.properties as Input) : {};

/** What each tool lets a confirmer change. */
const FIELDS: Record<string, FieldSpec[]> = {
  notion_create: [
    { path: "title", label: "Title", kind: "text", required: true },
    { path: "summary", label: "Summary", kind: "multiline" },
    {
      // `notion-create.ts` reads `properties.product_pillar` before the bare key.
      path: "properties.product_pillar",
      label: "Product Pillar",
      kind: "select",
      options: { database: "roadmap", property: "Product Pillar" },
      applies: surfaceIs("prd"),
      read: (input) => props(input).product_pillar || input.product_pillar,
    },
    {
      path: "properties.status",
      label: "Status",
      kind: "select",
      options: { database: "decisions", property: "Status" },
      applies: surfaceIs("decision"),
      read: (input) => props(input).status || props(input).Status || input.status,
    },
  ],
  github_issue_create: [
    { path: "title", label: "Title", kind: "text", required: true },
    { path: "body", label: "Body", kind: "multiline", required: true },
  ],
  email_send: [
    { path: "subject", label: "Subject", kind: "text" },
    { path: "body", label: "Body", kind: "multiline", required: true },
  ],
  dm_relay: [{ path: "text", label: "Message", kind: "multiline", required: true }],
};

function readPath(input: Input, path: string): unknown {
  return path.split(".").reduce<unknown>((at, key) => (at && typeof at === "object" ? (at as Input)[key] : undefined), input);
}

function writePath(input: Input, path: string, value: string): Input {
  const out = JSON.parse(JSON.stringify(input)) as Input;
  const keys = path.split(".");
  let at = out;
  for (const key of keys.slice(0, -1)) {
    if (!at[key] || typeof at[key] !== "object") at[key] = {};
    at = at[key] as Input;
  }
  at[keys.at(-1)!] = value;
  return out;
}

/**
 * The fields a confirmer may edit on this proposal, every operation's in
 * batch order, each select with the live options it may take.
 *
 * @param proposal - The card, as the Gate holds it
 * @param readOptions - The live option read; each source is read once
 */
export async function reviewFields(proposal: PendingProposal, readOptions: ReadOptions | undefined): Promise<EditableField[]> {
  const reads = new Map<string, Promise<string[] | null>>();
  const optionsOf = (source: OptionSource) => {
    const id = `${source.database}/${source.property}`;
    if (!reads.has(id)) reads.set(id, readOptions ? readOptions(source).catch(() => null) : Promise.resolve(null));
    return reads.get(id)!;
  };
  const fields: EditableField[] = [];
  for (const [index, op] of proposalOperations(proposal).entries()) {
    for (const spec of FIELDS[op.toolName] ?? []) {
      if (spec.applies && !spec.applies(op.input)) continue;
      const raw = spec.read ? spec.read(op.input) : readPath(op.input, spec.path);
      if (raw !== undefined && typeof raw !== "string") continue;
      const value = typeof raw === "string" ? raw : "";
      if (!value && !spec.required && spec.kind !== "select") continue;
      if (value.length > MAX_INPUT_CHARS) continue;
      const field: EditableField = { key: `${index}.${spec.path}`, label: spec.label, kind: spec.kind, required: !!spec.required, value };
      if (spec.options) {
        const options = (await optionsOf(spec.options))?.filter((o) => o.length <= MAX_OPTION_CHARS).slice(0, MAX_OPTIONS);
        if (!options?.length) continue;
        field.options = options;
      }
      fields.push(field);
    }
  }
  return fields;
}

/**
 * One input block per field. `values` overrides a field's draft value — the
 * person's own edit, kept when the pop-up is redrawn around an alert.
 */
export function fieldInputBlocks(fields: readonly EditableField[], values: ReadonlyMap<string, string> = new Map()): unknown[] {
  return fields.map((field) => {
    const value = values.get(field.key) ?? field.value;
    const element =
      field.kind === "select"
        ? {
            type: "static_select",
            action_id: FIELD_ACTION_ID,
            options: (field.options ?? []).map(option),
            ...(field.options?.includes(value) ? { initial_option: option(value) } : {}),
          }
        : {
            type: "plain_text_input",
            action_id: FIELD_ACTION_ID,
            multiline: field.kind === "multiline",
            max_length: MAX_INPUT_CHARS,
            ...(value ? { initial_value: value } : {}),
          };
    return {
      type: "input",
      block_id: `${FIELD_BLOCK_PREFIX}${field.key}`,
      optional: !field.required,
      label: { type: "plain_text", text: field.label },
      element,
    };
  });
}

function option(value: string) {
  return { text: { type: "plain_text", text: value }, value };
}

/**
 * The fields an input block list offers, read back off the blocks — what a
 * submitted view carries, with nothing re-read. The draft value is the
 * block's initial one.
 */
export function fieldsFromBlocks(blocks: readonly unknown[]): EditableField[] {
  const fields: EditableField[] = [];
  for (const block of blocks) {
    const b = block as {
      type?: string;
      block_id?: string;
      optional?: boolean;
      label?: { text?: string };
      element?: { type?: string; multiline?: boolean; initial_value?: string; initial_option?: { value?: string }; options?: Array<{ value?: string }> };
    };
    if (b.type !== "input" || !b.block_id?.startsWith(FIELD_BLOCK_PREFIX)) continue;
    const select = b.element?.type === "static_select";
    fields.push({
      key: b.block_id.slice(FIELD_BLOCK_PREFIX.length),
      label: b.label?.text ?? "",
      kind: select ? "select" : b.element?.multiline ? "multiline" : "text",
      required: b.optional === false,
      value: (select ? b.element?.initial_option?.value : b.element?.initial_value) ?? "",
      ...(select ? { options: (b.element?.options ?? []).map((o) => o.value ?? "") } : {}),
    });
  }
  return fields;
}

/** Each field's value as the pop-up's state has it; absent when the state
 *  does not carry the field, which leaves the draft's value standing. */
export function stateValues(fields: readonly EditableField[], state: ReviewViewState | undefined): Map<string, string> {
  const values = new Map<string, string>();
  for (const field of fields) {
    const entry = state?.[`${FIELD_BLOCK_PREFIX}${field.key}`]?.[FIELD_ACTION_ID];
    if (!entry) continue;
    if (field.kind === "select") {
      const picked = entry.selected_option?.value;
      if (picked) values.set(field.key, picked);
    } else {
      values.set(field.key, entry.value ?? "");
    }
  }
  return values;
}

/** Why one value may not be written, as the alert says it; null when it may. */
function refusal(field: EditableField, value: string): string | null {
  if (field.kind === "select") {
    return field.options?.includes(value)
      ? null
      : `"${clip(value)}" is not a ${field.label} option in the database any more. Pick one it offers, then approve.`;
  }
  if (field.required && !value.trim()) return `${field.label} can't be empty. Write one, then approve.`;
  const slot = value.trim() ? placeholderIn(value) : null;
  return slot ? `${field.label} is still a placeholder (${clip(slot)}). Write the real wording, then approve.` : null;
}

/** Alert text is held to 200 characters; a quoted value never crowds it out. */
function clip(text: string): string {
  return text.length > 40 ? `${text.slice(0, 39)}…` : text;
}

/**
 * The edits the state carries, checked: the labels that changed, or the alert
 * for the first one the guards refuse. Only a changed field is checked — a
 * draft value already passed the guards when it was staged.
 */
export function checkFieldEdits(
  fields: readonly EditableField[],
  state: ReviewViewState | undefined,
): { ok: true; changed: Map<string, string>; edited: string[] } | { ok: false; alert: string } {
  const values = stateValues(fields, state);
  const changed = new Map<string, string>();
  const edited: string[] = [];
  for (const field of fields) {
    const value = values.get(field.key);
    if (value === undefined || value === field.value) continue;
    const why = refusal(field, value);
    if (why) return { ok: false, alert: why };
    changed.set(field.key, value);
    if (!edited.includes(field.label)) edited.push(field.label);
  }
  return { ok: true, changed, edited };
}

/**
 * The proposal's batch with the pop-up's edits applied, or the alert that
 * refuses them. The seam every pop-up decision that writes reads its edits
 * through, so what is checked is what is written.
 *
 * @param proposal - The card, as the Gate holds it now
 * @param fields - `reviewFields` of that card, with options read now
 * @param state - The pop-up's state from the press
 */
export function checkEdits(proposal: PendingProposal, fields: readonly EditableField[], state: ReviewViewState | undefined): CheckedEdits {
  const checked = checkFieldEdits(fields, state);
  if (!checked.ok) return checked;
  const operations = proposalOperations(proposal).map((op, index) => {
    let input = op.input;
    for (const [key, value] of checked.changed) {
      const [at, ...path] = key.split(".");
      if (Number(at) === index) input = writePath(input, path.join("."), value);
    }
    return { toolName: op.toolName, input };
  });
  return { ok: true, operations, edited: checked.edited };
}

/** The card's line for an approved edit: who changed which fields. */
export function editedNote(userId: string, edited: readonly string[]): string {
  return `:pencil2: <@${userId}> edited ${edited.join(", ")}`;
}
