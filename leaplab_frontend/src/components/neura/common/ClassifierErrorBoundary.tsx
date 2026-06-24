import React from 'react'

interface Props {
    children: React.ReactNode
    onReset?: () => void
    onBackToDashboard?: () => void
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ClassifierErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[Neura] Classifier error:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
        this.props.onReset?.()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100%',
                    padding: '40px 20px',
                    background: 'var(--ml-bg)',
                    color: 'var(--ml-text-primary)',
                    fontFamily: "'DM Sans', sans-serif",
                }}>
                    <div style={{
                        background: 'var(--ml-surface)',
                        border: '1px solid var(--ml-border)',
                        borderRadius: 16,
                        padding: '40px 32px',
                        maxWidth: 480,
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: 'var(--ml-card-shadow)',
                    }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
                            Something went wrong
                        </h2>
                        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ml-text-secondary)', lineHeight: 1.5 }}>
                            The classifier encountered an unexpected error. Your collected samples are still saved.
                        </p>
                        {this.state.error && (
                            <details style={{
                                marginBottom: 24,
                                textAlign: 'left',
                            }}>
                                <summary style={{
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    color: 'var(--ml-text-muted)',
                                    marginBottom: 8,
                                }}>
                                    Error details
                                </summary>
                                <pre style={{
                                    background: 'var(--ml-well)',
                                    border: '1px solid var(--ml-border)',
                                    borderRadius: 8,
                                    padding: 12,
                                    fontSize: 12,
                                    color: 'var(--ml-error-text)',
                                    overflow: 'auto',
                                    margin: 0,
                                    fontFamily: "'DM Mono', monospace",
                                }}>
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: 10,
                                    border: '1px solid var(--ml-border)',
                                    background: 'var(--ml-surface)',
                                    color: 'var(--ml-text-primary)',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Try Again
                            </button>
                            {this.props.onBackToDashboard && (
                                <button
                                    onClick={this.props.onBackToDashboard}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: 'var(--ml-accent)',
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Back to Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
