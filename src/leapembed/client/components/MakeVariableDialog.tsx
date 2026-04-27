/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import Blockly from '../../server/blockly/runtime';

interface MakeVariableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateVariable: (variable: {
        name: string;
        type: 'Number' | 'String';
        scope: 'all_sprites' | 'this_sprite';
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

function MakeVariableDialog({
    isOpen,
    onClose,
    onCreateVariable,
    workspace
}: MakeVariableDialogProps) {
    const [variableName, setVariableName] = useState('');
    const [variableType, setVariableType] = useState<'Number' | 'String'>('Number');
    const [variableScope, setVariableScope] = useState<'all_sprites' | 'this_sprite'>('all_sprites');
    const [error, setError] = useState<string | null>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setVariableName('');
            setVariableType('Number');
            setVariableScope('all_sprites');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const trimmedName = variableName.trim();

        if (!trimmedName) {
            setError('Variable name cannot be empty');
            return;
        }

        // Check if variable already exists
        if (workspace) {
            const existingVars = workspace.getVariableMap().getAllVariables();
            const exists = existingVars.some((v: any) =>
                v.name.toLowerCase() === trimmedName.toLowerCase()
            );
            if (exists) {
                setError('A variable with this name already exists');
                return;
            }
        }

        // Create the variable in Blockly
        if (workspace) {
            try {
                const newVar = workspace.getVariableMap().createVariable(trimmedName, variableType);
                if (newVar) {
                    onCreateVariable({
                        name: trimmedName,
                        type: variableType,
                        scope: variableScope
                    });
                    onClose();
                }
            } catch (err) {
                setError('Failed to create variable. Please try again.');
                console.error('[MakeVariableDialog] Error creating variable:', err);
            }
        }
    };

    const handleCancel = () => {
        setVariableName('');
        setError(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && variableName.trim()) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.dialog}>
                {/* Header */}
                <div style={styles.header}>
                    <span style={styles.headerText}>New Variable</span>
                    <button style={styles.closeBtn} onClick={handleCancel}>×</button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {/* Variable Name Input */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>New variable name:</label>
                        <input
                            type="text"
                            value={variableName}
                            onChange={(e) => {
                                setVariableName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter variable name"
                            style={{
                                ...styles.input,
                                borderColor: error ? '#ff6b6b' : '#ddd'
                            }}
                            autoFocus
                        />
                        {error && <span style={styles.errorText}>{error}</span>}
                    </div>

                    {/* Data Type Toggle */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Data Type:</label>
                        <div style={styles.toggleContainer}>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(variableType === 'Number' ? styles.toggleActive : {})
                                }}
                                onClick={() => setVariableType('Number')}
                            >
                                <span style={styles.toggleIcon}>🔢</span>
                                Number
                            </button>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(variableType === 'String' ? styles.toggleActive : {})
                                }}
                                onClick={() => setVariableType('String')}
                            >
                                <span style={styles.toggleIcon}>📝</span>
                                String
                            </button>
                        </div>
                    </div>

                    {/* Scope Toggle */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Scope:</label>
                        <div style={styles.toggleContainer}>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(variableScope === 'all_sprites' ? styles.toggleActive : {})
                                }}
                                onClick={() => setVariableScope('all_sprites')}
                            >
                                <span style={styles.toggleIcon}>🌐</span>
                                For all sprites
                            </button>
                            <button
                                style={{
                                    ...styles.toggleBtn,
                                    ...(variableScope === 'this_sprite' ? styles.toggleActive : {})
                                }}
                                onClick={() => setVariableScope('this_sprite')}
                            >
                                <span style={styles.toggleIcon}>👤</span>
                                For this sprite only
                            </button>
                        </div>
                    </div>

                    {/* Block Preview */}
                    <div style={styles.previewSection}>
                        <label style={styles.label}>Preview:</label>
                        <div style={styles.previewBlock}>
                            <span style={styles.previewLabel}>set</span>
                            <span style={styles.previewVariable}>{variableName || 'my variable'}</span>
                            <span style={styles.previewLabel}>to</span>
                            <span style={styles.previewValue}>
                                {variableType === 'Number' ? '0' : '""'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <button style={styles.cancelBtn} onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        style={{
                            ...styles.okBtn,
                            opacity: variableName.trim() ? 1 : 0.5,
                            cursor: variableName.trim() ? 'pointer' : 'not-allowed'
                        }}
                        onClick={handleSubmit}
                        disabled={!variableName.trim()}
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
        backgroundColor: '#FF8C1A',
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
        borderColor: '#FF8C1A',
        backgroundColor: '#FFF5E6',
        color: '#FF8C1A',
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
        backgroundColor: '#FF8C1A',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '8px',
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(255, 140, 26, 0.3)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
        backgroundColor: '#FF8C1A',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'background 0.2s',
    },
};

export default MakeVariableDialog;
