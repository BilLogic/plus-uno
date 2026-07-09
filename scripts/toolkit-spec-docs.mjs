#!/usr/bin/env node
/**
 * One-off / repeatable: Toolkit Profile-style Storybook docs.
 * - Deletes grouped Overview stubs and legacy Toolkit root story
 * - Sets tags: ['!dev', '!autodocs'] on CSF files
 * - Writes sibling *.mdx with Overview / Variants (if export exists) / Interactive playground
 *
 * Usage: node scripts/toolkit-spec-docs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TOOLKIT = path.join(REPO_ROOT, 'design-system/src/specs/Toolkit');

/** When a story file has no `figma.com/design/...` URL, link to the Web App Specs file. */
const DEFAULT_TOOLKIT_FIGMA =
    'https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs';

const DELETE_REL = [
    'Toolkit.stories.jsx',
    'ToolkitSpec.jsx',
    'pre-session/modals/Call-Offs/CallOffs.stories.jsx',
    'pre-session/elements/Elements.stories.jsx',
    'pre-session/cards/Cards.stories.jsx',
    'pre-session/tables/Tables.stories.jsx',
    'pre-session/pages/Pages.stories.jsx',
    'pre-session/sections/Sections.stories.jsx',
    'pre-session/modals/Modals.stories.jsx',
    'in-session/elements/Elements.stories.jsx',
    'in-session/cards/Cards.stories.jsx',
    'in-session/tables/Tables.stories.jsx',
    'in-session/pages/Pages.stories.jsx',
    'in-session/sections/Sections.stories.jsx',
    'in-session/modals/Modals.stories.jsx',
    'post-session/elements/Elements.stories.jsx',
    'post-session/cards/Cards.stories.jsx',
    'post-session/tables/Tables.stories.jsx',
    'post-session/pages/Pages.stories.jsx',
    'post-session/sections/Sections.stories.jsx',
    'post-session/modals/Modals.stories.jsx',
];

function walkStories(dir, acc = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
        if (ent.isDirectory()) walkStories(p, acc);
        else if (ent.name.endsWith('.stories.jsx')) acc.push(p);
    }
    return acc;
}

function patchTags(content) {
    let c = content;
    c = c.replace(/\btags:\s*\[\s*'autodocs'\s*\]/g, "tags: ['!dev', '!autodocs']");
    c = c.replace(/\btags:\s*\[\s*'!autodocs'\s*\]/g, "tags: ['!dev', '!autodocs']");

    const firstExportConst = c.search(/\nexport const /);
    const head = firstExportConst === -1 ? c : c.slice(0, firstExportConst);
    if (!/\btags:\s*\[/.test(head)) {
        c = c.replace(/export default \{/, "export default {\n    tags: ['!dev', '!autodocs'],");
    }
    return c;
}

function listStoryExports(content) {
    return [...content.matchAll(/^export const (\w+)\s*=/gm)].map((m) => m[1]);
}

function pickInteractive(exports, content) {
    if (exports.includes('Interactive')) return 'Interactive';
    if (exports.includes('Playground')) return 'Playground';
    for (const name of exports) {
        const idx = content.indexOf(`export const ${name}`);
        if (idx === -1) continue;
        const slice = content.slice(idx, idx + 500);
        if (/args\s*:/.test(slice)) return name;
    }
    return null;
}

function pickOverview(exports) {
    if (exports.includes('Overview')) return 'Overview';
    if (exports.includes('Default')) return 'Default';
    return exports[0];
}

function toImportAlias(base) {
    const alphanumeric = base.replace(/[^a-zA-Z0-9]/g, '');
    return `${alphanumeric || 'Story'}Stories`;
}

function extractFigmaLink(content) {
    const m = content.match(/https:\/\/www\.figma\.com\/design\/[^\s`'")\]>\\]+/);
    if (!m) return DEFAULT_TOOLKIT_FIGMA;
    return m[0].replace(/[.,;:]+$/, '');
}

function writeMdx(storyPath) {
    const dir = path.dirname(storyPath);
    const base = path.basename(storyPath, '.stories.jsx');
    const content = fs.readFileSync(storyPath, 'utf8');
    const exports = listStoryExports(content);
    if (exports.length === 0) {
        console.warn('SKIP MDX (no named exports):', path.relative(TOOLKIT, storyPath));
        return;
    }
    const overview = pickOverview(exports);
    const variants = exports.includes('Variants') ? 'Variants' : null;
    const interactivePick = pickInteractive(exports, content);
    const interactive = interactivePick || overview;
    const importAlias = toImportAlias(base);
    const relGithub = path.relative(REPO_ROOT, storyPath).replace(/\\/g, '/');
    const githubLink = `https://github.com/BilLogic/plus-uno/blob/main/${relGithub}`;
    const figmaLink = extractFigmaLink(content);
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    const storyTitle = titleMatch ? titleMatch[1] : '';
    const safeStoryTitle = storyTitle.replace(/`/g, "'");
    const introLine = storyTitle
        ? `This entry is part of **Toolkit** specs (Storybook title \`${safeStoryTitle}\`). Visual specs live in **Figma**; tokens, layout, and behavior notes are in the **GitHub** source below.`
        : 'Toolkit organism spec — use **Figma** for visuals and **GitHub** for implementation notes.';


    const variantsSection = variants
        ? `
<div className="sb-ds-doc-section">

### Variants

<DocsCanvasShell description={<>Documented state variations.</>}>
    <DsCanvasQuiet of={${importAlias}.${variants}} />
</DocsCanvasShell>

</div>
`
        : '';

    const mdx = `import { Meta, Title, Canvas } from '@storybook/addon-docs/blocks';

import * as ${importAlias} from './${base}.stories.jsx';
import { DocsCanvasShell, DocsInteractivePlayground, ResourcesBlock, DsCanvasQuiet } from '@/storybook-docs/ds-docs-layout.jsx';

<Meta of={${importAlias}} name="Toolkit Docs — ${base.replace(/"/g, '')}" />

<Title />

${introLine}

<ResourcesBlock
    figmaLink="${figmaLink}"
    githubLink="${githubLink}"
/>

<div className="sb-ds-component-docs sb-ds-component-docs--page not-prose">

<div className="sb-ds-doc-section">

### Overview

<DocsCanvasShell attachSourceBelow description={<>Primary canvas (<code>${overview}</code> story).</>}>
    <Canvas of={${importAlias}.${overview}} story={{ inline: true }} layout="padded" sourceState="hidden" />
</DocsCanvasShell>

</div>
${variantsSection}
<div className="sb-ds-doc-section">

### Interactive playground

<DocsInteractivePlayground
    of={${importAlias}.${interactive}}
    description={
        <>
            Use the table below to change props. The preview is rendered{' '}
            <strong className="text-foreground">inline</strong> while you scroll the docs page.
        </>
    }
/>

</div>

</div>
`;

    fs.writeFileSync(path.join(dir, `${base}.mdx`), mdx);
}

for (const rel of DELETE_REL) {
    const p = path.join(TOOLKIT, rel);
    if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log('Deleted', rel);
    }
}

const stories = walkStories(TOOLKIT);
for (const sp of stories) {
    const raw = fs.readFileSync(sp, 'utf8');
    fs.writeFileSync(sp, patchTags(raw));
    writeMdx(sp);
}

console.log('Toolkit spec docs updated. Story files:', stories.length);
