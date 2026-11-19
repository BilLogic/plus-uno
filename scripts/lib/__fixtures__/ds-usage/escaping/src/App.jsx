// A prototype that escapes the design system once per fail-level rule.
import { Buton } from '@/components';
import StatusTag from '@/components/labels/StatusTag';
import { Button, Select } from '@/components';
import { Section } from '@/templates';

export default function App() {
  return (
    <div style={{ padding: '12px' }}>
      <Button variant="primary" />
      <i className="fa-light fa-house" />
      <span style={{ color: 'var(--palette-neutral-1000)' }} />
      <span style={{ color: 'var(--ds-txt)' }} />
      <Section title="Queue" filters={[{ text: 'All', menu: () => <Select options={[]} /> }]} />
      <button type="button">Raw</button>
    </div>
  );
}
