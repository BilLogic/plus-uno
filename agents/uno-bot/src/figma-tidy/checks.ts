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

export type TidyCheck = "wrong-folder" | "unknown-card" | "no-active-card";

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
}

/** A Roadmap card, as the checks read it. `owner` is its design owner's Slack id. */
export interface TidyCard {
  number: number;
  title: string;
  url: string;
  designStatus: string | null;
  devStatus: string | null;
  owner: string | null;
}

export interface TidyFinding {
  /** File, check and card: what the weeks remember. */
  fingerprint: string;
  check: TidyCheck;
  file: TidyFile;
  /** The folder it sits in. */
  folder: TidyFolder;
  /** The card the finding is about; null for no active card. */
  card: number | null;
  /** The card as the Roadmap has it, for a wrong folder. */
  known?: TidyCard;
  /** Where it belongs, as the team's folder; null when the team has none by that stage. */
  moveTo?: { stage: Stage; folder: TidyFolder | null };
  /** Who the reply mentions; null for the unassigned reply. */
  owner: string | null;
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
  if (/^deployed$/i.test(card.devStatus?.trim() ?? "")) return ["Specs"];
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

export function fingerprintOf(fileKey: string, check: TidyCheck, card: number | null): string {
  return `${fileKey}|${check}|${card ?? "-"}`;
}

/** The card numbers every checked file names, each once: what the post asks the Roadmap for. */
export function cardsNamed(files: readonly TidyFile[], folders: readonly TidyFolder[]): number[] {
  const out = new Set<number>();
  for (const f of checkedFiles(files, folders)) for (const n of cardNumbersOf(f.file.name)) out.add(n);
  return [...out];
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
export function tidyFindings(files: readonly TidyFile[], folders: readonly TidyFolder[], cards: readonly TidyCard[]): TidyFinding[] {
  const out: TidyFinding[] = [];
  const stageFolder = (team: string, stage: Stage) =>
    folders.find((f) => f.team === team && stageOfFolder(f.name) === stage) ?? null;
  for (const { file, folder, stage } of checkedFiles(files, folders)) {
    const numbers = cardNumbersOf(file.name);
    if (!numbers.length) {
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
