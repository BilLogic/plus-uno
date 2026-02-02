import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'react-bootstrap';
import { ErrorBoundary } from './ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@plus-ds/styles/main.scss';
import App from './App';
import './styles/plus-tokens.scss';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:20px;color:red;font-family:sans-serif;">Error: #root not found</div>';
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ThemeProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ThemeProvider>
      </StrictMode>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : '';
    rootEl.innerHTML = `<div style="padding:20px;color:#c00;font-family:monospace;white-space:pre-wrap;background:#fff5f5;">Startup error: ${msg}\n\n${stack}</div>`;
    console.error(err);
  }
}
