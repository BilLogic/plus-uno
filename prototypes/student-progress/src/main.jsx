import React from 'react';
import ReactDOM from 'react-dom/client';
// Bootstrap base CSS first (react-bootstrap layout/overlay primitives inside the
// DS shell depend on it); the DS stylesheet loads after so its tokens win.
// Matches prototypes/starter.
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import '@/styles/main.scss';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 'var(--size-element-pad-x-lg)' }}>
                    <h2 style={{ color: 'var(--color-danger)' }}>Something went wrong</h2>
                    <pre
                        style={{
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'var(--color-danger-container)',
                            padding: 'var(--size-element-pad-md)',
                            borderRadius: 'var(--size-corner-radius-component-sm, 8px)',
                        }}
                    >
                        {this.state.error?.message}
                        {'\n\n'}
                        {this.state.error?.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

let rootElement = document.getElementById('root');
if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
}

// Reuse the root across Vite HMR updates — calling createRoot twice on the same
// container throws a React warning otherwise.
const root = rootElement._reactRoot ?? (rootElement._reactRoot = ReactDOM.createRoot(rootElement));

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
