import React, { useState, useEffect } from 'react';
import Blockly from '@blockly-runtime';

interface MakeListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateList: (list: {
        name: string;
        scope: 'all_sprites' | 'this_sprite';
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

export const MakeListDialog: React.FC<MakeListDialogProps> = ({
    isOpen,
    onClose,
    onCreateList,
    workspace
}) => {
    const [listName, setListName] = useState('');
    const [listScope, setListScope] = useState<'all_sprites' | 'this_sprite'>('all_sprites');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setListName('');
            setListScope('all_sprites');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const trimmedName = listName.trim();
        
        if (!trimmedName) {
            setError('List name cannot be empty');
            return;
        }

        if (workspace) {
            const existingVars = workspace.getVariableMap().getAllVariables();
            const exists = existingVars.some((v: any) => 
                v.name.toLowerCase() === trimmedName.toLowerCase() && v.type === 'list'
            );
            if (exists) {
                setError('A list with this name already exists');
                return;
            }
        }

        if (workspace) {
            try {
                const newList = workspace.createVariable(trimmedName, 'list');
                if (newList) {
                    onCreateList({
                        name: trimmedName,
                        scope: listScope
                    });
                    onClose();
                }
            } catch (err) {
                setError('Failed to create list. Please try again.');
                console.error('[MakeListDialog] Error creating list:', err);
            }
        }
    };

    const handleCancel = () => {
        setListName('');
        setError(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && listName.trim()) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.dialog}>
                <div style={styles.header}>
                    <span style={styles.headerText}>New List</span>
                    <button style={styles.closeBtn} onClick={handleCancel}>×</button>
                </div>

                <div style={styles.content}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>New list name:</label>
                        <input
                            type="text"
                            value={listName}
                            onChange={(e) => {
                                setListName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter list name"
                            style={{
                                ...styles.input,
                                borderColor: error ? '#ff6b6b' : '#ddd'
                            }}
                            autoFocus
                        />
                        {error && <span style={styles.errorText}>{error}</span>}
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Scope:</label>
                        <div style={styles.toggleContainer}>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(listScope === 'all_sprites' ? styles.toggleActive : {})
                                }}
                                onClick={() => setListScope('all_sprites')}
                            >
                                <span style={styles.toggleIcon}>🌐</span>
                                For all sprites
                            </button>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(listScope === 'this_sprite' ? styles.toggleActive : {})
                                }}
                                onClick={() => setListScope('this_sprite')}
                            >
                                <span style={styles.toggleIcon}>👤</span>
                                For this sprite only
                            </button>
                        </div>
                    </div>

                    <div style={styles.previewSection}>
                        <label style={styles.label}>Preview:</label>
                        <div style={styles.previewBlock}>
                            <span style={styles.previewLabel}>add</span>
                            <span style={styles.previewValue}>thing</span>
                            <span style={styles.previewLabel}>to</span>
                            <span style={styles.previewVariable}>{listName || 'my list'}</span>
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button style={styles.cancelBtn} onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        style={{
                            ...styles.okBtn,
                            opacity: listName.trim() ? 1 : 0.5,
                            cursor: listName.trim() ? 'pointer' : 'not-allowed'
                        }}
                        onClick={handleSubmit}
                        disabled={!listName.trim()}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
    },
    dialog: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        width: '420px',
        maxWidth: '90vw',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#CF63CF',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
    },
    headerText: {
        color: 'white',
        fontSize: '18px',
        fontWeight: 600,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background 0.2s',
    },
    content: {
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#333',
    },
    input: {
        padding: '12px 14px',
        borderRadius: '8px',
        border: '2px solid #ddd',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: '12px',
        marginTop: '4px',
    },
    toggleContainer: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
    },
    toggleBtn: {
        flex: 1,
        minWidth: '120px',
        padding: '10px 14px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        color: '#555',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s',
    },
    toggleActive: {
        borderColor: '#CF63CF',
        backgroundColor: '#FCE8FC',
        color: '#CF63CF',
    },
    toggleIcon: {
        fontSize: '14px',
    },
    previewSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '8px',
    },
    previewBlock: {
        backgroundColor: '#CF63CF',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '8px',
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(207, 99, 207, 0.3)',
    },
    previewLabel: {
        fontWeight: 600,
    },
    previewVariable: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '13px',
    },
    previewValue: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '13px',
        minWidth: '24px',
        textAlign: 'center',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 20px',
        borderTop: '1px solid #eee',
    },
    cancelBtn: {
        padding: '10px 20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        color: '#555',
        transition: 'background 0.2s',
    },
    okBtn: {
        padding: '10px 24px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#CF63CF',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'background 0.2s',
    },
};

export default MakeListDialog;
