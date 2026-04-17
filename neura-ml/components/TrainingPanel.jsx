import React, { useState } from 'react';

/**
 * Train button, progress, JS/Py toggle, advanced settings
 * Shared training UI across all classifiers
 */
function TrainingPanel({
    onTrain,
    isTraining,
    progress,
    modelTrained,
    advancedSettings
}) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [exportFormat, setExportFormat] = useState('javascript');

    return (
        <div className="training-panel">
            <div className="training-header">
                <h3>Training</h3>
                {modelTrained && <span className="status-badge success">✓ Model Trained</span>}
            </div>

            <div className="training-controls">
                <button
                    className="btn-train"
                    onClick={onTrain}
                    disabled={isTraining}
                >
                    {isTraining ? '⏳ Training...' : '🚀 Train Model'}
                </button>

                {isTraining && (
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                        <span className="progress-text">{progress}%</span>
                    </div>
                )}
            </div>

            <div className="export-section">
                <label>Export Format</label>
                <div className="export-toggle">
                    <button
                        className={exportFormat === 'javascript' ? 'active' : ''}
                        onClick={() => setExportFormat('javascript')}
                    >
                        JavaScript
                    </button>
                    <button
                        className={exportFormat === 'python' ? 'active' : ''}
                        onClick={() => setExportFormat('python')}
                    >
                        Python
                    </button>
                </div>
            </div>

            <button
                className="btn-advanced"
                onClick={() => setShowAdvanced(!showAdvanced)}
            >
                ⚙️ Advanced Settings {showAdvanced ? '▼' : '▶'}
            </button>

            {showAdvanced && (
                <div className="advanced-settings">
                    {advancedSettings || (
                        <>
                            <div className="setting-row">
                                <label>Epochs</label>
                                <input type="number" defaultValue={50} min={1} max={200} />
                            </div>
                            <div className="setting-row">
                                <label>Batch Size</label>
                                <input type="number" defaultValue={32} min={1} max={128} />
                            </div>
                            <div className="setting-row">
                                <label>Learning Rate</label>
                                <input type="number" defaultValue={0.001} step={0.0001} />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default TrainingPanel;
