import React, { useState, lazy, Suspense } from 'react';
const LandingPage = lazy(() => import('./LandingPage'));

const IntermediateApp = lazy(() => import('./IntermediateApp'));
// @ts-ignore
const JuniorApp = lazy(() => import('./junior/JuniorApp'));
// @ts-ignore
const PythonApp = lazy(() => import('./python/PythonApp'));
// @ts-ignore
const PythonNotebook = lazy(() => import('./python/PythonNotebook'));
// @ts-ignore
const AppInventor = lazy(() => import('./modules/AppInventor'));
// @ts-ignore
const AppForgeStudio = lazy(() => import('./modules/appforge/AppForgeStudio'));

type AppMode = 'home' | 'intermediate' | 'junior' | 'python' | 'notebook' | 'appinventor' | 'appforge';


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

    // Lazy load Blockly custom fields to keep main bundle small
    React.useEffect(() => {
        import('./blockly/registerCustomFields');
    }, []);

    const [intermediateOpenTab, setIntermediateOpenTab] = useState<'blocks' | 'python' | 'costumes' | 'sounds'>('blocks');
    const [switchPrompt, setSwitchPrompt] = useState<null | { from: AppMode; to: AppMode; tab?: 'blocks' | 'python' | 'costumes' | 'sounds' }>(null);

    const requestSwitch = (from: AppMode, to: AppMode, tab?: 'blocks' | 'python' | 'costumes' | 'sounds') => {
        setSwitchPrompt({ from, to, tab });
    };

    const confirmSwitch = () => {
        if (!switchPrompt) return;
        if (switchPrompt.to === 'intermediate' && switchPrompt.tab) {
            setIntermediateOpenTab(switchPrompt.tab);
        }
        setMode(switchPrompt.to);
        setSwitchPrompt(null);
    };

    const cancelSwitch = () => setSwitchPrompt(null);

    return (
        <ErrorBoundary key={mode}>
            <Suspense fallback={<div style={{ padding: 20, color: '#673AB7', fontWeight: 'bold' }}>Loading LeapBlocks...</div>}>
                {mode === 'intermediate' && <IntermediateApp
                    onBack={() => setMode('home')}
                    onOpenPython={() => requestSwitch('intermediate', 'python')}
                    openTab={intermediateOpenTab}
                />}
                {mode === 'junior' && <JuniorApp onBack={() => setMode('home')} />}
                {mode === 'python' && <PythonApp
                    onBack={() => setMode('home')}
                    onSwitchToNotebook={() => requestSwitch('python', 'notebook')}
                    onSwitchToBlocks={() => requestSwitch('python', 'intermediate', 'blocks')}
                    onSwitchToCostumes={() => requestSwitch('python', 'intermediate', 'costumes')}
                />}
                {mode === 'notebook' && <PythonNotebook onBack={() => setMode('home')} onSwitchToIDE={() => setMode('python')} />}
                {mode === 'appinventor' && <AppInventor {...({ onBack: () => setMode('home') } as any)} />}
                {mode === 'appforge' && <AppForgeStudio {...({ onBack: () => setMode('home') } as any)} />}
                {mode === 'home' && <LandingPage onSelect={setMode} />}
            </Suspense>

            {switchPrompt && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 360, borderRadius: 12, background: '#fff', padding: 20, boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}>
                        <h2 style={{ margin: '0 0 10px', fontSize: 18 }}>Switching Coding Environment</h2>
                        <p style={{ margin: '0 0 16px', lineHeight: 1.4 }}>
                            You are switching from <strong>{switchPrompt.from}</strong> into <strong>{switchPrompt.to}</strong>.
                            {switchPrompt.tab ? ` (target tab: ${switchPrompt.tab})` : ''}
                            The existing code in the current editor will stop running.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={cancelSwitch} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={confirmSwitch} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#5A2D82', color: '#fff', cursor: 'pointer' }}>
                                Go Ahead
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
}
