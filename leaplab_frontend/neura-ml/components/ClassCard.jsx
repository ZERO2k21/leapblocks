import { useState, useRef } from 'react'

const COLORS = [
    { header: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200', dot: '#ef4444' },
    { header: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200', dot: '#14b8a6' },
    { header: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', dot: '#8b5cf6' },
    { header: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', dot: '#f97316' },
    { header: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200', dot: '#ec4899' },
    { header: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', dot: '#3b82f6' },
]

/**
 * Enhanced ClassCard component with modern Tailwind styling
 * Features: inline editing, file upload, webcam capture, sample previews
 * 
 * Props:
 * - classData: { id, name, samples: [{ preview: dataURL }] }
 * - index: number (for color selection)
 * - onRename: (classId, newName) => void
 * - onDelete: (classId) => void
 * - onAddSamples: (classId, dataURL) => void
 * - onWebcam: (classId) => void
 * - showImagePreviews: boolean (default: true)
 */
export default function ClassCard({
    classData,
    index = 0,
    onRename,
    onDelete,
    onAddSamples,
    onWebcam,
    onUpload,
    showImagePreviews = true
}) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(classData.name)
    const fileRef = useRef(null)
    const color = COLORS[index % COLORS.length]

    const commitRename = () => {
        if (draft.trim() && onRename) {
            onRename(classData.id, draft.trim())
        } else {
            setDraft(classData.name)
        }
        setEditing(false)
    }

    const handleFiles = (e) => {
        if (!onAddSamples) return

        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader()
            reader.onload = ev => onAddSamples(classData.id, ev.target.result)
            reader.readAsDataURL(file)
        })
        e.target.value = ''
    }

    const handleUploadClick = () => {
        if (onUpload) {
            onUpload(classData.id)
        } else {
            fileRef.current?.click()
        }
    }

    const samples = classData.samples || []

    return (
        <div className={`rounded-xl border ${color.border} bg-white shadow-sm overflow-hidden`}>
            {/* Colored header */}
            <div className={`${color.header} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {editing ? (
                        <input
                            autoFocus
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') commitRename()
                                if (e.key === 'Escape') {
                                    setDraft(classData.name)
                                    setEditing(false)
                                }
                            }}
                            onBlur={commitRename}
                            className="bg-white/20 text-white placeholder-white/60 rounded-md px-2 py-0.5 text-sm font-bold outline-none border border-white/40 flex-1 min-w-0"
                        />
                    ) : (
                        <span className="text-white font-bold text-sm truncate">{classData.name}</span>
                    )}
                    <button
                        onClick={() => setEditing(true)}
                        className="text-white/70 hover:text-white transition-colors shrink-0"
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>
                {onDelete && (
                    <button
                        onClick={() => onDelete(classData.id)}
                        className="text-white/60 hover:text-white transition-colors ml-2"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="flex divide-x divide-gray-100">
                {/* Left: add samples */}
                <div className="p-4 flex-1">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Add Image Samples</p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleUploadClick}
                            className="flex flex-col items-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl px-4 py-3 text-gray-400 hover:text-gray-600 transition-all cursor-pointer flex-1"
                        >
                            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l4-4 4 4 4-4 4 4" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                            </svg>
                            <span className="text-xs font-medium">Upload</span>
                        </button>
                        {onWebcam && (
                            <button
                                onClick={() => onWebcam(classData.id)}
                                className="flex flex-col items-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl px-4 py-3 text-gray-400 hover:text-gray-600 transition-all cursor-pointer flex-1"
                            >
                                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                </svg>
                                <span className="text-xs font-medium">Webcam</span>
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFiles}
                    />
                </div>

                {/* Right: sample count + thumbnails */}
                <div className={`p-4 flex-1 ${color.light}`}>
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                        {samples.length} Image Sample{samples.length !== 1 ? 's' : ''}
                    </p>
                    {showImagePreviews && samples.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {samples.slice(-10).map((s, i) => (
                                <img
                                    key={i}
                                    src={s.preview || s}
                                    alt=""
                                    className="w-8 h-8 rounded object-cover border border-white shadow-sm"
                                />
                            ))}
                            {samples.length > 10 && (
                                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
                                    +{samples.length - 10}
                                </div>
                            )}
                        </div>
                    )}
                    {samples.length === 0 && (
                        <p className="text-xs text-gray-300 italic">No samples yet</p>
                    )}
                </div>
            </div>
        </div>
    )
}
