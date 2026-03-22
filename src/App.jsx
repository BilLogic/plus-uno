import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import Button from '@/components/Button';
import HomeRedesignApp from '../playground/home-redesign/src/App';
import SidebarIterationApp from '../playground/sidebar-iteration/src/App';
import { PrototypeMarket } from './pages/PrototypeMarket';
import './App.scss';

function BackToMarket() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/market' || pathname === '/prototypes') return null;
  return (
    <div className="back-to-market">
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

function StorybookInfo() {
  return (
    <div className="storybook-info">
      <h2>Storybook</h2>
      <p className="body1-txt">Storybook runs as a separate server on port 6006.</p>
      <p className="body2-txt">
        Run <code>npm run storybook</code> then visit{' '}
        <a href="http://localhost:6006">localhost:6006</a>
      </p>
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

        {/* Storybook info */}
        <Route path="/storybook" element={<StorybookInfo />} />

        {/* Embedded prototypes — all sub-routes of home-redesign shell */}
        <Route path="/home/*" element={<HomeRedesignApp />} />
        <Route path="/sidebar-iteration/*" element={<SidebarIterationApp />} />

        {/* Catch-all → marketplace */}
        <Route path="/*" element={<PrototypeMarket />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
