import React, { useState, useEffect } from 'react';
import * as Blockly from '@blockly-runtime';

type ArgumentType = 'input' | 'boolean' | 'label';

interface BlockArgument {
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
    const [blockName, setBlockName] = useState('');
    const [args, setArgs] = useState<BlockArgument[]>([]);
    const [warp, setWarp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setBlockName('');
            setArgs([]);
            setWarp(false);
            setError(null);
        }
    }, [isOpen]);

    const addArgument = (type: ArgumentType) => {
        const newArg: BlockArgument = {
            id: `arg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            value: type === 'label' ? 'label' : (type === 'boolean' ? 'bool' : 'input')
        };
        setArgs([...args, newArg]);
    };

    const updateArgument = (id: string, value: string) => {
        setArgs(args.map(arg => arg.id === id ? { ...arg, value } : arg));
    };

    const removeArgument = (id: string) => {
        setArgs(args.filter(arg => arg.id !== id));
    };

    const handleSubmit = () => {
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
        setBlockName('');
        setArgs([]);
        setWarp(false);
        setError(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    // Generate block preview
    const generatePreview = () => {
        if (!blockName && args.length === 0) {
            return <span style={styles.previewPlaceholder}>block name</span>;
        }

        return (
            <>
                {blockName && <span style={styles.previewText}>{blockName}</span>}
                {args.map((arg, index) => {
                    if (arg.type === 'label') {
                        return <span key={arg.id} style={styles.previewText}>{arg.value}</span>;
                    } else if (arg.type === 'boolean') {
                        return (
                            <span key={arg.id} style={styles.previewBoolean}>
                                {arg.value}
                            </span>
                        );
                    } else {
                        return (
                            <span key={arg.id} style={styles.previewInput}>
                                {arg.value}
                            </span>
                        );
                    }
                })}
            </>
        );
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.dialog}>
                <div style={styles.header}>
                    <span style={styles.headerText}>Make a Block</span>
                    <button style={styles.closeBtn} onClick={handleCancel}>×</button>
                </div>

                <div style={styles.content}>
                    {/* Block Preview */}
                    <div style={styles.previewSection}>
                        <div style={styles.previewBlock}>
                            {generatePreview()}
                        </div>
                    </div>

                    {/* Block Name */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Block name:</label>
                        <input
                            type="text"
                            value={blockName}
                            onChange={(e) => {
                                setBlockName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter block name"
                            style={{
                                ...styles.input,
                                borderColor: error ? '#ff6b6b' : '#ddd'
                            }}
                            autoFocus
                        />
                        {error && <span style={styles.errorText}>{error}</span>}
                    </div>

                    {/* Arguments List */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Arguments:</label>
                        <div style={styles.argsList}>
                            {args.length === 0 ? (
                                <div style={styles.emptyArgs}>No arguments added</div>
                            ) : (
                                args.map((arg, index) => (
                                    <div key={arg.id} style={styles.argRow}>
                                        <span style={styles.argNumber}>{index + 1}.</span>
                                        {arg.type === 'label' ? (
                                            <input
                                                type="text"
                                                value={arg.value}
                                                onChange={(e) => updateArgument(arg.id, e.target.value)}
                                                placeholder="Label text"
                                                style={styles.argInput}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={arg.value}
                                                onChange={(e) => updateArgument(arg.id, e.target.value)}
                                                placeholder={arg.type === 'boolean' ? 'Boolean name' : 'Input name'}
                                                style={styles.argInput}
                                            />
                                        )}
                                        <span style={styles.argTypeBadge}>
                                            {arg.type === 'input' ? '🔢' : arg.type === 'boolean' ? '◆' : '📝'}
                                        </span>
                                        <button
                                            style={styles.removeArgBtn}
                                            onClick={() => removeArgument(arg.id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add Buttons */}
                    <div style={styles.addButtonsRow}>
                        <button
                            style={styles.addBtn}
                            onClick={() => addArgument('input')}
                        >
                            <span>🔢</span> Add an input (number)
                        </button>
                        <button
                            style={styles.addBtn}
                            onClick={() => addArgument('input')}
                        >
                            <span>📝</span> Add an input (text)
                        </button>
                        <button
                            style={styles.addBtn}
                            onClick={() => addArgument('boolean')}
                        >
                            <span>◆</span> Add an input (boolean)
                        </button>
                        <button
                            style={styles.addBtn}
                            onClick={() => addArgument('label')}
                        >
                            <span>🏷️</span> Add a label
                        </button>
                    </div>

                    {/* Warp Checkbox */}
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
                    <button style={styles.cancelBtn} onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        style={{
                            ...styles.okBtn,
                            opacity: blockName.trim() ? 1 : 0.5,
                            cursor: blockName.trim() ? 'pointer' : 'not-allowed'
                        }}
                        onClick={handleSubmit}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out',
    },
    dialog: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        width: '480px',
        maxWidth: '90vw',
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out',
    },
    // Adding CSS for animations via a style tag or external CSS is better, 
    // but for this component we can inject a style tag in useEffect or assume global CSS.
    // I'll add the header and other styles below.
    header: {
        backgroundColor: '#FF6680',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        flexShrink: 0,
    },
    // ... rest of the styles remain the same but I'll add the @keyframes logic in the component
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
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'auto',
    },
    previewSection: {
        display: 'flex',
        justifyContent: 'center',
    },
    previewBlock: {
        backgroundColor: '#FF6680',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '30px 10px 10px 30px',
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(255, 102, 128, 0.3)',
        flexWrap: 'wrap',
        maxWidth: '100%',
    },
    previewPlaceholder: {
        opacity: 0.6,
        fontStyle: 'italic',
    },
    previewText: {
        fontWeight: 600,
    },
    previewInput: {
        backgroundColor: 'white',
        color: '#333',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '13px',
        minWidth: '50px',
        textAlign: 'center',
    },
    previewBoolean: {
        backgroundColor: 'white',
        color: '#333',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '13px',
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
        minWidth: '50px',
        textAlign: 'center',
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
    argsList: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '8px',
        minHeight: '60px',
        maxHeight: '150px',
        overflow: 'auto',
    },
    emptyArgs: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '20px',
    },
    argRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px',
        backgroundColor: '#f9f9f9',
        borderRadius: '6px',
        marginBottom: '6px',
    },
    argNumber: {
        fontSize: '12px',
        color: '#999',
        width: '20px',
    },
    argInput: {
        flex: 1,
        padding: '8px 10px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        fontSize: '13px',
        outline: 'none',
        fontFamily: 'inherit',
    },
    argTypeBadge: {
        fontSize: '14px',
        padding: '4px',
    },
    removeArgBtn: {
        background: '#ff6b6b',
        border: 'none',
        color: 'white',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    },
    addButtonsRow: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    addBtn: {
        flex: 1,
        minWidth: '120px',
        padding: '10px 12px',
        border: '2px solid #FF6680',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#FF6680',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s',
    },
    checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 0',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        color: '#555',
        cursor: 'pointer',
    },
    checkbox: {
        width: '18px',
        height: '18px',
        cursor: 'pointer',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 20px',
        borderTop: '1px solid #eee',
        flexShrink: 0,
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
        backgroundColor: '#FF6680',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'background 0.2s',
    },
};

export default MakeBlockDialog;
