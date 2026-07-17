import React from 'react'

interface StatsBarProps {
    totalClasses: number
    totalImages: number
    imagesPerClass: number
    recommended: number
    compact?: boolean
}

export default function StatsBar({ totalClasses, totalImages, imagesPerClass, recommended, compact }: StatsBarProps) {
    if (compact) {
        return (
            <div style={{ width: '100%', background: '#fff', borderRadius: '10px', padding: '8px 10px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>📁</div>
                    <span style={{ fontSize: '9px', color: '#6b7280' }}>cls:</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#630ed4' }}>{totalClasses}</span>
                </div>
                <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>🖼️</div>
                    <span style={{ fontSize: '9px', color: '#6b7280' }}>pics:</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669' }}>{totalImages}</span>
                </div>
                <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>📊</div>
                    <span style={{ fontSize: '9px', color: '#6b7280' }}>avg:</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#d97706' }}>{imagesPerClass}/cls</span>
                </div>
                <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '5px' }}>
                    <span style={{ fontSize: '9px' }}>🎯</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669' }}>{recommended}/cls</span>
                </div>
                <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#630ed4', boxShadow: '0 0 4px rgba(99,14,212,0.5)' }} />
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#630ed4', letterSpacing: '0.08em' }}>NEURA</span>
                </div>
            </div>
        )
    }

    const stats = [
        { emoji: '📁', label: 'classes', value: totalClasses, color: '#630ed4', bg: '#f5f3ff' },
        { emoji: '🖼️', label: 'pics', value: totalImages, color: '#059669', bg: '#ecfdf5' },
        { emoji: '📊', label: 'Avg', value: `${imagesPerClass}/class`, color: '#d97706', bg: '#fffbeb' },
    ]

    return (
        <div style={{ width: '100%', maxWidth: '720px' }} className="animate-fade-in">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}
            >
                {/* Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <div
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: stat.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                }}
                            >
                                {stat.emoji}
                            </div>
                            <div>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>{stat.label}: </span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

                {/* Goal */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                        borderRadius: '8px',
                    }}
                >
                    <span style={{ fontSize: '14px' }}>🎯</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                        Goal: {recommended}/class
                    </span>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

                {/* Brand */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <div
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#630ed4',
                            boxShadow: '0 0 6px rgba(99,14,212,0.5)',
                        }}
                    />
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#630ed4', letterSpacing: '0.08em' }}>
                        NEURA
                    </span>
                </div>
            </div>
        </div>
    )
}
