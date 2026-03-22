import React from 'react'
import ReactDOM from 'react-dom/client'
// Import CSS fundamentals BEFORE components so PLUS Design System overrides Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import '@plus-ds/styles/main.scss'

import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
