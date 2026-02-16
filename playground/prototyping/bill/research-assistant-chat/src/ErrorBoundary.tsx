import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches React errors and displays them on screen for debugging. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'monospace',
            fontSize: 14,
            color: '#c00',
            background: '#fff5f5',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '100vh',
          }}
        >
          <strong>Error:</strong> {this.state.error.message}
          {'\n\n'}
          <strong>Stack:</strong>
          {'\n'}
          {this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}
