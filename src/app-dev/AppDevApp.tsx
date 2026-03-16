import React, { useState, useRef, useEffect } from 'react';
import { 
    Smartphone, 
    MousePointer2, 
    Layers, 
    Settings2, 
    ChevronLeft,
    Type,
    Square,
    Image as ImageIcon,
    ToggleLeft,
    Play,
    Code2,
    Palette,
    Plus,
    Trash2,
    Save
} from 'lucide-react';

interface Component {
    id: string;
    type: string;
    name: string;
    properties: any;
}

interface AppDevAppProps {
    onBack: () => void;
}

export default function AppDevApp({ onBack }: AppDevAppProps) {
    const [view, setView] = useState<'designer' | 'blocks'>('designer');
    const [components, setComponents] = useState<Component[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const addComponent = (type: string) => {
        const id = `${type}_${Date.now()}`;
        const newComp = {
            id,
            type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${components.length + 1}`,
            properties: {
                text: type === 'button' || type === 'label' ? 'New ' + type : '',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontSize: 16,
            }
        };
        setComponents([...components, newComp]);
        setSelectedId(id);
    };

    return (
        <div style={styles.container}>
            {/* Topbar */}
            <div style={styles.topbar}>
                <div style={styles.topbarLeft}>
                    <button onClick={onBack} style={styles.backBtn}>
                        <ChevronLeft size={20} />
                    </button>
                    <div style={styles.projectInfo}>
                        <Smartphone size={18} color="#855CD6" />
                        <span style={styles.projectName}>My First Mobile App</span>
                    </div>
                </div>

                <div style={styles.viewSwitcher}>
                    <button 
                        onClick={() => setView('designer')}
                        style={{...styles.switchBtn, ...(view === 'designer' ? styles.activeSwitch : {})}}
                    >
                        <Palette size={16} />
                        Designer
                    </button>
                    <button 
                        onClick={() => setView('blocks')}
                        style={{...styles.switchBtn, ...(view === 'blocks' ? styles.activeSwitch : {})}}
                    >
                        <Code2 size={16} />
                        Blocks
                    </button>
                </div>

                <div style={styles.topbarRight}>
                    <button style={styles.saveBtn}>
                        <Save size={18} />
                        Save Project
                    </button>
                    <button style={styles.runBtn}>
                        <Play size={18} />
                        Run App
                    </button>
                </div>
            </div>

            <div style={styles.main}>
                {view === 'designer' ? (
                    <Designer 
                        components={components} 
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onAdd={addComponent}
                    />
                ) : (
                    <div style={styles.placeholder}>
                        <Code2 size={48} color="#855CD6" />
                        <h3>Blocks Editor</h3>
                        <p>Blockly integration for mobile components coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Designer({ components, selectedId, onSelect, onAdd }: any) {
    const componentTypes = [
        { type: 'button', icon: <Square size={18} />, label: 'Button' },
        { type: 'label', icon: <Type size={18} />, label: 'Label' },
        { type: 'image', icon: <ImageIcon size={18} />, label: 'Image' },
        { type: 'switch', icon: <ToggleLeft size={18} />, label: 'Switch' },
    ];

    return (
        <div style={styles.designerContainer}>
            {/* Left Palette */}
            <div style={styles.palette}>
                <div style={styles.sidebarHeader}>
                    <Plus size={16} />
                    <span>Components</span>
                </div>
                <div style={styles.paletteList}>
                    {componentTypes.map(c => (
                        <button key={c.type} onClick={() => onAdd(c.type)} style={styles.paletteItem}>
                            {c.icon}
                            <span>{c.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Center Viewport */}
            <div style={styles.viewport}>
                <div style={styles.phoneFrame}>
                    <div style={styles.phoneScreen}>
                        <div style={styles.screenHeader}>
                            <span>9:41</span>
                            <div style={styles.screenNotch} />
                            <div style={styles.screenIcons}>🔋 📶</div>
                        </div>
                        <div style={styles.screenContent}>
                            {components.map((comp: Component) => (
                                <div 
                                    key={comp.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(comp.id);
                                    }}
                                    style={{
                                        ...styles.renderedComponent,
                                        ...(selectedId === comp.id ? styles.selectedComponent : {}),
                                        backgroundColor: comp.properties.backgroundColor,
                                        color: comp.properties.textColor,
                                        fontSize: comp.properties.fontSize,
                                    }}
                                >
                                    {comp.type === 'button' && (
                                        <button style={styles.previewButton}>{comp.properties.text}</button>
                                    )}
                                    {comp.type === 'label' && (
                                        <span>{comp.properties.text}</span>
                                    )}
                                    {comp.type === 'image' && (
                                        <div style={styles.previewImage}>
                                            <ImageIcon size={32} color="#CBD5E1" />
                                        </div>
                                    )}
                                    {comp.type === 'switch' && (
                                        <ToggleLeft size={32} color="#855CD6" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Properties */}
            <div style={styles.properties}>
                <div style={styles.sidebarHeader}>
                    <Settings2 size={16} />
                    <span>Properties</span>
                </div>
                {selectedId ? (
                    <div style={styles.propList}>
                        <div style={styles.propItem}>
                            <label>Name</label>
                            <input readOnly value={components.find((c: any) => c.id === selectedId)?.name} style={styles.propInput} />
                        </div>
                        <button style={styles.deleteBtn}>
                            <Trash2 size={14} />
                            Delete Component
                        </button>
                    </div>
                ) : (
                    <div style={styles.noSelection}>
                        <MousePointer2 size={32} color="#E2E8F0" />
                        <p>Select a component to edit its properties</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
        fontFamily: '"Inter", sans-serif',
    },
    topbar: {
        height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10,
    },
    topbarLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid #E2E8F0',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#64748B',
    },
    projectInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    projectName: {
        fontSize: 16,
        fontWeight: 700,
        color: '#1E293B',
    },
    viewSwitcher: {
        background: '#F1F5F9',
        padding: 4,
        borderRadius: 12,
        display: 'flex',
        gap: 4,
    },
    switchBtn: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        fontSize: 14,
        fontWeight: 600,
        color: '#64748B',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    activeSwitch: {
        background: '#FFFFFF',
        color: '#855CD6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    topbarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    saveBtn: {
        padding: '10px 16px',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        background: 'white',
        fontSize: 14,
        fontWeight: 600,
        color: '#1E293B',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
    },
    runBtn: {
        padding: '10px 20px',
        borderRadius: 12,
        border: 'none',
        background: 'linear-gradient(135deg, #855CD6, #6D28D9)',
        fontSize: 14,
        fontWeight: 700,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(133, 92, 214, 0.25)',
    },
    main: {
        flex: 1,
        overflow: 'hidden',
    },
    designerContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
    },
    palette: {
        width: 260,
        background: 'white',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
    },
    sidebarHeader: {
        padding: '16px 20px',
        fontSize: 12,
        fontWeight: 700,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid #F1F5F9',
    },
    paletteList: {
        padding: 12,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
    },
    paletteItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        border: '1px solid #F1F5F9',
        background: '#F8FAFC',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: 12,
        fontWeight: 600,
        color: '#475569',
    },
    viewport: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F1F5F9',
        overflow: 'auto',
        padding: 40,
    },
    phoneFrame: {
        width: 320,
        height: 640,
        background: '#1E293B',
        borderRadius: 48,
        padding: 12,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
    },
    phoneScreen: {
        width: '100%',
        height: '100%',
        background: 'white',
        borderRadius: 36,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    screenHeader: {
        height: 44,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 14,
        fontWeight: 600,
        color: '#1E293B',
    },
    screenNotch: {
        width: 120,
        height: 24,
        background: '#1E293B',
        borderRadius: '0 0 20px 20px',
    },
    screenContent: {
        flex: 1,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: '#fafafe',
    },
    renderedComponent: {
        padding: 4,
        borderRadius: 8,
        cursor: 'pointer',
        border: '2px solid transparent',
        transition: 'all 0.1s',
    },
    selectedComponent: {
        borderColor: '#855CD6',
        backgroundColor: 'rgba(133, 92, 214, 0.05) !important',
    },
    previewButton: {
        width: '100%',
        padding: '12px',
        borderRadius: 12,
        border: 'none',
        background: '#855CD6',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
    },
    previewImage: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        background: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #E2E8F0',
    },
    properties: {
        width: 300,
        background: 'white',
        borderLeft: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
    },
    propList: {
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    propItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    propInput: {
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        fontSize: 14,
        outline: 'none',
    },
    deleteBtn: {
        marginTop: 20,
        padding: '12px',
        borderRadius: 12,
        border: '1px solid #FEE2E2',
        background: '#FEF2F2',
        color: '#EF4444',
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
    },
    noSelection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 14,
        gap: 16,
    },
    placeholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: '#64748B',
    }
};
