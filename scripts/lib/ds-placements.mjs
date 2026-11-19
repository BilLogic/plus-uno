/** Slot acceptance becomes checker rows; ordering remains hand-authored. */
export function placementsFromSlots({ slots = [] }) {
  return slots.map(({ owner, prop, containers = [], accepts, rejects, ...row }) => ({
    ...row,
    in: [`${owner}.${prop}`, ...containers],
    components: rejects,
    use: accepts,
  }));
}
