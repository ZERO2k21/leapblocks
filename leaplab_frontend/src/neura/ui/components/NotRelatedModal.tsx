import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface NotRelatedModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload?: () => void
    title?: string
    description?: string
}

export default function NotRelatedModal({
    isOpen,
    onClose,
    onUpload,
    title = "This image isn't from your samples",
    description = "No, this image doesn't match any of your training samples. Please upload an image that is related to the samples you used for training."
}: NotRelatedModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === modalRef.current) onClose()
    }

    if (!isOpen) return null

    return createPortal(
        <div
            ref={modalRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-[modalFadeIn_0.25s_ease-out]"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#0a0128]/60 backdrop-blur-md" />

            {/* Modal */}
            <div className="relative w-full max-w-[400px] animate-[modalSlideIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                {/* Glow border */}
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-rose-400/30 via-orange-400/20 to-[#e11d48]/30 blur-xs" />

                {/* Card */}
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(225,29,72,0.2),0_0_0_1px_rgba(225,29,72,0.05)]">
                    {/* Top gradient bar */}
                    <div className="h-1 bg-gradient-to-r from-rose-400 via-[#e11d48] to-orange-400" />

                    {/* Content */}
                    <div className="p-7 pb-5 text-center">
                        {/* Icon */}
                        <div className="relative w-14 h-14 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 rotate-3 shadow-md shadow-rose-500/15" />
                            <div className="relative w-full h-full rounded-2xl bg-white flex items-center justify-center shadow-xs border border-rose-200/30">
                                <span className="text-2xl">❌</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-[1.15rem] font-extrabold text-[#131b2e] mb-2 leading-snug">
                            {title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-500 leading-relaxed max-w-[320px] mx-auto">
                            {description}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-6" />

                    {/* Buttons */}
                    <div className="p-4 px-6 pb-5 flex gap-2.5">
                        {onUpload && (
                            <button
                                type="button"
                                onClick={() => { onClose(); onUpload() }}
                                className="flex-1 py-3 rounded-2xl text-xs font-bold border-none cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-md shadow-purple-600/25 transition-all duration-200 tracking-wide hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/30"
                            >
                                Upload Related Sample 📂
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className={`py-3 rounded-2xl text-xs font-bold border-2 border-gray-200 cursor-pointer bg-white text-gray-700 transition-all duration-200 tracking-wide hover:border-purple-400 hover:bg-purple-50/50 hover:-translate-y-0.5 ${onUpload ? 'flex-[0.6]' : 'flex-1'}`}
                        >
                            Got it 👍
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>,
        document.body
    )
}
