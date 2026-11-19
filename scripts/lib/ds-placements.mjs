/** Slot acceptance becomes checker rows; ordering remains hand-authored. */
// A slot recorded under a template's old pattern name is also a slot of the template's name.
const TEMPLATE_NAME = { PatternSection: 'Section', PatternCard: 'Card', PatternTable: 'Table' };
const withTemplateNames = (names) => [...new Set(names.flatMap((n) => {
  const [head, ...rest] = n.split('.');
  return TEMPLATE_NAME[head] ? [n, [TEMPLATE_NAME[head], ...rest].join('.')] : [n];
}))];

export function placementsFromSlots({ slots = [] }) {
  return slots.map(({ owner, prop, containers = [], accepts, rejects, ...row }) => ({
    ...row,
    in: withTemplateNames([`${owner}.${prop}`, ...containers]),
    components: rejects,
    use: accepts,
  }));
}
