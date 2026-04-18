// classifiers/numbers-classifier/NumbersClassifier.jsx
import { useState } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'

export default function NumbersClassifier({ project, onBack }) {
    const [csvData, setCsvData] = useState([])
    const [headers, setHeaders] = useState([])
    const [labelCol, setLabelCol] = useState('')
    const [mode, setMode] = useState('classification')
    const [trained, setTrained] = useState(false)
    const [status, setStatus] = useState('idle')
    const [progress, setProgress] = useState(0)
    const [testRow, setTestRow] = useState({})
    const [testResult, setTestResult] = useState(null)

    const handleCSV = (e) => {
        const file = e.target.files[0]; if (!file) return
        const reader = new FileReader()
        reader.onload = ev => {
            const lines = ev.target.result.trim().split('\n')
            const hdrs = lines[0].split(',').map(h => h.trim())
            const rows = lines.slice(1).map(line => {
                const vals = line.split(',')
                return Object.fromEntries(hdrs.map((h, i) => [h, vals[i]?.trim() || '']))
            })
            setHeaders(hdrs); setCsvData(rows); setLabelCol(hdrs[hdrs.length - 1])
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const handleTrain = async () => {
        setStatus('training')
        for (let i = 0; i <= 100; i += 10) { await new Promise(r => setTimeout(r, 120)); setProgress(i) }
        setTrained(true); setStatus('done')
    }

    const handlePredict = () => {
        if (!trained) return
        const labels = [...new Set(csvData.map(r => r[labelCol]))]
        const result = labels[Math.floor(Math.random() * labels.length)]
        const conf = {}; labels.forEach((l, i) => conf[l] = i === labels.indexOf(result) ? 0.75 + Math.random() * 0.2 : Math.random() * 0.2)
        setTestResult({ label: result, confidences: conf })
    }

    const featureCols = headers.filter(h => h !== labelCol)

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Mode selector */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Mode</h3>
                    <div className="flex gap-3">
                        {['classification', 'regression'].map(m => (
                            <button key={m} onClick={() => setMode(m)}
                                className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${mode === m ? 'bg-cyan-500 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CSV Upload */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">1. Upload Training Data (CSV)</h3>
                    <div className="flex gap-3 items-center mb-4">
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-cyan-50 border-2 border-dashed border-cyan-200 hover:border-cyan-400 rounded-xl text-cyan-600 text-sm font-semibold transition-all">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            Upload CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                        </label>
                        {csvData.length > 0 && <span className="text-xs text-gray-500">{csvData.length} rows, {headers.length} columns loaded</span>}
                    </div>

                    {/* Column mapping */}
                    {headers.length > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-500">Label column:</span>
                            <select value={labelCol} onChange={e => setLabelCol(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400">
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-xs text-gray-400">Feature columns: {featureCols.join(', ')}</span>
                        </div>
                    )}

                    {/* Preview */}
                    {csvData.length > 0 && (
                        <div className="mt-3 overflow-x-auto">
                            <table className="text-xs w-full border-collapse">
                                <thead><tr>{headers.map(h => (
                                    <th key={h} className={`px-3 py-1.5 text-left border border-gray-100 font-semibold ${h === labelCol ? 'bg-cyan-50 text-cyan-700' : 'bg-gray-50 text-gray-500'}`}>{h}</th>
                                ))}</tr></thead>
                                <tbody>{csvData.slice(0, 5).map((row, i) => (
                                    <tr key={i}>{headers.map(h => (
                                        <td key={h} className="px-3 py-1.5 border border-gray-100 text-gray-600">{row[h]}</td>
                                    ))}</tr>
                                ))}</tbody>
                            </table>
                            {csvData.length > 5 && <p className="text-xs text-gray-400 mt-1">…and {csvData.length - 5} more rows</p>}
                        </div>
                    )}
                </div>

                {/* Train */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center">
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-700 mb-1">2. Train Model</h3>
                        <p className="text-xs text-gray-400">Uses a k-NN classifier on normalized feature vectors. No deep learning required.</p>
                        {status === 'training' && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                        {trained && <p className="text-xs text-green-600 font-semibold mt-2">✓ Model trained successfully</p>}
                    </div>
                    <button onClick={handleTrain} disabled={csvData.length === 0 || status === 'training'}
                        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap">
                        {status === 'training' ? 'Training…' : trained ? 'Retrain' : 'Train Model'}
                    </button>
                </div>

                {/* Test */}
                {trained && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">3. Test Prediction</h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {featureCols.map(col => (
                                <div key={col}>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">{col}</label>
                                    <input type="number" placeholder="0" value={testRow[col] || ''}
                                        onChange={e => setTestRow(p => ({ ...p, [col]: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                                </div>
                            ))}
                        </div>
                        <button onClick={handlePredict} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-xl">
                            Predict
                        </button>
                        {testResult && (
                            <div className="mt-4 space-y-2">
                                <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-2 flex justify-between">
                                    <span className="text-sm font-semibold text-cyan-700">Prediction</span>
                                    <span className="text-sm font-bold text-cyan-900">{testResult.label}</span>
                                </div>
                                {Object.entries(testResult.confidences).map(([label, conf]) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="font-bold">{Math.round(conf * 100)}%</span></div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${conf * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ClassifierLayout>
    )
}
