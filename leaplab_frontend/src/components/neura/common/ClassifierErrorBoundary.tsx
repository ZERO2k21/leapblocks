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
                <div className="flex flex-col items-center justify-center min-h-full py-10 px-5 bg-ml-bg text-ml-text-primary font-sans">
                    <div className="bg-ml-surface border border-ml-border rounded-2xl py-10 px-8 max-w-[480px] w-full text-center shadow-ml-card">
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
                        <p className="m-0 mb-6 text-sm text-ml-text-secondary leading-relaxed">
                            The classifier encountered an unexpected error. Your collected samples are still saved.
                        </p>
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-[13px] text-ml-text-muted mb-2">
                                    Error details
                                </summary>
                                <pre className="bg-ml-well border border-ml-border rounded-lg p-3 text-xs text-ml-error-text overflow-auto m-0 font-mono">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2.5 rounded-[10px] border border-ml-border bg-ml-surface text-ml-text-primary text-sm font-medium cursor-pointer"
                            >
                                Try Again
                            </button>
                            {this.props.onBackToDashboard && (
                                <button
                                    onClick={this.props.onBackToDashboard}
                                    className="px-6 py-2.5 rounded-[10px] border-none bg-ml-accent text-white text-sm font-medium cursor-pointer"
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
