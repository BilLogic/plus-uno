// Markdown → Notion blocks.
//
// WHY THIS EXISTS
// ---------------
// Until 2026-08-22 every body the bot wrote to Notion went through
// `bodyToParagraphs`: split on blank lines, one `paragraph` block each, no
// markup parsing of any kind. Nothing told the model that, and the convention
// doc it follows (`docs/conventions/notion.md`) shows a Decisions body written
// as `**Decision:** one sentence` — so the model wrote Markdown, correctly, and
// it landed in Notion as literal asterisks. Bullets landed as literal hyphens,
// links as literal `[label](url)`.
//
// The Slack side was fixed the same day by picking ONE dialect — the model
// writes standard Markdown and each egress converts (`slack/mrkdwn.ts`). This
// is that rule's other half: the same Markdown, turned into real Notion blocks
// with real annotations.
//
// Pure and import-free so it is unit-testable — `notion.ts` reaches for `Env`,
// `fetch` and the subrequest meter, none of which exist under `npm test`.

/** Notion caps a single rich_text `content` at 2000 characters. */
const MAX_RICH_TEXT = 1900;

/** Notion caps a block's rich_text array at 100 elements. Stay under it. */
const MAX_RUNS_PER_BLOCK = 90;

/** Notion caps `children` at 100 per create/append request. Exported because
 *  the caller has to batch, not because this module does. */
export const MAX_BLOCKS_PER_REQUEST = 100;

/** How deep inline emphasis may nest before we stop looking. `**a _b_ c**` is
 *  two; nobody writes four, and a bound means a pathological input cannot
 *  recurse without end. */
const MAX_INLINE_DEPTH = 4;

export interface Annotations {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface RichTextRun {
  type: "text";
  text: { content: string; link?: { url: string } };
  annotations?: Annotations;
}

export interface NotionBlock {
  object: "block";
  type: string;
  [key: string]: unknown;
}

// ── Inline: **bold**, _italic_, `code`, ~~strike~~, [label](url) ──────────────

// Ordered alternation — the first branch that matches at a position wins, which
// is why `**bold**` is listed before `*italic*` and `__bold__` before `_italic_`.
//
// The underscore forms carry word-boundary lookarounds on purpose. This
// codebase's own vocabulary is full of snake_case (`notion_create`,
// `search_blueprint`, `proposal_resolve`) and without them "notion_create and
// source_read" would italicise the span between the two underscores — turning
// tool names the bot writes constantly into mangled emphasis.
const INLINE_SOURCE = [
  "(`[^`\\n]+`)", // 1 code span
  "(!?\\[[^\\]\\n]*\\]\\([^)\\s]+\\))", // 2 link (or image, rendered as a link)
  "(\\*\\*[^\\n]+?\\*\\*)", // 3 bold
  "((?<![A-Za-z0-9_])__[^\\n]+?__(?![A-Za-z0-9_]))", // 4 bold
  "(~~[^\\n]+?~~)", // 5 strikethrough
  "(\\*[^*\\n]+?\\*)", // 6 italic
  "((?<![A-Za-z0-9_])_[^_\\n]+?_(?![A-Za-z0-9_]))", // 7 italic
].join("|");

/**
 * A FRESH matcher per call, never a shared module-level one.
 *
 * `parseInline` recurses — `**bold with _italic_**` parses its own inner text —
 * and a `/g` regex carries `lastIndex` on the object itself. Sharing one
 * instance means an inner call rewinds the outer call's cursor mid-loop, so the
 * outer `while` re-matches a token it has already consumed and never
 * terminates: the run array grows until the process aborts. Caught here by the
 * 5000-character paragraph test, which took 47 seconds to SIGABRT.
 */
function inlineMatcher(): RegExp {
  return new RegExp(INLINE_SOURCE, "g");
}

const LINK = /^!?\[([^\]\n]*)\]\(([^)\s]+)\)$/;

/**
 * One line (or paragraph) of Markdown → Notion rich_text runs.
 *
 * Annotations compose through nesting: `**bold with _italic_ inside**` yields a
 * bold run, a bold+italic run, and a bold run. A code span is terminal — its
 * content is never re-parsed, so `` `**not bold**` `` keeps its asterisks,
 * which is the whole point of a code span.
 */
export function parseInline(
  text: string,
  inherited: Annotations = {},
  depth = 0,
): RichTextRun[] {
  const runs: RichTextRun[] = [];
  const push = (content: string, annotations: Annotations, link?: string) => {
    if (!content) return;
    const run: RichTextRun = { type: "text", text: { content } };
    if (link) run.text.link = { url: link };
    if (Object.keys(annotations).length) run.annotations = { ...annotations };
    runs.push(run);
  };

  if (depth >= MAX_INLINE_DEPTH) {
    push(text, inherited);
    return runs;
  }

  const matcher = inlineMatcher();
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = matcher.exec(text)) !== null) {
    if (m.index > last) push(text.slice(last, m.index), inherited);
    const token = m[0];

    if (m[1]) {
      // Code span — terminal, contents taken literally.
      push(token.slice(1, -1), { ...inherited, code: true });
    } else if (m[2]) {
      const link = LINK.exec(token);
      if (link) {
        const label = link[1]!.trim();
        const url = link[2]!;
        // A bare or unusable scheme would 400 the whole request; keep the text,
        // drop the link. Notion accepts http(s) and mailto.
        const usable = /^(https?:\/\/|mailto:)/i.test(url);
        if (usable) {
          // The label may itself carry emphasis: [**bold label**](url).
          const inner = parseInline(label || url, inherited, depth + 1);
          for (const run of inner) {
            run.text.link = { url };
            runs.push(run);
          }
        } else {
          push(label ? `${label} (${url})` : url, inherited);
        }
      } else {
        push(token, inherited);
      }
    } else if (m[3] || m[4]) {
      const inner = m[3] ? token.slice(2, -2) : token.slice(2, -2);
      runs.push(...parseInline(inner, { ...inherited, bold: true }, depth + 1));
    } else if (m[5]) {
      runs.push(...parseInline(token.slice(2, -2), { ...inherited, strikethrough: true }, depth + 1));
    } else if (m[6] || m[7]) {
      runs.push(...parseInline(token.slice(1, -1), { ...inherited, italic: true }, depth + 1));
    }
    last = m.index + token.length;
  }
  if (last < text.length) push(text.slice(last), inherited);

  return splitOversizedRuns(runs).slice(0, MAX_RUNS_PER_BLOCK);
}

/** No single run may exceed Notion's per-run content cap. */
function splitOversizedRuns(runs: RichTextRun[]): RichTextRun[] {
  const out: RichTextRun[] = [];
  for (const run of runs) {
    const { content } = run.text;
    if (content.length <= MAX_RICH_TEXT) {
      out.push(run);
      continue;
    }
    for (let i = 0; i < content.length; i += MAX_RICH_TEXT) {
      out.push({ ...run, text: { ...run.text, content: content.slice(i, i + MAX_RICH_TEXT) } });
    }
  }
  return out;
}

// ── Blocks ───────────────────────────────────────────────────────────────────

function block(type: string, payload: Record<string, unknown>): NotionBlock {
  return { object: "block", type, [type]: payload };
}

function textBlock(type: string, text: string, extra: Record<string, unknown> = {}): NotionBlock {
  return block(type, { rich_text: parseInline(text), ...extra });
}

/**
 * Notion validates `code.language` against a closed enum and 400s the whole
 * request on anything else — so an unknown tag degrades to "plain text" rather
 * than failing the write. Aliases map to the enum's own spelling.
 */
const CODE_LANGUAGES: Record<string, string> = {
  bash: "bash", sh: "shell", shell: "shell", zsh: "shell", console: "shell",
  c: "c", cpp: "c++", "c++": "c++", cs: "c#", "c#": "c#", csharp: "c#",
  css: "css", diff: "diff", docker: "docker", dockerfile: "docker",
  go: "go", graphql: "graphql", html: "html", java: "java",
  js: "javascript", javascript: "javascript", jsx: "javascript",
  json: "json", kotlin: "kotlin", less: "less", lua: "lua",
  make: "makefile", makefile: "makefile", md: "markdown", markdown: "markdown",
  php: "php", plaintext: "plain text", text: "plain text", txt: "plain text",
  py: "python", python: "python", r: "r", ruby: "ruby", rb: "ruby",
  rust: "rust", rs: "rust", scala: "scala", scss: "scss", sass: "sass",
  sql: "sql", swift: "swift", toml: "toml",
  ts: "typescript", typescript: "typescript", tsx: "typescript",
  xml: "xml", yaml: "yaml", yml: "yaml",
};

const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const NUMBERED = /^(\s*)\d+[.)]\s+(.*)$/;
const TODO = /^(\s*)[-*+]\s+\[([ xX])\]\s*(.*)$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const DIVIDER = /^\s*([-*_])\1{2,}\s*$/;
const FENCE = /^\s*```\s*([A-Za-z0-9_+#-]*)\s*$/;

/** Two spaces of indent under a list item makes a child. One level only —
 *  deeper nesting flattens to that level rather than being dropped. */
const INDENT_FOR_CHILD = 2;

/**
 * A Markdown body → Notion blocks.
 *
 * **Headings map to `heading_3`, never `heading_1`/`heading_2`.** The document
 * structure above this — a PRD's section headings, the "Acceptance Criteria"
 * and "Implementation Notes" headings `fetchNotionPRD` reads downstream — owns
 * `heading_2`. A `##` inside a section body is subordinate to its section, so
 * it renders subordinate; letting it emit `heading_2` would put it level with
 * the section it lives inside and break the outline the downstream reader walks.
 */
export function markdownToNotionBlocks(markdown: string): NotionBlock[] {
  if (!markdown?.trim()) return [];
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: NotionBlock[] = [];
  let paragraph: string[] = [];
  // The most recent top-level list item, so an indented line can become its
  // child rather than a sibling.
  let lastListBlock: NotionBlock | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join("\n").trim();
    paragraph = [];
    if (text) blocks.push(textBlock("paragraph", text));
  };
  const pushBlock = (b: NotionBlock, isListItem: boolean) => {
    flushParagraph();
    blocks.push(b);
    lastListBlock = isListItem ? b : null;
  };
  const addChild = (parent: NotionBlock, child: NotionBlock) => {
    const payload = parent[parent.type] as { children?: NotionBlock[] };
    (payload.children ??= []).push(child);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Fenced code — consumed whole, contents never parsed.
    const fence = FENCE.exec(line);
    if (fence) {
      flushParagraph();
      lastListBlock = null;
      const lang = CODE_LANGUAGES[fence[1]!.toLowerCase()] ?? "plain text";
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i]!)) body.push(lines[i]!), i++;
      blocks.push(
        block("code", {
          language: lang,
          rich_text: [{ type: "text", text: { content: body.join("\n").slice(0, MAX_RICH_TEXT) } }],
        }),
      );
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      lastListBlock = null;
      continue;
    }

    if (DIVIDER.test(line)) {
      pushBlock(block("divider", {}), false);
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      pushBlock(textBlock("heading_3", heading[2]!.trim()), false);
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      // Consecutive `>` lines are one quote block.
      const parts = [quote[1]!];
      while (i + 1 < lines.length && QUOTE.test(lines[i + 1]!)) {
        parts.push(QUOTE.exec(lines[++i]!)![1]!);
      }
      pushBlock(textBlock("quote", parts.join("\n").trim()), false);
      continue;
    }

    // Checkbox before bullet — `- [ ] x` matches both, and the checkbox is the
    // more specific reading.
    const todo = TODO.exec(line);
    if (todo) {
      const item = textBlock("to_do", todo[3]!, { checked: todo[2]!.toLowerCase() === "x" });
      if (todo[1]!.length >= INDENT_FOR_CHILD && lastListBlock) addChild(lastListBlock, item);
      else pushBlock(item, true);
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      const item = textBlock("bulleted_list_item", bullet[2]!);
      if (bullet[1]!.length >= INDENT_FOR_CHILD && lastListBlock) addChild(lastListBlock, item);
      else pushBlock(item, true);
      continue;
    }

    const numbered = NUMBERED.exec(line);
    if (numbered) {
      const item = textBlock("numbered_list_item", numbered[2]!);
      if (numbered[1]!.length >= INDENT_FOR_CHILD && lastListBlock) addChild(lastListBlock, item);
      else pushBlock(item, true);
      continue;
    }

    paragraph.push(line);
  }
  flushParagraph();

  return splitOversizedParagraphs(blocks);
}

/** A paragraph whose runs together exceed the per-block cap becomes several
 *  paragraphs. Preserves annotations — the split happens between runs, and
 *  parseInline has already split any single run that was too long. */
function splitOversizedParagraphs(blocks: NotionBlock[]): NotionBlock[] {
  const out: NotionBlock[] = [];
  for (const b of blocks) {
    if (b.type !== "paragraph") {
      out.push(b);
      continue;
    }
    const runs = (b.paragraph as { rich_text: RichTextRun[] }).rich_text;
    const total = runs.reduce((n, r) => n + r.text.content.length, 0);
    if (total <= MAX_RICH_TEXT) {
      out.push(b);
      continue;
    }
    let batch: RichTextRun[] = [];
    let size = 0;
    for (const run of runs) {
      if (batch.length && size + run.text.content.length > MAX_RICH_TEXT) {
        out.push(block("paragraph", { rich_text: batch }));
        batch = [];
        size = 0;
      }
      batch.push(run);
      size += run.text.content.length;
    }
    if (batch.length) out.push(block("paragraph", { rich_text: batch }));
  }
  return out;
}

/**
 * Split a children array into request-sized batches.
 *
 * Notion accepts at most 100 blocks per create or append. Nothing enforced
 * this before 2026-08-22: a long PRD — summary, eight sections of several
 * paragraphs, acceptance criteria, plus the two fixed headings — crosses 100
 * and the entire create 400s, so the card is never made.
 */
export function chunkBlocks<T>(blocks: T[], size = MAX_BLOCKS_PER_REQUEST): T[][] {
  if (blocks.length <= size) return blocks.length ? [blocks] : [];
  const out: T[][] = [];
  for (let i = 0; i < blocks.length; i += size) out.push(blocks.slice(i, i + size));
  return out;
}
