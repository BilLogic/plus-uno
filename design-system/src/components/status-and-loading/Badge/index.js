export * from './Badge';
export { default } from './Badge';

// Legacy helper for specs that expect a DOM factory.
export function createBadge({ text = '', variant = 'primary' } = {}) {
  const badge = document.createElement('span');
  badge.className = `badge bg-${variant}`;
  badge.textContent = text;
  return badge;
}
