import React, { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';

/**
 * MediaPipe 21 landmarks
 * Hand gesture classification using MediaPipe Hands
 */
function HandPoseClassifier({ project }) {
    const [classes, setClasses] = useState([
        { id: 0, name: 'Gesture 1', samples: [], color: '#FF6B6B' },
        { id: 1, name: 'Gesture 2', samples: [], color: '#4ECDC4' },
    ]);
    const [modelTrained, setModelTrained] = useState(false);

    const handleTrain = async () => {
        // TODO: Implement hand pose model training with MediaPipe
        setModelTrained(true);
        alert('Hand pose model training coming soon!');
    };

    return (
        <ClassifierLayout project={project}>
            <div className="hand-pose-classifier three-panel-layout">
                <div className="panel classes-panel">
                    <div className="panel-header">
                        <h3>Hand Gesture Classes</h3>
                    </div>
                    <div className="classes-list">
                        {classes.map(cls => (
                            <ClassCard
                                key={cls.id}
                                classData={cls}
                                color={cls.color}
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

export default HandPoseClassifier;
