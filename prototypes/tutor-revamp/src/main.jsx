import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'react-bootstrap';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/main.scss';
import { OpenTabsProvider } from '@/patterns';
import App from './App';
import { createAppTabsStore } from './shell';
import './index.css';

// `?mode=dark` or `?mode=light` pins the color mode; without it the app follows the OS.
// The tokens key off data-color-mode; Bootstrap keys off data-bs-theme, which has no auto.
const asked = new URLSearchParams(window.location.search).get('mode');
const mode = ['light', 'dark'].includes(asked) ? asked : 'auto';
const osDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-color-mode', mode);
document.documentElement.setAttribute('data-bs-theme', mode === 'auto' ? (osDark ? 'dark' : 'light') : mode);

const store = createAppTabsStore();

const rootEl = document.getElementById('root');
if (!rootEl) {
    document.body.innerHTML = '<div style="padding:20px;color:red;font-family:sans-serif;">Error: #root not found</div>';
} else {
    ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
            <ThemeProvider>
                <OpenTabsProvider store={store}>
                    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
                        <App />
                    </BrowserRouter>
                </OpenTabsProvider>
            </ThemeProvider>
        </React.StrictMode>
    );
}
