/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import Blockly from '@blockly-runtime';

interface MakeTableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTable: (table: {
        name: string;
        rows: number;
        cols: number;
        scope: 'all_sprites' | 'this_sprite';
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

export const MakeTableDialog: React.FC<MakeTableDialogProps> = ({
    isOpen,
    onClose,
    onCreateTable,
    workspace
}) => {
    const [tableName, setTableName] = useState('');
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [tableScope, setTableScope] = useState<'all_sprites' | 'this_sprite'>('all_sprites');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTableName('');
            setRows(3);
            setCols(3);
            setTableScope('all_sprites');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const trimmedName = tableName.trim();
        
        if (!trimmedName) {
            setError('Table name cannot be empty');
            return;
        }

        if (rows < 1 || rows > 20) {
            setError('Rows must be between 1 and 20');
            return;
        }

        if (cols < 1 || cols > 10) {
            setError('Columns must be between 1 and 10');
            return;
        }

        if (workspace) {
            const existingVars = workspace.getVariableMap().getAllVariables();
            const exists = existingVars.some((v: any) => 
                v.name.toLowerCase() === trimmedName.toLowerCase() && v.type === 'table'
            );
            if (exists) {
                setError('A table with this name already exists');
                return;
            }
        }

        if (workspace) {
            try {
                const newTable = workspace.getVariableMap().createVariable(trimmedName, 'table');
                if (newTable) {
                    onCreateTable({
                        name: trimmedName,
                        rows,
                        cols,
                        scope: tableScope
                    });
                    onClose();
                }
            } catch (err) {
                setError('Failed to create table. Please try again.');
                console.error('[MakeTableDialog] Error creating table:', err);
            }
        }
    };

    const handleCancel = () => {
        setTableName('');
        setError(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tableName.trim()) {
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
                    <span style={styles.headerText}>New Table</span>
                    <button style={styles.closeBtn} onClick={handleCancel}>×</button>
                </div>

                <div style={styles.content}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>New table name:</label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e) => {
                                setTableName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter table name"
                            style={{
                                ...styles.input,
                                borderColor: error ? '#ff6b6b' : '#ddd'
                            }}
                            autoFocus
                        />
                        {error && <span style={styles.errorText}>{error}</span>}
                    </div>

                    <div style={styles.dimensionsRow}>
                        <div style={styles.dimensionInput}>
                            <label style={styles.label}>Rows:</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={rows}
                                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                                style={styles.numberInput}
                            />
                        </div>
                        <div style={styles.dimensionInput}>
                            <label style={styles.label}>Columns:</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={cols}
                                onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                style={styles.numberInput}
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Scope:</label>
                        <div style={styles.toggleContainer}>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(tableScope === 'all_sprites' ? styles.toggleActive : {})
                                }}
                                onClick={() => setTableScope('all_sprites')}
                            >
                                <span style={styles.toggleIcon}>🌐</span>
                                For all sprites
                            </button>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(tableScope === 'this_sprite' ? styles.toggleActive : {})
                                }}
                                onClick={() => setTableScope('this_sprite')}
                            >
                                <span style={styles.toggleIcon}>👤</span>
                                For this sprite only
                            </button>
                        </div>
                    </div>

                    <div style={styles.previewSection}>
                        <label style={styles.label}>Preview:</label>
                        <div style={styles.previewBlock}>
                            <span style={styles.previewLabel}>set row</span>
                            <span style={styles.previewValue}>1</span>
                            <span style={styles.previewLabel}>column</span>
                            <span style={styles.previewValue}>1</span>
                            <span style={styles.previewLabel}>of</span>
                            <span style={styles.previewVariable}>{tableName || 'my table'}</span>
                            <span style={styles.previewLabel}>to</span>
                            <span style={styles.previewValue}>0</span>
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
                            opacity: tableName.trim() ? 1 : 0.5,
                            cursor: tableName.trim() ? 'pointer' : 'not-allowed'
                        }}
                        onClick={handleSubmit}
                        disabled={!tableName.trim()}
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
        backgroundColor: '#A52A2A',
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
    dimensionsRow: {
        display: 'flex',
        gap: '16px',
    },
    dimensionInput: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    numberInput: {
        padding: '12px 14px',
        borderRadius: '8px',
        border: '2px solid #ddd',
        fontSize: '15px',
        outline: 'none',
        fontFamily: 'inherit',
        textAlign: 'center',
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
        borderColor: '#A52A2A',
        backgroundColor: '#F5E6E6',
        color: '#A52A2A',
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
        backgroundColor: '#A52A2A',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '8px',
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(165, 42, 42, 0.3)',
    },
    previewLabel: {
        fontWeight: 600,
    },
    previewVariable: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px',
    },
    previewValue: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        minWidth: '20px',
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
        backgroundColor: '#A52A2A',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'background 0.2s',
    },
};

export default MakeTableDialog;
