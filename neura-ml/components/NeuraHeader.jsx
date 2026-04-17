// components/NeuraHeader.jsx
export default function NeuraHeader({ onBack }) {
    return (
        <div className="bg-purple-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Neura
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    <span className="text-xl font-bold">NeuraML</span>
                    <span className="text-xs text-purple-200 ml-1">by LeapLab</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm">
                    Help
                </button>
            </div>
        </div>
    )
}
