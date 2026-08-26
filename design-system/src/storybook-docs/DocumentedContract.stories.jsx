/**
 * The render half of #167 — the documented surface has to survive being used.
 *
 * `npm run check:doc-identifiers` proves a documented name EXISTS in source. It
 * cannot prove the component does anything with it: a `oneOf` can list a value
 * the render never branches on, and propTypes can declare a prop the body drops
 * on the floor (`Select` declares `required`, `onFocus` and `onBlur` and wires
 * none of them — #207). So this runs in a real browser, through the installed
 * `@storybook/addon-vitest` setup, and mounts every prop and variant the
 * authored pages name.
 *
 * Three assertions, and the boundary between them and #206 / #207 matters:
 *
 *   1. Every enum value a page names MOUNTS — the component renders a non-empty
 *      subtree with that value, rather than throwing or collapsing to nothing.
 *   2. When a page names two or more values of the same prop, the prop is not
 *      INERT — those renders are not all byte-identical. A page that documents
 *      eight button styles against a component that ignores `style` is the
 *      failure this catches, and no static check can.
 *   3. Every prop a page names is ACCEPTED — passing it (with a probe value
 *      matched to its declared type) still renders.
 *
 * What it deliberately does NOT assert is that a prop CHANGES anything.
 * `required` on Select genuinely does nothing, and the docs say so; asserting
 * per-prop effect would fail on a correctly-documented bug and push authors to
 * stop writing them down. Assertion 2 is scoped to enum props, where "renders
 * the variant" is the documented promise.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/DocumentedContract.stories.jsx
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { expect } from 'storybook/test';

import {
  documentedSurface,
  implSymbol,
  parsePropTypes,
} from '../../../scripts/doc-identifiers.mjs';

/* ------------------------------------------------------------- the corpus */

const RAW = import.meta.glob(
  ['../components/**/*.{jsx,mdx}', '!**/*.test.jsx', '!**/*.stories.jsx'],
  { query: '?raw', import: 'default', eager: true },
);
/**
 * Eager, and with the sibling test files excluded — both deliberate.
 *
 * Eager: a lazy glob hides these modules from Vite's pre-run dependency scan,
 * so `react-bootstrap/Alert` and friends were optimised mid-run, which reloads
 * the page and aborts the file. That is the flake `vite.config.js` documents
 * under `optimizeDeps.include`. Every other story file imports its component
 * statically; this one has to look the same to the scanner.
 *
 * Excluded: `**\/*.test.jsx` are the design-system's own jsdom tests. They
 * import `@testing-library/react`, which is not a dependency of the browser
 * project — pulling them in made the whole dependency scan bail out, and then
 * everything optimised at runtime.
 */
const MODULES = import.meta.glob(
  ['../components/**/*.jsx', '!**/*.test.jsx', '!**/*.stories.jsx'],
  { eager: true },
);

/**
 * Component pages: an `<Name>.mdx` sitting beside the `<Name>.jsx` it documents.
 * `_internal` is out — those components are not an import surface, and #166
 * scoped the authored half to the public groups.
 */
function documentedComponents() {
  const out = [];
  for (const mdxPath of Object.keys(RAW)) {
    if (!mdxPath.endsWith('.mdx') || mdxPath.includes('/_internal/')) continue;
    const name = mdxPath.split('/').pop().replace(/\.mdx$/, '');
    const jsxPath = mdxPath.replace(/\.mdx$/, '.jsx');
    const source = RAW[jsxPath];
    if (!source) continue;

    const symbol = implSymbol(source, name);
    const props = new Map(parsePropTypes(source, symbol).map((p) => [p.name, p]));
    if (!props.size) continue;

    const surface = documentedSurface(RAW[mdxPath], name, props);
    if (!surface.variants.size && !surface.props.length) continue;
    out.push({
      name,
      jsxPath,
      propTypes: props,
      variants: surface.variants,
      documentedProps: surface.props,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------- rendering */

/**
 * A value of the declared type — and only for the types where "of that type" is
 * enough. A first pass matched `PropTypes.string` anywhere in the declaration,
 * which handed `arrayOf(shape({ label: string }))` the string "Sample" and
 * produced eleven failures that were all this function's fault. Anything
 * composite returns `undefined` and the prop is skipped: a fabricated shape
 * tests the fabrication, not the component.
 */
const sampleElement = () => React.createElement('span', null, 'Sample');

function probeValue(name, meta) {
  if (meta.enumValues?.length) return meta.enumValues[0];
  const t = (meta.type ?? '').replace(/\.isRequired\s*$/, '').trim();
  if (t === 'PropTypes.bool') return true;
  if (t === 'PropTypes.string') return 'Sample';
  if (t === 'PropTypes.number') return 1;
  if (t === 'PropTypes.func') return () => {};
  if (t === 'PropTypes.element') return sampleElement();
  // A string is a legal node everywhere except as a child of an overlay
  // trigger, which clones its child and needs a real element to clone.
  if (t === 'PropTypes.node') return name === 'children' ? sampleElement() : 'Sample';
  return undefined;
}

/**
 * The minimum that makes a component render at all.
 *
 * `show` and its synonyms are set because a component that starts hidden
 * renders nothing whatever variant you pass it — Modal's `type="scrollable"`
 * would look like a broken variant when it is simply closed. Everything else is
 * the component's own required props plus a text label and an element child.
 */
const VISIBILITY = ['show', 'open', 'isOpen', 'visible'];

function baseProps(props) {
  const base = {};
  // Required props only. Handing an OPTIONAL `children` to `ButtonGroup` — which
  // clones each child and pushes `style` onto it — turned a fabricated `<span>`
  // into a React error that had nothing to do with the documented variant.
  for (const [name, meta] of props) {
    if (!meta.required) continue;
    const v = probeValue(name, meta);
    if (v !== undefined) base[name] = v;
  }
  for (const name of ['text', 'label', 'title', 'buttonText']) {
    const meta = props.get(name);
    if (meta && base[name] === undefined && probeValue(name, meta) === 'Sample') base[name] = 'Sample';
  }
  for (const name of VISIBILITY) {
    if (props.get(name)?.type?.startsWith('PropTypes.bool')) base[name] = true;
  }
  return base;
}

/**
 * Mount, and hand back everything the component put in the document.
 *
 * Not just the host: Modal, Tooltip and Popover render through a portal onto
 * `document.body`, so a host-only reading calls every overlay variant empty.
 * React 19 does not rethrow a render error out of `flushSync` — it reports it
 * and commits nothing — so a crash arrives here as empty markup. `onCaughtError`
 * is how the reason gets back to the caller instead of being lost to the console.
 */
function renderMarkup(Component, props, canvasElement) {
  const host = document.createElement('div');
  canvasElement.appendChild(host);
  const outside = new Set(document.body.children);
  const errors = [];
  const root = createRoot(host, {
    onUncaughtError: (error) => errors.push(error),
    onCaughtError: (error) => errors.push(error),
  });
  try {
    flushSync(() => root.render(React.createElement(Component, props)));
    const portaled = [...document.body.children]
      .filter((el) => !outside.has(el) && el !== host && !host.contains(el))
      .map((el) => el.outerHTML)
      .join('');
    return { html: host.innerHTML + portaled, errors };
  } finally {
    flushSync(() => root.unmount());
    host.remove();
  }
}

const load = (jsxPath, name) => {
  const mod = MODULES[jsxPath];
  return mod?.default ?? mod?.[name];
};

/* ---------------------------------------------------------------- stories */

/**
 * The story body is a manifest, not a demo: it says out loud what the run
 * covered, so a reader of the Storybook page sees the size of the contract
 * rather than an empty canvas.
 */
const Manifest = ({ subjects }) => (
  <div style={{ font: '13px/1.6 system-ui, sans-serif' }}>
    <p>
      <strong>{subjects.length}</strong> documented components ·{' '}
      <strong>{subjects.reduce((n, s) => n + [...s.variants.values()].flat().length, 0)}</strong>{' '}
      documented variants ·{' '}
      <strong>{subjects.reduce((n, s) => n + s.documentedProps.length, 0)}</strong> documented props
    </p>
    <ul>
      {subjects.map((s) => (
        <li key={s.name}>
          <code>{s.name}</code>
          {[...s.variants].map(([prop, values]) => ` · ${prop}=${values.join('|')}`)}
        </li>
      ))}
    </ul>
  </div>
);

const subjects = documentedComponents();

export default {
  title: 'Docs/Documented contract',
  component: Manifest,
  tags: ['!autodocs'],
  parameters: {
    // This story mounts other components on purpose, in states their own pages
    // warn about (icon-only Buttons have no accessible name by design). The a11y
    // baseline is #169's, and reporting those here would double-count them.
    a11y: { test: 'off' },
    layout: 'padded',
  },
};

export const DocumentedVariantsRender = {
  args: { subjects },
  play: async ({ canvasElement }) => {
    const failures = [];

    for (const subject of subjects) {
      if (!subject.variants.size) continue;
      const Component = load(subject.jsxPath, subject.name);
      const base = baseProps(subject.propTypes);

      for (const [prop, values] of subject.variants) {
        const rendered = new Map();
        for (const value of values) {
          try {
            const { html, errors } = renderMarkup(Component, { ...base, [prop]: value }, canvasElement);
            if (errors.length) {
              failures.push(`${subject.name} ${prop}="${value}" threw: ${errors[0].message}`);
              continue;
            }
            if (!html.trim()) {
              failures.push(`${subject.name} ${prop}="${value}" rendered nothing`);
              continue;
            }
            rendered.set(value, html);
          } catch (error) {
            failures.push(`${subject.name} ${prop}="${value}" threw: ${error.message}`);
          }
        }
        if (rendered.size >= 2 && new Set(rendered.values()).size === 1) {
          failures.push(
            `${subject.name} ${prop} is inert: ${[...rendered.keys()].join(', ')} all render identically, ` +
              'so the page documents variants the component does not implement',
          );
        }
      }
    }

    expect(failures, failures.join('\n')).toEqual([]);
  },
};

export const DocumentedPropsAreAccepted = {
  args: { subjects },
  play: async ({ canvasElement }) => {
    const failures = [];

    for (const subject of subjects) {
      if (!subject.documentedProps.length) continue;
      const Component = load(subject.jsxPath, subject.name);
      const base = baseProps(subject.propTypes);

      for (const prop of subject.documentedProps) {
        const value = probeValue(prop, subject.propTypes.get(prop));
        if (value === undefined) continue; // shape cannot be fabricated; not a finding
        try {
          const { html, errors } = renderMarkup(Component, { ...base, [prop]: value }, canvasElement);
          if (errors.length) {
            failures.push(`${subject.name} threw when passed ${prop}: ${errors[0].message}`);
          } else if (!html.trim()) {
            failures.push(`${subject.name} rendered nothing with ${prop} set`);
          }
        } catch (error) {
          failures.push(`${subject.name} threw when passed ${prop}: ${error.message}`);
        }
      }
    }

    expect(failures, failures.join('\n')).toEqual([]);
  },
};

/**
 * The gate on the gate. If the corpus stops producing subjects — a glob that
 * silently matches nothing, a parser that returns no props — both stories above
 * pass on an empty list, which is exactly the "guard that cannot fail" #191
 * fixed twice.
 */
export const TheContractIsNotEmpty = {
  args: { subjects },
  play: async () => {
    expect(subjects.length).toBeGreaterThanOrEqual(10);
    const variants = subjects.reduce((n, s) => n + [...s.variants.values()].flat().length, 0);
    expect(variants).toBeGreaterThanOrEqual(25);
  },
};
