import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#000', color: '#fff', fontFamily: 'monospace', padding: 24
        }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16 }}>ERROR</h1>
          <p style={{ fontSize: 13, color: '#666', maxWidth: 480, textAlign: 'center' }}>
            {this.state.message || 'Something went wrong. Please refresh.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 32, padding: '12px 24px', background: '#fff', color: '#000',
              border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em'
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
