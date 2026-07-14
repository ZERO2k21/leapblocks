import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DiscardConfirmModalProps {
    isOpen: boolean
    classCount: number
    onConfirm: () => void
    onCancel: () => void
}

export default function DiscardConfirmModal({ isOpen, classCount, onConfirm, onCancel }: DiscardConfirmModalProps) {
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
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[rgba(10,1,40,0.55)] backdrop-blur-md animate-fade-in"

        >
            <div className="relative w-full max-w-[380px] bg-white rounded-3xl shadow-2xl p-8 text-center animate-scale-in">
                <div className="w-16 h-16 rounded-2xl bg-[#fef3c7] flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                </div>

                <h3 className="text-lg font-extrabold text-[#131b2e] mb-2">
                    Leave without adding samples?
                </h3>

                <p className="text-sm text-[#4a4455] mb-6 leading-relaxed">
                    You created <span className="font-bold text-[#630ed4]">{classCount} {classCount === 1 ? 'class' : 'classes'}</span>{' '}
                    but haven't added any training data yet. Your progress will be lost! 😢
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#630ed4] to-[#7c3aed] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    >
                        Stay 🏠
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 rounded-xl font-bold text-sm border-2 border-[#dae2fd] bg-[#faf8ff] text-[#4a4455] hover:bg-[#f2f3ff] hover:border-[#ccc3d8] active:translate-y-0.5 transition-all"
                    >
                        Leave 🚪
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
