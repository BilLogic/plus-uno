export * from './Button';
export { default } from './Button';

// Legacy helper for specs that expect a DOM factory.
export function createButton({ text = 'Button', variant = 'primary', onClick } = {}) {
  const btn = document.createElement('button');
  btn.className = `btn btn-${variant}`;
  btn.textContent = text;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
