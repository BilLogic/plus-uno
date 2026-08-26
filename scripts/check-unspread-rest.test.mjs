/**
 * Tests for `check:unspread-rest` — the cases that decide whether it is worth
 * running at all.
 *
 * A guard nobody has watched fail is a guard nobody knows works (#191). For this
 * one the harder half is again the opposite: it reads JavaScript with a lexer
 * rather than a parser, because `check:harness` runs with no `npm ci` and so has
 * no parser to reach for. A lexer that blanks too much reports a component that
 * DOES spread as one that does not, and a check that lies about a fixed file
 * gets switched off within a week. So the exoneration cases below matter more
 * than the detection case, and the apostrophe one is not hypothetical — it was
 * found by running the first draft over `design-system/src` and noticing four
 * real spreads had disappeared from `StudentDashboard.stories.jsx` (#230).
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { strip, unspread } from './check-unspread-rest.mjs';

const names = (src) => unspread(src).map((f) => f.name);

/** #230 as it stood on `main`: collected in the signature, spread onto nothing. */
const DEFECT = `
const DateAndTimePicker = ({
    label,
    className = '',
    ...props
}) => {
    return (
        <div className={\`plus-datetime-wrapper \${className}\`} role="group">
            <input />
        </div>
    );
};
`;

/** The fix: same signature, spread onto the wrapper. */
const FIXED = DEFECT.replace('role="group"', 'role="group" {...props}');

test('flags a rest element that is collected and never referenced', () => {
  assert.deepEqual(names(DEFECT), ['props']);
  assert.equal(unspread(DEFECT)[0].line, 5);
});

test('a spread onto the wrapper exonerates it', () => {
  assert.deepEqual(names(FIXED), []);
});

test('`Input`s shape — collect, then spread onto the control — is clean', () => {
  const src = `
const Input = ({ id, name, ...props }) => (
    <Form.Control id={id} name={name} {...props} />
);
`;
  assert.deepEqual(names(src), []);
});

test('a mention in a comment is not a reference', () => {
  // Otherwise the defect hides behind its own documentation, which is exactly
  // where a comment about `props` tends to live.
  const src = `
// Forwards props to the wrapper.
/** Everything else lands in props. */
const C = ({ a, ...props }) => <div a={a} />;
`;
  assert.deepEqual(names(src), ['props']);
});

test('a mention inside a string is not a reference either', () => {
  const src = `const C = ({ a, ...props }) => <div title="props" data-x='props' a={a} />;`;
  assert.deepEqual(names(src), ['props']);
});

test('spread of a keyword expression is not a rest element', () => {
  // `[...new Set(x)]` reads as a rest element named `new` to anything that only
  // looks for `...` followed by a word. It was the first sweep's one false hit.
  const src = `const uniq = (x) => [...new Set(x)];`;
  assert.deepEqual(names(src), []);
});

test('an apostrophe in JSX text does not blank the code after it', () => {
  // The regression that made the quote handling line-bounded. Before that, the
  // apostrophe in "Bill's" opened a string that ran to the next apostrophe in
  // the file, blanking the spread in between — so a correct component was
  // reported as dropping its props.
  const src = `
const C = ({ ...props }) => (
    <div>
        <p>Bill's session</p>
        <span>the tutor's note</span>
        <Thing {...props} />
    </div>
);
`;
  assert.deepEqual(names(src), []);
  assert.match(strip(src), /\{\.\.\.props\}/);
});

test('a template literal keeps the code inside its ${} holes', () => {
  const src = `
const C = ({ ...props }) => <div className={\`a-\${props.size} b\`} />;
`;
  assert.deepEqual(names(src), []);
});

test('a regex literal containing a quote does not open a string', () => {
  const src = `
const C = ({ ...props }) => {
    const ok = /can't|won't/.test(props.label);
    return <div data-ok={ok} />;
};
`;
  assert.deepEqual(names(src), []);
});

test('division is not mistaken for a regex', () => {
  const src = `
const C = ({ total, count, ...props }) => {
    const mean = total / count / 2;
    return <div title={mean} {...props} />;
};
`;
  assert.deepEqual(names(src), []);
});

test('a reference that is not a spread is deliberately left alone', () => {
  // The stated limit. A component that reads the rest object has made a choice;
  // this check reports a fact, and arguing with the choice is review's job.
  const src = `const C = ({ ...props }) => <div>{Object.keys(props).length}</div>;`;
  assert.deepEqual(names(src), []);
});

test('reports every distinct dropped rest element in a file', () => {
  const src = `
const A = ({ ...aRest }) => <div />;
const B = ({ ...bRest }) => <div {...bRest} />;
const C = ({ ...cRest }) => <div />;
`;
  assert.deepEqual(names(src).sort(), ['aRest', 'cRest']);
});

test('strip keeps line numbers aligned with the file on disk', () => {
  const src = ['const a = 1;', '/* two', '   lines */', "const b = 'x';", 'const c = 2;'].join('\n');
  assert.equal(strip(src).split('\n').length, src.split('\n').length);
});
