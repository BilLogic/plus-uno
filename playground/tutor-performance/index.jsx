import React from 'react';
import ReactDOM from 'react-dom/client';
import TutorPerformancePage from './TutorPerformancePage';
import '@/styles/main.scss';

let rootElement = document.getElementById('root');
if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <TutorPerformancePage />
    </React.StrictMode>
);
