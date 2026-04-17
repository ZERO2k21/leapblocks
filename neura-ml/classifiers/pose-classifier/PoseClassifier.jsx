import React, { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';

/**
 * MoveNet keypoints
 * Body pose classification using MoveNet model
 */
function PoseClassifier({ project }) {
    const [classes, setClasses] = useState([
        { id: 0, name: 'Pose 1', samples: [], color: '#FF6B6B' },
        { id: 1, name: 'Pose 2', samples: [], color: '#4ECDC4' },
    ]);
    const [modelTrained, setModelTrained] = useState(false);

    const handleTrain = async () => {
        // TODO: Implement pose model training with MoveNet
        setModelTrained(true);
        alert('Pose model training coming soon!');
    };

    return (
        <ClassifierLayout project={project}>
            <div className="pose-classifier three-panel-layout">
                <div className="panel classes-panel">
                    <div className="panel-header">
                        <h3>Pose Classes</h3>
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

export default PoseClassifier;
