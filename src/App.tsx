/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, lazy, Suspense, useCallback } from 'react';

const APP_LOAD_START = performance.now();
const logAppTiming = (label: string) => {
    const elapsed = (performance.now() - APP_LOAD_START).toFixed(2);
    console.log(`[APP TIMING] ${elapsed}ms - ${label}`);
};

logAppTiming('App.tsx module loaded');

import Loader from './components/Loader';
logAppTiming('Loader imported');

const LandingPage = lazy(() => {
    logAppTiming('LandingPage lazy load started');
    return import('./LandingPage').then(module => {
        logAppTiming('LandingPage lazy load completed');
        return module;
    });
});

const IntermediateApp = lazy(() => {
    logAppTiming('IntermediateApp lazy load started');
    return import('./IntermediateApp').then(module => {
        logAppTiming('IntermediateApp lazy load completed');
        return module;
    });
});

// @ts-ignore
const JuniorApp = lazy(() => {
    logAppTiming('JuniorApp lazy load started');
    return import('./leapignite/client/JuniorApp').then(module => {
        logAppTiming('JuniorApp lazy load completed');
        return module;
    });
});

// @ts-ignore
const PythonApp = lazy(() => {
    logAppTiming('PythonApp lazy load started');
    return import('./python/PythonApp').then(module => {
        logAppTiming('PythonApp lazy load completed');
        return module;
    });
});

// @ts-ignore
const PythonNotebook = lazy(() => {
    logAppTiming('PythonNotebook lazy load started');
    return import('./python/PythonNotebook').then(module => {
        logAppTiming('PythonNotebook lazy load completed');
        return module;
    });
});

// @ts-ignore
const AppInventor = lazy(() => {
    logAppTiming('AppInventor lazy load started');
    return import('./studio').then(module => {
        logAppTiming('AppInventor lazy load completed');
        return module;
    });
});

// @ts-ignore
const ElectraStudio = lazy(() => {
    logAppTiming('ElectraStudio lazy load started');
    return import('./Electra/Client/Src/ElectraStudio').then(module => {
        logAppTiming('ElectraStudio lazy load completed');
        return module;
    });
});

const NeuraApp = lazy(() => {
    logAppTiming('NeuraApp lazy load started');
    return import('./NeuraApp').then(module => {
        logAppTiming('NeuraApp lazy load completed');
        return module;
    });
});

logAppTiming('All lazy components defined');

type AppMode = 'home' | 'intermediate' | 'junior' | 'python' | 'notebook' | 'appinventor' | 'appforge' | 'electra' | 'neura';


class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
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
    logAppTiming('App component function called');
    const [mode, setMode] = useState<AppMode>('home');
    const [juniorKey, setJuniorKey] = useState(0);

    const cleanBlocklyStyles = useCallback(() => {
        document.querySelectorAll('style[data-blockly]').forEach(el => el.remove());
        document.querySelectorAll('style').forEach(el => {
            if (el.textContent?.includes('.blockly')) {
                el.remove();
            }
        });
        document.querySelectorAll('.blocklyToolboxDiv, .blocklyWidgetDiv, .blocklyDropDownDiv, .blocklyContextMenu').forEach(el => {
            el.remove();
        });
    }, []);

    const handleSetMode = useCallback((newMode: AppMode) => {
        cleanBlocklyStyles();
        if (newMode === 'junior') {
            setJuniorKey(k => k + 1);
        }
        setMode(newMode);
    }, [cleanBlocklyStyles]);

    // Log when component mounts
    React.useEffect(() => {
        logAppTiming('App component mounted');
    }, []);

    // Log when mode changes
    React.useEffect(() => {
        logAppTiming(`Mode changed to: ${mode}`);
    }, [mode]);

    // Defer Blockly custom field registration to idle time — doesn't block first paint
    // REMOVED: Only load when user actually navigates to Blockly mode
    // React.useEffect(() => {
    //     const register = () => import('./blockly/registerCustomFields');
    //     if (typeof requestIdleCallback !== 'undefined') {
    //         requestIdleCallback(register, { timeout: 3000 });
    //     } else {
    //         setTimeout(register, 500);
    //     }
    // }, []);

    // REMOVED: Prefetch disabled - modules load only when user navigates to them
    // This prevents loading heavy modules (Electra, Blockly) that user may never use
    // React.useEffect(() => {
    //     const prefetch = () => {
    //         import('./modules/electra/ForgeStudio');
    //         import('./IntermediateApp');
    //     };
    //     if (typeof requestIdleCallback !== 'undefined') {
    //         requestIdleCallback(prefetch, { timeout: 5000 });
    //     } else {
    //         setTimeout(prefetch, 1000);
    //     }
    // }, []);

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
        handleSetMode(switchPrompt.to);
        setSwitchPrompt(null);
    };

    const cancelSwitch = () => setSwitchPrompt(null);

    return (
        <ErrorBoundary key={mode}>
            <Suspense fallback={<Loader />}>
                {mode === 'intermediate' && <IntermediateApp
                    onBack={() => handleSetMode('home')}
                    onOpenPython={() => requestSwitch('intermediate', 'python')}
                    openTab={intermediateOpenTab}
                />}
                {mode === 'junior' && <JuniorApp key={juniorKey} onBack={() => handleSetMode('home')} />}
                {mode === 'python' && <PythonApp
                    onBack={() => handleSetMode('home')}
                    onSwitchToNotebook={() => requestSwitch('python', 'notebook')}
                    onSwitchToBlocks={() => requestSwitch('python', 'intermediate', 'blocks')}
                    onSwitchToCostumes={() => requestSwitch('python', 'intermediate', 'costumes')}
                />}
                {mode === 'notebook' && <PythonNotebook onBack={() => handleSetMode('home')} onSwitchToIDE={() => handleSetMode('python')} />}
                {mode === 'appinventor' && <AppInventor {...({ onBack: () => handleSetMode('home') } as any)} />}
                {mode === 'appforge' && <ElectraStudio {...({ onBack: () => handleSetMode('home') } as any)} />}
                {mode === 'electra' && <ElectraStudio {...({ onBack: () => handleSetMode('home') } as any)} />}
                {mode === 'neura' && <NeuraApp onBack={() => handleSetMode('home')} />}
                {mode === 'home' && <LandingPage onSelect={handleSetMode} />}
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
