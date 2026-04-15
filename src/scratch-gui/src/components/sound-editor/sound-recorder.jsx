/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';
import AudioRecorder from '../../lib/audio/audio-recorder';
import RecordButton from './record-button';
import LevelMeter from './level-meter';
import WaveformDisplay from './waveform-display';
import './sound-editor.css';

const SoundRecorder = ({ isOpen, onClose, onSave }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioData, setAudioData] = useState(null); // { blob, buffer, blobUrl }
    const [analyser, setAnalyser] = useState(null);
    const recorderRef = useRef(null);

    // Initialize recorder engine when modal opens
    useEffect(() => {
        if (isOpen) {
            recorderRef.current = new AudioRecorder();
            recorderRef.current.onComplete = (data) => {
                setAudioData(data);
            };

            // Request mic access immediately or on first interaction (Scratch requests on open)
            recorderRef.current.requestDevice().then(success => {
                if (success) {
                    setAnalyser(recorderRef.current.getAnalyser());
                }
            });
        }

        return () => {
            if (recorderRef.current) {
                recorderRef.current.dispose();
                recorderRef.current = null;
            }
            setIsRecording(false);
            setAudioData(null);
            setAnalyser(null);
        };
    }, [isOpen]);

    const handleToggleRecording = () => {
        if (!recorderRef.current) return;

        if (isRecording) {
            recorderRef.current.stop();
            setIsRecording(false);
        } else {
            setAudioData(null); // Clear previous
            recorderRef.current.start();
            setIsRecording(true);
        }
    };

    const handleSave = () => {
        if (audioData && onSave) {
            onSave(audioData);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="sound-recorder-overlay">
            <div className="sound-recorder-modal">
                <div className="sound-recorder-header">
                    <span>Record Sound</span>
                    <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="sound-recorder-body">
                    {/* Visualizer Row */}
                    {!audioData && (
                        <div className="level-meter-container">
                            <LevelMeter analyser={analyser} />
                        </div>
                    )}

                    {audioData && (
                        <div className="waveform-container">
                            <WaveformDisplay buffer={audioData.buffer} />
                        </div>
                    )}

                    {/* Controls Row */}
                    <RecordButton
                        isRecording={isRecording}
                        onClick={handleToggleRecording}
                    />

                    {isRecording ? (
                        <div style={{ color: '#ff4d4d', fontWeight: 'bold' }}>Recording...</div>
                    ) : (
                        <div style={{ color: '#666' }}>
                            {audioData ? 'Ready to save' : 'Click to record'}
                        </div>
                    )}
                </div>

                <div className="sound-recorder-footer">
                    <button className="button-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className="button-save"
                        onClick={handleSave}
                        disabled={!audioData || isRecording}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SoundRecorder;
