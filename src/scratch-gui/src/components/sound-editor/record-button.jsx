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
