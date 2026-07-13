export * from './StaticBadgeSmart';
export { default } from './StaticBadgeSmart';

// Legacy helper for specs that expect a DOM factory.
export function createStaticBadgeSmart({ label = '', variant = 'primary' } = {}) {
  const badge = document.createElement('span');
  badge.className = `badge bg-${variant}`;
  badge.textContent = label;
  return badge;
}
