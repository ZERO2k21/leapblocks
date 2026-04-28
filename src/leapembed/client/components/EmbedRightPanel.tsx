/**
 * EmbedRightPanel.tsx
 *
 * STAGE MODE:  Stage canvas + monitor overlays + ask bar + SpritePanel
 *              (no log/serial — those are upload-only)
 *
 * UPLOAD MODE: Generated C++ code panel + Log/Serial monitor
 *              (no stage canvas, no SpritePanel — hardware workflow only)
 */
import React from 'react';
import Stage from '../stage/Stage';
import SpritePanel from '../stage/SpritePanel';
import AskBar from './AskBar';
import SerialMonitor from './SerialMonitor';
import { EmbedMonitors } from './EmbedMonitors';
import { embedStyles as styles } from '../styles/embedApp.styles';
import { STAGE_CONFIG } from '../../server/engine/stageConfig';
import type { StageManager } from '../../server/engine/stageManager';
import type { Sprite } from '../stage/Sprite';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from '../hooks/useMonitors';

interface EmbedRightPanelProps {
    editorMode: 'stage' | 'upload';
    stageLayout: 'normal' | 'small' | 'large';
    isFullscreen: boolean;
    fullscreenScale: number;
    stageContainerRef: React.RefObject<HTMLDivElement>;

    // Stage mode props
    sprites: Sprite[];
    selectedSpriteId: string | null;
    stageManager: StageManager;
    backdropRefresh: number;
    isCameraOn: boolean;
    showGrid: boolean;
    isRunning: boolean;
    askState: { isAsking: boolean; question: string };
    onAskSubmit: (answer: string) => void;
    onSelectSprite: (id: string) => void;
    onSpriteClick: (id: string) => void;
    onAddSprite: (type: any) => void;
    onDeleteSprite: (id: string) => void;
    onRemoveBackground: (id: string) => void;
    onOpenSpriteLibrary: () => void;
    onOpenBackdropLibrary: () => void;
    onPaintSprite?: () => void;
    onUploadSprite?: (entry?: any) => void;
    variableMonitors: VariableMonitorState[];
    listMonitors: ListMonitorState[];
    tableMonitors: TableMonitorState[];
    sensingMonitors: VariableMonitorState[];
    onMonitorPositionChange: (type: any, id: string, x: number, y: number) => void;
    onMonitorResize: (type: any, id: string, w: number, h: number) => void;
    onMonitorBringToFront: (type: any, id: string) => void;
    onVariableModeChange: (id: string, mode: any) => void;
    onVariableValueChange: (id: string, value: any) => void;
    onVariableSliderRangeChange: (id: string, min: number, max: number) => void;
    onShowVariable: (name: string) => void;
    onHideVariable: (name: string) => void;
    onShowList: (name: string) => void;
    onHideList: (name: string) => void;
    onShowTable: (name: string) => void;
    onHideTable: (name: string) => void;
    onRun: () => void;
    onStop: () => void;
    onExitFullscreen: () => void;

    // Upload mode props
    generatedCode: string;
    activeTab: 'log' | 'serial';
    onTabChange: (tab: 'log' | 'serial') => void;
    logMessages: string[];
    serialMessages: string[];
    baudRate: number;
    setBaudRate: (v: number) => void;
    lineEnding: string;
    setLineEnding: (v: string) => void;
    isConnected: boolean;
    onSendSerial: (msg: string) => void;
    onUpload: () => void;
}

export const EmbedRightPanel: React.FC<EmbedRightPanelProps> = ({
    editorMode, stageLayout, isFullscreen, fullscreenScale, stageContainerRef,
    sprites, selectedSpriteId, stageManager, backdropRefresh,
    isCameraOn, showGrid, isRunning,
    askState, onAskSubmit,
    onSelectSprite, onSpriteClick, onAddSprite, onDeleteSprite,
    onRemoveBackground, onOpenSpriteLibrary, onOpenBackdropLibrary,
    onPaintSprite, onUploadSprite,
    variableMonitors, listMonitors, tableMonitors, sensingMonitors,
    onMonitorPositionChange, onMonitorResize, onMonitorBringToFront,
    onVariableModeChange, onVariableValueChange, onVariableSliderRangeChange,
    onShowVariable, onHideVariable, onShowList, onHideList, onShowTable, onHideTable,
    onRun, onStop, onExitFullscreen,
    generatedCode, activeTab, onTabChange,
    logMessages, serialMessages, baudRate, setBaudRate,
    lineEnding, setLineEnding, isConnected, onSendSerial, onUpload,
}) => {
    const panelWidth = isFullscreen ? '100vw' : (stageLayout === 'small' ? '256px' : '496px');
    const stageH = stageLayout === 'small' ? 155 : 310;
    const W = STAGE_CONFIG.WIDTH;
    const H = STAGE_CONFIG.HEIGHT;

    // ─────────────────────────────────────────────────────────────────────────
    // UPLOAD MODE: C++ code panel + log/serial (no stage, no sprites)
    // ─────────────────────────────────────────────────────────────────────────
    if (editorMode === 'upload') {
        return (
            <div style={{ ...styles.rightPanel, width: panelWidth }} className="right-panel-responsive">

                {/* Generated C++ code */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 8, border: '1px solid #eee', overflow: 'hidden', margin: '4px 0' }}>
                    <div style={styles.codeHeader}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Generated Code (C++)</span>
                        <button style={styles.uploadCodeBtn} onClick={onUpload}>⬆ Upload</button>
                    </div>
                    <div style={styles.codeArea}>
                        <pre style={styles.codeContent}>
                            {generatedCode.split('\n').map((line, i) => (
                                <div key={i} style={styles.codeLine}>
                                    <span style={styles.lineNumber}>{i + 1}</span>
                                    <span>{line}</span>
                                </div>
                            ))}
                        </pre>
                    </div>
                </div>

                {/* Log / Serial monitor */}
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <div style={styles.bottomTabs}>
                        <button style={activeTab === 'log' ? styles.bottomTabActive : styles.bottomTab}
                            onClick={() => onTabChange('log')}>Log</button>
                        <button style={activeTab === 'serial' ? styles.bottomTabActive : styles.bottomTab}
                            onClick={() => onTabChange('serial')}>Serial</button>
                    </div>
                    {activeTab === 'log' ? (
                        <div style={styles.logArea}>
                            {logMessages.map((msg, i) => (
                                <div key={i} style={styles.logLine}>{msg}</div>
                            ))}
                        </div>
                    ) : (
                        <SerialMonitor
                            baudRate={baudRate} setBaudRate={setBaudRate}
                            lineEnding={lineEnding} setLineEnding={setLineEnding}
                            messages={serialMessages} setMessages={() => { }}
                            onSendMessage={onSendSerial} isConnected={isConnected}
                        />
                    )}
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE MODE: Stage canvas + monitors + SpritePanel (no log/serial)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            style={{ ...styles.rightPanel, width: panelWidth, transition: 'width 0.2s ease-in-out' }}
            className="right-panel-responsive"
        >
            {/* Stage canvas container */}
            <div
                ref={stageContainerRef}
                className="stage-container-responsive"
                style={{
                    ...(!isFullscreen ? styles.stageContainer : {}),
                    width: isFullscreen ? '100vw' : '100%',
                    height: isFullscreen ? '100vh' : `${stageH}px`,
                    position: isFullscreen ? 'fixed' : 'relative',
                    top: isFullscreen ? 0 : 'auto',
                    left: isFullscreen ? 0 : 'auto',
                    zIndex: isFullscreen ? 9999 : 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'flex-start',
                    background: isFullscreen ? '#f0f0f0' : 'transparent',
                    overflow: 'hidden', flexShrink: 0,
                }}
            >
                {/* Fullscreen toolbar */}
                {isFullscreen && (
                    <div style={{
                        display: 'flex', width: '100%', height: 54,
                        background: '#fff', borderBottom: '1px solid #e0e0e0',
                        alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 10000,
                    }}>
                        <button onClick={onRun} disabled={isRunning}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <path fill="#4CBB17" d="M5 3v18M5 3l14 9-14 9V3z" />
                            </svg>
                        </button>
                        <button onClick={onStop} disabled={!isRunning}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <svg viewBox="0 0 24 24" width="28" height="28">
                                <polygon fill="#EC5959" points="5,5 19,5 19,19 5,19" />
                            </svg>
                        </button>
                        <div style={{ flex: 1 }} />
                        <button onClick={onExitFullscreen}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#666' }}>
                            Exit Fullscreen ✕
                        </button>
                    </div>
                )}

                {/* Stage canvas + monitor overlays + ask bar */}
                <div style={{
                    position: 'relative',
                    width: isFullscreen ? `${Math.round(W * fullscreenScale)}px` : '100%',
                    flexShrink: 0,
                }}>
                    <Stage
                        sprites={sprites}
                        selectedSpriteId={selectedSpriteId}
                        isRunning={isRunning}
                        isCameraOn={isCameraOn}
                        showGridNumbers={showGrid}
                        onSpriteClick={onSpriteClick}
                        width={isFullscreen ? Math.round(W * fullscreenScale) : W}
                        height={isFullscreen ? Math.round(H * fullscreenScale) : H}
                    />

                    {/* Variable / list / table / sensing monitors */}
                    <EmbedMonitors
                        variableMonitors={variableMonitors}
                        listMonitors={listMonitors}
                        tableMonitors={tableMonitors}
                        sensingMonitors={sensingMonitors}
                        stageWidth={W} stageHeight={H}
                        onPositionChange={onMonitorPositionChange}
                        onResize={onMonitorResize}
                        onBringToFront={onMonitorBringToFront}
                        onVariableModeChange={onVariableModeChange}
                        onVariableValueChange={onVariableValueChange}
                        onVariableSliderRangeChange={onVariableSliderRangeChange}
                        onShowVariable={onShowVariable} onHideVariable={onHideVariable}
                        onShowList={onShowList} onHideList={onHideList}
                        onShowTable={onShowTable} onHideTable={onHideTable}
                    />

                    {/* Ask-and-wait input bar */}
                    {askState.isAsking && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
                            <AskBar question={askState.question} onSubmit={onAskSubmit} />
                        </div>
                    )}
                </div>
            </div>

            {/* Sprite panel — hidden in fullscreen */}
            {!isFullscreen && (
                <SpritePanel
                    sprites={sprites}
                    selectedSpriteId={selectedSpriteId}
                    onSelectSprite={onSelectSprite}
                    onAddSprite={onAddSprite}
                    onDeleteSprite={onDeleteSprite}
                    onRemoveBackground={onRemoveBackground}
                    onOpenSpriteLibrary={onOpenSpriteLibrary}
                    onOpenBackdropLibrary={onOpenBackdropLibrary}
                    onPaintSprite={onPaintSprite}
                    onUploadSprite={onUploadSprite}
                    stageManager={stageManager}
                    backdropVersion={backdropRefresh}
                    isFullscreen={false}
                />
            )}
        </div>
    );
};
