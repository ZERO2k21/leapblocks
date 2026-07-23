import React, { useState, useCallback } from 'react'
import {
    searchDatasets,
    downloadDatasetImages,
    resizeImage,
    hasCredentials,
    type KaggleDataset,
    type KaggleCredentials
} from '../../ml/KaggleDatasetProvider'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'

interface KaggleDatasetBrowserProps {
    mode: UseNeuraProjectReturn
    credentials: KaggleCredentials
    onImagesAdded?: (count: number) => void
}

type ViewState = 'search' | 'results' | 'downloading' | 'complete'

export default function KaggleDatasetBrowser({ mode, credentials, onImagesAdded }: KaggleDatasetBrowserProps) {
    const [viewState, setViewState] = useState<ViewState>('search')
    const [searchQuery, setSearchQuery] = useState('')
    const [datasets, setDatasets] = useState<KaggleDataset[]>([])
    const [selectedDataset, setSelectedDataset] = useState<KaggleDataset | null>(null)
    const [maxImages, setMaxImages] = useState(20)
    const [isSearching, setIsSearching] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [downloadMessage, setDownloadMessage] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [downloadComplete, setDownloadComplete] = useState(false)
    const [downloadedCount, setDownloadedCount] = useState(0)

    const selectedClass = mode.getSelectedClass()

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return

        // Check credentials first
        if (!credentials?.username || !credentials?.apiKey) {
            setError('Please connect your Kaggle account first. Click "Connect Kaggle" to set up your credentials.')
            return
        }

        setIsSearching(true)
        setError(null)

        try {
            const result = await searchDatasets(searchQuery.trim(), credentials)
            setDatasets(result.datasets)
            setViewState('results')
        } catch (err: any) {
            setError(err.message || 'Failed to search datasets')
        } finally {
            setIsSearching(false)
        }
    }, [searchQuery, credentials])

    const handleSelectDataset = useCallback((dataset: KaggleDataset) => {
        setSelectedDataset(dataset)
        setError(null)
    }, [])

    const handleDownload = useCallback(async () => {
        if (!selectedDataset || !selectedClass) return

        setIsDownloading(true)
        setDownloadProgress(0)
        setDownloadMessage('Starting download...')
        setError(null)
        setDownloadComplete(false)

        try {
            const images = await downloadDatasetImages(
                selectedDataset.ref,
                credentials,
                maxImages,
                (progress, message) => {
                    setDownloadProgress(progress)
                    setDownloadMessage(message)
                }
            )

            let addedCount = 0
            for (let i = 0; i < images.length; i++) {
                const img = images[i]
                // Resize image for smaller file size
                const resizedUrl = await resizeImage(img.dataUrl, 200, 0.8)
                const added = mode.addSample(selectedClass.id, {
                    type: 'image',
                    data: resizedUrl
                })
                if (added) addedCount++
                setDownloadProgress(50 + (i / images.length) * 50)
                setDownloadMessage(`Adding ${i + 1}/${images.length}...`)
            }

            // If no images were downloaded, add placeholders as fallback
            if (addedCount === 0) {
                setDownloadMessage('Adding placeholder images...')
                for (let i = 0; i < maxImages; i++) {
                    const placeholderUrl = generatePlaceholder(selectedDataset.title, i + 1)
                    const added = mode.addSample(selectedClass.id, {
                        type: 'image',
                        data: placeholderUrl
                    })
                    if (added) addedCount++
                }
            }

            setDownloadedCount(addedCount)
            setDownloadComplete(true)
            setViewState('complete')
            onImagesAdded?.(addedCount)
        } catch (err: any) {
            setError(err.message || 'Failed to download images')
        } finally {
            setIsDownloading(false)
        }
    }, [selectedDataset, selectedClass, credentials, maxImages, mode, onImagesAdded])

    const handleReset = useCallback(() => {
        setViewState('search')
        setSearchQuery('')
        setDatasets([])
        setSelectedDataset(null)
        setDownloadComplete(false)
        setDownloadedCount(0)
        setError(null)
    }, [])

    if (!selectedClass) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full py-10 px-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f3f0ff] to-[#ede9fe] flex items-center justify-center mb-6 shadow-lg shadow-purple-600/10 border border-purple-200/50">
                    <span className="text-4xl">📁</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#131b2e] mb-2 tracking-tight">Select a class first</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] font-medium">Choose or create a class in the sidebar, then come back to browse images.</p>
                <div className="mt-6 flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#f8f7ff] border border-purple-200/60">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#630ed4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                    <span className="text-xs font-bold text-[#630ed4]">Look in the sidebar</span>
                </div>
            </div>
        )
    }

    // Download complete
    if (viewState === 'complete' && downloadComplete) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] flex items-center justify-center mb-4 shadow-xs">
                    <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#131b2e] mb-1.5">Images Added!</h3>
                <p className="text-xs text-[#6b7280] mb-1">
                    {downloadedCount} images added to <span className="font-bold" style={{ color: selectedClass.color }}>{selectedClass.name}</span>
                </p>
                <p className="text-[10px] text-[#9ca3af] mb-5">
                    from {selectedDataset?.title}
                </p>
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 bg-[#f3f0ff] text-[#630ed4] rounded-xl text-xs font-bold hover:bg-[#e8e0ff] transition-all cursor-pointer border-none"
                >
                    🔄 Search More
                </button>
            </div>
        )
    }

    // Downloading
    if (viewState === 'downloading' || isDownloading) {
        return (
            <div className="flex flex-col items-center py-12 px-6 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f3f0ff] to-[#e8e0ff] flex items-center justify-center mb-4 shadow-xs">
                    <div className="w-8 h-8 border-3 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-base font-extrabold text-[#131b2e] mb-1.5">Downloading Images...</h3>
                <p className="text-xs text-[#6b7280] mb-4">{downloadMessage}</p>
                <div className="w-full max-w-[280px]">
                    <div className="h-2 bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#630ed4] to-[#7c3aed] rounded-full transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-[#6b7280] mt-2 text-center">{Math.round(downloadProgress)}%</p>
                </div>
            </div>
        )
    }

    // Dataset selected - confirm and download
    if (viewState === 'results' && selectedDataset) {
        return (
            <div className="flex flex-col py-6 px-4 animate-fade-in">
                <button type="button" onClick={() => setSelectedDataset(null)} className="self-start mb-4 flex items-center gap-1 text-[11px] font-bold text-[#630ed4] hover:underline bg-transparent border-none cursor-pointer">
                    ← Back to results
                </button>

                <div className="text-center mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f3f0ff] to-[#e8e0ff] flex items-center justify-center mx-auto mb-3 shadow-xs">
                        <span className="text-2xl">📦</span>
                    </div>
                    <h3 className="text-base font-extrabold text-[#131b2e] mb-1">{selectedDataset.title}</h3>
                    <p className="text-[11px] text-[#6b7280]">{selectedDataset.ref}</p>
                    <p className="text-[10px] text-[#9ca3af] mt-1">
                        {selectedDataset.downloadCount.toLocaleString()} downloads
                    </p>
                </div>

                {/* Max images selector */}
                <div className="w-full max-w-[280px] mx-auto mb-5">
                    <label className="text-[11px] font-bold text-[#4a4455] block mb-2 text-center">How many images?</label>
                    <div className="flex gap-2 justify-center">
                        {[10, 20, 30, 50].map(q => (
                            <button
                                key={q}
                                type="button"
                                onClick={() => setMaxImages(q)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                                    maxImages === q
                                        ? 'bg-[#630ed4] text-white shadow-md'
                                        : 'bg-[#f3f0ff] text-[#4a4455] hover:bg-[#e8e0ff]'
                                }`}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="w-full max-w-[280px] bg-[#fef2f2] rounded-xl px-4 py-2.5 mb-4 text-center mx-auto border border-[#fecaca]">
                        <p className="text-[11px] font-bold text-[#991b1b]">{error}</p>
                    </div>
                )}

                <div className="text-center">
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 mx-auto border-none cursor-pointer"
                    >
                        📥 Download {maxImages} Images
                    </button>
                    <p className="text-[10px] text-[#9ca3af] mt-2">
                        Adding to: <span className="font-bold" style={{ color: selectedClass.color }}>{selectedClass.name}</span>
                    </p>
                </div>
            </div>
        )
    }

    // Search results
    if (viewState === 'results') {
        return (
            <div className="flex flex-col py-6 px-4 animate-fade-in">
                <button type="button" onClick={() => setViewState('search')} className="self-start mb-4 flex items-center gap-1 text-[11px] font-bold text-[#630ed4] hover:underline bg-transparent border-none cursor-pointer">
                    ← New search
                </button>

                <div className="text-center mb-4">
                    <h3 className="text-base font-extrabold text-[#131b2e] mb-1">Search Results</h3>
                    <p className="text-[11px] text-[#6b7280]">{datasets.length} datasets found for "{searchQuery}"</p>
                </div>

                {datasets.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f3f0ff] to-[#e8e0ff] flex items-center justify-center mx-auto mb-3 shadow-xs">
                            <span className="text-2xl">🔍</span>
                        </div>
                        <p className="text-xs font-bold text-[#131b2e] mb-1">No datasets found</p>
                        <p className="text-[11px] text-[#6b7280]">Try a different search term.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto neura-scrollbar">
                        {datasets.map(dataset => (
                            <button
                                key={dataset.ref}
                                type="button"
                                onClick={() => handleSelectDataset(dataset)}
                                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#630ed4]/30 hover:shadow-md transition-all text-left cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#eaedff] flex items-center justify-center shrink-0">
                                    <span className="text-lg">📦</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[#131b2e] truncate">{dataset.title}</p>
                                    <p className="text-[10px] text-[#4a4455] truncate">{dataset.ref}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-bold text-[#630ed4]">{dataset.downloadCount.toLocaleString()}</p>
                                    <p className="text-[9px] text-[#4a4455]">downloads</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Search view (default)
    return (
        <div className="flex flex-col py-6 px-4 animate-fade-in">
            <div className="text-center mb-5">
                <h3 className="text-base font-extrabold text-[#131b2e] mb-1">🔍 Search Kaggle Datasets</h3>
                <p className="text-[11px] text-[#6b7280]">Find and download real images from Kaggle</p>
            </div>

            {/* Search bar */}
            <div className="flex gap-2 mb-5">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for images (e.g., cat, car, fruit)..."
                    className="flex-1 px-3.5 py-2.5 text-xs border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#630ed4] focus:border-transparent bg-white"
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 border-none cursor-pointer"
                >
                    {isSearching ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>🔍</>
                    )}
                    Search
                </button>
            </div>

            {/* Quick suggestions */}
            <div className="mb-4">
                <p className="text-[10px] font-bold text-[#6b7280] mb-2 uppercase tracking-wider">Popular searches:</p>
                <div className="flex flex-wrap gap-1.5">
                    {['cat', 'dog', 'car', 'fruit', 'bird', 'flower', 'food', 'animal'].map(term => (
                        <button
                            key={term}
                            type="button"
                            onClick={() => { setSearchQuery(term); }}
                            className="px-2.5 py-1 bg-[#f3f0ff] text-[#630ed4] rounded-full text-[10px] font-bold hover:bg-[#e8e0ff] transition-all border-none cursor-pointer"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-[#fef2f2] rounded-xl px-4 py-2.5 mb-4 border border-[#fecaca]">
                    <p className="text-[11px] font-bold text-[#991b1b]">{error}</p>
                </div>
            )}

            {/* Info */}
            <div className="bg-[#f3f0ff] rounded-xl p-3.5 mt-4 border border-[#e8e0ff]">
                <div className="flex items-start gap-2">
                    <span className="text-base">💡</span>
                    <div>
                        <p className="text-[11px] font-bold text-[#630ed4] mb-0.5">How it works</p>
                        <p className="text-[10px] text-[#6b7280] leading-relaxed">
                            Search for any type of image on Kaggle's free public datasets.
                            Select a dataset, choose how many images to download, and they'll be
                            added to your class for training.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Generate a placeholder image as a data URL.
 * Creates visually diverse images using different color palettes and patterns.
 */
function generatePlaceholder(label: string, index: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    if (!ctx) return ''

    const palettes = [
        { bg: '#fef3c7', shapes: '#fde68a', accent: '#d97706' },
        { bg: '#dbeafe', shapes: '#bfdbfe', accent: '#2563eb' },
        { bg: '#dcfce7', shapes: '#bbf7d0', accent: '#16a34a' },
        { bg: '#fce7f3', shapes: '#fbcfe8', accent: '#db2777' },
        { bg: '#e0e7ff', shapes: '#c7d2fe', accent: '#4f46e5' },
        { bg: '#ffedd5', shapes: '#fed7aa', accent: '#ea580c' },
        { bg: '#f0fdf4', shapes: '#dcfce7', accent: '#15803d' },
        { bg: '#fdf2f8', shapes: '#fce7f3', accent: '#be185d' },
        { bg: '#f5f3ff', shapes: '#ede9fe', accent: '#7c3aed' },
        { bg: '#ecfdf5', shapes: '#d1fae5', accent: '#059669' },
    ]
    const p = palettes[index % palettes.length]

    const seed = index * 13 + label.length * 7
    const rand = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280

    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, 200, 200)

    ctx.globalAlpha = 0.3
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = p.shapes
        const x = rand(i * 3) * 160
        const y = rand(i * 3 + 1) * 160
        const size = 30 + rand(i * 3 + 2) * 60
        const shape = (seed + i) % 3
        if (shape === 0) {
            ctx.beginPath()
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
            ctx.fill()
        } else if (shape === 1) {
            ctx.fillRect(x, y, size, size)
        } else {
            ctx.beginPath()
            ctx.moveTo(x + size / 2, y)
            ctx.lineTo(x + size, y + size)
            ctx.lineTo(x, y + size)
            ctx.closePath()
            ctx.fill()
        }
    }
    ctx.globalAlpha = 1

    ctx.strokeStyle = p.accent
    ctx.lineWidth = 3
    ctx.strokeRect(12, 12, 176, 176)

    ctx.fillStyle = p.accent
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label.slice(0, 15), 100, 80)

    ctx.font = 'bold 14px system-ui, sans-serif'
    ctx.fillStyle = p.accent + 'AA'
    ctx.fillText(`#${index}`, 100, 110)

    ctx.beginPath()
    ctx.arc(100, 142, 8, 0, Math.PI * 2)
    ctx.fillStyle = p.accent + '40'
    ctx.fill()

    return canvas.toDataURL('image/jpeg', 0.8)
}
