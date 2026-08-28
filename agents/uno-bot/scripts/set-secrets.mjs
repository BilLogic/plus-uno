#!/usr/bin/env node
// Type each secret once, into your own terminal, and it goes straight to
// Cloudflare. Built for #288: the account move means re-entering every secret
// on the new account, and the alternative is fifteen dashboard forms.
//
// What this deliberately does NOT do:
//
//   • echo what you type (the terminal's echo is off for the duration)
//   • write any value to disk, to a log line, or to an argv entry — argv is
//     visible to `ps` for every user on the machine and lands in shell history,
//     so the value is handed to wrangler on stdin
//   • read anything back. Cloudflare stores secrets write-only; nothing here
//     could show you an existing value even if it wanted to.
//
// Usage:
//   npm run secrets:set              the required ones that are not set yet
//   npm run secrets:set -- --all     every declared secret, including optional
//   npm run secrets:set -- --only NOTION_API_KEY,DEBUG_TOKEN
//
// Multi-line secrets (the Vertex PEM) are not prompted for. A no-echo prompt
// cannot honestly take a pasted key block, so the command to pipe it from a
// file you already have is printed instead.
import { SECRETS, classify } from "./secrets.mjs";
import { feedKeys, parseOnly } from "./secret-prompt.mjs";
import { liveSecretNames, nodeTooOld, putSecret } from "./wrangler-secrets.mjs";

const args = process.argv.slice(2);
const all = args.includes("--all");
let only = null;
try {
  const names = parseOnly(args);
  only = names && new Set(names);
} catch (err) {
  console.error(String(err.message ?? err));
  process.exit(1);
}

// Before anything asks for typing. Finding out at the end that wrangler cannot
// run is the failure this ordering exists to prevent.
const tooOld = nodeTooOld();
if (tooOld) {
  console.error(tooOld);
  process.exit(1);
}

if (only) {
  const unknown = [...only].filter((n) => !SECRETS.some((s) => s.name === n));
  if (unknown.length) {
    console.error(`not declared in scripts/secrets.mjs: ${unknown.join(", ")}`);
    process.exit(1);
  }
}

if (!process.stdin.isTTY) {
  // A pipe would work, silently, and put whatever was upstream into a secret.
  console.error(
    "secrets:set needs an interactive terminal — it reads with echo off.\n" +
      "  -> To script one: wrangler secret put NAME < file",
  );
  process.exit(1);
}

console.log("Reading what is already set…");
let live;
try {
  live = liveSecretNames();
} catch (err) {
  console.error(String(err.message ?? err));
  process.exit(1);
}
const { missing, present, forbidden } = classify(live);

if (forbidden.length) {
  console.error(`\n⚠ set on this Worker and must not be: ${forbidden.join(", ")}`);
  console.error("  -> wrangler secret delete <name>. See the reason in scripts/secrets.mjs.\n");
}

if (only) {
  // Asked for by name and refused. Reporting "nothing to do" would answer a
  // question nobody asked and leave the reason — ADR-018 — undiscovered.
  const refused = SECRETS.filter((s) => s.forbidden && only.has(s.name));
  for (const s of refused) {
    console.error(`\n${s.name} is declared MUST-NOT-BE-SET, so this will not set it.`);
    console.error(`  ${s.why}`);
  }
  if (refused.length === only.size) process.exit(1);
}

const queue = SECRETS.filter((s) => {
  if (s.forbidden) return false; // never offered, whatever the flags say
  if (only) return only.has(s.name);
  if (all) return true;
  return missing.includes(s.name);
});

if (!queue.length) {
  console.log(
    `\nNothing to do. ${present.length} secret(s) set; every required one is present.\n` +
      "  --all re-enters them anyway; --only NAME does one.",
  );
  process.exit(0);
}

console.log(
  `\n${queue.length} to set. Nothing you type is shown, stored, or logged.\n` +
    "Enter alone skips one. Ctrl-C stops.\n",
);

let set = 0;
let skipped = 0;
for (const s of queue) {
  const state = live.includes(s.name) ? " (already set — this REPLACES it)" : "";
  console.log(`\n${s.name}${s.required ? "" : "  [optional]"}${state}`);
  console.log(`  ${s.why}`);

  if (s.multiline) {
    console.log("  This one spans lines. A prompt that cannot echo would mangle it, so:");
    console.log(`    npx wrangler secret put ${s.name} < /path/to/key.pem`);
    skipped += 1;
    continue;
  }

  const { value, extra } = await prompt("  value: ");
  if (extra) {
    // A line break INSIDE the paste. What was captured is a fragment, and
    // writing it would look like success — Cloudflare never reads a value back,
    // so the only symptom would be the Worker failing against that service.
    console.error(
      `  NOT SET: what you pasted has a line break in it, so only the first ${value.length} ` +
        "chars arrived.\n" +
        `  -> npx wrangler secret put ${s.name} < /path/to/file`,
    );
    process.exitCode = 1;
    skipped += 1;
    continue;
  }
  if (!value) {
    console.log("  skipped.");
    skipped += 1;
    continue;
  }
  try {
    putSecret(s.name, value);
    // The length, not the value. It catches the common paste failures — an
    // empty clipboard, half a token — without putting the secret on screen.
    console.log(`  set (${value.length} chars).`);
    set += 1;
  } catch (err) {
    console.error(`  FAILED: ${String(err.message ?? err)}`);
    process.exitCode = 1;
  }
}

console.log(`\n${set} set, ${skipped} skipped.`);
if (set) console.log("Secrets take effect on the next deploy of the Worker.");
console.log("Check the whole picture with: npm run secrets:audit");

/**
 * Read one line with the terminal's echo turned off.
 *
 * Raw mode rather than a muted stream, so backspace and Ctrl-C behave. The
 * value is never written anywhere but the returned string.
 *
 * @param {string} label
 * @returns {Promise<string>}
 */
function prompt(label) {
  return new Promise((resolve) => {
    process.stdout.write(label);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let buf = "";
    const restore = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      const next = feedKeys(buf, chunk);
      buf = next.buf;
      if (!next.done) return;
      restore();
      if (next.cancelled) {
        // Restored FIRST. Exiting from raw mode with echo off leaves the shell
        // unusable, and whoever hit Ctrl-C here is mid-way through credentials.
        process.exit(130);
      }
      resolve({ value: buf.trim(), extra: next.extra });
    };
    stdin.on("data", onData);
  });
}
