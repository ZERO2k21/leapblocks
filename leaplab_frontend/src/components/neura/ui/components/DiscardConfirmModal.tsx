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
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes neura-discard-overlay-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes neura-discard-card-in {
                    from { opacity: 0; transform: scale(0.88) translateY(16px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes neura-discard-icon-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
            `}} />

            <div
                ref={modalRef}
                onClick={handleOverlayClick}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    background: 'rgba(10, 1, 40, 0.55)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    animation: 'neura-discard-overlay-in 0.25s ease-out',
                    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Card */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '400px',
                        background: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0 25px 60px rgba(10,1,40,0.25), 0 0 0 1px rgba(10,1,40,0.05)',
                        padding: '40px 36px 32px',
                        animation: 'neura-discard-card-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        textAlign: 'center',
                    }}
                >
                    {/* Warning Icon */}
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            animation: 'neura-discard-icon-pulse 2s ease-in-out infinite',
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h3
                        style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: '#1F2937',
                            marginBottom: '8px',
                            lineHeight: 1.3,
                        }}
                    >
                        Leave without adding samples?
                    </h3>

                    {/* Description */}
                    <p
                        style={{
                            fontSize: '14px',
                            color: '#6B7280',
                            lineHeight: 1.6,
                            marginBottom: '28px',
                            maxWidth: '300px',
                            margin: '0 auto 28px',
                        }}
                    >
                        You created{' '}
                        <span style={{ fontWeight: 700, color: '#7C3AED' }}>
                            {classCount} {classCount === 1 ? 'class' : 'classes'}
                        </span>{' '}
                        but haven't added any training data yet. Your progress will be lost.
                    </p>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Stay button (primary) */}
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '14px 20px',
                                borderRadius: '14px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.45)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.35)'
                            }}
                            onMouseDown={e => {
                                e.currentTarget.style.transform = 'translateY(1px)'
                            }}
                            onMouseUp={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                        >
                            Stay
                        </button>

                        {/* Leave button (secondary) */}
                        <button
                            onClick={onConfirm}
                            style={{
                                flex: 1,
                                padding: '14px 20px',
                                borderRadius: '14px',
                                border: '2px solid #E5E7EB',
                                background: '#F9FAFB',
                                color: '#6B7280',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#F3F4F6'
                                e.currentTarget.style.borderColor = '#D1D5DB'
                                e.currentTarget.style.color = '#374151'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#F9FAFB'
                                e.currentTarget.style.borderColor = '#E5E7EB'
                                e.currentTarget.style.color = '#6B7280'
                            }}
                            onMouseDown={e => {
                                e.currentTarget.style.transform = 'translateY(1px)'
                            }}
                            onMouseUp={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}
