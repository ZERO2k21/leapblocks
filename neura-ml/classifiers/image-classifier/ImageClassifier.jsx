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
function ImageClassifier({ project, onBack }) {
    const [classes, setClasses] = useState([
        { id: 1, name: 'Class 1', samples: [] },
        { id: 2, name: 'Class 2', samples: [] },
    ]);
    const [activeClass, setActiveClass] = useState(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [modelTrained, setModelTrained] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState('idle'); // 'idle' | 'training' | 'trained'
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [epochs, setEpochs] = useState(50);

    const { train, predict, isTraining, trainingProgress } = useTFClassifier();

    const handleAddClass = () => {
        const newClass = {
            id: Date.now(), // Use timestamp for unique ID
            name: `Class ${classes.length + 1}`,
            samples: [],
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

    const handleRenameClass = (classId, newName) => {
        setClasses(classes.map(cls =>
            cls.id === classId ? { ...cls, name: newName } : cls
        ));
    };

    const handleWebcamCapture = (blob) => {
        if (activeClass === null) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataURL = e.target.result;
            const updatedClasses = classes.map(cls => {
                if (cls.id === activeClass) {
                    return {
                        ...cls,
                        samples: [...cls.samples, { preview: dataURL }],
                    };
                }
                return cls;
            });
            setClasses(updatedClasses);
        };
        reader.readAsDataURL(blob);
    };

    const handleAddSamples = (classId, dataURL) => {
        const updatedClasses = classes.map(cls => {
            if (cls.id === classId) {
                return {
                    ...cls,
                    samples: [...cls.samples, { preview: dataURL }],
                };
            }
            return cls;
        });
        setClasses(updatedClasses);
    };

    const handleFileUpload = (classId, files) => {
        const updatedClasses = classes.map(cls => {
            if (cls.id === classId) {
                const newSamples = Array.from(files).map(file => {
                    return { preview: URL.createObjectURL(file) };
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

        setTrainingStatus('training');
        const success = await train(classes);
        if (success) {
            setModelTrained(true);
            setTrainingStatus('trained');
            alert('Model trained successfully!');
        } else {
            setTrainingStatus('idle');
            alert('Training failed. Please try again.');
        }
    };

    const handlePredict = async (canvas) => {
        try {
            const result = await predict(canvas);
            // Return in the format expected by TestingPanel
            return {
                confidences: result.predictions.reduce((acc, pred) => {
                    const className = classes.find(c => c.id === pred.classId)?.name || 'Unknown';
                    acc[className] = pred.confidence;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Prediction error:', error);
            return { confidences: {} };
        }
    };

    // Calculate sample counts for TrainingPanel
    const sampleCounts = classes.reduce((acc, cls) => {
        acc[cls.name] = cls.samples.length;
        return acc;
    }, {});

    const canTrain = classes.every(cls => cls.samples.length >= 5);

    return (
        <ClassifierLayout project={project} onBack={onBack}>
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
                        {classes.map((cls, index) => (
                            <ClassCard
                                key={cls.id}
                                classData={cls}
                                index={index}
                                onRename={handleRenameClass}
                                onDelete={handleDeleteClass}
                                onAddSamples={handleAddSamples}
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
                                showImagePreviews={true}
                            />
                        ))}
                    </div>
                </div>

                {/* Middle Panel: Training */}
                <div className="panel training-panel-container">
                    <TrainingPanel
                        status={trainingStatus}
                        progress={trainingProgress}
                        accuracy={0.95} // TODO: Get actual accuracy from training
                        canTrain={canTrain}
                        onTrain={handleTrain}
                        showAdvanced={showAdvanced}
                        setShowAdvanced={setShowAdvanced}
                        epochs={epochs}
                        setEpochs={setEpochs}
                        trained={modelTrained}
                        sampleCounts={sampleCounts}
                    />
                </div>

                {/* Right Panel: Testing */}
                <div className="panel testing-panel-container">
                    <TestingPanel
                        trained={modelTrained}
                        predict={handlePredict}
                        classes={classes}
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
