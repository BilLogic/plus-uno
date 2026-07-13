export * from './Modal';
export { default } from './Modal';

// Legacy helper for specs that expect a DOM factory.
export function createModal({ title = 'Modal', body = '' } = {}) {
  const container = document.createElement('div');
  container.className = 'modal';
  const header = document.createElement('h4');
  header.textContent = title;
  const content = document.createElement('div');
  content.textContent = body;
  container.appendChild(header);
  container.appendChild(content);
  return container;
}
