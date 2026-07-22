/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, lazy, Suspense, useCallback, useEffect } from 'react';
import { ToastProvider } from './leapignite/client/components/Toast';

import Loader from './components/Loader';
import { UpdateBanner } from './components/UpdateBanner';
import { getSharedProject, fetchCloudProjectContent } from './services/cloudProjectApi';
import { useCloudProjectStore } from './store/cloudProjectStore';
import { isEmbedded } from './hooks/useIsEmbedded';

const LandingPage = lazy(() => import('./LandingPage'));

const IntermediateApp = lazy(() => {
    if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
        (window as any).define = undefined;
    }
    return import('./embed/IntermediateApp');
});

// @ts-ignore
const JuniorApp = lazy(() => {
    if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
        (window as any).define = undefined;
    }
    return import('./leapignite/client/JuniorApp');
});

// @ts-ignore
const PythonApp = lazy(() => import('./leaplogix/client/LogixApp'));

// @ts-ignore
const PythonNotebook = lazy(() => import('./python/PythonNotebook'));

// @ts-ignore
const AppInventor = lazy(() => {
    if (typeof window !== 'undefined' && typeof (window as any).define === 'function' && (window as any).define.amd) {
        (window as any).define = undefined;
    }
    return import('./creova');
});

// @ts-ignore
const ElectraWorkspace = lazy(() => import('./Electra/Client/Src/ElectraWorkspace'));

const NeuraApp = lazy(() => import('./neura/NeuraApp'));

const Leap3DApp = lazy(() => import('./vision3d'));

const PulseApp = lazy(() => import('./PulseApp'));

type AppMode = 'home' | 'intermediate' | 'junior' | 'python' | 'notebook' | 'creova' | 'appforge' | 'electra' | 'neura' | 'vision3d' | 'pulse';


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
        // Notify parent frame if embedded
        try {
            if (isEmbedded()) {
                window.parent.postMessage({ type: 'leaplab-error', error: error?.message || String(error) }, '*');
            }
        } catch {}
    }
    render() {
        if (this.state.hasError) {
            if (isEmbedded()) {
                // Compact inline error bar for embed context — does not cover the whole page
                return (
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
                        background: '#2a1a1a', color: '#ff6b6b', fontFamily: 'monospace',
                        padding: '10px 16px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', borderTop: '2px solid #f44336',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Error:</span>
                            <span style={{ fontSize: 12, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {this.state.error?.message || String(this.state.error)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                style={{
                                    padding: '4px 12px', borderRadius: 4, border: '1px solid #555',
                                    background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: 11,
                                }}
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '4px 12px', borderRadius: 4, border: 'none',
                                    background: '#f44336', color: '#fff', cursor: 'pointer', fontSize: 11,
                                }}
                            >
                                Reload
                            </button>
                        </div>
                    </div>
                );
            }
            // Full-page error for non-embedded context
            return (
                <div style={{ padding: 20, background: '#fff', color: '#f44336', fontFamily: 'monospace' }}>
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error?.toString()}</pre>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button onClick={() => this.setState({ hasError: false, error: null })} style={{ padding: '6px 14px', cursor: 'pointer' }}>
                            Dismiss
                        </button>
                        <button onClick={() => window.location.reload()} style={{ padding: '6px 14px', cursor: 'pointer' }}>
                            Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    // Check for ?project=<url> query param — auto-open in correct mode
    const params = new URLSearchParams(window.location.search);
    const projectUrl = params.get('project') || params.get('projectUrl') || null;
    const shareId = params.get('share') || null;
    const urlMode = params.get('mode') as AppMode | null;
    const isElectraMode = urlMode === 'electra';

    const [mode, setMode] = useState<AppMode>(isElectraMode ? 'electra' : 'home');
    const [projectUrlReady, setProjectUrlReady] = useState(false);
    const [resolvedProjectUrl, setResolvedProjectUrl] = useState<string | null>(projectUrl);
    const [juniorKey, setJuniorKey] = useState(0);
    const modeRef = React.useRef(mode);
    modeRef.current = mode;
    const handleSetModeRef = React.useRef<any>(null);

    // ── Global window-level drag-and-drop file upload ──
    const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);
    const [globalDragLabel, setGlobalDragLabel] = useState('');

    useEffect(() => {
        let dragCounter = 0;
        let isInternalDrag = false;

        const handleDragStart = () => {
            isInternalDrag = true;
        };

        const handleDragEnd = () => {
            isInternalDrag = false;
        };

        // Always prevent default for file drags so the browser never navigates away
        const preventFileNav = (e: DragEvent) => {
            if (isInternalDrag) return;
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault();
            }
        };

        const handleDragEnter = (e: DragEvent) => {
            if (isInternalDrag) return;
            if (!e.dataTransfer?.types?.includes('Files')) return;
            const activeUpload = (window as any).__activeUpload;
            const currentMode = modeRef.current;

            // Show overlay for .leap file drops on the landing page
            if (!activeUpload && currentMode !== 'home') return;

            // If on landing page, check if any file is a .leap file
            if (!activeUpload && currentMode === 'home') {
                const files = e.dataTransfer?.files;
                const hasLeapFile = files && Array.from(files).some(f => f.name.endsWith('.leap') || f.name.endsWith('.lbp'));
                if (!hasLeapFile) return;
            }

            e.preventDefault();
            dragCounter++;
            if (dragCounter === 1) {
                setIsGlobalDragOver(true);
                setGlobalDragLabel(activeUpload?.label || '.leap Project');
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            if (isInternalDrag) return;
            if (!e.dataTransfer?.types?.includes('Files')) return;
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                setIsGlobalDragOver(false);
            }
        };

        const handleDrop = (e: DragEvent) => {
            if (isInternalDrag) return;
            if (!e.dataTransfer?.types?.includes('Files')) return;
            e.preventDefault();
            dragCounter = 0;
            setIsGlobalDragOver(false);

            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;

            const activeUpload = (window as any).__activeUpload;
            if (activeUpload) {
                activeUpload.handler(files);
                return;
            }

            // Handle .leap file drops on the landing page
            const file = files[0];
            if (file && (file.name.endsWith('.leap') || file.name.endsWith('.lbp'))) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target?.result as string);
                        const detectedMode: AppMode =
                            data.mode === 'junior' ? 'junior' :
                            data.mode === 'python' ? 'python' :
                            data.mode === 'creova' ? 'creova' :
                            data.mode === 'electra' ? 'electra' :
                            data.mode === 'neura' ? 'neura' :
                            'intermediate';

                        useCloudProjectStore.getState().setPendingProject({
                            mode: detectedMode,
                            data,
                            projectName: data.projectName || file.name.replace(/\.(leap|lbp)$/i, ''),
                        });

                        if (handleSetModeRef.current) {
                            handleSetModeRef.current(detectedMode);
                        }
                    } catch (err) {
                        console.error('Failed to parse .leap file:', err);
                        alert('Invalid .leap project file.');
                    }
                };
                reader.readAsText(file);
            }
        };

        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('dragover', preventFileNav);
        window.addEventListener('drop', preventFileNav);
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragstart', handleDragStart);
            window.removeEventListener('dragend', handleDragEnd);
            window.removeEventListener('dragover', preventFileNav);
            window.removeEventListener('drop', preventFileNav);
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

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

                // Electra payloads are identified by an explicit mode field, or by the raw circuit
                // payload they were saved as before the wrapper existed. We check both the flat
                // shape (nodes/edges/board) and the nested circuit shape for maximum coverage of
                // already-uploaded trainer projects. Only the two supported Electra boards count.
                const ELECTRA_BOARDS = ['arduino-uno', 'esp32-c3'] as const;
                const hasElectraBoard = ELECTRA_BOARDS.includes(data.board);
                const hasElectraCircuit =
                    (Array.isArray(data.nodes) && Array.isArray(data.edges)) ||
                    (Array.isArray(data.circuit?.nodes) && Array.isArray(data.circuit?.edges));
                const isElectraPayload = data.mode === 'electra' ||
                    (hasElectraCircuit && hasElectraBoard);

                const VALID_MODES: AppMode[] = ['junior', 'intermediate', 'python', 'creova', 'electra', 'neura', 'vision3d'];
                const detectedMode: AppMode =
                    (urlMode && VALID_MODES.includes(urlMode as any))
                        ? (urlMode as AppMode)
                        : data.mode === 'junior' ? 'junior' :
                          data.mode === 'python' ? 'python' :
                          data.mode === 'creova' ? 'creova' :
                          data.mode === 'neura' ? 'neura' :
                          data.mode === 'vision3d' ? 'vision3d' :
                          isElectraPayload ? 'electra' :
                          'intermediate';

                useCloudProjectStore.getState().setPendingProject({
                    mode: detectedMode,
                    data,
                    projectName: data.projectName || data.name || 'Untitled Project',
                });

                setMode(detectedMode);
            } catch (err) {
                console.error('Failed to detect project mode:', err);
                // Default to intermediate on error
                setMode('intermediate');
            } finally {
                setProjectUrlReady(true);
            }
        })();
    }, [projectUrl, urlMode]);

    // When ?share=<shareId> is present, fetch the shared project and route to the correct module
    React.useEffect(() => {
        if (!shareId) return;

        let cancelled = false;
        (async () => {
            try {
                const project = await getSharedProject(shareId);
                if (!project.fileUrl) throw new Error('Shared project file URL is missing');

                const { LMS_API_BASE } = await import('./config/api');
                const fileUrl = project.fileUrl.startsWith('http')
                    ? project.fileUrl
                    : `${LMS_API_BASE}${project.fileUrl}`;

                const content = await fetchCloudProjectContent(fileUrl);

                if (cancelled) return;

                useCloudProjectStore.getState().setPendingProject({
                    mode: project.mode,
                    data: content,
                    projectName: project.name,
                });

                if (project.sharePermission) {
                    useCloudProjectStore.getState().setSharedProjectInfo({
                        shareId,
                        permission: project.sharePermission,
                    });
                } else {
                    useCloudProjectStore.getState().clearSharedProjectInfo();
                }

                const detectedMode: AppMode =
                    project.mode === 'junior' ? 'junior' :
                    project.mode === 'python' ? 'python' :
                    project.mode === 'creova' ? 'creova' :
                    project.mode === 'electra' ? 'electra' :
                    project.mode === 'neura' ? 'neura' :
                    'intermediate';

                setMode(detectedMode);
            } catch (err: any) {
                console.error('Failed to load shared project:', err);
                const msg = err?.message || 'Failed to load shared project.';
                alert(msg.includes('Authentication') ? msg : 'Failed to load shared project. The link may be invalid or expired.');
            }
        })();

        return () => { cancelled = true; };
    }, [shareId]);

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

    // Keep ref in sync for drag-drop handler
    handleSetModeRef.current = handleSetMode;

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
        // Clear shared-link URL parameters and cloud state when returning home
        if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        useCloudProjectStore.getState().clearPendingProject();
        useCloudProjectStore.getState().clearActiveProjectId();
        useCloudProjectStore.getState().clearSharedProjectInfo();
        setResolvedProjectUrl(null);
        setProjectUrlReady(true);
        handleSetMode('home');
        setExitPrompt(false);
    };

    const cancelExit = () => setExitPrompt(false);

    return (
        <ErrorBoundary key={mode}>
            <ToastProvider>
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
                    {projectUrlReady && mode === 'appforge' && <ElectraWorkspace
                        onBack={requestExit}
                        onHome={() => handleSetMode('home')}
                        onRedirectToCreova={handleRedirectToCreova}
                        redirectProjectData={redirectProjectData?.type === 'electra' ? redirectProjectData : null}
                        clearRedirectProjectData={clearRedirectProjectData}
                    />}
                    {projectUrlReady && mode === 'electra' && <ElectraWorkspace
                        onBack={requestExit}
                        onHome={() => handleSetMode('home')}
                        onRedirectToCreova={handleRedirectToCreova}
                        redirectProjectData={redirectProjectData?.type === 'electra' ? redirectProjectData : null}
                        clearRedirectProjectData={clearRedirectProjectData}
                    />}
                    {mode === 'neura' && <NeuraApp onBack={requestExit} />}
                    {mode === 'vision3d' && <Leap3DApp onBack={requestExit} />}
                    {mode === 'pulse' && <PulseApp onBack={requestExit} />}
                    {mode === 'home' && <LandingPage onSelect={handleSetMode} />}
                </Suspense>


                {switchPrompt && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 'min(360px, 90vw)', borderRadius: 12, background: '#fff', padding: 20, boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}>
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

                {(window as any).electronAPI?.isElectron && <UpdateBanner />}

                {/* Global drag-and-drop overlay */}
                {isGlobalDragOver && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(99, 14, 212, 0.12)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        zIndex: 99999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.97)',
                            border: '3px dashed #630ed4',
                            borderRadius: '24px',
                            padding: '40px 60px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 24px 48px rgba(99, 14, 212, 0.18)',
                        }}>
                            <span style={{ fontSize: '56px' }}>📥</span>
                            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: 800 }}>
                                {globalDragLabel === '.leap Project' ? 'Drop to Open Project' : 'Drop to Upload'}
                            </h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', fontWeight: 600 }}>
                                {globalDragLabel === '.leap Project'
                                    ? 'Release to open in the matching module'
                                    : <>Release to upload to <span style={{ color: '#630ed4', fontWeight: 800 }}>{globalDragLabel}</span></>
                                }
                            </p>
                        </div>
                    </div>
                )}

                {exitPrompt && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 'min(360px, 90vw)', borderRadius: 12, background: '#fff', padding: 20, boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}>
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
            </ToastProvider>
        </ErrorBoundary>
    );
}
