/**
 * ImageClassifier — 3-panel layout: classes | training | testing.
 */
import { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';
import TestingPanel from '../../components/TestingPanel';
import WebcamModal from '../../components/WebcamModal';
import useTFClassifier from '../../hooks/useTFClassifier';

export default function ImageClassifier({ project, onBack }) {
    const [classes, setClasses] = useState([
        { id: 1, name: 'Class 1', samples: [] },
        { id: 2, name: 'Class 2', samples: [] },
    ]);
    const [activeClass, setActiveClass] = useState(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [modelTrained, setModelTrained] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState('idle');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [epochs, setEpochs] = useState(50);

    const { train, predict, isTraining, trainingProgress } = useTFClassifier();

    const handleAddClass = () => {
        setClasses([...classes, { id: Date.now(), name: `Class ${classes.length + 1}`, samples: [] }]);
    };

    const handleDeleteClass = (classId) => {
        if (classes.length <= 2) return;
        setClasses(classes.filter((c) => c.id !== classId));
    };

    const handleRenameClass = (classId, newName) => {
        setClasses(classes.map((cls) => (cls.id === classId ? { ...cls, name: newName } : cls)));
    };

    const handleAddSamples = (classId, dataURL) => {
        setClasses(classes.map((cls) => (cls.id === classId ? { ...cls, samples: [...cls.samples, { preview: dataURL }] } : cls)));
    };

    const handleWebcamCapture = (blob) => {
        if (activeClass === null) return;
        const reader = new FileReader();
        reader.onload = (e) => handleAddSamples(activeClass, e.target.result);
        reader.readAsDataURL(blob);
    };

    const handleFileUpload = (classId, files) => {
        setClasses(classes.map((cls) => {
            if (cls.id !== classId) return cls;
            const newSamples = Array.from(files).map((file) => ({ preview: URL.createObjectURL(file) }));
            return { ...cls, samples: [...cls.samples, ...newSamples] };
        }));
    };

    const handleTrain = async () => {
        const hasEnough = classes.every((cls) => cls.samples.length >= 5);
        if (!hasEnough) return alert('Each class needs at least 5 samples.');
        setTrainingStatus('training');
        const success = await train(classes);
        if (success) { setModelTrained(true); setTrainingStatus('trained'); }
        else setTrainingStatus('idle');
    };

    const handlePredict = async (canvas) => {
        try {
            const result = await predict(canvas);
            const confidences = result.predictions.reduce((acc, pred) => {
                const name = classes.find((c) => c.id === pred.classId)?.name || 'Unknown';
                acc[name] = pred.confidence;
                return acc;
            }, {});
            return { confidences };
        } catch { return { confidences: {} }; }
    };

    const sampleCounts = classes.reduce((acc, cls) => { acc[cls.name] = cls.samples.length; return acc; }, {});
    const canTrain = classes.every((cls) => cls.samples.length >= 5);

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="neura-panels">
                {/* LEFT: Classes */}
                <div className="neura-panel neura-panel-left">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Classes</h3>
                        <button onClick={handleAddClass} className="neura-btn-ghost text-violet-600 hover:text-violet-700">
                            + Add Class
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {classes.map((cls, index) => (
                            <ClassCard
                                key={cls.id}
                                classData={cls}
                                index={index}
                                onRename={handleRenameClass}
                                onDelete={handleDeleteClass}
                                onAddSamples={handleAddSamples}
                                onWebcam={() => { setActiveClass(cls.id); setShowWebcam(true); }}
                                onUpload={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.multiple = true;
                                    input.accept = 'image/*';
                                    input.onchange = (e) => handleFileUpload(cls.id, e.target.files);
                                    input.click();
                                }}
                            />
                        ))}
                        <button onClick={handleAddClass} className="neura-add-class-btn">
                            + Add Class
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="neura-panel-divider" />

                {/* CENTER: Training */}
                <div className="neura-panel neura-panel-center">
                    <TrainingPanel
                        status={trainingStatus}
                        progress={trainingProgress}
                        accuracy={0.95}
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

                {/* Divider */}
                <div className="neura-panel-divider" />

                {/* RIGHT: Testing */}
                <div className="neura-panel neura-panel-right">
                    <TestingPanel trained={modelTrained} predict={handlePredict} classes={classes} />
                </div>
            </div>

            {showWebcam && (
                <WebcamModal
                    classLabel={classes.find((c) => c.id === activeClass)?.name || ''}
                    colorIndex={classes.findIndex((c) => c.id === activeClass)}
                    onCapture={handleWebcamCapture}
                    onClose={() => setShowWebcam(false)}
                />
            )}
        </ClassifierLayout>
    );
}
