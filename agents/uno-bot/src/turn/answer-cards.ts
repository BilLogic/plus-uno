// Answer cards — linkable items as cards beneath an answer: one card, or a
// carousel of up to 10, asked for through `present` (`turn/presentation.ts`).
//
// BUILT FROM THE LOOKUP, NEVER FROM THE MODEL. The model chooses the lookup and
// the fields for a card's title and subtitle; every word and every link on a
// card is what a row of that lookup really carried. A card exists to be
// opened, so a row with no link is no card, and a list with no linked rows is
// refused — the model names the items in prose instead.
//
// THE LINKS are a row's own addresses: its `url` first, as "Open", then any
// other field holding an http(s) address, labelled by its field, up to 3 —
// Slack's limit on a card's buttons.
//
// THE PLAIN LIST is the answer of record, as it is for a table: the message's
// text copy, the plain rung a refused card falls back to and the draft judge
// all read it. Each card is one Markdown line, linked, so the fallback still
// opens every item.
//
// PURE: no Env, no Slack shape. What a card LOOKS like in Slack — its block
// and its estate's logo — is `slack/answer-cards-block.ts`'s.

/** One link button on a card. */
export interface CardLink {
  label: string;
  url: string;
}

/** One card, as data. */
export interface AnswerCard {
  title: string;
  subtitle?: string;
  /** 1 to 3; the first is the card's own address, and says which estate's
   *  logo it carries. */
  links: CardLink[];
}

/** The cards beneath an answer. */
export interface AnswerCards {
  /** The lookup their rows came from. */
  lookup: string;
  /** 1 to 10. */
  cards: AnswerCard[];
  /** How many linked rows the lookup listed. More than `cards.length` when
   *  the list was capped. */
  total: number;
}

/** What the model asked for: the list, the title and subtitle fields. */
export interface CardsRequest {
  list?: string;
  /** The title field, then optionally the subtitle field. */
  columns: string[];
}

/** Cards, or why there are none — worded for the model. */
export type CardsReading = { cards: AnswerCards } | { refusal: string };

/** A carousel holds at most this many cards. */
export const MAX_CARDS = 10;

/** A card holds at most this many buttons. */
export const MAX_LINKS = 3;

/** A card's title and subtitle, at most: Slack's limit. */
const MAX_TITLE = 150;

type Record_ = Record<string, unknown>;

const isRecord = (v: unknown): v is Record_ => typeof v === "object" && v !== null && !Array.isArray(v);
const isAddress = (v: unknown): v is string => typeof v === "string" && /^https?:\/\/\S+$/.test(v);

const clip = (s: string, max: number): string => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

/** A value as a card's words, or null for none. */
function wordsOf(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const line = value.replace(/\s+/g, " ").trim();
  return line ? clip(line, MAX_TITLE) : null;
}

/** A field name as a button's label: `prototype_url` → "Prototype". */
function labelOf(field: string): string {
  const words = field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_\s]+/)
    .filter((w) => w && !/^(url|link|href)$/i.test(w));
  const label = words.join(" ");
  return label ? label[0]!.toUpperCase() + label.slice(1) : "Open";
}

/** A row's links: its `url` first, then its other addresses, up to 3. */
function linksOf(row: Record_): CardLink[] {
  const links: CardLink[] = [];
  const seen = new Set<string>();
  const add = (label: string, url: string) => {
    if (seen.has(url) || links.length >= MAX_LINKS) return;
    seen.add(url);
    links.push({ label, url });
  };
  if (isAddress(row.url)) add("Open", row.url);
  for (const [field, value] of Object.entries(row)) {
    if (field !== "url" && isAddress(value)) add(links.length ? labelOf(field) : "Open", value);
  }
  return links;
}

/** The list of records a result holds under `key`, or its first one. */
function listOf(result: Record_, key: string | undefined): Record_[] | null {
  const lists = Object.entries(result).filter(
    ([, v]) => Array.isArray(v) && v.length > 0 && v.every(isRecord),
  ) as Array<[string, Record_[]]>;
  const found = key ? lists.find(([k]) => k === key) : lists[0];
  return found ? found[1] : null;
}

/**
 * Cards of any lookup's linked rows, or the reason there are none.
 *
 * @param lookup - The tool that ran
 * @param result - What it answered, parsed
 * @param request - The model's choice of list and fields
 */
export function cardsOf(lookup: string, result: Record_, request: CardsRequest): CardsReading {
  const rows = listOf(result, request.list);
  if (!rows) {
    return {
      refusal: request.list
        ? `${lookup}'s result has no list of records called '${request.list}'.`
        : `${lookup}'s result holds no list of records to make cards of.`,
    };
  }
  const [titleField, subtitleField] = request.columns.map((c) => c.trim()).filter(Boolean);
  if (!titleField) return { refusal: "Name the field for each card's title." };
  if (!rows.some((r) => wordsOf(r[titleField]) !== null)) {
    return { refusal: `'${titleField}' is not a field these rows carry as text.` };
  }

  const linked = rows.flatMap((row): AnswerCard[] => {
    const title = wordsOf(row[titleField]);
    const links = linksOf(row);
    if (!title || links.length === 0) return [];
    const subtitle = subtitleField ? wordsOf(row[subtitleField]) : null;
    return [{ title, ...(subtitle ? { subtitle } : {}), links }];
  });
  if (linked.length === 0) return { refusal: "None of those rows carries a link, and a card is there to be opened." };
  return { cards: { lookup, cards: linked.slice(0, MAX_CARDS), total: linked.length } };
}

/**
 * The cards as a plain list, one linked Markdown line each.
 *
 * @param cards - The cards it lists
 */
export function cardList(cards: AnswerCards): string {
  return cards.cards
    .map((c) => `- [${c.title}](${c.links[0]!.url})${c.subtitle ? ` — ${c.subtitle}` : ""}`)
    .join("\n");
}
