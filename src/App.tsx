import React, { useState } from 'react';
import LandingPage from './LandingPage';
import IntermediateApp from './IntermediateApp';
// @ts-ignore
import JuniorApp from './junior/JuniorApp';
// @ts-ignore
import PythonApp from './python/PythonApp';

type AppMode = 'home' | 'intermediate' | 'junior' | 'python';


class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, background: '#fff', color: '#f44336', fontFamily: 'monospace' }}>
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error?.toString()}</pre>
                    <button onClick={() => window.location.reload()}>Reload</button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    const [mode, setMode] = useState<AppMode>('home');

    return (
        <ErrorBoundary>
            {mode === 'intermediate' && <IntermediateApp onBack={() => setMode('home')} />}
            {mode === 'junior' && <JuniorApp onBack={() => setMode('home')} />}
            {mode === 'python' && <PythonApp onBack={() => setMode('home')} />}
            {mode === 'home' && <LandingPage onSelect={setMode} />}
        </ErrorBoundary>
    );
}
