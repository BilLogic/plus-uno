#!/usr/bin/env node
/**
 * Jev (TypeSafe) vs the regex baseline on the uno-prototype gate's decisions.
 * Exploration only — nothing here is wired into the hook.
 *
 * Run:  node .cursor/hooks/uno-prototype/eval/compare-jev.mjs
 *         [--suite <name>]                        intent · prdCheck · reflection · deliverable · wireframeRoute (default: all)
 *         [--intents <path>]                      another intents.mjs to use as the regex baseline
 *         [--min-confidence 0.5]                  below this, the hybrid row falls back to regex
 *         [--json]                                raw per-case results instead of the report
 *
 * The regex half always runs. The Jev half runs only when TYPESAFE_API_KEY is
 * set, in the shell or in the repo's .env: one HTTPS call per case, sequential, so the latency numbers are what a
 * hook would actually wait. The call is plain fetch against the HTTP API, so
 * no SDK install is needed. Case labels live in jev-cases.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { GLOBAL_COMMANDS } from '../constants.mjs';
import { isNoPrdAnswer, isNonEmptyText, looksLikePrdContent, parseChoice } from '../validators.mjs';
import {
  DELIVERABLE_CASES,
  INTENT_CASES,
  PRD_CHECK_CASES,
  REFLECTION_CASES,
  WIREFRAME_ROUTE_CASES,
} from './jev-cases.mjs';

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const JEV_MODEL = 'jev-latest';
// The UserPromptSubmit hook is given 10s in .claude/settings.json.
const JEV_TIMEOUT_MS = 10_000;

// The key lives in the repo's gitignored .env (see .env.example); a value
// already exported in the shell wins over the file.
const envFile = new URL('../../../../.env', import.meta.url);
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const args = parseArgs(process.argv.slice(2));
const apiKey = process.env.TYPESAFE_API_KEY;
const intentsPath = args.intents
  ? path.resolve(args.intents)
  : new URL('../intents.mjs', import.meta.url).pathname;
const { hasPrototypeIntent } = await import(pathToFileURL(intentsPath).href);
const minConfidence = Number(args['min-confidence'] ?? 0.5);

const REPO_CONTEXT =
  'A designer is chatting with a coding agent in a design-system repo. The repo has a skill called uno-prototype that turns a PRD into a new prototype; it starts with a PRD gate that asks "Do you have a PRD?".';

/**
 * Each suite: the regex baseline, the Jev question for one case, and how to
 * read the Jev answer back into the suite's label space.
 */
const SUITES = {
  intent: {
    cases: INTENT_CASES,
    regex: (c) => (hasPrototypeIntent(c.text) ? 'start_new' : 'no_gate'),
    // The gate is binary: only start_new fires it.
    gate: (label) => (label === 'start_new' ? 'start_new' : 'no_gate'),
    jevRequest: (c) => ({
      state: { context: REPO_CONTEXT, message: c.text },
      questions: {
        intent: {
          type: 'choice',
          instructions: 'What is the designer asking the agent to do in this message?',
          criteria: {
            start_new:
              'Start creating a NEW prototype, mockup, wireframe, flow sketch, concept or other design artifact — including invoking the uno-prototype skill to do so.',
            iterate_existing: 'Keep working on, fix, or change a prototype or artifact that already exists.',
            discuss_skill:
              'Talk about, explain, debug, configure, or change the uno-prototype skill, its hook, or its PRD gate — not use it.',
            review: 'Review, critique, check, or QA an existing prototype or design.',
            other: 'Anything else: unrelated coding, general questions, chit-chat.',
          },
        },
      },
    }),
  },

  prdCheck: {
    cases: PRD_CHECK_CASES,
    // Mirrors engine.mjs at prd_check: literal choice, then the paste fast
    // path, then the natural "no"; anything else is re-asked.
    regex: (c) => {
      const choice = parseChoice(c.text, ['Yes', 'No']);
      if (choice) return choice === 'Yes' ? 'yes' : 'no';
      if (looksLikePrdContent(c.text)) return 'pasted_prd';
      if (isNoPrdAnswer(c.text)) return 'no';
      return 'unclear';
    },
    jevRequest: (c) => ({
      state: { agent_question: 'Do you have a PRD?', designer_reply: c.text },
      questions: {
        reply: {
          type: 'choice',
          instructions: 'How did the designer answer the agent_question?',
          criteria: {
            yes: 'Says they have a PRD, without pasting it yet.',
            no: 'Says they do not have a PRD (yet).',
            pasted_prd: 'The reply IS the PRD: a link to it, a file path, or its text.',
            unclear: 'Neither — asks a question back, or the answer cannot be told.',
          },
        },
      },
    }),
  },

  reflection: {
    cases: REFLECTION_CASES,
    // Mirrors engine.mjs during reflect_*: the literal "back" command, else
    // any non-empty text is stored as the answer.
    regex: (c) => {
      if (GLOBAL_COMMANDS.back.test(c.text)) return 'go_back';
      return isNonEmptyText(c.text) ? 'answer' : 'unclear';
    },
    jevRequest: (c) => ({
      state: { agent_question: c.question, designer_reply: c.text },
      questions: {
        reply: {
          type: 'choice',
          instructions: 'The agent asked the designer agent_question. What is designer_reply doing?',
          criteria: {
            answer: 'Answers the question, or confirms / adjusts what the agent proposed.',
            clarifying_question: 'Asks the agent a question about this step instead of answering it.',
            go_back: 'Wants to return to an earlier question or change an earlier answer.',
            off_topic: 'About something unrelated to this question.',
          },
        },
      },
    }),
  },

  // No regex does this today — the agent reads SKILL.md's routing table. The
  // baseline is the keyword lookup a hook could do from that same table.
  deliverable: {
    cases: DELIVERABLE_CASES.map((c) => ({ ...c, text: `${c.artifact} · ${c.fidelity}` })),
    regex: (c) => {
      const t = c.artifact.toLowerCase();
      if (/design system|prototypes\/|plus components|hi-fi build/.test(t)) return 'coded_build';
      if (/interactive|clickable|functional|tap through|v0|figma make|ai studio/.test(t)) return 'interactive';
      if (/storyboard|sequence of frames/.test(t)) return 'storyboard';
      if (/concept|image|vibe/.test(t)) return 'concept_image';
      if (/flow|journey|map/.test(t)) return 'flow_map';
      if (/wireframe|mockup|ascii|sketch|screen/.test(t)) return 'wireframe';
      return 'unknown';
    },
    jevRequest: (c) => ({
      state: { artifact: c.artifact, fidelity: c.fidelity },
      questions: {
        deliverable: {
          type: 'choice',
          instructions: 'The designer confirmed this prototype brief. Which kind of deliverable is the artifact?',
          criteria: {
            flow_map: 'A user flow, journey map, or data-flow map — boxes and arrows, not screens.',
            wireframe: 'A wireframe or static mockup of screens — including a quick in-chat ASCII sketch or a polished still screen. Nothing clicks.',
            concept_image: 'A single concept or mood image that conveys a feeling or direction.',
            storyboard: 'A sequence of illustrated frames telling a story over time.',
            interactive: 'A clickable or functional prototype generated by an external tool (Claude design, Figma Make, Stitch, v0, AI Studio).',
            coded_build: 'A hi-fi build coded directly on the PLUS design system in this repo.',
          },
        },
      },
    }),
  },

  wireframeRoute: {
    cases: WIREFRAME_ROUTE_CASES,
    regex: (c) => {
      const t = c.text.toLowerCase();
      if (/ascii|in chat|here in chat/.test(t)) return 'ascii';
      if (/figma|canvas|comment/.test(t)) return 'figma';
      return 'spec';
    },
    jevRequest: (c) => ({
      state: { designer_said: c.text },
      questions: {
        route: {
          type: 'choice',
          instructions: 'The deliverable is a wireframe. Which route fits what the designer said?',
          criteria: {
            ascii: 'An ASCII wireframe drawn right in the chat — low visual fidelity, speed and convergence matter most.',
            figma: 'A wireframe drawn directly into a Figma file, so the team can comment on the canvas.',
            spec: 'A prompt-spec handed to an external generator (Stitch, Figma Make) that adds value, e.g. several variations or higher visual polish.',
          },
        },
      },
    }),
  },
};

/** @returns {Promise<{ label?: string; confidence?: number; ms: number; error?: string }>} */
async function askJev(body) {
  const start = performance.now();
  try {
    const res = await fetch(JEV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: JEV_MODEL, ...body }),
      signal: AbortSignal.timeout(JEV_TIMEOUT_MS),
    });
    const ms = performance.now() - start;
    if (!res.ok) return { ms, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const json = await res.json();
    const answer = Object.values(json.answers || {})[0];
    return { label: answer?.choice, confidence: answer?.confidence, ms };
  } catch (err) {
    return { ms: performance.now() - start, error: err.name === 'TimeoutError' ? 'timeout' : err.message };
  }
}

async function runSuite(name, suite) {
  const rows = [];
  for (const c of suite.cases) {
    const t0 = performance.now();
    const regex = suite.regex(c);
    const regexMs = performance.now() - t0;
    const jev = apiKey ? await askJev(suite.jevRequest(c)) : null;
    rows.push({ ...c, regex, regexMs, jev });
  }
  return { name, suite, rows };
}

function percentile(values, p) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function fmtMs(ms) {
  if (Number.isNaN(ms)) return '—';
  return ms < 1 ? `${(ms * 1000).toFixed(0)}µs` : `${ms.toFixed(0)}ms`;
}

function report({ name, suite, rows }) {
  const gate = suite.gate || ((l) => l);
  const n = rows.length;
  const lines = [`\n## ${name} (${n} cases)`];

  const regexHits = rows.filter((r) => r.regex === gate(r.label));
  const regexMs = rows.map((r) => r.regexMs);
  const table = [
    ['method', 'correct', 'p50', 'p95', 'errors'],
    ['regex', `${regexHits.length}/${n}`, fmtMs(percentile(regexMs, 50)), fmtMs(percentile(regexMs, 95)), '0'],
  ];

  if (apiKey) {
    const ok = rows.filter((r) => !r.jev.error);
    const jevMs = ok.map((r) => r.jev.ms);
    const jevHits = rows.filter((r) => r.jev.label && gate(r.jev.label) === gate(r.label));
    const errors = rows.length - ok.length;
    table.push(['jev', `${jevHits.length}/${n}`, fmtMs(percentile(jevMs, 50)), fmtMs(percentile(jevMs, 95)), String(errors)]);
    if (suite.gate) {
      // Finer than the gate: did Jev name the right one of the five intents?
      const exact = rows.filter((r) => r.jev.label === r.label).length;
      table.push(['jev (5-way label)', `${exact}/${n}`, '', '', '']);
    }
    // What shipping it would look like: trust Jev when sure, else keep regex.
    const hybrid = rows.filter((r) => {
      const useJev = !r.jev.error && (r.jev.confidence ?? 0) >= minConfidence;
      return (useJev ? gate(r.jev.label) : r.regex) === gate(r.label);
    });
    table.push([`hybrid (jev ≥${minConfidence} conf, else regex)`, `${hybrid.length}/${n}`, '', '', '']);
  }

  const widths = table[0].map((_, i) => Math.max(...table.map((row) => row[i].length)));
  for (const row of table) lines.push(row.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd());

  const misses = rows.filter(
    (r) => r.regex !== gate(r.label) || (r.jev && gate(r.jev.label ?? '') !== gate(r.label)),
  );
  if (misses.length) {
    lines.push('', 'misses (expected → regex | jev):');
    for (const r of misses) {
      const jevCell = !r.jev
        ? ''
        : r.jev.error
          ? ` | jev error: ${r.jev.error}`
          : ` | ${r.jev.label} (conf ${r.jev.confidence?.toFixed(2)})`;
      const regexMark = r.regex === gate(r.label) ? '✓' : '✗';
      lines.push(`  ${r.id} ${gate(r.label)} → ${regexMark} ${r.regex}${jevCell}${r.real ? ' [real]' : ''}`);
      lines.push(`      "${r.text.replace(/\n/g, ' / ').slice(0, 110)}"`);
    }
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith('--') ? (i++, next) : true;
  }
  return out;
}

const selected = args.suite ? { [args.suite]: SUITES[args.suite] } : SUITES;
if (args.suite && !SUITES[args.suite]) {
  console.error(`Unknown suite "${args.suite}". Use one of: ${Object.keys(SUITES).join(', ')}`);
  process.exit(1);
}

const results = [];
for (const [name, suite] of Object.entries(selected)) results.push(await runSuite(name, suite));

if (args.json) {
  console.log(JSON.stringify(results.map(({ name, rows }) => ({ name, rows })), null, 2));
} else {
  console.log(`# uno-prototype gate: regex vs Jev`);
  console.log(`regex baseline: ${path.relative(process.cwd(), intentsPath)}`);
  console.log(`jev: ${apiKey ? `${JEV_MODEL}, sequential, ${JEV_TIMEOUT_MS / 1000}s timeout` : 'not run (no TYPESAFE_API_KEY)'}`);
  for (const r of results) console.log(report(r));
}
