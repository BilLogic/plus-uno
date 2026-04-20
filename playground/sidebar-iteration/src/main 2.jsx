import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// import '@/tokens/index.scss' // Removed as it does not exist
// Need to clearer on global styles. Usually main.scss or similar.
// Let's import the specific tokens file or checking how existing prototypes do it.
// references/iteration.md says: import '@tutors.plus/design-system/styles' or custom.
// Since we are aliasing @ to src, we might need to import specific scss.
// Let's try importing index.scss from design system if it exists, or just minimal setup.
// For now I'll skip global SCSS in main.jsx and rely on component imports or add it if needed.
// Actually, SidebarIteration needs variables.
// Use: import '@/styles/main.scss' if it exists.
// Let's check available styles.

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
