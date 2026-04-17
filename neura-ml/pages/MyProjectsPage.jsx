// pages/MyProjectsPage.jsx
import { useState } from 'react'
import NeuraHeader from '../components/NeuraHeader'

const PROJECT_TYPE_ICONS = {
    'Image Classifier': '🖼️',
    'Object Detection': '🔍',
    'Pose Classifier': '🧍',
    'Hand Pose Classifier': '🖐️',
    'Audio Classifier': '🎙️',
    'Text Classifier': '📝',
    'Numbers (C/R)': '📊',
}

const STATUS_COLORS = {
    'Untrained': 'bg-amber-100 text-amber-700',
    'Trained': 'bg-green-100 text-green-700',
    'Training': 'bg-blue-100 text-blue-700',
}

export default function MyProjectsPage({ projects, onBack, onCreateNew, onOpenProject }) {
    const [search, setSearch] = useState('')

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NeuraHeader onBack={onBack} />

            {/* Sub-header bar — matches PictoBlox purple bar */}
            <div className="bg-purple-50 border-b border-purple-100 px-8 py-3 flex items-center gap-4">
                <h1 className="text-xl font-bold text-purple-900 mr-4">My Projects</h1>
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-purple-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-56"
                    />
                </div>
                <button
                    onClick={onCreateNew}
                    className="ml-2 px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    Create New Project
                </button>
                <button className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors">
                    Open ML Project
                </button>
            </div>

            {/* Table header */}
            <div className="mx-6 mt-4 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <div className="grid grid-cols-5 bg-purple-700 text-white text-sm font-semibold px-6 py-3">
                    <span>Project Details</span>
                    <span className="text-center">Type</span>
                    <span className="text-center">No. of Classes</span>
                    <span className="text-center">Last Updated</span>
                    <span className="text-center">Status</span>
                </div>

                {/* Empty state */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="relative w-44 h-44">
                            {/* Orbiting icons animation */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-purple-50 border-2 border-dashed border-purple-200 flex items-center justify-center">
                                    <span className="text-4xl">🧠</span>
                                </div>
                            </div>
                            <div className="absolute top-2 right-6 animate-bounce delay-100">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl shadow-sm">📝</div>
                            </div>
                            <div className="absolute bottom-4 left-2 animate-bounce delay-300">
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-xl shadow-sm">🖐️</div>
                            </div>
                            <div className="absolute top-6 left-4 animate-bounce delay-500">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl shadow-sm">🎙️</div>
                            </div>
                            <div className="absolute bottom-6 right-0 animate-bounce delay-200">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shadow-sm">🐱</div>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">No projects yet. Create your first ML project!</p>
                        <button
                            onClick={onCreateNew}
                            className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            + Create New Project
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onOpenProject(project)}
                                className="grid grid-cols-5 px-6 py-4 hover:bg-purple-50 cursor-pointer transition-colors items-center"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-lg">
                                        {PROJECT_TYPE_ICONS[project.type] || '🤖'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800 text-sm">{project.name}</div>
                                        {project.description && (
                                            <div className="text-xs text-gray-400 truncate max-w-[160px]">{project.description}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center text-sm text-gray-600">{project.type}</div>
                                <div className="text-center text-sm text-gray-600">{project.classes}</div>
                                <div className="text-center text-xs text-gray-400">
                                    {new Date(project.lastUpdated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="flex justify-center">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[project.status] || STATUS_COLORS['Untrained']}`}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
