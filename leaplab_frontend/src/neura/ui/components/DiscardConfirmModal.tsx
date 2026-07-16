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
            style={{ animation: 'modalFadeIn 0.25s ease-out' }}
        >
            {/* Backdrop */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,1,40,0.6)', backdropFilter: 'blur(8px)' }} />

            {/* Modal */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '380px',
                    animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Glow border */}
                <div style={{
                    position: 'absolute',
                    inset: '-1px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(192,132,252,0.3), rgba(129,140,248,0.2), rgba(99,14,212,0.3))',
                    filter: 'blur(1px)',
                }} />

                {/* Card */}
                <div style={{
                    position: 'relative',
                    background: '#fff',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px -12px rgba(99,14,212,0.2), 0 0 0 1px rgba(99,14,212,0.05)',
                }}>
                    {/* Top gradient bar */}
                    <div style={{ height: '4px', background: 'linear-gradient(90deg, #c084fc, #630ed4, #818cf8)' }} />

                    {/* Content */}
                    <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
                        {/* Icon */}
                        <div style={{ position: 'relative', width: '56px', height: '56px', margin: '0 auto 16px' }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                transform: 'rotate(3deg)',
                                boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
                            }} />
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                borderRadius: '16px',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(253,230,138,0.3)',
                            }}>
                                <span style={{ fontSize: '1.6rem' }}>⚠️</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: '#131b2e',
                            marginBottom: '8px',
                            lineHeight: 1.3,
                        }}>
                            {title || 'Leave without adding samples?'}
                        </h3>

                        {/* Description */}
                        <p style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            lineHeight: 1.6,
                            maxWidth: '300px',
                            margin: '0 auto',
                        }}>
                            {description || (
                                <>You created <span style={{ fontWeight: 700, color: '#630ed4' }}>{classCount} {classCount === 1 ? 'class' : 'classes'}</span> but haven't added any training data yet. Your progress will be lost!</>
                            )}
                        </p>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)', margin: '0 24px' }} />

                    {/* Buttons */}
                    <div style={{ padding: '16px 24px 20px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                borderRadius: '14px',
                                fontSize: '13px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #630ed4, #7c3aed)',
                                color: '#fff',
                                boxShadow: '0 4px 16px rgba(99,14,212,0.25)',
                                transition: 'all 0.2s ease',
                                letterSpacing: '0.02em',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,14,212,0.3)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,14,212,0.25)'
                            }}
                        >
                            Stay 🏠
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                borderRadius: '14px',
                                fontSize: '13px',
                                fontWeight: 700,
                                border: '2px solid #e5e7eb',
                                cursor: 'pointer',
                                background: '#fff',
                                color: '#374151',
                                transition: 'all 0.2s ease',
                                letterSpacing: '0.02em',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#c084fc'
                                e.currentTarget.style.background = '#faf5ff'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb'
                                e.currentTarget.style.background = '#fff'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            {confirmText || 'Leave 🚪'}
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
