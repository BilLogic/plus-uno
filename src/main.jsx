import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/main.scss';
import '../playground/home-redesign/src/styles/plus-tokens.scss';
import '../playground/research-assistant-chat/src/styles/plus-tokens.scss';
import '../playground/research-assistant-chat/src/index.css';
import App from './App';
import './index.css';

let rootEl = document.getElementById('root');
if (!rootEl) {
  rootEl = document.createElement('div');
  rootEl.id = 'root';
  document.body.appendChild(rootEl);
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
