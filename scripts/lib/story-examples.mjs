import fs from 'node:fs';
import path from 'node:path';
import { blankComments, closeOf, importsOf } from './jsx-scan.mjs';
import { scanStorybookPages } from './storybook-pages.mjs';
import { storybookId } from './storybook-id.mjs';

export const REFERENCE_SCREENS = 'design-system/agent-views/reference-screens.json';

/** Tagged, self-contained story renders: the executable source for agent examples. */
export function storyExamples(root) {
  const examples = [];
  for (const page of scanStorybookPages(root).filter((p) => p.file.includes('.stories.'))) {
    const source = fs.readFileSync(path.join(root, page.file), 'utf8');
    const text = blankComments(source);
    for (const match of text.matchAll(/export const (\w+)\s*=\s*\{/g)) {
      const start = match.index + match[0].length - 1;
      const story = text.slice(start, closeOf(text, start));
      const tags = [...(story.match(/\btags:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
      const patterns = tags.filter((t) => t.startsWith('pattern:')).map((t) => t.slice(8));
      const reference = tags.find((t) => t.startsWith('reference:'))?.slice(10);
      if (!patterns.length && !reference) continue;
      const render = /\brender:\s*(function\s+\w+\s*\([^)]*\)\s*)\{/.exec(story);
      if (!render) throw new Error(`${page.file}#${match[1]}: tagged examples need a named render function`);
      const bodyStart = start + render.index + render[0].length - 1;
      const fn = source.slice(start + render.index + render[0].indexOf('function'), closeOf(text, bodyStart));
      const used = (name) => name && new RegExp(`\\b${name}\\b`).test(fn);
      const imports = importsOf(text).flatMap((i) => {
        const named = i.named.filter((n) => used(n.local)).map((n) => n.imported === n.local ? n.local : `${n.imported} as ${n.local}`);
        const clause = [used(i.default) && i.default, used(i.namespace) && `* as ${i.namespace}`, named.length && `{ ${named.join(', ')} }`].filter(Boolean).join(', ');
        return clause ? [`import ${clause} from '${i.source}';`] : [];
      });
      const name = story.match(/\bname:\s*['"]([^'"]+)['"]/)?.[1] ?? match[1];
      const indent = fn.split('\n').at(-1).match(/^\s*/)[0];
      const code = fn.split('\n').map((line, i) => i ? line.replace(new RegExp(`^${indent}`), '') : line).join('\n');
      examples.push({ patterns, reference, name, file: page.file, export: match[1],
        url: `https://plus-uno.netlify.app/storybook/?path=/story/${storybookId(page.title, match[1].replace(/([a-z0-9])([A-Z])/g, '$1 $2'))}`,
        code: `${imports.join('\n')}\n\n${code}` });
    }
  }
  return examples;
}
