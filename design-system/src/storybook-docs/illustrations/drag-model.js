/**
 * The order rules of the Reorder demos, apart from any drawing. A set of lists
 * is `{ [listId]: [itemId, …] }`; every move returns a new set.
 */

/** Where an item sits: `{ list, index }`, or null when it is in no list. */
export const locate = (lists, id) => {
  for (const [list, ids] of Object.entries(lists)) {
    const index = ids.indexOf(id);
    if (index >= 0) return { list, index };
  }
  return null;
};

/** Takes `id` out of wherever it is and puts it at `index` of `list` (clamped to the list's length). */
export const moveTo = (lists, id, list, index) => {
  const from = locate(lists, id);
  if (!from) return lists;
  const next = Object.fromEntries(Object.entries(lists).map(([key, ids]) => [key, ids.filter((x) => x !== id)]));
  const at = Math.max(0, Math.min(index, next[list].length));
  next[list].splice(at, 0, id);
  return next;
};

/** Dropping onto an item takes that item's place; the rest close up around it. */
export const dropOnto = (lists, id, targetId) => {
  const target = locate(lists, targetId);
  return target && id !== targetId ? moveTo(lists, id, target.list, target.index) : lists;
};

/** Dropping on a list's empty room puts the item last. */
export const dropInto = (lists, id, list) => moveTo(lists, id, list, lists[list].length);

/** One step for the keyboard: up/down inside the list, or across to the next list at the same index. */
export const step = (lists, id, direction) => {
  const at = locate(lists, id);
  if (!at) return lists;
  const keys = Object.keys(lists);
  if (direction === 'up' || direction === 'down') return moveTo(lists, id, at.list, at.index + (direction === 'up' ? -1 : 1));
  const across = keys[keys.indexOf(at.list) + (direction === 'left' ? -1 : 1)];
  return across ? moveTo(lists, id, across, at.index) : lists;
};

export const orderKey = (ids) => ids.join(',');
