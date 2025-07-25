// Add this Error Boundary to your Wix custom code

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    // Dev: console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        React.createElement('div', {
          style: { padding: '20px', textAlign: 'center', color: '#666' }
        }, [
          React.createElement('h3', { key: 'title' }, '3D Model Loading Error'),
          React.createElement('p', { key: 'message' }, 'Unable to load 3D model. Please refresh the page.'),
          React.createElement('button', {
            key: 'retry',
            onClick: () => window.location.reload(),
            style: { 
              padding: '10px 20px', 
              backgroundColor: '#007cba', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }
          }, 'Retry')
        ])
      );
    }

    return this.props.children;
  }
}

// Wrap your 3D model component with this error boundary
export default ErrorBoundary;
