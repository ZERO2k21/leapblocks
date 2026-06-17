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
    if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
        (window as any).define = undefined;
    }
    return import('./IntermediateApp').then(module => {
        logAppTiming('IntermediateApp lazy load completed');
        return module;
    });
});

// @ts-ignore
const JuniorApp = lazy(() => {
    logAppTiming('JuniorApp lazy load started');
    if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
        (window as any).define = undefined;
    }
    return import('./leapignite/client/JuniorApp').then(module => {
        logAppTiming('JuniorApp lazy load completed');
        return module;
    });
});

// @ts-ignore
const PythonApp = lazy(() => {
    logAppTiming('PythonApp lazy load started');
    return import('./leaplogix/client/LogixApp').then(module => {
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
    if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
        (window as any).define = undefined;
    }
    return import('./creova').then(module => {
        logAppTiming('AppInventor lazy load completed');
        return module;
    });
});

// @ts-ignore
const ElectraWorkspace = lazy(() => {
    logAppTiming('ElectraWorkspace lazy load started');
    return import('./Electra/Client/Src/ElectraWorkspace').then(module => {
        logAppTiming('ElectraWorkspace lazy load completed');
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

type AppMode = 'home' | 'intermediate' | 'junior' | 'python' | 'notebook' | 'creova' | 'appforge' | 'electra' | 'neura';


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

    // Check for ?project=<url> query param — auto-open in correct mode
    const params = new URLSearchParams(window.location.search);
    const projectUrl = params.get('project') || params.get('projectUrl') || null;
    const isElectraMode = params.get('mode') === 'electra';

    const [mode, setMode] = useState<AppMode>(isElectraMode ? 'electra' : 'home');
    const [projectUrlReady, setProjectUrlReady] = useState(false);
    const [resolvedProjectUrl, setResolvedProjectUrl] = useState<string | null>(projectUrl);
    const [juniorKey, setJuniorKey] = useState(0);

    // When projectUrl is present, fetch JSON to detect mode before routing
    React.useEffect(() => {
        if (!projectUrl) {
            setProjectUrlReady(true);
            return;
        }

        (async () => {
            try {
                const resp = await fetch(projectUrl);
                if (!resp.ok) throw new Error(`Failed to fetch project: ${resp.status}`);
                const data = await resp.json();
                const detectedMode: AppMode = data.mode === 'junior' ? 'junior' : 'intermediate';
                logAppTiming(`Project mode detected: ${detectedMode}`);
                setMode(detectedMode);
            } catch (err) {
                console.error('Failed to detect project mode:', err);
                // Default to intermediate on error
                setMode('intermediate');
            } finally {
                setProjectUrlReady(true);
            }
        })();
    }, [projectUrl]);

    const cleanBlocklyStyles = useCallback(() => {
        // Only remove floating Blockly DOM elements that are appended to document.body
        // and persist after the component unmounts. Do NOT remove <style> tags —
        // Blockly caches CSS injection state and will skip re-injecting on the next
        // mount if the styles are missing, which breaks the UI.
        document.querySelectorAll('.blocklyToolboxDiv, .blocklyWidgetDiv, .blocklyDropDownDiv, .blocklyContextMenu').forEach(el => {
            el.remove();
        });
    }, []);

    const handleSetMode = useCallback((newMode: AppMode) => {
        cleanBlocklyStyles();
        if (newMode === 'junior') {
            setJuniorKey(k => k + 1);
        }
        if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
            (window as any).define = undefined;
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

    const [redirectProjectData, setRedirectProjectData] = useState<{
        type: 'electra' | 'creova';
        data: unknown;
        projectName?: string | null;
        projectPath?: string | null;
    } | null>(null);

    const handleRedirectToElectra = useCallback((data: unknown, projectName?: string | null, projectPath?: string | null) => {
        setRedirectProjectData({ type: 'electra', data, projectName, projectPath });
        handleSetMode('electra');
    }, [handleSetMode]);

    const handleRedirectToCreova = useCallback((data: unknown, projectName?: string | null, projectPath?: string | null) => {
        setRedirectProjectData({ type: 'creova', data, projectName, projectPath });
        handleSetMode('creova');
    }, [handleSetMode]);

    const clearRedirectProjectData = useCallback(() => {
        setRedirectProjectData(null);
    }, []);

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

    const [exitPrompt, setExitPrompt] = useState<boolean>(false);

    const requestExit = () => {
        setExitPrompt(true);
    };

    const confirmExit = () => {
        handleSetMode('home');
        setExitPrompt(false);
    };

    const cancelExit = () => setExitPrompt(false);

    return (
        <ErrorBoundary key={mode}>
            <Suspense fallback={<Loader />}>
                {!projectUrlReady && projectUrl && <Loader />}
                {projectUrlReady && mode === 'intermediate' && <IntermediateApp
                    onBack={requestExit}
                    onOpenPython={() => requestSwitch('intermediate', 'python')}
                    openTab={intermediateOpenTab}
                    projectUrl={resolvedProjectUrl}
                />}
                {projectUrlReady && mode === 'junior' && <JuniorApp key={juniorKey} onBack={requestExit} projectUrl={resolvedProjectUrl} />}
                {mode === 'python' && <PythonApp
                    onBack={requestExit}
                    onSwitchToNotebook={() => requestSwitch('python', 'notebook')}
                    onSwitchToBlocks={() => requestSwitch('python', 'intermediate', 'blocks')}
                    onSwitchToCostumes={() => requestSwitch('python', 'intermediate', 'costumes')}
                />}
                {mode === 'notebook' && <PythonNotebook onBack={requestExit} onSwitchToIDE={() => handleSetMode('python')} />}
                {mode === 'creova' && <AppInventor
                    onBack={requestExit}
                    onRedirectToElectra={handleRedirectToElectra}
                    redirectProjectData={redirectProjectData?.type === 'creova' ? redirectProjectData : null}
                    clearRedirectProjectData={clearRedirectProjectData}
                />}
                {mode === 'appforge' && <ElectraWorkspace
                    onBack={requestExit}
                    onHome={() => handleSetMode('home')}
                    onRedirectToCreova={handleRedirectToCreova}
                    redirectProjectData={redirectProjectData?.type === 'electra' ? redirectProjectData : null}
                    clearRedirectProjectData={clearRedirectProjectData}
                />}
                {mode === 'electra' && <ElectraWorkspace
                    onBack={requestExit}
                    onHome={() => handleSetMode('home')}
                    onRedirectToCreova={handleRedirectToCreova}
                    redirectProjectData={redirectProjectData?.type === 'electra' ? redirectProjectData : null}
                    clearRedirectProjectData={clearRedirectProjectData}
                />}
                {mode === 'neura' && <NeuraApp onBack={requestExit} />}
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

            {exitPrompt && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 360, borderRadius: 12, background: '#fff', padding: 20, boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}>
                        <h2 style={{ margin: '0 0 10px', fontSize: 18 }}>Exit to Home?</h2>
                        <p style={{ margin: '0 0 16px', lineHeight: 1.4 }}>
                            Are you sure you want to exit? The code in the current editor will stop running.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={cancelExit} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }}>
                                No
                            </button>
                            <button onClick={confirmExit} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#5A2D82', color: '#fff', cursor: 'pointer' }}>
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
}
