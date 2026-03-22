/**
 * Session Prep Card prototype.
 * Single screen tutors see before a session: last session summary, student goal, quick prompts, Start session CTA.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/main.scss';
import SessionPrepCardPage from './SessionPrepCardPage';

let rootElement = document.getElementById('root');
if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <SessionPrepCardPage />
    </React.StrictMode>
);
