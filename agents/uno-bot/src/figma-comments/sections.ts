// Which section of a file a comment's node sits in (#900, How We Fig).
//
// A PLUS file's pages sit under six divider pages, named exactly
// `- - - 🖼️ Cover - - -`, `- - - 📐 Specs - - -`, `- - - ⏳ WIP - - -`,
// `- - - 🕹️ Playground - - -`, `- - - 🔍 For Review - - -` and
// `- - - 🗂️ Archive - - -` (`docs/connectors/figma.md` § Page sections). A
// page belongs to the section of the last divider above it; a page above every
// divider, or in a file with none, belongs to no section. Only Specs and For
// Review hold decisions worth carrying out of Figma.
//
// A divider is matched on its word, between three dashes either side, with or
// without its emoji: an emoji typed with or without its variation selector is
// still the same divider, and a page named "Specs notes" is not one.
//
// WHERE A NODE IS. A comment names only its node. A file read to depth 2
// gives the pages and their top-level nodes — where comments are usually
// pinned — and a read for the remaining ids gives the path down to each. Both
// trees are walked the same way (`pageOf`).
//
// PURE.

import type { FigmaNode } from "../integrations/figma-reading";

export type Section = "Cover" | "Specs" | "WIP" | "Playground" | "For Review" | "Archive";

/** The sections whose comments are read for decisions. */
export const DECISION_SECTIONS: ReadonlySet<Section> = new Set<Section>(["Specs", "For Review"]);

const DIVIDER = /^-\s*-\s*-\s*(?:\p{Extended_Pictographic}️?\s*)?(cover|specs|wip|playground|for review|archive)\s*-\s*-\s*-$/iu;

const SECTION_OF: Record<string, Section> = {
  cover: "Cover",
  specs: "Specs",
  wip: "WIP",
  playground: "Playground",
  "for review": "For Review",
  archive: "Archive",
};

/**
 * The section a page name opens, or null when the page is no divider.
 *
 * @param name - A page's name
 */
export function dividerSection(name: string): Section | null {
  const m = DIVIDER.exec(name.trim().replace(/\s+/g, " "));
  return m ? SECTION_OF[m[1]!.toLowerCase()]! : null;
}

/** A page of a file, in order, with the section it sits in. */
export interface FilePage {
  id: string;
  name: string;
  section: Section | null;
}

/**
 * The file's pages, in order, each with the section of the last divider above
 * it. A divider page is in its own section.
 *
 * @param document - The file's document node
 */
export function pagesOf(document: FigmaNode): FilePage[] {
  let section: Section | null = null;
  const pages: FilePage[] = [];
  for (const page of document.children ?? []) {
    if (!page.id) continue;
    const name = page.name ?? "";
    section = dividerSection(name) ?? section;
    pages.push({ id: page.id, name, section });
  }
  return pages;
}

/** Where a node is: its page, and the node itself as the tree names it. */
export interface NodePlace {
  pageId: string;
  /** The node's name; empty when the tree did not reach it by name. */
  name: string;
  /** True when the node is the page itself. */
  isPage: boolean;
}

/**
 * The page a node is on, in any tree that reaches it — a depth-2 read, or a
 * read for its id — or null when this tree does not hold it.
 *
 * @param document - A file read's document node
 * @param nodeId - The node a comment is pinned to
 */
export function pageOf(document: FigmaNode, nodeId: string): NodePlace | null {
  for (const page of document.children ?? []) {
    if (!page.id) continue;
    if (page.id === nodeId) return { pageId: page.id, name: page.name ?? "", isPage: true };
    const found = find(page, nodeId);
    if (found) return { pageId: page.id, name: found.name ?? "", isPage: false };
  }
  return null;
}

function find(node: FigmaNode, id: string): FigmaNode | null {
  for (const child of node.children ?? []) {
    if (child.id === id) return child;
    const deeper = find(child, id);
    if (deeper) return deeper;
  }
  return null;
}
