import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@/styles/bootstrap-layer.css';
import '@/styles/main.scss';
import App from './App';
import './styles/plus-tokens.scss';

/**
 * Standalone entry for local `npm run dev:live-app`.
 * Production mounts the same App via the root SPA at `/home` and `/app`.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
