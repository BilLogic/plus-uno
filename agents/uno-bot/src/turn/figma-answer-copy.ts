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
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`|“[^”]*”|"[^"\n]*"|^\s*>[^\n]*$)/gm)
    .map((part, i) => i % 2 ? part : part.replace(/\[[^\]\n]*\]\((https?:\/\/[^\s)]+)\)|<(https?:\/\/[^|>\s]+)\|[^>\n]*>/g, (match, markdownUrl: string | undefined, slackUrl: string | undefined) => named(markdownUrl ?? slackUrl!, match)))
    .join("")
    .replace(/(?:^|\s+)I (?:read|checked|fetched) (?:the )?(?:comment thread|comments|frame) (?:on (?:the )?(?:linked )?Figma frame )?just now(?:,?\s+so (?:this|the) (?:transcript|answer|reading) is current)?[.!]?\s*$/i, "")
    .trimEnd();
}
