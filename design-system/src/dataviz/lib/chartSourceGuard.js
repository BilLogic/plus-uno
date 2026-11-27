import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

export const GUARD_RELATIVE_PATH = 'lib/chartSourceGuard.js';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.css']);
const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const BS = String.fromCharCode(92);

/**
 * Collects every chart source file under `rootDir`, skipping stories, test
 * files, and this guard module itself.
 *
 * @param {string} rootDir
 * @returns {Array<{ path: string, rel: string, text: string }>}
 */
export function collectChartSourceFiles(rootDir) {
    const walk = (dir) =>
        readdirSync(dir).flatMap((entry) => {
            const path = join(dir, entry);
            if (statSync(path).isDirectory()) return walk(path);
            if (entry.endsWith('.stories.jsx') || entry.endsWith('.test.js')) return [];
            if (!SOURCE_EXTENSIONS.has(extname(entry))) return [];
            const rel = relative(rootDir, path).split(sep).join('/');
            if (rel === GUARD_RELATIVE_PATH) return [];
            return [{ path, rel, text: readFileSync(path, 'utf8') }];
        });
    return walk(rootDir);
}

function parseSource(rawText) {
    const normalized = rawText.split(CR + LF).join(LF);
    let stripped = '';
    let codeOnly = '';
    let i = 0;
    while (i < normalized.length) {
        const ch = normalized[i];
        const next = normalized[i + 1];
        if (ch === '/' && next === '/') {
            while (i < normalized.length && normalized[i] !== LF) {
                stripped += ' ';
                codeOnly += ' ';
                i += 1;
            }
            continue;
        }
        if (ch === '/' && next === '*') {
            stripped += '  ';
            codeOnly += '  ';
            i += 2;
            while (i < normalized.length && !(normalized[i] === '*' && normalized[i + 1] === '/')) {
                const c = normalized[i];
                stripped += c === LF ? LF : ' ';
                codeOnly += c === LF ? LF : ' ';
                i += 1;
            }
            if (i < normalized.length) {
                stripped += '  ';
                codeOnly += '  ';
                i += 2;
            }
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
            const quote = ch;
            const multiline = quote === '`';
            stripped += quote;
            codeOnly += quote;
            i += 1;
            while (
                i < normalized.length &&
                normalized[i] !== quote &&
                (multiline || normalized[i] !== LF)
            ) {
                if (normalized[i] === BS && i + 1 < normalized.length) {
                    const esc = normalized[i + 1];
                    stripped += BS + esc;
                    codeOnly += ' ' + (esc === LF ? LF : ' ');
                    i += 2;
                    continue;
                }
                const c = normalized[i];
                stripped += c;
                codeOnly += c === LF ? LF : ' ';
                i += 1;
            }
            if (i < normalized.length && normalized[i] === quote) {
                stripped += quote;
                codeOnly += quote;
                i += 1;
            }
            continue;
        }
        stripped += ch;
        codeOnly += ch;
        i += 1;
    }
    return { stripped, codeOnly };
}

export const stripComments = (source) => parseSource(source).stripped;

/**
 * Explicit allow-list of `relPath -> Set<trimmedLine>` for chart literals the
 * guard would otherwise flag. Empty: chart fill opacities read the
 * `--ds-opacity-chart-*` tokens.
 */
export const ALLOWED_SOURCE_LINES = new Map();

const STATES_ALLOWED_FILES = new Set([
    'chartTheme.js',
    'PlusChart.jsx',
    'temporal/Sparkline/Sparkline.jsx',
]);

export const HARD_BAN_LINE_RULES = [
    {
        id: 'eased-curve',
        pattern:
            /\beasing\s*:\s*['"][^'"]+['"]|cubic-bezier\s*\(|\b(?:transition|animation)\s*:\s*['"]?[^;}`'"]*\bease-(?:in-out|in|out)\b/,
        codePattern: /\bease(?:In|Out)\w*\b/,
    },
    {
        id: 'animation-ms-or-removed-prop',
        pattern:
            /\b(?:transition|animation)\s*:[^;}]*\b[1-9]\d*(?:\.\d+)?(?:ms|s)\b|\b(?:duration|defer)\s*:\s*['"]?[1-9]\d*(?:\.\d+)?(?:ms|s)?['"]?/,
        codePattern:
            /\banimate\s*:|\banimate=(?!=)|\(\s*\{[^{})]*\banimate\b|\b(?:animationDelay|animationDuration|enableAnimation)\b/,
    },
    {
        // Charts allow weight 500 only, and this guard intentionally
        // bans numeric 500 literals too so only the medium weight token
        // passes (tokens beat literals).
        id: 'banned-font-weight',
        pattern:
            /<b\b|<strong\b|\b(?:font-weight|fontWeight)\s*:\s*['"]?(?:bold|bolder|lighter|normal|[1-9]00)\b['"]?|--type-weight-(?!medium\b)[a-z0-9-]+/i,
    },
    {
        id: 'series-color-text',
        pattern:
            /style\s*=\s*["'][^"']*color\s*:\s*\{(?:series|point)\.color\}[^"']*["']\s*>\s*(?!●)|style\s*=\s*["'][^"']*color\s*:\s*\$\{(?!\s*(?:ink\b|inkFor\b))[^}]*(?:series|point|this)\.color\s*\}[^"']*["']\s*>\s*(?!●)|style\s*:\s*\{[^{}]*\bcolor\s*:\s*(?:['"]var\(--chart-[\w-]+\)['"]|\b(?:series|point)\.color\b)/,
    },
    {
        id: 'pixel-offset',
        pattern:
            /\b(?:pointWidth|offset|radius|distance|minSize|maxSize)\s*:\s*-?[1-9]\d*(?:\.\d+)?\b|\b(?:borderRadius|borderWidth|lineWidth|gridLineWidth|stemWidth|medianWidth|whiskerWidth|tickWidth|fontSize)\s*:\s*['"]?[1-9]\d*(?:\.\d+)?(?:px)?['"]?(?!%)|\bfont-size\s*:\s*\d+px\b|\bfillOpacity\s*:\s*0?\.\d+\b|\b[A-Z0-9_]*FILL_OPACITY\s*=\s*0?\.\d+\b/,
    },
    {
        id: 'control-radius-on-non-control',
        pattern: /--radius-control-(?:sm|md|lg)\b|--(?:button|field|input|select|control)-radius\b/,
    },
];

function checkLabelPixelOffsets(relPath, codeOnly, strippedLines, allowedLines) {
    const hits = [];
    const blockOpener = /\b(?:dataLabels|labels|title)\s*:\s*\{/g;
    for (const match of codeOnly.matchAll(blockOpener)) {
        const openBraceIdx = match.index + match[0].length - 1;
        let depth = 1;
        let cursor = openBraceIdx + 1;
        let shallowSlice = '';
        while (cursor < codeOnly.length && depth > 0) {
            const ch = codeOnly[cursor];
            if (ch === '{') {
                depth += 1;
                shallowSlice += ' ';
            } else if (ch === '}') {
                depth -= 1;
                shallowSlice += ' ';
            } else {
                shallowSlice += depth === 1 || ch === LF ? ch : ' ';
            }
            cursor += 1;
        }
        const startLineIdx = codeOnly.slice(0, openBraceIdx).split(LF).length - 1;
        shallowSlice.split(LF).forEach((sliceLine, offset) => {
            if (!/\b(?:x|y)\s*:\s*-?[1-9]\d*(?:\.\d+)?\b/.test(sliceLine)) return;
            const lineIdx = startLineIdx + offset;
            const trimmed = (strippedLines[lineIdx] ?? '').trim();
            if (!trimmed || (allowedLines && allowedLines.has(trimmed))) return;
            hits.push(`${relPath}:${lineIdx + 1} [pixel-offset] ${trimmed}`);
        });
    }
    return hits;
}

export function checkMissingTabularFigures(relPath, stripped) {
    const hits = [];
    const lines = stripped.split(LF);
    lines.forEach((line, idx) => {
        if (
            /\b(?:fontVariantNumeric|font-variant-numeric)\s*:\s*['"]?(?!tabular-nums\b|TABULAR\b)[a-z-]+/i.test(line) ||
            /--type-family-code\b|\bmonospace\b/.test(line)
        ) {
            hits.push(`${relPath}:${idx + 1} [missing-tabular-figures] ${line.trim()}`);
        }
    });
    const slotPattern =
        /\b(?:labels\s*:\s*\{[^{}]*style|dataLabels\s*:\s*\{[^{}]*style|itemStyle|tooltip\s*:\s*\{[^{}]*style)\s*:\s*\{([^{}]*)\}/g;
    for (const match of stripped.matchAll(slotPattern)) {
        const body = match[1];
        const setsType = /\b(?:fontFamily|fontSize|fontWeight)\s*:/.test(body);
        const hasTabular =
            /\bfontVariantNumeric\s*:\s*(?:TABULAR\b|['"]tabular-nums['"])/.test(body) ||
            /\.\.\.(?:chartTheme|baseSeriesPlot|dataLabelsStyle)\b/.test(body);
        if (setsType && !hasTabular) {
            const lineNum = stripped.slice(0, match.index).split(LF).length;
            hits.push(`${relPath}:${lineNum} [missing-tabular-figures] number slot style missing tabular-nums`);
        }
    }
    return hits;
}

export function auditChartSource(relPath, rawText) {
    const { stripped, codeOnly } = parseSource(rawText);
    const strippedLines = stripped.split(LF);
    const codeLines = codeOnly.split(LF);
    const allowedLines = ALLOWED_SOURCE_LINES.get(relPath);
    const findings = [];
    const record = (entry) => {
        if (!findings.includes(entry)) findings.push(entry);
    };

    strippedLines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || (allowedLines && allowedLines.has(trimmed))) return;
        const codeLine = codeLines[idx] ?? '';
        for (const rule of HARD_BAN_LINE_RULES) {
            const matched =
                (rule.pattern && rule.pattern.test(line)) ||
                (rule.codePattern && rule.codePattern.test(codeLine));
            if (matched) {
                record(`${relPath}:${idx + 1} [${rule.id}] ${trimmed}`);
            }
        }
        if (!STATES_ALLOWED_FILES.has(relPath) && /\bstates\s*:/.test(codeLine)) {
            record(`${relPath}:${idx + 1} [pixel-offset] ${trimmed}`);
        }
    });

    for (const hit of checkLabelPixelOffsets(relPath, codeOnly, strippedLines, allowedLines)) {
        record(hit);
    }
    for (const hit of checkMissingTabularFigures(relPath, stripped)) {
        record(hit);
    }
    return findings;
}
