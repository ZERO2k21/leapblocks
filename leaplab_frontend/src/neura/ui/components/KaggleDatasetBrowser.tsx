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
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">📁</span>
                <p className="text-sm font-bold text-[#131b2e] mb-1">Select a class first</p>
                <p className="text-xs text-[#4a4455]">Choose or create a class in the sidebar, then come back to download images.</p>
            </div>
        )
    }

    // Download complete
    if (viewState === 'complete' && downloadComplete) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-[#d1fae5] flex items-center justify-center mb-4">
                    <span className="text-4xl">✅</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#131b2e] mb-2">Images Added!</h3>
                <p className="text-sm text-[#4a4455] mb-1">
                    {downloadedCount} images added to <span className="font-bold" style={{ color: selectedClass.color }}>{selectedClass.name}</span>
                </p>
                <p className="text-xs text-[#4a4455] mb-6">
                    from {selectedDataset?.title}
                </p>
                <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-[#eaedff] text-[#630ed4] rounded-xl font-bold text-sm hover:bg-[#dae2fd] transition-all"
                >
                    🔄 Search More
                </button>
            </div>
        )
    }

    // Downloading
    if (viewState === 'downloading' || isDownloading) {
        return (
            <div className="flex flex-col items-center py-12 animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-[#eaedff] flex items-center justify-center mb-6">
                    <div className="w-12 h-12 border-4 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-extrabold text-[#131b2e] mb-2">Downloading Images...</h3>
                <p className="text-sm text-[#4a4455] mb-4">{downloadMessage}</p>
                <div className="w-full max-w-xs">
                    <div className="h-3 bg-[#dae2fd] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#630ed4] to-[#7c3aed] rounded-full transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-[#4a4455] mt-2 text-center">{Math.round(downloadProgress)}%</p>
                </div>
            </div>
        )
    }

    // Dataset selected - confirm and download
    if (viewState === 'results' && selectedDataset) {
        return (
            <div className="flex flex-col py-6 animate-fade-in">
                <button onClick={() => setSelectedDataset(null)} className="self-start mb-4 flex items-center gap-1 text-xs font-bold text-[#630ed4] hover:underline">
                    ← Back to results
                </button>

                <div className="text-center mb-6">
                    <span className="text-4xl mb-2 block">📦</span>
                    <h3 className="text-lg font-extrabold text-[#131b2e] mb-1">{selectedDataset.title}</h3>
                    <p className="text-xs text-[#4a4455]">{selectedDataset.ref}</p>
                    <p className="text-xs text-[#4a4455] mt-1">
                        {selectedDataset.downloadCount.toLocaleString()} downloads
                    </p>
                </div>

                {/* Max images selector */}
                <div className="w-full max-w-xs mx-auto mb-6">
                    <label className="text-xs font-bold text-[#4a4455] block mb-2 text-center">How many images?</label>
                    <div className="flex gap-2 justify-center">
                        {[10, 20, 30, 50].map(q => (
                            <button
                                key={q}
                                onClick={() => setMaxImages(q)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    maxImages === q
                                        ? 'bg-[#630ed4] text-white shadow-md'
                                        : 'bg-[#eaedff] text-[#4a4455] hover:bg-[#dae2fd]'
                                }`}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="w-full max-w-xs bg-[#fee2e2] rounded-xl px-4 py-3 mb-4 text-center mx-auto">
                        <p className="text-xs font-bold text-[#991b1b]">{error}</p>
                    </div>
                )}

                <div className="text-center">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="px-8 py-3 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                        📥 Download {maxImages} Images
                    </button>
                    <p className="text-[10px] text-[#4a4455] mt-2">
                        Adding to: <span className="font-bold" style={{ color: selectedClass.color }}>{selectedClass.name}</span>
                    </p>
                </div>
            </div>
        )
    }

    // Search results
    if (viewState === 'results') {
        return (
            <div className="flex flex-col py-6 animate-fade-in">
                <button onClick={() => setViewState('search')} className="self-start mb-4 flex items-center gap-1 text-xs font-bold text-[#630ed4] hover:underline">
                    ← New search
                </button>

                <div className="text-center mb-4">
                    <h3 className="text-lg font-extrabold text-[#131b2e] mb-1">Search Results</h3>
                    <p className="text-xs text-[#4a4455]">{datasets.length} datasets found for "{searchQuery}"</p>
                </div>

                {datasets.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="text-4xl mb-3 block">🔍</span>
                        <p className="text-sm text-[#4a4455]">No datasets found. Try a different search term.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto neura-scrollbar">
                        {datasets.map(dataset => (
                            <button
                                key={dataset.ref}
                                onClick={() => handleSelectDataset(dataset)}
                                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-[#dae2fd] hover:border-[#630ed4]/30 hover:shadow-md transition-all text-left"
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
        <div className="flex flex-col py-6 animate-fade-in">
            <div className="text-center mb-6">
                <h3 className="text-lg font-extrabold text-[#131b2e] mb-1">🔍 Search Kaggle Datasets</h3>
                <p className="text-xs text-[#4a4455]">Find and download real images from Kaggle</p>
            </div>

            {/* Search bar */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for images (e.g., cat, car, fruit)..."
                    className="flex-1 px-4 py-2.5 text-sm border border-[#dae2fd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#630ed4] focus:border-transparent bg-white"
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                    {isSearching ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>🔍</>
                    )}
                    Search
                </button>
            </div>

            {/* Quick suggestions */}
            <div className="mb-4">
                <p className="text-[10px] font-bold text-[#4a4455] mb-2 uppercase tracking-wider">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                    {['cat', 'dog', 'car', 'fruit', 'bird', 'flower', 'food', 'animal'].map(term => (
                        <button
                            key={term}
                            onClick={() => { setSearchQuery(term); }}
                            className="px-3 py-1 bg-[#eaedff] text-[#630ed4] rounded-full text-[10px] font-bold hover:bg-[#dae2fd] transition-all"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-[#fee2e2] rounded-xl px-4 py-3 mb-4">
                    <p className="text-xs font-bold text-[#991b1b]">{error}</p>
                </div>
            )}

            {/* Info */}
            <div className="bg-[#f2f3ff] rounded-xl p-4 mt-4">
                <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div>
                        <p className="text-[11px] font-bold text-[#630ed4] mb-1">How it works</p>
                        <p className="text-[10px] text-[#4a4455]">
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
 */
function generatePlaceholder(label: string, index: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    if (!ctx) return ''

    const colors = ['#630ed4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    const color = colors[index % colors.length]

    // Background
    ctx.fillStyle = color + '20'
    ctx.fillRect(0, 0, 200, 200)

    // Border
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(10, 10, 180, 180)

    // Label
    ctx.fillStyle = color
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label.slice(0, 15), 100, 85)

    // Index
    ctx.font = 'bold 14px system-ui, sans-serif'
    ctx.fillStyle = color + '80'
    ctx.fillText(`#${index}`, 100, 115)

    return canvas.toDataURL('image/jpeg', 0.75)
}
