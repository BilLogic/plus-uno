// The Roadmap cards a Figma file belongs to, read off its title (#900).
//
// How We Fig titles a card's file `<Project> / Card <n> & <m> / <designers>`
// (`docs/connectors/figma.md` § File titles): `Card <n>` is the card's number,
// a file for several cards joins them with `&`, and a number matches only
// whole. Files from before the convention carry the variants it corrects — a
// bare `2204 & 2251` segment, or `Card #733` — and still name their cards, so
// both are read. The `Card #` placeholder names none. A library, template or
// reference kit keeps a plain name and has no card.
//
// PURE.

/** A title segment that is nothing but card numbers, `Card`-led or bare. */
const CARD_SEGMENT = /^(?:cards?\s*)?#?\s*\d+(?:\s*&\s*#?\s*\d+)*$/i;

/**
 * The card numbers a file's title names, in order, each once.
 *
 * @param title - The file's name, as Figma has it
 */
export function cardNumbersOf(title: string): number[] {
  const numbers: number[] = [];
  for (const raw of title.split("/")) {
    const segment = raw.trim();
    if (!CARD_SEGMENT.test(segment)) continue;
    // A bare number is only a card when the title is in the convention's
    // shape, with something before it: a file titled "2024" is not a card.
    if (!/^cards?\b/i.test(segment) && !title.includes("/")) continue;
    for (const m of segment.matchAll(/\d+/g)) {
      const n = Number(m[0]);
      if (n > 0 && !numbers.includes(n)) numbers.push(n);
    }
  }
  return numbers;
}
