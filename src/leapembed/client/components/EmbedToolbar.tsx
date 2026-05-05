/**
 * EmbedToolbar.tsx
 * Unified toolbar: workspace tabs (Blocks/Python/Costumes/Sounds),
 * undo/redo, and stage controls (run/stop/camera/grid/layout/fullscreen).
 */
import React from 'react';
import {
    LayoutTemplate, Terminal, Pen, Volume2,
    Undo2, Redo2, Camera, CameraOff, Grid3X3,
    Maximize, Minimize, LayoutPanelLeft, Flag, Square,
} from 'lucide-react';
import { embedStyles as styles } from '../styles/embedApp.styles';

interface EmbedToolbarProps {
    appMode: string;
    editorMode: 'stage' | 'upload';
    workspaceTab: 'blocks' | 'python' | 'costumes' | 'sounds';
    selectedSpriteId: string | null;
    sprites: any[];
    isRunning: boolean;
    isCameraOn: boolean;
    showGrid: boolean;
    stageLayout: 'normal' | 'small' | 'large';
    isFullscreen: boolean;
    onTabChange: (tab: 'blocks' | 'python' | 'costumes' | 'sounds') => void;
    onUndo: () => void;
    onRedo: () => void;
    onRun: () => void;
    onStop: () => void;
    onToggleCamera: () => void;
    onToggleGrid: () => void;
    onLayoutChange: (layout: 'normal' | 'small' | 'large') => void;
    onFullscreen: () => void;
    onOpenPython?: () => void;
}

export const EmbedToolbar: React.FC<EmbedToolbarProps> = ({
    appMode, editorMode, workspaceTab, selectedSpriteId, sprites,
    isRunning, isCameraOn, showGrid, stageLayout, isFullscreen,
    onTabChange, onUndo, onRedo, onRun, onStop,
    onToggleCamera, onToggleGrid, onLayoutChange, onFullscreen, onOpenPython,
}) => {
    if (appMode !== 'blocks') return null;

    const selectedSprite = sprites.find((s: any) => s.id === selectedSpriteId);

    return (
        <div style={styles.unifiedToolbar}>
            {/* Left: Workspace Tabs */}
            <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', paddingLeft: '20px', flex: 1 }}>
                {/* Blocks tab always shown */}
                <button style={workspaceTab === 'blocks' ? styles.tabActive : styles.tab} onClick={() => onTabChange('blocks')}>
                    <LayoutTemplate size={18} color={workspaceTab === 'blocks' ? '#855CD6' : '#999'} /> Blocks
                </button>
                {/* Python/Costumes/Sounds only in stage mode */}
                {editorMode === 'stage' && <>
                    <button style={workspaceTab === 'python' ? styles.tabActive : styles.tab}
                        onClick={() => onOpenPython ? onOpenPython() : onTabChange('python')}>
                        <Terminal size={18} color={workspaceTab === 'python' ? '#855CD6' : '#999'} /> Python
                    </button>
                    <button style={workspaceTab === 'costumes' ? styles.tabActive : styles.tab} onClick={() => onTabChange('costumes')}>
                        <Pen size={18} color={workspaceTab === 'costumes' ? '#855CD6' : '#999'} />
                        {selectedSprite ? selectedSprite.name : 'Costumes'}
                    </button>
                    <button style={workspaceTab === 'sounds' ? styles.tabActive : styles.tab} onClick={() => onTabChange('sounds')}>
                        <Volume2 size={18} color={workspaceTab === 'sounds' ? '#855CD6' : '#999'} /> Sounds
                    </button>
                </>}
            </div>

            {/* Middle: Undo/Redo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px', borderRight: editorMode === 'stage' ? '1px solid #eee' : 'none' }}>
                <button style={styles.undoRedoBtn} onClick={onUndo} title="Undo"><Undo2 size={18} color="#575E75" /></button>
                <button style={styles.undoRedoBtn} onClick={onRedo} title="Redo"><Redo2 size={18} color="#575E75" /></button>
            </div>

            {/* Right: Stage Controls — only in stage mode */}
            {editorMode === 'stage' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', paddingLeft: '12px' }}>
                    {/* Run */}
                    <button style={styles.runButtonTop} onClick={onRun} title="Run (Green Flag)" disabled={isRunning}>
                        <svg viewBox="0 0 24 24" width="22" height="22">
                            <path fill="#4CBB17" d="M5 3v18M5 3l14 9-14 9V3z" />
                        </svg>
                    </button>
                    {/* Stop */}
                    <button style={styles.stopButtonTop} onClick={onStop} title="Stop" disabled={!isRunning}>
                        <svg viewBox="0 0 24 24" width="22" height="22">
                            <polygon fill="#EC5959" points="5,5 19,5 19,19 5,19" />
                        </svg>
                    </button>
                    <div style={{ width: 1, height: 20, background: '#eee' }} />
                    {/* Camera */}
                    <button style={{ ...styles.iconBtn, ...(isCameraOn ? styles.iconBtnActive : {}) }}
                        onClick={onToggleCamera} title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
                        {isCameraOn ? <CameraOff size={18} /> : <Camera size={18} />}
                    </button>
                    {/* Grid */}
                    <button style={{ ...styles.iconBtn, ...(showGrid ? styles.iconBtnActive : {}) }}
                        onClick={onToggleGrid} title="Toggle grid">
                        <Grid3X3 size={18} />
                    </button>
                    {/* Layout */}
                    <button style={{ ...styles.iconBtn, ...(stageLayout === 'normal' ? styles.iconBtnActive : {}) }}
                        onClick={() => onLayoutChange('normal')} title="Normal layout">
                        <LayoutTemplate size={18} />
                    </button>
                    <button style={{ ...styles.iconBtn, ...(stageLayout === 'small' ? styles.iconBtnActive : {}) }}
                        onClick={() => onLayoutChange('small')} title="Small stage">
                        <LayoutPanelLeft size={18} />
                    </button>
                    {/* Fullscreen */}
                    <button style={styles.iconBtn} onClick={onFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                </div>
            )}
        </div>
    );
};
