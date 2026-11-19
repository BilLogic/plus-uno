/**
 * Show code from source: a docs example prints its own declaration, so the
 * code a reader copies is the code that rendered and there is no second copy
 * to keep in step.
 *
 * A template's examples live in one module that imports only PLUS parts. The
 * docs page imports that module as text (`import raw from './Examples.jsx?raw'`)
 * and asks for an example by name. The staging the docs add around it (a
 * stage, a window, a Blanket behind a Modal) lives in the story's own module,
 * which Show code never reads.
 */

const DECLARATION = /^(?:export\s+)?(?:const|let|function)\s+([A-Za-z_$][\w$]*)/;
const TOP_LEVEL_START = /^(?:(?:export\s+)?(?:const|let|function)\s|\/\*\*|\/\/|import\s)/;

/** The module's top-level declarations: name, printed text and the names it reads. */
function declarations(raw) {
    const lines = raw.split('\n');
    const found = [];
    let current = null;
    for (const line of lines) {
        const match = DECLARATION.exec(line);
        if (match) {
            current = { name: match[1], lines: [line.replace(/^export\s+/, '')] };
            found.push(current);
        } else if (TOP_LEVEL_START.test(line)) {
            current = null;
        } else if (current) {
            current.lines.push(line);
        }
    }
    return found.map(({ name, lines: body }) => {
        while (body.length && body[body.length - 1].trim() === '') body.pop();
        return { name, text: body.join('\n') };
    });
}

/** The module's imports as { from, default, named[] }, so a snippet can carry the ones it uses. */
function imports(raw) {
    const found = [];
    for (const match of raw.matchAll(/^import\s+([\s\S]*?)\s+from\s+'([^']+)';?$/gm)) {
        const clause = match[1];
        if (clause.startsWith('*')) continue;
        const braces = /\{([^}]*)\}/.exec(clause);
        const lead = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
        const named = braces ? braces[1].split(',').map((n) => n.trim()).filter(Boolean) : [];
        found.push({ from: match[2], lead, named });
    }
    return found;
}

/** The import lines the printed code needs, keeping only the names it uses. */
function importLines(raw, code) {
    const uses = (name) => new RegExp(`(?<![\\w$.])${name.split(/\s+as\s+/).pop()}(?![\\w$])`).test(code);
    const lines = [];
    for (const { from, lead, named } of imports(raw)) {
        const parts = [];
        if (lead && uses(lead)) parts.push(lead);
        const used = named.filter(uses);
        if (used.length) parts.push(`{ ${used.join(', ')} }`);
        if (parts.length) lines.push(`import ${parts.join(', ')} from '${from}';`);
    }
    return lines;
}

/**
 * The source of one example: the imports it needs, then every declaration in
 * the same module that it reads, then its own declaration, in file order.
 *
 * @param {string} raw - the examples module as text
 * @param {string} name - the example's export name
 */
export function sourceOf(raw, name) {
    const all = declarations(raw);
    const byName = new Map(all.map((d) => [d.name, d]));
    if (!byName.has(name)) throw new Error(`show-code: ${name} is not declared in the examples module`);
    const needed = new Set();
    const visit = (declaration) => {
        if (needed.has(declaration.name)) return;
        needed.add(declaration.name);
        for (const word of declaration.text.match(/[A-Za-z_$][\w$]*/g) ?? []) {
            if (byName.has(word)) visit(byName.get(word));
        }
    };
    visit(byName.get(name));
    const body = all.filter((d) => needed.has(d.name)).map((d) => d.text).join('\n\n');
    const lines = importLines(raw, body);
    return lines.length ? `${lines.join('\n')}\n\n${body}` : body;
}

/**
 * The printed source of several examples, keyed by name.
 *
 * @param {string} raw - the examples module as text
 * @param {string[]} names - example export names
 */
export const showCode = (raw, names) => Object.fromEntries(names.map((name) => [name, sourceOf(raw, name)]));
