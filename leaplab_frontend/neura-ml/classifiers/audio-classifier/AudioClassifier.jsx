import React, { useState, useRef } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';

/**
 * Mic record per class
 * Audio classification using microphone input
 */
function AudioClassifier({ project, onBack }) {
    const [classes, setClasses] = useState([
        { id: 0, name: 'Sound 1', samples: [], color: '#FF6B6B' },
        { id: 1, name: 'Sound 2', samples: [], color: '#4ECDC4' },
    ]);
    const [recording, setRecording] = useState(null);
    const [modelTrained, setModelTrained] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleStartRecording = async (classId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                const updatedClasses = classes.map(cls => {
                    if (cls.id === classId) {
                        return {
                            ...cls,
                            samples: [...cls.samples, { audio: audioBlob, preview: audioUrl }],
                        };
                    }
                    return cls;
                });
                setClasses(updatedClasses);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setRecording(classId);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recording !== null) {
            mediaRecorderRef.current.stop();
            setRecording(null);
        }
    };

    const handleTrain = async () => {
        // TODO: Implement audio model training
        setModelTrained(true);
        alert('Audio model training coming soon!');
    };

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="audio-classifier three-panel-layout">
                <div className="panel classes-panel">
                    <div className="panel-header">
                        <h3>Sound Classes</h3>
                    </div>
                    <div className="classes-list">
                        {classes.map(cls => (
                            <ClassCard
                                key={cls.id}
                                classData={cls}
                                color={cls.color}
                                onAddSamples={() => {
                                    if (recording === cls.id) {
                                        handleStopRecording();
                                    } else {
                                        handleStartRecording(cls.id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="panel training-panel-container">
                    <TrainingPanel
                        onTrain={handleTrain}
                        isTraining={false}
                        progress={0}
                        modelTrained={modelTrained}
                    />
                </div>

                <div className="panel testing-panel-container">
                    <TestingPanel
                        model={modelTrained}
                        classes={classes}
                        onPredict={async () => []}
                    />
                </div>
            </div>
        </ClassifierLayout>
    );
}

export default AudioClassifier;
