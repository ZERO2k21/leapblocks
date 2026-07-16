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
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{ animation: 'modalFadeIn 0.3s ease-out' }}
        >
            <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />

            <div
                className="relative w-full max-w-[420px] overflow-hidden"
                style={{ animation: 'modalSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-[#c084fc]/40 via-[#818cf8]/20 to-[#630ed4]/40 blur-sm" />

                <div className="relative bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_25px_60px_-12px_rgba(99,14,212,0.25),0_0_0_1px_rgba(99,14,212,0.08)] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c084fc] via-[#630ed4] to-[#818cf8]" />

                    <div className="px-8 pt-8 pb-5">
                        <div className="relative w-16 h-16 mx-auto mb-5">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-2xl rotate-3 shadow-md" />
                            <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#fde68a]/50">
                                <span className="text-3xl">⚠️</span>
                            </div>
                        </div>

                        <h3 className="text-[19px] font-extrabold text-[#131b2e] mb-2.5 text-center tracking-tight leading-tight">
                            {title || 'Leave without adding samples?'}
                        </h3>

                        <p className="text-[13px] text-[#5b5670] leading-[1.65] text-center max-w-[320px] mx-auto">
                            {description || (
                                <>
                                    You created <span className="font-bold text-[#630ed4]">{classCount} {classCount === 1 ? 'class' : 'classes'}</span>{' '}
                                    but haven't added any training data yet. Your progress will be lost! 😢
                                </>
                            )}
                        </p>
                    </div>

                    <div className="mx-8">
                        <div className="h-px bg-gradient-to-r from-transparent via-[#e5e1f0] to-transparent" />
                    </div>

                    <div className="px-8 py-5">
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg shadow-[#630ed4]/25 hover:shadow-xl hover:shadow-[#630ed4]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 bg-gradient-to-r from-[#630ed4] to-[#7c3aed] relative overflow-hidden group"
                            >
                                <span className="relative z-10">Stay 🏠</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#630ed4] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-[#e5e0f3] bg-white/80 text-[#4a4455] hover:bg-[#faf8ff] hover:border-[#c084fc]/40 hover:text-[#131b2e] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 relative overflow-hidden group"
                            >
                                <span className="relative z-10">{confirmText || 'Leave 🚪'}</span>
                            </button>
                        </div>
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
