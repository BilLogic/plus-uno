// The decisions inside the no-echo prompt, separated from the terminal.
//
// A prompt that cannot show what it received has to be right about what it
// received, and it cannot be exercised by hand: nothing is on screen to check
// against. So the keystroke handling is a pure reducer, tested next door, and
// set-secrets.mjs is left holding only raw mode and the listener.

const CTRL_C = "\u0003";
const DEL = "\u007f";
const ESC = "\u001b";

/**
 * How many characters after the ESC belong to the escape sequence.
 *
 * CSI is `ESC [` then parameter bytes then a final byte in @–~. Anything else
 * after ESC is treated as a single-character sequence, which is the safe
 * reading: one extra dropped character beats one embedded in a secret.
 */
function csiLength(chunk, escIndex) {
  if (chunk[escIndex + 1] !== "[") return 1;
  let i = escIndex + 2;
  while (i < chunk.length && !(chunk[i] >= "@" && chunk[i] <= "~")) i++;
  return i - escIndex;
}

/**
 * Fold one chunk of raw-mode input into the value being typed.
 *
 * @param {string} buf what has been typed so far
 * @param {string} chunk what the terminal just delivered
 * @returns {{buf: string, done: boolean, extra: string, cancelled: boolean}}
 *   `extra` is whatever followed the newline. It is normally empty; when it is
 *   not, the person pasted something with a line break INSIDE it and the value
 *   just taken is a fragment. That has to be said out loud — writing half a
 *   credential and printing "set" is unrecoverable in the sense that matters,
 *   because Cloudflare will not read the value back to show anyone the truth.
 */
export function feedKeys(buf, chunk) {
  for (let i = 0; i < chunk.length; i++) {
    const ch = chunk[i];

    if (ch === "\r" || ch === "\n") {
      let rest = chunk.slice(i + 1);
      // CRLF is one Enter. Reading the \n as leftover would make every entry on
      // a terminal that sends CRLF claim it had been truncated — an alarm that
      // is always wrong is an alarm nobody reads.
      if (ch === "\r" && rest.startsWith("\n")) rest = rest.slice(1);
      return { buf, done: true, extra: rest, cancelled: false };
    }

    if (ch === CTRL_C) return { buf, done: true, extra: "", cancelled: true };

    if (ch === DEL || ch === "\b") {
      buf = buf.slice(0, -1);
      continue;
    }

    if (ch === ESC) {
      // An arrow key is ESC [ D — three characters, two of them printable. It
      // is NOT enough to drop the ESC: that leaves "[D" sitting in the middle
      // of a token, invisible at a prompt with no echo, in a value Cloudflare
      // will never read back. Consume the whole CSI sequence.
      i += csiLength(chunk, i);
      continue;
    }

    // Everything else below space is a control character with no business in a
    // credential.
    if (ch >= " ") buf += ch;
  }
  return { buf, done: false, extra: "", cancelled: false };
}

/**
 * The `--only` list, or null when the flag was not passed.
 *
 * Throws on a flag with no value. Treating that as "not passed" is the quiet
 * failure: the caller falls through to its default and starts asking for every
 * unset required secret, at a prompt that shows nothing, to someone who meant
 * to replace exactly one.
 *
 * @param {string[]} args
 * @returns {string[]|null}
 */
export function parseOnly(args) {
  const inline = args.find((a) => a.startsWith("--only="));
  const flag = args.indexOf("--only");
  if (!inline && flag === -1) return null;

  const raw = inline ? inline.slice("--only=".length) : args[flag + 1];
  const names = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // A following flag is not a value. `--only --all` means the name was lost.
  if (!names.length || names.some((n) => n.startsWith("-"))) {
    throw new Error("--only needs a comma-separated list of secret names, e.g. --only DEBUG_TOKEN");
  }
  return names;
}
