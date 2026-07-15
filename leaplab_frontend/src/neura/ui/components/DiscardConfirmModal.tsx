import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DiscardConfirmModalProps {
    isOpen: boolean
    classCount: number
    onConfirm: () => void
    onCancel: () => void
    title?: string
    description?: string
    confirmText?: string
}

export default function DiscardConfirmModal({ isOpen, classCount, onConfirm, onCancel, title, description, confirmText }: DiscardConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onCancel()
        }
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onCancel])

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === modalRef.current) onCancel()
    }

    if (!isOpen) return null

    return createPortal(
        <div
            ref={modalRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[rgba(10,1,40,0.6)] backdrop-blur-md"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
            <div
                className="relative w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden"
                style={{ animation: 'scaleIn 0.25s ease-out' }}
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] px-8 pt-8 pb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#131b2e] mb-2 text-center">
                        {title || 'Leave without adding samples?'}
                    </h3>
                    <p className="text-sm text-[#4a4455] leading-relaxed text-center">
                        {description || (
                            <>
                                You created <span className="font-bold text-[#630ed4]">{classCount} {classCount === 1 ? 'class' : 'classes'}</span>{' '}
                                but haven't added any training data yet. Your progress will be lost! 😢
                            </>
                        )}
                    </p>
                </div>

                {/* Buttons */}
                <div className="px-8 py-6 bg-[#faf8ff]">
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            Stay 🏠
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm border-2 border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f3f4f6] hover:border-[#d1d5db] active:translate-y-0.5 transition-all"
                        >
                            {confirmText || 'Leave 🚪'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
