// Links into Figma that a reader opens. PURE.

/** A Figma file, opened at its start: what a card's Open file and a post's
 *  file link point at. */
export function figmaFileUrl(fileKey: string): string {
  return `https://www.figma.com/design/${encodeURIComponent(fileKey)}`;
}
