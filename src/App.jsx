import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import NavFab from './components/NavFab/NavFab';
import HomeRedesignApp from '../playground/home-redesign/src/App';
import SidebarIterationApp from '../playground/sidebar-iteration/src/App';
import { PrototypeMarket } from './pages/PrototypeMarket';
import './App.scss';

function App() {
  return (
    <ThemeProvider>
      <NavFab />
      <Routes>
        {/* Marketplace is the landing page */}
        <Route path="/" element={<PrototypeMarket />} />
        <Route path="/market" element={<PrototypeMarket />} />
        <Route path="/prototypes" element={<PrototypeMarket />} />

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
