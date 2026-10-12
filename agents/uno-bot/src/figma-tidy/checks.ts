// The weekly Figma tidy-up's checks: each listed file against the Roadmap
// cards its title names (`docs/connectors/figma.md` § Agent duties in the
// workspace, the hygiene checklist).
//
//   • WRONG FOLDER — the file's stage folder doesn't match its card's stage,
//     read from Design Status together with Dev Status (§ Teams and stage
//     folders). A file for several cards may sit in any of their folders, and
//     is told the folder of the least advanced one.
//   • UNKNOWN CARD — a `Card <n>` the Roadmap doesn't have. The post suggests
//     a likely card by the file's project name.
//   • NO ACTIVE CARD — a title naming no card, on a file that isn't a library,
//     template or reference kit and isn't in Archive.
//   • TITLE — the file's page names or Cover text name a Roadmap card its
//     title leaves out. The post writes out the whole title to paste, the
//     missing cards added to its `Card` segment. A file whose pages name a
//     Roadmap card is on that card, so it is not told to go to Archive.
//
// Left out: MISC's files and every `/ Marketing /` file (#891), and a file in
// a folder that is not one of the five stage folders, whose stage nothing
// says. A card in a Design Status the table doesn't name is not judged either.
//
// Each finding is fingerprinted by file, check and card, which is what the
// post remembers from week to week (`./run.ts`).
//
// PURE.

import { cardNumbersOf } from "../figma-comments/title";

/** The five stage folders, least advanced first. */
export const STAGES = ["Playground", "WIP", "Under-Dev", "Specs", "Archive"] as const;
export type Stage = (typeof STAGES)[number];


/** A team's folder, as the read lists it. */
export interface TidyFolder {
  team: string;
  id: string;
  name: string;
}

/** A file, as the read lists it. */
export interface TidyFile {
  team: string;
  folderId: string;
  key: string;
  name: string;
  /** Figma's `last_modified`: when the file's pages are read again. */
  modified?: string;
}

/** A Roadmap card, as the checks read it. `owner` is its design owner's Slack
 *  id, and `ownerName` their name, for a DM, which tags nobody; `designers`
 *  its designer Contributors' first names, for a title. */
export interface TidyCard {
  number: number;
  title: string;
  url: string;
  designStatus: string | null;
  devStatus: string | null;
  owner: string | null;
  ownerName?: string;
  designers: string[];
}

/** Where a file belongs, as the team's folder; null when the team has none by that stage. */
export interface TidyMove {
  stage: Stage;
  folder: TidyFolder | null;
}

/** One finding: what every check shares, and what each check alone carries. */
export type TidyFinding = {
  /** File, check and card: what the weeks remember. */
  fingerprint: string;
  file: TidyFile;
  /** The folder it sits in. */
  folder: TidyFolder;
  /** Who the reply mentions; null for the unassigned reply. */
  owner: string | null;
} & (
  | { check: "wrong-folder"; card: number; known: TidyCard; moveTo: TidyMove }
  | { check: "no-active-card"; card: null; moveTo: TidyMove }
  | { check: "unknown-card"; card: number }
  /** `retitle` is the title to paste and the cards it adds. */
  | { check: "title"; card: number; known: TidyCard; retitle: { title: string; missing: number[] } }
);

export type TidyCheck = TidyFinding["check"];

/** A card counts as deployed when its Dev Status says so, whatever its Design Status. */
export function isDeployed(card: Pick<TidyCard, "devStatus">): boolean {
  return /^deployed$/i.test(card.devStatus?.trim() ?? "");
}

/** A folder's stage, from its name with emoji, case and punctuation set aside. */
export function stageOfFolder(name: string): Stage | null {
  const bare = name.toLowerCase().replace(/[^a-z]/g, "");
  return STAGES.find((s) => s.toLowerCase().replace(/[^a-z]/g, "") === bare) ?? null;
}

/**
 * The folders a card's file may sit in, the first the one it is told; null
 * when the card's Design Status is one the table doesn't name.
 */
export function foldersForCard(card: Pick<TidyCard, "designStatus" | "devStatus">): Stage[] | null {
  if (isDeployed(card)) return ["Specs"];
  switch (card.designStatus?.trim()) {
    case "Need PRD / Under Playground":
      return ["Playground"];
    case "Ready for Design":
    case "WIP":
    case "Under Review":
      return ["WIP"];
    case "Under Dev":
      return ["Under-Dev", "Specs"];
    case "Shipped":
      return ["Specs"];
    case "Archived":
      return ["Archive"];
    default:
      return null;
  }
}

/** MISC's files and `/ Marketing /` files sit outside the scheme. */
export function isExempt(file: Pick<TidyFile, "team" | "name">): boolean {
  return file.team.trim().toLowerCase() === "misc" || /\/\s*marketing\s*\//i.test(file.name);
}

/** A library, template or reference kit, which keeps a plain name and no card. */
export function isKit(name: string): boolean {
  return /\b(librar(?:y|ies)|design system|templates?|kits?|reference|foundations?)\b/i.test(name);
}

/** The project a title names: its first segment. */
export function projectOf(name: string): string {
  return name.split("/")[0]!.trim();
}

/**
 * The card a project's name most likely means: the one whose title shares the
 * most of its words of three letters or more. Null when none shares one.
 *
 * @param project - The file's project (`projectOf`)
 * @param cards - Roadmap cards whose titles hold any of its words
 */
export function likelyCard<C extends { title: string }>(project: string, cards: readonly C[]): C | null {
  const words = projectWords(project);
  let best: C | null = null;
  let score = 0;
  for (const c of cards) {
    const title = c.title.toLowerCase();
    const s = words.filter((w) => title.includes(w)).length;
    if (s > score) [best, score] = [c, s];
  }
  return best;
}

/** A project's words of three letters or more, lower case: what a title search looks for. */
export function projectWords(project: string): string[] {
  return [...new Set(project.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3))];
}

/** A file's title cards, as a skip remembers them: a change to these opens it again. */
export function cardKey(name: string): string {
  return [...cardNumbersOf(name)].sort((a, b) => a - b).join(",");
}

/** What a skip is kept under: the file and the check, whatever the card. */
export function skipKeyOf(fileKey: string, check: TidyCheck): string {
  return `${fileKey}|${check}`;
}

export function fingerprintOf(fileKey: string, check: TidyCheck, card: number | null): string {
  return `${fileKey}|${check}|${card ?? "-"}`;
}

/** The card numbers every checked file names, in its title or its pages, each once: what the post asks the Roadmap for. */
export function cardsNamed(files: readonly TidyFile[], folders: readonly TidyFolder[], refs: TidyRefsByFile = {}): number[] {
  const out = new Set<number>();
  for (const f of checkedFiles(files, folders)) for (const n of [...cardNumbersOf(f.file.name), ...(refs[f.file.key] ?? [])]) out.add(n);
  return [...out];
}

/** The cards each file's page names and Cover text name, by file key. */
export type TidyRefsByFile = Readonly<Record<string, readonly number[]>>;

/**
 * The card numbers a piece of text names as `Card <n>`, `Card #<n>` or
 * `Cards <n> & <m>`, in order, each once. A bare number is not a card: page
 * names carry dates and sizes.
 *
 * @param text - A page's name, or a text layer's characters
 */
export function cardRefsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\bcards?\s*#?\s*\d+(?:\s*(?:&|,|and)\s*#?\s*\d+)*/gi)) {
    for (const d of m[0].matchAll(/\d+/g)) {
      const n = Number(d[0]);
      if (n > 0 && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

/**
 * The whole title, `<Project> / Card <n> & <m> / <designers>`: these cards in
 * its `Card` segment, or a `Card` segment put after the project when it has
 * none, and the designers after it when nothing follows it.
 *
 * @param name - The file's title
 * @param cards - Every card the title should name, in order
 * @param designers - Those cards' designers, for a title that names none
 */
export function retitled(name: string, cards: readonly number[], designers: readonly string[] = []): string {
  const segments = name.split("/").map((s) => s.trim());
  const cardSegment = `Card ${cards.join(" & ")}`;
  let at = segments.findIndex((s, i) => i > 0 && cardNumbersOf(`x / ${s}`).length > 0);
  if (at >= 0) segments[at] = cardSegment;
  else segments.splice((at = 1), 0, cardSegment);
  if (at === segments.length - 1 && designers.length) segments.push(designers.join(" & "));
  return segments.join(" / ");
}

/** The files whose pages the title check reads: those checked, outside Archive, and not a kit. */
export function pageReadFiles(files: readonly TidyFile[], folders: readonly TidyFolder[]): TidyFile[] {
  return checkedFiles(files, folders)
    .filter((f) => f.stage !== "Archive" && !isKit(f.file.name))
    .map((f) => f.file);
}

/** The files the checks look at, each with its folder and that folder's stage. */
function checkedFiles(files: readonly TidyFile[], folders: readonly TidyFolder[]): Array<{ file: TidyFile; folder: TidyFolder; stage: Stage }> {
  return files.flatMap((file) => {
    const folder = folders.find((f) => f.id === file.folderId);
    const stage = folder ? stageOfFolder(folder.name) : null;
    return folder && stage && !isExempt(file) ? [{ file, folder, stage }] : [];
  });
}

/**
 * Every finding, in the listing's order.
 *
 * @param files - Every listed file
 * @param folders - Every listed folder
 * @param cards - The Roadmap's cards for the numbers the titles name
 */
export function tidyFindings(
  files: readonly TidyFile[],
  folders: readonly TidyFolder[],
  cards: readonly TidyCard[],
  refs: TidyRefsByFile = {},
): TidyFinding[] {
  const out: TidyFinding[] = [];
  const stageFolder = (team: string, stage: Stage) =>
    folders.find((f) => f.team === team && stageOfFolder(f.name) === stage) ?? null;
  for (const { file, folder, stage } of checkedFiles(files, folders)) {
    const numbers = cardNumbersOf(file.name);
    const missing = (refs[file.key] ?? [])
      .filter((n) => !numbers.includes(n))
      .flatMap((n) => cards.find((c) => c.number === n) ?? [])
      .sort((a, b) => a.number - b.number);
    if (missing.length) {
      const named = numbers.flatMap((n) => cards.find((c) => c.number === n) ?? []);
      const lead = named.find((c) => c.owner);
      const designers = [...new Set([...named, ...missing].flatMap((c) => c.designers))];
      out.push({
        fingerprint: fingerprintOf(file.key, "title", missing[0]!.number),
        check: "title",
        file,
        folder,
        card: missing[0]!.number,
        known: missing[0]!,
        retitle: {
          title: retitled(file.name, [...numbers, ...missing.map((c) => c.number)], designers),
          missing: missing.map((c) => c.number),
        },
        owner: lead?.owner ?? missing.find((c) => c.owner)?.owner ?? null,
      });
    }
    if (!numbers.length) {
      if (missing.length) continue;
      if (stage !== "Archive" && !isKit(file.name)) {
        out.push({
          fingerprint: fingerprintOf(file.key, "no-active-card", null),
          check: "no-active-card",
          file,
          folder,
          card: null,
          moveTo: { stage: "Archive", folder: stageFolder(file.team, "Archive") },
          owner: null,
        });
      }
      continue;
    }
    const known: Array<{ card: TidyCard; allowed: Stage[] }> = [];
    for (const n of numbers) {
      const c = cards.find((x) => x.number === n);
      if (!c) {
        out.push({ fingerprint: fingerprintOf(file.key, "unknown-card", n), check: "unknown-card", file, folder, card: n, owner: null });
        continue;
      }
      const allowed = foldersForCard(c);
      if (allowed) known.push({ card: c, allowed });
    }
    if (!known.length || known.some((k) => k.allowed.includes(stage))) continue;
    // Told the least advanced card's folder: work still under way leads.
    const lead = known.reduce((a, b) => (STAGES.indexOf(b.allowed[0]!) < STAGES.indexOf(a.allowed[0]!) ? b : a));
    const to = lead.allowed[0]!;
    out.push({
      fingerprint: fingerprintOf(file.key, "wrong-folder", lead.card.number),
      check: "wrong-folder",
      file,
      folder,
      card: lead.card.number,
      known: lead.card,
      moveTo: { stage: to, folder: stageFolder(file.team, to) },
      owner: lead.card.owner,
    });
  }
  return out;
}
