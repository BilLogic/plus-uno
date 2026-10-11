import type { TaskCardSource } from "../agent/task-card-readout";
import { parseFigmaUrl } from "../integrations/figma-reading";

/** Name a read frame from its source, after the judge has finished rewriting.
 * A closing read receipt belongs to Sources; quoted comments stay verbatim. */
export function figmaAnswerCopy(text: string, sources: readonly TaskCardSource[] = []): string {
  const frames = sources.flatMap((source) => {
    const frame = parseFigmaUrl(source.url);
    return frame?.nodeId && source.text.trim() ? [{ ...frame, title: source.text.trim() }] : [];
  });
  if (!frames.length) return text;
  const named = (url: string, original: string): string => {
    const frame = parseFigmaUrl(url);
    const read = frames.find((f) => f.fileKey === frame?.fileKey && f.nodeId === frame?.nodeId);
    if (!read) return original;
    const title = read.title.replace(/[\\[\]<>]/g, "\\$&");
    return `[${title}](${url})`;
  };
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]*`|“[^”]*”|"[^"\n]*"|^\s*>[^\n]*$)/gm);
  return parts
    .map((part, i) => {
      if (i % 2) return part;
      const linked = part.replace(/\[[^\]\n]*\]\((https?:\/\/[^\s)]+)\)|<(https?:\/\/[^|>\s]+)\|[^>\n]*>/g, (match, markdownUrl: string | undefined, slackUrl: string | undefined) => named(markdownUrl ?? slackUrl!, match));
      // Only the closing unquoted passage can be a retrieval receipt.
      return i === parts.length - 1
        ? linked.replace(/(?:^|\s+)I (?:read|checked|fetched) [^\n.!?]*?\bjust now(?:,?\s+so [^\n.!?]*?\bcurrent)?[.!]?\s*$/i, "")
        : linked;
    })
    .join("")
    .trimEnd();
}
