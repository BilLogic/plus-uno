import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button.jsx';
import Flag from '@/components/messaging/Flag/Flag.jsx';

export default function App() {
  return <main style={{ padding: '24px', background: '#ffffff', borderRadius: '10px' }}>
    <h1>Queue</h1>
    <Button><i className="fa-duotone fa-check" /> Resolve</Button>
    <Flag bold dismissible>Review saved</Flag>
  </main>;
}
