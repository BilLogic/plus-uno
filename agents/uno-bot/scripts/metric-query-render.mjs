// @ts-check
/**
 * Renders a metric query file (queries/usage/*.sql) into the one statement
 * `wrangler d1 execute --file` runs: the window, and the inputs the query reads
 * that are not in the database.
 *
 * THE WINDOW. Every query opens with a `win` CTE whose two dates sit on lines
 * marked `-- @from` and `-- @to`. The file runs as it stands on its own dates;
 * a window given here replaces just those two literals.
 *
 * THE INPUTS. Three things a metric needs live outside `uno-bot-usage`, and
 * each enters a query as a VALUES table at a `-- @input <name>` marker:
 *   - `graded_answers` — the hand grading of answers, checked in as
 *     queries/usage/graded-answers.csv, so a grading can be re-run and cited;
 *   - `corpus_threads` — the Coordination Request Corpus export the human
 *     baseline is computed from;
 *   - `ticket_closures` — GitHub's `url` and `closedAt` for the bot's own
 *     tickets, exported when the query is run.
 * None of them is written to the database: the rows exist only in the
 * statement. A query whose marker is left unrendered fails with "no such
 * table", so an ungraded run cannot pass for a graded one.
 *
 * Pure: no filesystem, so the workerd suite renders exactly what the CLI
 * (`./metric-query.mjs`) renders.
 */

/** D1's ceiling on one SQL statement, in bytes. */
export const D1_STATEMENT_LIMIT = 100_000;

/**
 * @typedef {"text" | "grade" | "time" | "time?" | "bool" | "text?"} ColumnKind
 * @typedef {{ name: string, kind: ColumnKind, aliases?: string[] }} InputColumn
 * @typedef {string | number | null} SqlValue
 */

/** @type {Record<string, InputColumn[]>} */
const INPUTS = {
  graded_answers: [
    { name: "turn_id", kind: "text" },
    { name: "grade", kind: "grade" },
    { name: "grader", kind: "text" },
    { name: "note", kind: "text?" },
  ],
  corpus_threads: [
    { name: "thread_id", kind: "text" },
    { name: "asked_at", kind: "time" },
    { name: "first_reply_at", kind: "time?" },
    { name: "lead_replied_first", kind: "bool" },
  ],
  ticket_closures: [
    { name: "url", kind: "text" },
    { name: "closed_at", kind: "time?", aliases: ["closedAt"] },
  ],
};

const GRADES = ["correct", "partial", "wrong"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MARKER = /^[ \t]*-- @input ([a-z_]+)[ \t]*$/gm;

/**
 * A CSV file as records keyed by its header row. RFC 4180: quoted fields, `""`
 * inside quotes, newlines inside quotes, CRLF or LF. Blank lines are skipped.
 *
 * @param {string} text
 * @returns {Record<string, string>[]}
 */
export function parseCsv(text) {
  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = "";
  let quoted = false;
  let i = 0;
  const endRow = () => {
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
    field = "";
  };
  while (i < text.length) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (c === '"') quoted = false;
      else field += c;
      i += 1;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") endRow();
    else if (c !== "\r") field += c;
    i += 1;
  }
  if (field !== "" || row.length > 0) endRow();

  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((fields, r) => {
    if (fields.length !== header.length) {
      throw new Error(`CSV row ${r + 2} has ${fields.length} fields, the header has ${header.length}`);
    }
    return Object.fromEntries(header.map((name, c) => [name.trim(), fields[c] ?? ""]));
  });
}

/**
 * One input's records as SQL rows, in its column order, each value checked.
 *
 * @param {string} name - an input a query can read
 * @param {Record<string, unknown>[]} records - parsed CSV, or GitHub's JSON
 * @returns {SqlValue[][]}
 */
export function inputRows(name, records) {
  const columns = Object.hasOwn(INPUTS, name) ? INPUTS[name] : undefined;
  if (!columns) throw new Error(`no input named "${name}"`);
  return records.map((record, r) =>
    columns.map((column) => {
      const key = [column.name, ...(column.aliases ?? [])].find((k) => Object.hasOwn(record, k));
      const raw = key === undefined ? null : record[key];
      const text = raw === null || raw === undefined ? "" : String(raw).trim();
      const fail = (/** @type {string} */ why) => new Error(`${name} row ${r + 1}: ${why}`);
      switch (column.kind) {
        case "text":
          if (!text) throw fail(`${column.name} is empty`);
          return text;
        case "text?":
          return text || null;
        case "grade": {
          const grade = text.toLowerCase();
          if (!GRADES.includes(grade)) throw fail(`grade "${text}" is not correct, partial or wrong`);
          return grade;
        }
        case "time":
        case "time?": {
          if (!text) {
            if (column.kind === "time?") return null;
            throw fail(`${column.name} is empty`);
          }
          const ms = /^\d+$/.test(text) ? Number(text) : Date.parse(text);
          if (!Number.isFinite(ms)) throw fail(`${column.name} "${text}" is not a time`);
          return ms;
        }
        case "bool": {
          const value = text.toLowerCase();
          if (["1", "true", "yes"].includes(value)) return 1;
          if (["0", "false", "no", ""].includes(value)) return 0;
          throw fail(`${column.name} "${text}" is not a boolean`);
        }
      }
    }),
  );
}

/**
 * The inputs a query reads, by its `-- @input` markers, in order.
 *
 * @param {string} sql
 * @returns {string[]}
 */
export function referencedInputs(sql) {
  return [...sql.matchAll(MARKER)].map((m) => /** @type {string} */ (m[1]));
}

/** @param {SqlValue} value */
function literal(value) {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

/**
 * @param {string} name
 * @param {SqlValue[][]} rows
 */
function inputCte(name, rows) {
  const columns = /** @type {InputColumn[]} */ (INPUTS[name]);
  const head = `  ${name}(${columns.map((c) => c.name).join(", ")}) AS `;
  if (rows.length === 0) return `${head}(SELECT ${columns.map(() => "NULL").join(", ")} WHERE 0),`;
  const values = rows.map((row) => `    (${row.map(literal).join(", ")})`).join(",\n");
  return `${head}(VALUES\n${values}\n  ),`;
}

/**
 * @param {string} sql
 * @param {"from" | "to"} marker
 * @param {string} date
 */
function withDate(sql, marker, date) {
  const line = new RegExp(`'\\d{4}-\\d{2}-\\d{2}'(?=[^\\n]*-- @${marker}\\b)`);
  if (!line.test(sql)) throw new Error(`the query has no -- @${marker} line to put the window on`);
  return sql.replace(line, `'${date}'`);
}

/**
 * A query file, ready for `wrangler d1 execute --file`.
 *
 * @param {string} sql - the query file's text
 * @param {{ from?: string, to?: string, inputs?: Record<string, SqlValue[][]> }} options
 *   - `from` / `to`: the window, `YYYY-MM-DD` UTC, start inclusive, end exclusive;
 *     either left out keeps the file's own date
 *   - `inputs`: rows from `inputRows`, by input name
 * @returns {string}
 */
export function renderMetricQuery(sql, { from, to, inputs = {} } = {}) {
  for (const date of [from, to]) {
    if (date !== undefined && !DATE.test(date)) throw new Error(`a window date is YYYY-MM-DD, not "${date}"`);
  }
  if (from !== undefined && to !== undefined && !(from < to)) {
    throw new Error(`the window must start before it ends: ${from} is not before ${to}`);
  }
  let out = sql;
  if (from !== undefined) out = withDate(out, "from", from);
  if (to !== undefined) out = withDate(out, "to", to);

  out = out.replace(MARKER, (_, /** @type {string} */ name) => {
    const rows = Object.hasOwn(inputs, name) ? inputs[name] : undefined;
    if (!rows) throw new Error(`the query reads ${name}, and none was given`);
    return inputCte(name, rows);
  });

  const bytes = new TextEncoder().encode(out).length;
  if (bytes > D1_STATEMENT_LIMIT) {
    throw new Error(`the rendered query is ${bytes} bytes; D1 runs at most ${D1_STATEMENT_LIMIT} in one statement`);
  }
  return out;
}
