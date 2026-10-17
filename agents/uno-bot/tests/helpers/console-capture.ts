// Every console line a test's code logs, log and warn alike, for the tests
// that assert what a run says about itself: why a draft made no offer, or
// what its thinking spent.

/** Install the capture; `restore` puts the console back. */
export function capturedLogs(): { seen: string[]; restore: () => void } {
  const seen: string[] = [];
  const { log, warn } = console;
  console.log = (...args: unknown[]) => void seen.push(args.map(String).join(" "));
  console.warn = (...args: unknown[]) => void seen.push(args.map(String).join(" "));
  return { seen, restore: () => Object.assign(console, { log, warn }) };
}

/**
 * Run `work` with the capture installed, and hand back what it logged.
 *
 * @param work - The code under test
 */
export async function logsOf<T>(work: () => Promise<T>): Promise<{ value: T; lines: string[] }> {
  const capture = capturedLogs();
  try {
    return { value: await work(), lines: capture.seen };
  } finally {
    capture.restore();
  }
}
