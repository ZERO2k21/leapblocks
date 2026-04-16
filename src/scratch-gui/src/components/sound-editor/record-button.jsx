/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import './sound-editor.css'; // We will create this CSS file later

const RecordButton = ({ isRecording, onClick }) => {
    return (
        <div className="record-button-container">
            <button
                className={`record-button ${isRecording ? 'recording' : ''}`}
                onClick={onClick}
                title={isRecording ? "Stop Recording" : "Record Sound"}
            >
                <div className="record-button-inner"></div>
            </button>
        </div>
    );
};

export default RecordButton;
