import React, { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import ClassCard from '../../components/ClassCard';
import TrainingPanel from '../../components/TrainingPanel';

/**
 * Type examples per class
 * Text classification using typed examples
 */
function TextClassifier({ project }) {
    const [classes, setClasses] = useState([
        { id: 0, name: 'Category 1', samples: [], color: '#FF6B6B' },
        { id: 1, name: 'Category 2', samples: [], color: '#4ECDC4' },
    ]);
    const [activeClass, setActiveClass] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [testText, setTestText] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [modelTrained, setModelTrained] = useState(false);

    const handleAddText = (classId) => {
        if (!textInput.trim()) return;

        const updatedClasses = classes.map(cls => {
            if (cls.id === classId) {
                return {
                    ...cls,
                    samples: [...cls.samples, { text: textInput.trim() }],
                };
            }
            return cls;
        });
        setClasses(updatedClasses);
        setTextInput('');
    };

    const handleTrain = async () => {
        // TODO: Implement text classification training
        setModelTrained(true);
        alert('Text model training coming soon!');
    };

    const handleTest = () => {
        if (!testText.trim() || !modelTrained) return;
        // TODO: Implement text prediction
        setPrediction({ class: 'Category 1', confidence: 0.85 });
    };

    return (
        <ClassifierLayout project={project}>
            <div className="text-classifier two-panel-layout">
                <div className="panel training-section">
                    <div className="panel-header">
                        <h3>Training Data</h3>
                    </div>

                    <div className="classes-list">
                        {classes.map(cls => (
                            <div key={cls.id} className="text-class-card">
                                <div className="class-header" style={{ backgroundColor: cls.color }}>
                                    <h4>{cls.name}</h4>
                                    <span>{cls.samples.length} examples</span>
                                </div>

                                <div className="text-input-area">
                                    <textarea
                                        placeholder="Type example text..."
                                        value={activeClass === cls.id ? textInput : ''}
                                        onChange={(e) => {
                                            setActiveClass(cls.id);
                                            setTextInput(e.target.value);
                                        }}
                                        rows={3}
                                    />
                                    <button onClick={() => handleAddText(cls.id)}>
                                        + Add Example
                                    </button>
                                </div>

                                <div className="examples-list">
                                    {cls.samples.map((sample, idx) => (
                                        <div key={idx} className="example-item">
                                            {sample.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <TrainingPanel
                        onTrain={handleTrain}
                        isTraining={false}
                        progress={0}
                        modelTrained={modelTrained}
                    />
                </div>

                <div className="panel testing-section">
                    <div className="panel-header">
                        <h3>Test Your Model</h3>
                    </div>

                    <div className="test-area">
                        <textarea
                            placeholder="Enter text to classify..."
                            value={testText}
                            onChange={(e) => setTestText(e.target.value)}
                            rows={5}
                        />
                        <button
                            className="btn-primary"
                            onClick={handleTest}
                            disabled={!modelTrained}
                        >
                            Classify Text
                        </button>

                        {prediction && (
                            <div className="prediction-result">
                                <h4>Prediction</h4>
                                <p>Class: {prediction.class}</p>
                                <p>Confidence: {(prediction.confidence * 100).toFixed(1)}%</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ClassifierLayout>
    );
}

export default TextClassifier;
