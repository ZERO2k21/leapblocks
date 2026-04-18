// classifiers/text-classifier/TextClassifier.tsx
import { useState } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'
import TrainingPanel from '../../components/TrainingPanel'

type TextClass = {
  id: number
  name: string
  samples: string[]
}

type TextClassifierProps = {
  project?: any
  onBack: () => void
}

const COLORS = ['bg-violet-500','bg-orange-500','bg-teal-500','bg-pink-500','bg-blue-500']

export default function TextClassifier({ project, onBack }: TextClassifierProps) {
  const [classes, setClasses] = useState<TextClass[]>([
    { id: 1, name: 'Category 1', samples: [] },
    { id: 2, name: 'Category 2', samples: [] },
  ])
  const [nextId, setNextId] = useState(3)
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [trained, setTrained] = useState(false)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [showAdv, setShowAdv] = useState(false)
  const [epochs, setEpochs] = useState(30)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState<{ label: string; confidences: Record<string, number> } | null>(null)

  const addSample = (classId: number) => {
    const text = inputs[classId]?.trim() ?? ''
    if (!text) return
    setClasses(p => p.map(c => c.id === classId ? { ...c, samples: [...c.samples, text] } : c))
    setInputs(p => ({ ...p, [classId]: '' }))
  }

  const handleTrain = async () => {
    setStatus('training')
    for (let i=0;i<=100;i+=5) { await new Promise(r=>setTimeout(r,80)); setProgress(i) }
    setTrained(true); setStatus('done')
  }

  const handlePredict = () => {
    if (!testText.trim() || !trained) return
    // Naive keyword-overlap scoring (real impl uses USE embeddings)
    const scores: Record<string, number> = {}
    classes.forEach(cls => {
      const words = testText.toLowerCase().split(/\s+/)
      let score = 0
      cls.samples.forEach(sample => {
        const sWords = sample.toLowerCase().split(/\s+/)
        words.forEach(w => {
          if (sWords.includes(w)) score++
        })
      })
      scores[cls.name] = score + Math.random() * 0.5
    })
    const total = Object.values(scores).reduce((s, v) => s + v, 0) || 1
    const confidences: Record<string, number> = {}
    Object.entries(scores).forEach(([k, v]) => {
      confidences[k] = v / total
    })
    const winner = Object.entries(confidences).sort((a, b) => b[1] - a[1])[0][0]
    setTestResult({ label: winner, confidences })
  }

  const canTrain = classes.filter(c=>c.samples.length>0).length>=2

  return (
    <ClassifierLayout project={project} onBack={onBack}>
      <div className="flex gap-6 items-start">
        <div className="flex flex-col gap-4 flex-1">
          {classes.map((cls,i) => (
            <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`${COLORS[i%COLORS.length]} px-4 py-2.5 flex items-center justify-between`}>
                <span className="text-white font-bold text-sm">{cls.name}</span>
                <button onClick={()=>setClasses(p=>p.filter(c=>c.id!==cls.id))} className="text-white/70 hover:text-white">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Add Text Samples</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text" placeholder="Type an example sentence…"
                    value={inputs[cls.id]||''}
                    onChange={e=>setInputs(p=>({...p,[cls.id]:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&addSample(cls.id)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <button onClick={()=>addSample(cls.id)} className={`px-4 py-2 ${COLORS[i%COLORS.length]} text-white text-sm font-bold rounded-lg`}>Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cls.samples.map((s,idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                      <span className="text-xs text-gray-700">{s}</span>
                      <button onClick={()=>setClasses(p=>p.map(c=>c.id===cls.id?{...c,samples:c.samples.filter((_,j)=>j!==idx)}:c))} className="text-gray-300 hover:text-red-400">×</button>
                    </div>
                  ))}
                  {cls.samples.length===0&&<span className="text-xs text-gray-300 italic">No samples yet</span>}
                </div>
              </div>
            </div>
          ))}

          <button onClick={()=>{setClasses(p=>[...p,{id:nextId,name:`Category ${nextId}`,samples:[]}]);setNextId(n=>n+1)}}
            className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 text-gray-400 hover:text-purple-600 text-sm font-semibold transition-all">
            + Add Class
          </button>
        </div>

        <TrainingPanel status={status} progress={progress} accuracy={0.87} canTrain={canTrain}
          onTrain={handleTrain} showAdvanced={showAdv} setShowAdvanced={setShowAdv}
          epochs={epochs} setEpochs={setEpochs} trained={trained}
          sampleCounts={Object.fromEntries(classes.map(c=>[c.name,c.samples.length]))} />

        <div className="w-8 flex items-center self-stretch pt-16"><div className="w-full h-px bg-purple-200"/></div>

        <div className="w-64 bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden shrink-0">
          <div className="bg-purple-700 px-4 py-3"><span className="text-white font-bold text-sm">Testing</span></div>
          {!trained ? (
            <div className="p-5 text-center text-xs text-gray-400">Train your text model first.</div>
          ) : (
            <div className="p-4 space-y-3">
              <textarea value={testText} onChange={e=>setTestText(e.target.value)}
                placeholder="Type text to classify…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none h-20 focus:outline-none focus:ring-1 focus:ring-purple-400" />
              <button onClick={handlePredict} className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg">
                Predict
              </button>
              {testResult && (
                <div className="space-y-2">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex justify-between">
                    <span className="text-xs text-purple-600 font-semibold">Prediction</span>
                    <span className="text-xs font-bold text-purple-900">{testResult.label}</span>
                  </div>
                  {Object.entries(testResult.confidences).map(([label,conf],i)=>(
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="font-bold">{Math.round(conf*100)}%</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-violet-500 h-1.5 rounded-full" style={{width:`${conf*100}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ClassifierLayout>
  )
}
