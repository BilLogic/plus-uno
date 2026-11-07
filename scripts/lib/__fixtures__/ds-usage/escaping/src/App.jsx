// A prototype that escapes the design system once per fail-level rule.
import { Buton } from '@/components';
import StatusTag from '@/components/labels/StatusTag';
import { Button } from '@/components';

export default function App() {
  return (
    <div style={{ padding: '12px' }}>
      <Button variant="primary" />
      <i className="fa-light fa-house" />
      <span style={{ color: 'var(--palette-neutral-1000)' }} />
      <span style={{ color: 'var(--ds-txt)' }} />
    </div>
  );
}
