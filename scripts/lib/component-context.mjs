/** Reverse edges from authored Template slots and Pattern pages. Shared by generation and lookup. */
import fs from 'node:fs';
import path from 'node:path';
import { scanStorybookPages } from './storybook-pages.mjs';
import { pageText, readDocsPage, sectionText } from './docs-page.mjs';
import { agentFilePath } from './docs-agent-file.mjs';

export const CONTEXT_PAGES = 'design-system/agent-views/context-pages.json';

export function componentContext(root, records, { source = false } = {}) {
  const names = records.map((r) => r.name);
  const inventoryPath = path.join(root, CONTEXT_PAGES);
  const inventory = !source && fs.existsSync(inventoryPath)
    ? JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
    : scanStorybookPages(root).filter((p) => p.file.endsWith('.mdx') && ['Templates', 'Patterns'].includes(p.categoryRoot))
      .map(({ file, title, categoryRoot, componentSource, componentName }) => ({ file, title, categoryRoot, componentSource, componentName }));
  const pages = inventory
    .map((p) => {
      const page = readDocsPage(fs.readFileSync(path.join(root, p.file), 'utf8'), { root, file: p.file });
      const record = records.find((r) => r.source === p.componentSource || r.name === p.componentName);
      const source = record?.source;
      const dir = source && path.posix.dirname(source);
      const doc = source
        ? `${dir}/${path.posix.basename(dir) === path.posix.basename(source, '.jsx') ? 'index' : record.name}.md`
        : agentFilePath(p.file, p.categoryRoot);
      const text = pageText(page);
      const slots = sectionText(page, 'Slots') ?? '';
      const references = (body) => names.filter((name) => {
        const words = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        return new RegExp(`\\b(?:${name}|${words}|${name.startsWith('Pattern') ? name.slice(7) : words})\\b`, 'i').test(body);
      });
      return {
        kind: p.categoryRoot === 'Templates' ? 'template' : 'pattern', intro: page.intro,
        name: p.title.split('/').at(-1), doc, text, slots, component: record?.name,
        slotComponent: record?.name ?? records.find((r) => r.name === p.title.split('/').at(-1))?.name,
        components: references(p.categoryRoot === 'Templates' ? [slots, sectionText(page, 'Parts'), sectionText(page, 'Best practices')].filter(Boolean).join('\n') : text),
      };
    });
  const edges = Object.fromEntries(names.map((name) => [name, {
    usedIn: pages.filter((p) => p.kind === 'template' && p.name !== 'Overview' && p.components.includes(name)),
    governedBy: pages.filter((p) => p.kind === 'pattern' && p.name !== 'Overview' && p.components.includes(name)),
  }]));
  return { inventory, pages, edges, records };
}

/** Keep whole entries and point to the remaining count instead of cutting a path. */
export function contextList(entries, limit = 360) {
  let text = '';
  for (const [i, entry] of entries.entries()) {
    const next = text ? `${text}; ${entry}` : entry;
    if (next.length > limit - 16) return `${text}${text ? '; ' : ''}+${entries.length - i} more`;
    text = next;
  }
  return text;
}

export function contextLines(edges = {}, limit = 360) {
  const label = (p) => `${p.name} (\`ds guide ${p.name.toLowerCase().replace(/ /g, '-')}\`)`;
  return {
    usedIn: contextList((edges.usedIn ?? []).map(label), limit),
    governedBy: contextList((edges.governedBy ?? []).map(label), limit),
  };
}

/** Regenerated JSDoc tags stay beside existing slot descriptions; they are omitted from prop facts. */
export function slotContextSource(source, template, context) {
  const record = context.records.find((r) => r.name === template.slotComponent);
  const at = source.indexOf(`${record?.implementedAs ?? template.slotComponent}.propTypes`);
  if (at === -1) return source;
  const end = source.indexOf('\n};', at);
  if (end === -1) return source;
  const props = source.slice(at, end).replace(/([ \t]*)(?:\/\*\*((?:[^*]|\*(?!\/))*)\*\/\s*)?(\w+):\s*PropTypes\.node/g, (whole, indent, body = '', prop) => {
    const clean = body.replace(/\n[ \t]*\* @ds-context[^\n]*/g, '').trimEnd();
    const row = template.slots.split('\n').find((line) => line.split('|')[1]?.includes(`\`${prop}\``)) ?? `| ${prop} | ${clean} |`;
    const patterns = context.pages.filter((p) => p.kind === 'pattern' && p.name !== 'Overview' && p.name.toLowerCase().split(/ /).some((w) => {
      const stem = w.replace(/(?:ing|s)$/, '');
      return stem.length >= 4 && new RegExp(`\\b${stem}\\w*`, 'i').test(`${prop} ${row.split('|').slice(2).join('|')}`);
    }));
    const governed = contextList(patterns.map((p) => `${p.name} (ds guide ${p.name.toLowerCase().replace(/ /g, '-')})`), 340);
    const tags = [`Used in: ${template.name}.${prop} (ds guide ${template.name.toLowerCase()})`, ...(governed ? [`Governed by: ${governed}`] : [])];
    return `${indent}/**${clean}\n${indent} * ${tags.map((t) => `@ds-context ${t}`).join(`\n${indent} * `)}\n${indent} */\n${indent}${prop}: PropTypes.node`;
  });
  return source.slice(0, at) + props + source.slice(end);
}
