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
                <div className="flex flex-col items-center justify-center min-h-full py-10 px-5 font-sans" style={{ background: 'var(--ml-bg)', color: 'var(--ml-text-primary)' }}>
                    <div className="rounded-2xl py-10 px-8 max-w-[480px] w-full text-center" style={{ background: 'var(--ml-surface)', border: '1px solid var(--ml-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <h2 className="m-0 mb-2 text-xl font-semibold">
                            Something went wrong
                        </h2>
                        <p className="m-0 mb-6 text-sm leading-relaxed" style={{ color: 'var(--ml-text-secondary)' }}>
                            The classifier encountered an unexpected error. Your collected samples are still saved.
                        </p>
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-[13px] mb-2" style={{ color: 'var(--ml-text-muted)' }}>
                                    Error details
                                </summary>
                                <pre className="rounded-lg p-3 text-xs overflow-auto m-0 font-mono" style={{ background: 'var(--ml-well)', border: '1px solid var(--ml-border)', color: 'var(--ml-error-text)' }}>
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2.5 rounded-[10px] text-sm font-medium cursor-pointer"
                                style={{ border: '1px solid var(--ml-border)', background: 'var(--ml-surface)', color: 'var(--ml-text-primary)' }}
                            >
                                Try Again
                            </button>
                            {this.props.onBackToDashboard && (
                                <button
                                    onClick={this.props.onBackToDashboard}
                                    className="px-6 py-2.5 rounded-[10px] border-none text-white text-sm font-medium cursor-pointer"
                                    style={{ background: 'var(--ml-accent)' }}
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
