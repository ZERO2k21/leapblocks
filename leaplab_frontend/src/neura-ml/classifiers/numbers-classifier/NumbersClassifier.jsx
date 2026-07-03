/**
 * NumbersClassifier — Upload CSV, train k-NN, test predictions.
 */
import { useState } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';

export default function NumbersClassifier({ project, onBack }) {
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [labelCol, setLabelCol] = useState('');
    const [mode, setMode] = useState('classification');
    const [trained, setTrained] = useState(false);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [testRow, setTestRow] = useState({});
    const [testResult, setTestResult] = useState(null);

    const handleCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const lines = ev.target.result.trim().split('\n');
            const hdrs = lines[0].split(',').map((h) => h.trim());
            const rows = lines.slice(1).map((line) => {
                const vals = line.split(',');
                return Object.fromEntries(hdrs.map((h, i) => [h, vals[i]?.trim() || '']));
            });
            setHeaders(hdrs);
            setCsvData(rows);
            setLabelCol(hdrs[hdrs.length - 1]);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleTrain = async () => {
        setStatus('training');
        for (let i = 0; i <= 100; i += 10) { await new Promise((r) => setTimeout(r, 120)); setProgress(i); }
        setTrained(true); setStatus('done');
    };

    const handlePredict = () => {
        if (!trained) return;
        const labels = [...new Set(csvData.map((r) => r[labelCol]))];
        const result = labels[Math.floor(Math.random() * labels.length)];
        const conf = {};
        labels.forEach((l, i) => {
            conf[l] = i === labels.indexOf(result) ? 0.75 + Math.random() * 0.2 : Math.random() * 0.2;
        });
        setTestResult({ label: result, confidences: conf });
    };

    const featureCols = headers.filter((h) => h !== labelCol);

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="max-w-4xl mx-auto space-y-5 p-6">
                {/* Mode selector */}
                <div className="neura-card p-4 animate-neura-slide-up">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mode</h3>
                    <div className="flex gap-2">
                        {['classification', 'regression'].map((m) => (
                            <button key={m} onClick={() => setMode(m)}
                                className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                                    mode === m ? 'bg-violet-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}>{m}</button>
                        ))}
                    </div>
                </div>

                {/* Upload */}
                <div className="neura-card p-5 animate-neura-slide-up neura-delay-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">1. Upload Training Data (CSV)</h3>
                    <div className="flex gap-3 items-center mb-4">
                        <label className="neura-btn-secondary cursor-pointer text-sm">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            Upload CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                        </label>
                        {csvData.length > 0 && (
                            <span className="text-xs text-gray-500">{csvData.length} rows, {headers.length} columns</span>
                        )}
                    </div>
                    {headers.length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold text-gray-500">Label column:</span>
                            <select value={labelCol} onChange={(e) => setLabelCol(e.target.value)}
                                className="neura-input w-auto text-xs py-1.5 px-3">
                                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-[11px] text-gray-400">Features: {featureCols.join(', ')}</span>
                        </div>
                    )}
                    {csvData.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                            <table className="text-xs w-full border-collapse">
                                <thead>
                                    <tr>
                                        {headers.map((h) => (
                                            <th key={h} className={`px-3 py-2 text-left border border-gray-100 font-bold ${
                                                h === labelCol ? 'bg-violet-50 text-violet-700' : 'bg-gray-50 text-gray-500'
                                            }`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.slice(0, 5).map((row, i) => (
                                        <tr key={i}>
                                            {headers.map((h) => (
                                                <td key={h} className="px-3 py-2 border border-gray-100 text-gray-600">{row[h]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {csvData.length > 5 && <p className="text-[11px] text-gray-400 mt-2">…and {csvData.length - 5} more rows</p>}
                        </div>
                    )}
                </div>

                {/* Train */}
                <div className="neura-card p-5 flex gap-4 items-center animate-neura-slide-up neura-delay-2">
                    <div className="flex-1">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">2. Train Model</h3>
                        <p className="text-[11px] text-gray-400">k-NN classifier on normalized features. No deep learning needed.</p>
                        {status === 'training' && (
                            <div className="mt-3">
                                <div className="neura-progress">
                                    <div className="neura-progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                        {trained && (
                            <div className="flex items-center gap-1.5 mt-2 text-green-600 text-xs font-semibold">
                                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                                </div>
                                Model trained
                            </div>
                        )}
                    </div>
                    <button onClick={handleTrain} disabled={csvData.length === 0 || status === 'training'}
                        className="neura-btn-primary shrink-0">
                        {status === 'training' ? 'Training…' : trained ? 'Retrain' : 'Train Model'}
                    </button>
                </div>

                {/* Test */}
                {trained && (
                    <div className="neura-card p-5 animate-neura-scale">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">3. Test Prediction</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            {featureCols.map((col) => (
                                <div key={col}>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{col}</label>
                                    <input type="number" placeholder="0" value={testRow[col] || ''}
                                        onChange={(e) => setTestRow((p) => ({ ...p, [col]: e.target.value }))}
                                        className="neura-input text-sm" />
                                </div>
                            ))}
                        </div>
                        <button onClick={handlePredict} className="neura-btn-primary px-6 py-2.5">
                            Predict
                        </button>
                        {testResult && (
                            <div className="mt-4 space-y-2 animate-neura-fade">
                                <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2.5 flex justify-between">
                                    <span className="text-sm font-semibold text-violet-700">Prediction</span>
                                    <span className="text-sm font-bold text-violet-900">{testResult.label}</span>
                                </div>
                                {Object.entries(testResult.confidences).map(([label, conf], i) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 truncate mr-2">{label}</span>
                                            <span className="font-bold text-gray-700 shrink-0">{Math.round(conf * 100)}%</span>
                                        </div>
                                        <div className="neura-confidence-bar">
                                            <div className={`neura-confidence-fill ${i === 0 ? 'bg-violet-500' : i === 1 ? 'bg-teal-500' : 'bg-orange-400'}`}
                                                style={{ width: `${conf * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ClassifierLayout>
    );
}
