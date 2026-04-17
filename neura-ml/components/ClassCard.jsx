import React from 'react';

/**
 * Colored class card (upload/webcam/samples)
 * Used in training panel to show each class with sample count
 */
function ClassCard({
    classData,
    color,
    onAddSamples,
    onWebcam,
    onUpload,
    onDelete
}) {
    return (
        <div className="class-card" style={{ borderColor: color }}>
            <div className="class-header" style={{ backgroundColor: color }}>
                <input
                    type="text"
                    value={classData.name}
                    placeholder="Class Name"
                    className="class-name-input"
                    onChange={(e) => classData.onRename?.(e.target.value)}
                />
                <button className="btn-delete-class" onClick={onDelete}>
                    ×
                </button>
            </div>

            <div className="class-body">
                <div className="sample-count">
                    {classData.samples?.length || 0} samples
                </div>

                <div className="class-actions">
                    {onWebcam && (
                        <button className="btn-icon" onClick={onWebcam} title="Add from Webcam">
                            📷
                        </button>
                    )}
                    {onUpload && (
                        <button className="btn-icon" onClick={onUpload} title="Upload Files">
                            📁
                        </button>
                    )}
                    {onAddSamples && (
                        <button className="btn-primary" onClick={onAddSamples}>
                            + Add Samples
                        </button>
                    )}
                </div>

                {classData.samples?.length > 0 && (
                    <div className="sample-preview">
                        {classData.samples.slice(0, 3).map((sample, idx) => (
                            <div key={idx} className="sample-thumbnail">
                                {sample.preview || '📊'}
                            </div>
                        ))}
                        {classData.samples.length > 3 && (
                            <div className="sample-more">+{classData.samples.length - 3}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassCard;
