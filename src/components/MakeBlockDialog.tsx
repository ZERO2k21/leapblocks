import React, { useState, useEffect } from 'react';
import Blockly from '@blockly-runtime';

/**
 * Argument types supported by Scratch 3.0
 */
export type ArgumentType = 'input' | 'boolean' | 'label';

export interface BlockArgument {
    id: string;
    type: ArgumentType;
    value: string;
}

interface MakeBlockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateBlock: (block: {
        name: string;
        arguments: BlockArgument[];
        warp: boolean;
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

export const MakeBlockDialog: React.FC<MakeBlockDialogProps> = ({
    isOpen,
    onClose,
    onCreateBlock,
    workspace
}) => {
    const [blockName, setBlockName] = useState('my block');
    const [args, setArgs] = useState<BlockArgument[]>([]);
    const [warp, setWarp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setBlockName('my block');
            setArgs([]);
            setWarp(false);
            setError(null);
        }
    }, [isOpen]);

    const addArgument = (type: ArgumentType) => {
        const newArg: BlockArgument = {
            id: `arg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            value: type === 'label' ? 'text' : (type === 'boolean' ? 'bool' : 'number or text')
        };
        setArgs([...args, newArg]);
    };

    const updateArgument = (id: string, value: string) => {
        setArgs(args.map(arg => arg.id === id ? { ...arg, value } : arg));
    };

    const removeArgument = (id: string) => {
        setArgs(args.filter(arg => arg.id !== id));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedName = blockName.trim();
        
        if (!trimmedName) {
            setError('Block name cannot be empty');
            return;
        }

        onCreateBlock({
            name: trimmedName,
            arguments: args,
            warp
        });
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleCancel()}>
            <div style={styles.dialog}>
                <div style={styles.header}>
                    <span style={styles.headerText}>Make a Block</span>
                    <button style={styles.closeBtn} onClick={handleCancel}>×</button>
                </div>

                <div style={styles.content}>
                    {/* Block Preview Area - Scratch Style */}
                    <div style={styles.previewSection}>
                        <div style={styles.previewBlock}>
                            <span style={styles.previewText}>{blockName || 'my block'}</span>
                            {args.map((arg) => (
                                <span 
                                    key={arg.id} 
                                    style={{
                                        ...styles.previewArg,
                                        backgroundColor: arg.type === 'boolean' ? '#4C97FF' : 'white',
                                        color: arg.type === 'boolean' ? 'white' : '#575E75',
                                        borderRadius: arg.type === 'boolean' ? '20px' : (arg.type === 'label' ? '0' : '8px'),
                                        border: arg.type === 'label' ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                        padding: arg.type === 'label' ? '0' : '4px 12px',
                                        fontWeight: arg.type === 'label' ? 'bold' : 'normal'
                                    }}
                                >
                                    {arg.value}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Argument Generation Buttons */}
                    <div style={styles.addButtonsRow}>
                        <button type="button" style={styles.addBtn} onClick={() => addArgument('input')}>
                            <div style={styles.iconBox}>123</div>
                            <span style={styles.addBtnText}>Add an input<br/>number or text</span>
                        </button>
                        <button type="button" style={styles.addBtn} onClick={() => addArgument('boolean')}>
                            <div style={{...styles.iconBox, borderRadius: '20px', width: '30px', height: '18px'}}></div>
                            <span style={styles.addBtnText}>Add an input<br/>boolean</span>
                        </button>
                        <button type="button" style={styles.addBtn} onClick={() => addArgument('label')}>
                            <div style={{...styles.iconBox, border: 'none', fontWeight: 'bold'}}>label</div>
                            <span style={styles.addBtnText}>Add a label</span>
                        </button>
                    </div>

                    {/* Inputs and Labels Configurator */}
                    <div style={styles.configArea}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.fieldLabel}>Block name:</label>
                            <input
                                type="text"
                                value={blockName}
                                onChange={(e) => {
                                    setBlockName(e.target.value);
                                    setError(null);
                                }}
                                style={{
                                    ...styles.textInput,
                                    borderColor: error ? '#ff6680' : '#ddd'
                                }}
                                autoFocus
                            />
                            {error && <span style={styles.errorText}>{error}</span>}
                        </div>

                        {args.map((arg, index) => (
                            <div key={arg.id} style={styles.argRow}>
                                <span style={styles.argLabel}>{arg.type === 'label' ? 'Label:' : 'Input:'}</span>
                                <input
                                    type="text"
                                    value={arg.value}
                                    onChange={(e) => updateArgument(arg.id, e.target.value)}
                                    style={styles.argInput}
                                />
                                <button
                                    type="button"
                                    style={styles.removeArgBtn}
                                    onClick={() => removeArgument(arg.id)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Warp Mode Toggle */}
                    <div style={styles.checkboxRow}>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={warp}
                                onChange={(e) => setWarp(e.target.checked)}
                                style={styles.checkbox}
                            />
                            <span>Run without screen refresh</span>
                        </label>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="button" style={styles.cancelBtn} onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        style={{
                            ...styles.okBtn,
                            opacity: blockName.trim() ? 1 : 0.5,
                            cursor: blockName.trim() ? 'pointer' : 'not-allowed'
                        }}
                        onClick={() => handleSubmit()}
                        disabled={!blockName.trim()}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(2px)',
    },
    dialog: {
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
        width: '560px',
        maxWidth: '90vw',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        backgroundColor: '#FF6680',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: 700,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '28px',
        cursor: 'pointer',
        fontWeight: 300,
        lineHeight: 1,
    },
    content: {
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto',
    },
    previewSection: {
        display: 'flex',
        justifyContent: 'center',
        background: '#F8F9FA',
        padding: '32px',
        borderRadius: '12px',
        border: '2px solid #EDF2F7',
    },
    previewBlock: {
        backgroundColor: '#FF6680',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 0 #CC5166',
        fontSize: '1.1rem',
        fontWeight: 700,
        flexWrap: 'wrap',
    },
    previewText: {
        whiteSpace: 'nowrap',
    },
    previewArg: {
        fontSize: '0.9rem',
        minWidth: '32px',
        textAlign: 'center',
    },
    addButtonsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
    },
    addBtn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    addBtnText: {
        fontSize: '0.75rem',
        color: '#4A5568',
        lineHeight: 1.2,
        fontWeight: 500,
    },
    iconBox: {
        width: '40px',
        height: '24px',
        backgroundColor: 'white',
        border: '1px solid #CBD5E0',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        color: '#4A5568',
    },
    configArea: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    fieldLabel: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#4A5568',
    },
    textInput: {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        fontSize: '0.95rem',
        outline: 'none',
        width: '100%',
    },
    argRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px',
        backgroundColor: '#F7FAFC',
        borderRadius: '8px',
        border: '1px solid #EDF2F7',
    },
    argLabel: {
        fontSize: '0.8rem',
        color: '#718096',
        minWidth: '60px',
        fontWeight: 500,
    },
    argInput: {
        flex: 1,
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #E2E8F0',
        fontSize: '0.9rem',
        outline: 'none',
    },
    removeArgBtn: {
        background: 'none',
        border: 'none',
        color: '#A0AEC0',
        cursor: 'pointer',
        fontSize: '1.5rem',
        fontWeight: 200,
        padding: '0 4px',
    },
    errorText: {
        color: '#FF6680',
        fontSize: '0.75rem',
        fontWeight: 500,
    },
    checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '4px 0',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.95rem',
        color: '#4A5568',
        cursor: 'pointer',
        fontWeight: 500,
    },
    checkbox: {
        width: '20px',
        height: '20px',
        cursor: 'pointer',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '24px',
        borderTop: '1px solid #EDF2F7',
    },
    cancelBtn: {
        padding: '10px 24px',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#4A5568',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.95rem',
    },
    okBtn: {
        padding: '10px 32px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#FF6680',
        color: 'white',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px rgba(255, 102, 128, 0.2)',
    },
};

export default MakeBlockDialog;
