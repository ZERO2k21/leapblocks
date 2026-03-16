import React, { useState, lazy, Suspense } from 'react';
import LandingPage from './LandingPage';
import './blockly/registerCustomFields';

const IntermediateApp = lazy(() => import('./IntermediateApp'));
// @ts-ignore
const JuniorApp = lazy(() => import('./junior/JuniorApp'));
// @ts-ignore
const PythonApp = lazy(() => import('./python/PythonApp'));
// @ts-ignore
const PythonNotebook = lazy(() => import('./python/PythonNotebook'));

type AppMode = 'home' | 'intermediate' | 'junior' | 'python' | 'notebook';


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
        <ErrorBoundary key={mode}>
            <Suspense fallback={<div style={{ padding: 20, color: '#673AB7', fontWeight: 'bold' }}>Loading LeapBlocks...</div>}>
                {mode === 'intermediate' && <IntermediateApp onBack={() => setMode('home')} onOpenPython={() => setMode('python')} />}
                {mode === 'junior' && <JuniorApp onBack={() => setMode('home')} />}
                {mode === 'python' && <PythonApp onBack={() => setMode('home')} onSwitchToNotebook={() => setMode('notebook')} />}
                {mode === 'notebook' && <PythonNotebook onBack={() => setMode('home')} onSwitchToIDE={() => setMode('python')} />}
                {mode === 'home' && <LandingPage onSelect={setMode} />}
            </Suspense>
        </ErrorBoundary>
    );
}
