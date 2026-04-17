import React, { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import TrainingPanel from '../../components/TrainingPanel';

/**
 * CSV upload + k-NN
 * Numerical data classification using CSV files
 */
function NumbersClassifier({ project }) {
    const [csvData, setCsvData] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [targetColumn, setTargetColumn] = useState('');
    const [modelTrained, setModelTrained] = useState(false);
    const [testInput, setTestInput] = useState({});
    const [prediction, setPrediction] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx];
            });
            return row;
        });

        setHeaders(headers);
        setCsvData(data);
        setTargetColumn(headers[headers.length - 1]); // Default to last column
    };

    const handleTrain = async () => {
        if (!csvData || !targetColumn) {
            alert('Please upload CSV and select target column');
            return;
        }

        // TODO: Implement k-NN training
        setModelTrained(true);
        alert('Numbers model training coming soon!');
    };

    const handlePredict = () => {
        if (!modelTrained) return;
        // TODO: Implement k-NN prediction
        setPrediction({ class: 'Class A', confidence: 0.92 });
    };

    return (
        <ClassifierLayout project={project}>
            <div className="numbers-classifier two-panel-layout">
                <div className="panel data-section">
                    <div className="panel-header">
                        <h3>Training Data</h3>
                    </div>

                    <div className="upload-section">
                        <label className="btn-upload">
                            📁 Upload CSV File
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </label>

                        {csvData && (
                            <div className="csv-info">
                                <p>✓ Loaded {csvData.length} rows</p>
                            </div>
                        )}
                    </div>

                    {headers.length > 0 && (
                        <div className="column-selection">
                            <label>Target Column (what to predict)</label>
                            <select
                                value={targetColumn}
                                onChange={(e) => setTargetColumn(e.target.value)}
                            >
                                {headers.map(header => (
                                    <option key={header} value={header}>
                                        {header}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {csvData && (
                        <div className="data-preview">
                            <h4>Data Preview</h4>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            {headers.map(header => (
                                                <th key={header}>{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvData.slice(0, 5).map((row, idx) => (
                                            <tr key={idx}>
                                                {headers.map(header => (
                                                    <td key={header}>{row[header]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

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

                    <div className="test-inputs">
                        {headers.filter(h => h !== targetColumn).map(header => (
                            <div key={header} className="input-row">
                                <label>{header}</label>
                                <input
                                    type="number"
                                    value={testInput[header] || ''}
                                    onChange={(e) => setTestInput({
                                        ...testInput,
                                        [header]: e.target.value,
                                    })}
                                />
                            </div>
                        ))}

                        <button
                            className="btn-primary"
                            onClick={handlePredict}
                            disabled={!modelTrained}
                        >
                            Predict
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

export default NumbersClassifier;
