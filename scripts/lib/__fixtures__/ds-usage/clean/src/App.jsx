// A prototype that stays inside the design system.
import { Button, SectionMessage } from '@/components';
import './App.scss';

export default function App() {
  return (
    <div className="app" style={{ padding: 'var(--pad-x-md)' }}>
      <SectionMessage appearance="info" />
      <Button appearance="primary" spacing="compact" onClick={() => {}}>Go</Button>
      <i className="fa-regular fa-bell" />
    </div>
  );
}
