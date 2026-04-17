// pages/CreateProjectPage.jsx
import { useState } from 'react'
import NeuraHeader from '../components/NeuraHeader'

const PROJECT_TYPES = [
    {
        id: 'image-classifier',
        label: 'Image Classifier',
        description: 'Classify images into custom categories',
        emoji: '🖼️',
        gradient: 'from-orange-400 to-red-400',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        iconBg: 'bg-orange-100',
    },
    {
        id: 'object-detection',
        label: 'Object Detection',
        description: 'Detect and locate objects in images',
        emoji: '🔍',
        gradient: 'from-green-400 to-teal-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
    },
    {
        id: 'pose-classifier',
        label: 'Pose Classifier',
        description: 'Recognize body poses and movements',
        emoji: '🧍',
        gradient: 'from-blue-400 to-indigo-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
    },
    {
        id: 'hand-pose-classifier',
        label: 'Hand Pose Classifier',
        description: 'Detect hand gestures and signs',
        emoji: '🖐️',
        gradient: 'from-purple-400 to-violet-500',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
    },
    {
        id: 'audio-classifier',
        label: 'Audio Classifier',
        description: 'Classify sounds and spoken words',
        emoji: '🎙️',
        gradient: 'from-pink-400 to-rose-500',
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        iconBg: 'bg-pink-100',
    },
    {
        id: 'numbers-classifier',
        label: 'Numbers (C/R)',
        description: 'Classification & regression on numeric data',
        emoji: '📊',
        gradient: 'from-cyan-400 to-blue-500',
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        iconBg: 'bg-cyan-100',
    },
    {
        id: 'text-classifier',
        label: 'Text Classifier',
        description: 'Classify text into custom categories',
        emoji: '📝',
        gradient: 'from-violet-400 to-purple-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        iconBg: 'bg-violet-100',
    },
]

export default function CreateProjectPage({ onBack, onCreate }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedType, setSelectedType] = useState(null)
    const [error, setError] = useState('')

    const handleCreate = () => {
        if (!name.trim()) { setError('Please enter a project name.'); return }
        if (!selectedType) { setError('Please select a project type.'); return }
        setError('')
        onCreate({ name: name.trim(), description: description.trim(), type: selectedType.label })
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <NeuraHeader onBack={onBack} />

            <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Modal header */}
                    <div className="flex items-center justify-between bg-purple-700 px-8 py-4">
                        <h2 className="text-white font-bold text-lg">Create New Project</h2>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7-7 7 7 7" />
                            </svg>
                            Back
                        </button>
                    </div>

                    <div className="px-8 py-6">
                        {/* Project details */}
                        <div className="mb-6">
                            <h3 className="text-purple-700 font-bold text-base mb-4">Enter Project Details:</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Enter Project Name"
                                    value={name}
                                    onChange={e => { setName(e.target.value); setError('') }}
                                    className="w-full border-b-2 border-gray-200 focus:border-purple-500 px-0 py-2 text-sm outline-none bg-transparent placeholder-gray-300 transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Enter Project Description (optional)"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full border-b-2 border-gray-200 focus:border-purple-500 px-0 py-2 text-sm outline-none bg-transparent placeholder-gray-300 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Type selector */}
                        <div className="mb-6">
                            <h3 className="text-purple-700 font-bold text-base mb-4">Select Project Type:</h3>
                            <div className="grid grid-cols-5 gap-3">
                                {PROJECT_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => { setSelectedType(type); setError('') }}
                                        className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center cursor-pointer
                      ${selectedType?.id === type.id
                                                ? `${type.border} ${type.bg} border-2 shadow-md scale-[1.03]`
                                                : 'border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }
                    `}
                                    >
                                        <div className={`w-16 h-12 rounded-lg ${selectedType?.id === type.id ? type.iconBg : 'bg-gray-100'} flex items-center justify-center text-2xl transition-colors`}>
                                            {type.emoji}
                                        </div>
                                        <span className={`text-xs font-semibold leading-tight ${selectedType?.id === type.id ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                        <div className="flex justify-end">
                            <button
                                onClick={handleCreate}
                                disabled={!name.trim() || !selectedType}
                                className="px-8 py-3 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                            >
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
