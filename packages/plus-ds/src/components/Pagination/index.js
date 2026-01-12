export * from './Pagination';
export { default } from './Pagination';

// Legacy helper for specs that expect a DOM factory.
export function createPagination({ pages = 1, current = 1 } = {}) {
  const nav = document.createElement('nav');
  for (let i = 1; i <= pages; i += 1) {
    const btn = document.createElement('button');
    btn.textContent = `${i}`;
    btn.disabled = i === current;
    nav.appendChild(btn);
  }
  return nav;
}
