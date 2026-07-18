import React, { useState, useEffect } from 'react'
import {
    Link2,
    X,
    KeyRound,
    User,
    Lightbulb,
    Loader2,
    CheckCircle2,
    Settings,
    Unlink,
    AlertCircle
} from 'lucide-react'
import {
    getStoredCredentials,
    storeCredentials,
    clearCredentials,
    testCredentials,
    hasCredentials,
    type KaggleCredentials
} from '../../ml/KaggleDatasetProvider'

interface KaggleSettingsProps {
    onCredentialsSaved?: () => void
    compact?: boolean
}

export default function KaggleSettings({ onCredentialsSaved, compact = false }: KaggleSettingsProps) {
    const [username, setUsername] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        setIsConnected(hasCredentials())
        const stored = getStoredCredentials()
        if (stored) {
            setUsername(stored.username)
        }
    }, [])

    const handleTestAndSave = async () => {
        if (!username.trim() || !apiKey.trim()) {
            setError('Please enter both username and API key')
            return
        }

        setIsTesting(true)
        setError(null)

        try {
            const valid = await testCredentials({ username: username.trim(), apiKey: apiKey.trim() })
            if (valid) {
                storeCredentials({ username: username.trim(), apiKey: apiKey.trim() })
                setIsConnected(true)
                setShowForm(false)
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
                onCredentialsSaved?.()
            } else {
                setError('Invalid credentials. Please check your username and API key.')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to test credentials')
        } finally {
            setIsTesting(false)
        }
    }

    const handleDisconnect = () => {
        clearCredentials()
        setIsConnected(false)
        setUsername('')
        setApiKey('')
    }

    // Compact view (badge or action button)
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {isConnected ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.04)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kaggle Connected</span>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 28px',
                            background: 'rgb(99, 14, 212)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(99, 14, 212, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Link2 size={18} />
                        <span>Connect Kaggle</span>
                    </button>
                )}

                {/* Modal Overlay */}
                {showForm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '440px', background: 'white', borderRadius: '20px', border: '1px solid rgba(229, 231, 235, 0.8)', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
                            {/* Close button */}
                            <button
                                onClick={() => { setShowForm(false); setError(null) }}
                                style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <X size={16} />
                            </button>

                            {/* Hero header */}
                            <div style={{ position: 'relative', padding: '32px 32px 40px', textAlign: 'center', background: 'linear-gradient(135deg, #630ed4 0%, #7c3aed 100%)' }}>
                                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', filter: 'blur(40px)' }} />
                                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '24px', background: 'white', borderRadius: '20px 20px 0 0' }} />
                                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.25)', marginBottom: '16px' }}>
                                    <Link2 size={26} color="white" />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '-0.025em', marginBottom: '4px' }}>Connect Kaggle</h3>
                                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Access free public datasets</p>
                                </div>
                            </div>

                            {/* Form body */}
                            <div style={{ position: 'relative', padding: '8px 32px 32px' }}>
                                <KaggleCredentialsForm
                                    username={username}
                                    apiKey={apiKey}
                                    setUsername={setUsername}
                                    setApiKey={setApiKey}
                                    error={error}
                                    isTesting={isTesting}
                                    onSave={handleTestAndSave}
                                    onCancel={() => { setShowForm(false); setError(null) }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Full view (inside settings panel)
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(99,14,212,0.2)]">
                        <Link2 size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Kaggle Connection</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Free public datasets</p>
                    </div>
                </div>
                {isConnected ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                        <span className="text-[10px] font-bold text-emerald-600">Connected</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400">Not Connected</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="px-6 py-5">
                {isConnected && !showForm ? (
                    <div className="animate-fade-in space-y-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center text-violet-600 text-xs font-black">
                                @
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connected as</p>
                                <p className="text-sm font-bold text-slate-800">{username}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                            >
                                <Settings size={14} />
                                <span>Settings</span>
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer shadow-sm"
                            >
                                <Unlink size={14} />
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>
                ) : showForm ? (
                    <div className="animate-fade-in">
                        <KaggleCredentialsForm
                            username={username}
                            apiKey={apiKey}
                            setUsername={setUsername}
                            setApiKey={setApiKey}
                            error={error}
                            isTesting={isTesting}
                            onSave={handleTestAndSave}
                            onCancel={() => { setShowForm(false); setError(null) }}
                        />
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-5">
                        <div className="flex items-start gap-4 px-4 py-4 bg-gradient-to-r from-violet-50/60 to-transparent rounded-xl border border-violet-100/50">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(99,14,212,0.15)] shrink-0">
                                <Link2 size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-1">Connect your Kaggle account</p>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    Search and import thousands of free public datasets directly into NEURA.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 28px',
                                background: 'rgb(99, 14, 212)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(99, 14, 212, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Link2 size={18} />
                            <span>Connect Kaggle</span>
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center animate-fade-in">
                        <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>Connected successfully!</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

function KaggleCredentialsForm({
    username,
    apiKey,
    setUsername,
    setApiKey,
    error,
    isTesting,
    onSave,
    onCancel
}: {
    username: string
    apiKey: string
    setUsername: (v: string) => void
    setApiKey: (v: string) => void
    error: string | null
    isTesting: boolean
    onSave: () => void
    onCancel: () => void
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Kaggle Username</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '14px', color: '#8b5cf6', opacity: 0.6 }}><User size={16} /></span>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your-username"
                        style={{ width: '100%', padding: '12px 16px 12px 42px', fontSize: '14px', fontWeight: 500, border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', background: '#f8fafc', color: '#1e293b', transition: 'all 0.2s' }}
                    />
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>API Key</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '14px', color: '#8b5cf6', opacity: 0.6 }}><KeyRound size={16} /></span>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="your-api-key"
                        style={{ width: '100%', padding: '12px 16px 12px 42px', fontSize: '14px', fontWeight: 500, border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', background: '#f8fafc', color: '#1e293b', transition: 'all 0.2s' }}
                    />
                </div>
            </div>

            {/* Steps Guide */}
            <div style={{ borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)', background: 'rgba(245, 243, 255, 0.5)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Lightbulb size={12} />
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed' }}>How to get your API key</p>
                </div>
                <ul style={{ padding: '14px 16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        <span style={{ width: '20px', height: '20px', minWidth: '20px', borderRadius: '6px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', marginTop: '1px' }}>1</span>
                        <span>Go to <a href="https://www.kaggle.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#7c3aed', textDecoration: 'underline' }}>kaggle.com</a> and sign in.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        <span style={{ width: '20px', height: '20px', minWidth: '20px', borderRadius: '6px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', marginTop: '1px' }}>2</span>
                        <span>Click your profile picture → <span style={{ fontWeight: 600, color: '#334155' }}>Settings</span>.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        <span style={{ width: '20px', height: '20px', minWidth: '20px', borderRadius: '6px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', marginTop: '1px' }}>3</span>
                        <span>Scroll to the <span style={{ fontWeight: 600, color: '#334155' }}>API</span> section.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        <span style={{ width: '20px', height: '20px', minWidth: '20px', borderRadius: '6px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', marginTop: '1px' }}>4</span>
                        <span>Click <span style={{ fontWeight: 600, color: '#7c3aed', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Create New Token</span>.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        <span style={{ width: '20px', height: '20px', minWidth: '20px', borderRadius: '6px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', marginTop: '1px' }}>5</span>
                        <span>Open the downloaded <span style={{ fontWeight: 600, color: '#334155' }}>kaggle.json</span> and copy credentials.</span>
                    </li>
                </ul>
            </div>

            {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px' }}>
                    <AlertCircle style={{ color: '#ef4444', minWidth: '16px', marginTop: '2px' }} size={16} />
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#dc2626', lineHeight: 1.5, margin: 0 }}>{error}</p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button
                    onClick={onSave}
                    disabled={isTesting}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 14, 212, 0.25)', transition: 'all 0.2s', opacity: isTesting ? 0.6 : 1 }}
                >
                    {isTesting ? (
                        <>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Testing...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={16} />
                            <span>Save & Test</span>
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isTesting}
                    style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
