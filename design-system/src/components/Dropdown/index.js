export * from './Dropdown';
export { default } from './Dropdown';

// Legacy helper for specs that expect a DOM factory.
export function createDropdown({ label = 'Dropdown', options = [] } = {}) {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const select = document.createElement('select');
  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt?.value ?? opt;
    option.textContent = opt?.label ?? opt;
    select.appendChild(option);
  });
  wrapper.appendChild(select);
  return wrapper;
}
