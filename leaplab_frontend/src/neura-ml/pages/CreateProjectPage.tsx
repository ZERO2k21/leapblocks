/**
 * CreateProjectPage — Premium project creation. (Pure Tailwind)
 */
import { useState } from 'react';
import NeuraHeader from '../components/NeuraHeader';
import type { CreateProjectPageProps, ProjectTypeOption, ProjectType } from '../types';

const PROJECT_TYPES: ProjectTypeOption[] = [
  { id: 'image-classifier', label: 'Image Classifier', emoji: '🖼️', gradient: 'from-orange-400 to-red-400', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Classify images into categories' },
  { id: 'object-detection', label: 'Object Detection', emoji: '🔍', gradient: 'from-green-400 to-teal-500', bg: 'bg-green-50', border: 'border-green-200', desc: 'Detect objects in images' },
  { id: 'pose-classifier', label: 'Pose Classifier', emoji: '🧍', gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Recognize body poses' },
  { id: 'hand-pose-classifier', label: 'Hand Pose Classifier', emoji: '🖐️', gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', border: 'border-purple-200', desc: 'Detect hand gestures' },
  { id: 'audio-classifier', label: 'Audio Classifier', emoji: '🎙️', gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', border: 'border-pink-200', desc: 'Classify sounds' },
  { id: 'numbers-classifier', label: 'Numbers (C/R)', emoji: '📊', gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50', border: 'border-cyan-200', desc: 'Numeric classification & regression' },
  { id: 'text-classifier', label: 'Text Classifier', emoji: '📝', gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', desc: 'Analyze text categories' },
];

export default function CreateProjectPage({
  onBack,
  onCreate,
}: CreateProjectPageProps): React.JSX.Element {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ProjectTypeOption | null>(null);
  const [error, setError] = useState<string>('');

  const handleCreate = (): void => {
    if (!name.trim()) { setError('Please enter a project name.'); return; }
    if (!selectedType) { setError('Please select a project type.'); return; }
    setError('');
    onCreate({ name: name.trim(), description: description.trim(), type: selectedType.label as ProjectType });
  };

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f7]">
      <NeuraHeader onBack={onBack} showProjectInput={false} />
      <div className="flex-1 min-h-0 overflow-y-auto flex items-start justify-center pt-10 pb-12 px-6">
        <div className="w-full max-w-3xl animate-neura-scale">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0a015a] to-[#15027a] px-8 py-5 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Create New Project</h2>
              <button onClick={onBack} className="text-white/60 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7-7 7 7 7" /></svg>
                Back
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Project Name</label>
                <input type="text" placeholder="Enter project name" value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setName(e.target.value); setError(''); }}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description <span className="normal-case font-normal">(optional)</span></label>
                <input type="text" placeholder="What does this project do?" value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                />
              </div>

              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Project Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {PROJECT_TYPES.map((type: ProjectTypeOption, i: number) => (
                    <button key={type.id} onClick={() => { setSelectedType(type); setError(''); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center group ${
                        selectedType?.id === type.id
                          ? `${type.border} ${type.bg} border-2 shadow-md scale-[1.03]`
                          : 'border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className={`w-14 h-10 rounded-lg flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${selectedType?.id === type.id ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                        {type.emoji}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${selectedType?.id === type.id ? 'text-gray-800' : 'text-gray-500'}`}>{type.label}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{type.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={handleCreate} disabled={!name.trim() || !selectedType}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0a015a] to-[#15027a] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
