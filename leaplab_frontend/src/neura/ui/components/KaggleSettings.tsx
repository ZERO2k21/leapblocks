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
                        className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#630ed4] hover:bg-[#7c3aed] text-white text-sm font-semibold rounded-xl border-none cursor-pointer shadow-[0_2px_8px_rgba(99,14,212,0.3)] transition-all duration-200"
                    >
                        <Link2 size={18} />
                        <span>Connect Kaggle</span>
                    </button>
                )}

                {/* Modal Overlay */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
                        <div className="relative w-full max-w-[440px] bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden">
                            {/* Close button */}
                            <button
                                onClick={() => { setShowForm(false); setError(null) }}
                                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-white/25 transition-all"
                            >
                                <X size={16} />
                            </button>

                            {/* Hero header */}
                            <div className="relative p-8 pb-10 text-center bg-gradient-to-br from-[#630ed4] to-[#7c3aed]">
                                <div className="absolute -top-10 -right-10 w-35 h-35 rounded-full bg-white/8 blur-xl" />
                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-white rounded-t-2xl" />
                                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 mb-4 text-white">
                                    <Link2 size={26} color="white" />
                                </div>
                                <div className="relative">
                                    <h3 className="text-xl font-bold text-white tracking-tight mb-1">Connect Kaggle</h3>
                                    <p className="text-xs text-white/70 font-medium m-0">Access free public datasets</p>
                                </div>
                            </div>

                            {/* Form body */}
                            <div className="relative p-8 pt-2 pb-8">
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
                            className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#630ed4] hover:bg-[#7c3aed] text-white text-sm font-semibold rounded-xl border-none cursor-pointer shadow-[0_2px_8px_rgba(99,14,212,0.3)] transition-all duration-200"
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
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Kaggle Username</label>
                <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-violet-500/60"><User size={16} /></span>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your-username"
                        className="w-full py-3 px-4 pl-10.5 text-sm font-medium border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl outline-none bg-slate-50 text-slate-800 transition-all"
                    />
                </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">API Key</label>
                <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-violet-500/60"><KeyRound size={16} /></span>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="your-api-key"
                        className="w-full py-3 px-4 pl-10.5 text-sm font-medium border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl outline-none bg-slate-50 text-slate-800 transition-all"
                    />
                </div>
            </div>

            {/* Steps Guide */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-50/50 overflow-hidden">
                <div className="flex items-center gap-2.5 p-3 px-4 border-b border-violet-500/10">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white">
                        <Lightbulb size={12} />
                    </div>
                    <p className="text-xs font-semibold text-violet-600 m-0">How to get your API key</p>
                </div>
                <ul className="p-3.5 px-4 m-0 flex flex-col gap-2.5 list-none">
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                        <span className="w-5 h-5 min-w-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
                        <span>Go to <a href="https://www.kaggle.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-600 underline">kaggle.com</a> and sign in.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                        <span className="w-5 h-5 min-w-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
                        <span>Click your profile picture → <span className="font-semibold text-slate-700">Settings</span>.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                        <span className="w-5 h-5 min-w-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-[10px] mt-0.5">3</span>
                        <span>Scroll to the <span className="font-semibold text-slate-700">API</span> section.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                        <span className="w-5 h-5 min-w-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-[10px] mt-0.5">4</span>
                        <span>Click <span className="font-semibold text-violet-600 bg-violet-500/10 px-1.5 py-0.5 rounded">Create New Token</span>.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
                        <span className="w-5 h-5 min-w-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-[10px] mt-0.5">5</span>
                        <span>Open the downloaded <span className="font-semibold text-slate-700">kaggle.json</span> and copy credentials.</span>
                    </li>
                </ul>
            </div>

            {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 px-4">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs font-medium text-red-600 leading-normal m-0">{error}</p>
                </div>
            )}

            <div className="flex gap-2.5 pt-1">
                <button
                    onClick={onSave}
                    disabled={isTesting}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-sm font-semibold border-none cursor-pointer shadow-[0_4px_14px_rgba(99,14,212,0.25)] transition-all ${isTesting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-95'}`}
                >
                    {isTesting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
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
                    className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
