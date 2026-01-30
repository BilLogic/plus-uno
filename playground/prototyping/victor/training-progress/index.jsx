/**
 * Training Progress prototype — replicates Figma node 367-146235.
 * Training Progress tab with overview cards and details table; clicking a tutor row opens lesson-details modal.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import TrainingProgressPage from './TrainingProgressPage';
import '@/styles/main.scss';

let rootElement = document.getElementById('root');
if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <TrainingProgressPage />
    </React.StrictMode>
);
