/**
 * The Storybook docs' AI agent's first answerer: no model, no key. It searches
 * the pages Storybook lists (index.json) and the component names the
 * generated component index carries, and replies with the pages that match as its sources.
 * Pure functions, so every rule is tested without a browser.
 */

const MAX_LINKS = 5;
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'how', 'do', 'does', 'i', 'to', 'use', 'using', 'where', 'what', 'which',
    'page', 'pages', 'docs', 'doc', 'documentation', 'for', 'of', 'in', 'on', 'me', 'show', 'find', 'about',
    'can', 'my', 'and', 'or', 'with', 'component', 'components', 'there', 'need', 'want',
]);

const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const compact = (s) => normalize(s).replace(/ /g, '');
const lastSegment = (title) => title.split('/').pop();

/** Component names from the generated index's `- [Name](path)` list lines. */
export const parseComponentNames = (markdown) => {
    if (!markdown) return [];
    const names = [];
    for (const line of String(markdown).split('\n')) {
        const match = /^- \[([^\]]+)\]\(/.exec(line);
        if (match) names.push(match[1]);
    }
    return names;
};

/**
 * One entry per Storybook title: `{ title, name, id, type }`, where `id` and
 * `type` point at the docs page (or, with none, the first story). A component
 * name no title carries is kept with a null `id`, so the answer can say it has
 * no docs page.
 */
export const buildDocsEntries = (storybookIndex, componentNames = []) => {
    const byTitle = new Map();
    for (const entry of Object.values(storybookIndex?.entries ?? {})) {
        if (!entry?.title || !entry.id) continue;
        const current = byTitle.get(entry.title);
        const better = !current || (entry.type === 'docs' && current.type !== 'docs');
        if (better) byTitle.set(entry.title, { title: entry.title, name: lastSegment(entry.title), id: entry.id, type: entry.type });
    }
    const known = new Set([...byTitle.values()].map((e) => compact(e.name)));
    const entries = [...byTitle.values()];
    for (const name of componentNames) {
        if (!known.has(compact(name))) entries.push({ title: name, name, id: null, type: null });
    }
    return entries;
};

const score = (entry, tokens, whole) => {
    const name = compact(entry.name);
    const title = normalize(entry.title);
    let total = 0;
    if (whole && compact(whole) === name) total += 20;
    for (const token of tokens) {
        if (name === token) total += 10;
        else if (name.includes(token)) total += 5;
        else if (title.includes(token)) total += 2;
    }
    return total;
};

/**
 * `(query, entries, { href }) => { text, sources }`, one `{ title, href, type }`
 * per matching page. `href(id, type)` builds a source's address, so the caller owns where Storybook lives.
 */
export const answerDocsQuery = (query, entries, { href }) => {
    const tokens = normalize(query ?? '').split(' ').filter((t) => t && !STOP_WORDS.has(t));
    if (tokens.length === 0) {
        return { text: 'Ask me about a component or a docs page by name, such as "Button" or "Color".', sources: [] };
    }
    const ranked = entries
        .map((entry) => ({ entry, points: score(entry, tokens, tokens.join(' ')) }))
        .filter((r) => r.points > 0)
        .sort((a, b) => b.points - a.points || a.entry.title.localeCompare(b.entry.title));
    const withPage = ranked.filter((r) => r.entry.id);
    const sources = withPage.slice(0, MAX_LINKS).map(({ entry }) => ({
        title: entry.name,
        href: href(entry.id, entry.type),
        type: entry.type === 'docs' ? 'Docs page' : 'Story',
    }));
    if (sources.length > 0) {
        return { text: sources.length === 1 ? 'This page matches.' : 'These pages match.', sources };
    }
    const missing = ranked.find((r) => !r.entry.id);
    if (missing) {
        return { text: `${missing.entry.name} is in the component index, but it has no docs page here yet.`, sources: [] };
    }
    return { text: 'I found no page for that. Try a component name, such as "Button" or "Modal".', sources: [] };
};

/**
 * The docs page a title or a name points at, for a link the model wrote as
 * `page:<title>` or a "take me to …" question: the exact title, then a title
 * ending in it, then a page of that name, then the best search match. Only
 * entries with a page; null when nothing matches.
 */
export const findPage = (name, entries) => {
    const wanted = normalize(name ?? '');
    if (!wanted) return null;
    const pages = entries.filter((e) => e.id);
    const byTitle = pages.find((e) => normalize(e.title) === wanted);
    if (byTitle) return byTitle;
    const ending = pages.filter((e) => normalize(e.title).endsWith(` ${wanted}`) && compact(e.title).endsWith(compact(wanted)));
    if (ending.length) return ending.find((e) => e.type === 'docs') ?? ending[0];
    const byName = pages.filter((e) => compact(e.name) === compact(wanted));
    if (byName.length) return byName.find((e) => e.type === 'docs') ?? byName[0];
    const tokens = wanted.split(' ').filter((t) => t && !STOP_WORDS.has(t));
    if (tokens.length === 0) return null;
    const best = pages
        .map((entry) => ({ entry, points: score(entry, tokens, tokens.join(' ')) }))
        .filter((r) => r.points >= 5)
        .sort((a, b) => b.points - a.points || a.entry.title.localeCompare(b.entry.title))[0];
    return best?.entry ?? null;
};

const PAGE_LINK = /\[([^\]\n]+)\]\(\s*page:([^)\n]+)\)/g;

/**
 * Turns the model's `[label](page:<title>)` links into docs addresses; a link
 * to a page that does not exist keeps its label as plain text.
 */
export const resolvePageLinks = (text, entries, href) => String(text ?? '').replace(PAGE_LINK, (whole, label, title) => {
    const page = findPage(title.trim(), entries);
    return page ? `[${label}](${href(page.id, page.type)})` : label;
});
