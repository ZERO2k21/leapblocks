import React, { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';
import WebcamModal from '../../components/WebcamModal';
import useTFClassifier from '../../hooks/useTFClassifier';

/**
 * Full 3-panel PictoBlox layout
 * Image classification using webcam or uploads
 */
function ImageClassifier({ project }) {
    const [classes, setClasses] = useState([
        { id: 0, name: 'Class 1', samples: [], color: '#FF6B6B' },
        { id: 1, name: 'Class 2', samples: [], color: '#4ECDC4' },
    ]);
    const [activeClass, setActiveClass] = useState(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [modelTrained, setModelTrained] = useState(false);

    const { train, predict, isTraining, trainingProgress } = useTFClassifier();

    const handleAddClass = () => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        const newClass = {
            id: classes.length,
            name: `Class ${classes.length + 1}`,
            samples: [],
            color: colors[classes.length % colors.length],
        };
        setClasses([...classes, newClass]);
    };

    const handleDeleteClass = (classId) => {
        if (classes.length <= 2) {
            alert('You need at least 2 classes');
            return;
        }
        setClasses(classes.filter(c => c.id !== classId));
    };

    const handleWebcamCapture = (blob) => {
        if (activeClass === null) return;

        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            const updatedClasses = classes.map(cls => {
                if (cls.id === activeClass) {
                    return {
                        ...cls,
                        samples: [...cls.samples, { image: img, preview: img.src }],
                    };
                }
                return cls;
            });
            setClasses(updatedClasses);
        };
    };

    const handleFileUpload = (classId, files) => {
        const updatedClasses = classes.map(cls => {
            if (cls.id === classId) {
                const newSamples = Array.from(files).map(file => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
                    return { image: img, preview: img.src };
                });
                return {
                    ...cls,
                    samples: [...cls.samples, ...newSamples],
                };
            }
            return cls;
        });
        setClasses(updatedClasses);
    };

    const handleTrain = async () => {
        const hasEnoughSamples = classes.every(cls => cls.samples.length >= 5);
        if (!hasEnoughSamples) {
            alert('Each class needs at least 5 samples');
            return;
        }

        const success = await train(classes);
        if (success) {
            setModelTrained(true);
            alert('Model trained successfully!');
        } else {
            alert('Training failed. Please try again.');
        }
    };

    const handlePredict = async (imageElement) => {
        try {
            const result = await predict(imageElement);
            return result.predictions.map(pred => ({
                className: classes.find(c => c.id === pred.classId)?.name || 'Unknown',
                confidence: pred.confidence,
            }));
        } catch (error) {
            console.error('Prediction error:', error);
            return [];
        }
    };

    return (
        <ClassifierLayout project={project}>
            <div className="image-classifier three-panel-layout">
                {/* Left Panel: Classes */}
                <div className="panel classes-panel">
                    <div className="panel-header">
                        <h3>Classes</h3>
                        <button className="btn-add" onClick={handleAddClass}>
                            + Add Class
                        </button>
                    </div>
                    <div className="classes-list">
                        {classes.map(cls => (
                            <ClassCard
                                key={cls.id}
                                classData={cls}
                                color={cls.color}
                                onWebcam={() => {
                                    setActiveClass(cls.id);
                                    setShowWebcam(true);
                                }}
                                onUpload={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.multiple = true;
                                    input.accept = 'image/*';
                                    input.onchange = (e) => handleFileUpload(cls.id, e.target.files);
                                    input.click();
                                }}
                                onDelete={() => handleDeleteClass(cls.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Middle Panel: Training */}
                <div className="panel training-panel-container">
                    <TrainingPanel
                        onTrain={handleTrain}
                        isTraining={isTraining}
                        progress={trainingProgress}
                        modelTrained={modelTrained}
                    />
                </div>

                {/* Right Panel: Testing */}
                <div className="panel testing-panel-container">
                    <TestingPanel
                        model={modelTrained}
                        classes={classes}
                        onPredict={handlePredict}
                    />
                </div>
            </div>

            <WebcamModal
                isOpen={showWebcam}
                onClose={() => setShowWebcam(false)}
                onCapture={handleWebcamCapture}
                captureMode="hold"
            />
        </ClassifierLayout>
    );
}

export default ImageClassifier;
