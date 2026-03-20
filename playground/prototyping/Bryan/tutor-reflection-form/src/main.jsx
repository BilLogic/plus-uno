import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/main.scss';
import App from './App';
import './App.scss';

const rootEl = document.getElementById('root');
if (!rootEl) {
    document.body.innerHTML =
        '<div style="padding:20px;color:red;font-family:sans-serif;">Error: #root not found</div>';
} else {
    ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
