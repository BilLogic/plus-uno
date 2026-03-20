import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/main.scss';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
    document.body.innerHTML = '<div style="padding:20px;color:#c00;font-family:sans-serif;">Error: root element not found.</div>';
} else {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
