import React from 'react';
import ReactDOM from 'react-dom/client';
import SessionsPage from './SessionsPage';
import '@/styles/main.scss'; // Import global styles

// Create a root element if it doesn't exist
let rootElement = document.getElementById('root');
if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <SessionsPage />
    </React.StrictMode>
);
