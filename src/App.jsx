import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import Button from '@/components/Button';
import HomeRedesignApp from '../playground/home-redesign/src/App';
import SidebarIterationApp from '../playground/sidebar-iteration/src/App';
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
        onClick={() => { window.location.href = '/'; }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BackToMarket />
      <Routes>
        {/* Marketplace is the landing page */}
        <Route path="/" element={<PrototypeMarket />} />
        <Route path="/market" element={<PrototypeMarket />} />
        <Route path="/prototypes" element={<PrototypeMarket />} />

        {/* Storybook redirect — runs on port 6006 */}
        <Route path="/storybook" element={
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h2>Storybook</h2>
            <p>Storybook runs as a separate server on port 6006.</p>
            <p>Run <code>npm run storybook</code> then visit <a href="http://localhost:6006">localhost:6006</a></p>
          </div>
        } />

        {/* Embedded prototypes */}
        <Route path="/sidebar-iteration/*" element={<SidebarIterationApp />} />
        <Route path="/home/*" element={<HomeRedesignApp />} />
        <Route path="/*" element={<PrototypeMarket />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
