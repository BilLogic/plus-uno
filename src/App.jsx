import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import Button from '@/components/Button';
import HomeRedesignApp from '../playground/prototyping/bill/home-redesign/src/App';
import { PrototypeMarket } from './pages/PrototypeMarket';

function BackToMarket() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/market' || pathname === '/prototypes') return null;
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <Button
        text="Market"
        style="primary"
        fill="filled"
        size="small"
        leadingVisual="arrow-left"
        onClick={() => { window.location.href = '/market'; }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BackToMarket />
      <Routes>
        <Route path="/" element={<PrototypeMarket />} />
        <Route path="/prototypes" element={<PrototypeMarket />} />
        <Route path="/market" element={<PrototypeMarket />} />
        <Route path="/*" element={<HomeRedesignApp />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
